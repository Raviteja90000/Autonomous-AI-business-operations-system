from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.memory import MemoryEpisode
from backend.app.core.logging import logger


class EpisodicMemoryManager:
    """Manages recording and retrieval of past execution episodes."""

    @classmethod
    async def record_episode(
        cls,
        db: AsyncSession,
        domain: str,
        cycle_id: str,
        goal: str,
        episode_summary: str,
        actions_taken: List[Any],
        outcome: str = "POSITIVE",
        reward_score: float = 1.0,
        confidence: float = 0.9,
        provenance: Optional[Dict[str, Any]] = None,
    ) -> MemoryEpisode:
        episode = MemoryEpisode(
            domain=domain.lower(),
            cycle_id=cycle_id,
            goal=goal,
            episode_summary=episode_summary,
            actions_taken=actions_taken,
            outcome=outcome,
            reward_score=reward_score,
            confidence=confidence,
            provenance=provenance or {"source": "odaea_cycle", "cycle_id": cycle_id},
        )
        db.add(episode)
        await db.flush()
        return episode

    @classmethod
    async def get_recent_episodes(
        cls,
        db: AsyncSession,
        domain: Optional[str] = None,
        limit: int = 10
    ) -> List[MemoryEpisode]:
        stmt = select(MemoryEpisode)
        if domain:
            stmt = stmt.where(MemoryEpisode.domain == domain.lower())
        stmt = stmt.order_by(MemoryEpisode.created_at.desc()).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())
