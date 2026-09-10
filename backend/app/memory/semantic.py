import math
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.memory import MemoryEpisode, MemoryDocument, MemoryEmbedding


def simple_text_embedding(text: str, dimensions: int = 32) -> List[float]:
    """Lightweight deterministic feature embedding for local semantic indexing."""
    words = re.findall(r"\w+", text.lower())
    vec = [0.0] * dimensions
    if not words:
        return vec
    for w in words:
        h = hash(w)
        for d in range(dimensions):
            vec[d] += math.sin(h * (d + 1))
    # Normalize vector
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [round(x / norm, 4) for x in vec]
    return vec


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return round(dot / (norm1 * norm2), 4)


class SemanticMemoryStore:
    """Semantic vector search over documents and episodic memories with full provenance."""

    @classmethod
    async def search(
        cls,
        db: AsyncSession,
        query: str,
        domain: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        query_vec = simple_text_embedding(query)
        results = []

        # 1. Search MemoryEpisodes
        stmt = select(MemoryEpisode)
        if domain:
            stmt = stmt.where(MemoryEpisode.domain == domain.lower())
        stmt = stmt.order_by(MemoryEpisode.created_at.desc()).limit(20)
        
        episodes_res = await db.execute(stmt)
        episodes = episodes_res.scalars().all()

        for ep in episodes:
            ep_vec = simple_text_embedding(f"{ep.goal} {ep.episode_summary}")
            sim = cosine_similarity(query_vec, ep_vec)
            # Add lexical bonus if keywords match
            if any(term in ep.episode_summary.lower() for term in query.lower().split()):
                sim = min(1.0, sim + 0.25)

            results.append({
                "id": ep.id,
                "source_type": "episode",
                "domain": ep.domain,
                "title_or_goal": ep.goal,
                "snippet": ep.episode_summary,
                "similarity_score": round(sim, 3),
                "provenance": ep.provenance or {"cycle_id": ep.cycle_id, "outcome": ep.outcome},
                "created_at": ep.created_at,
            })

        # 2. Search MemoryDocuments (SOPs, Playbooks)
        doc_stmt = select(MemoryDocument)
        if domain:
            doc_stmt = doc_stmt.where(MemoryDocument.domain == domain.lower())
        doc_stmt = doc_stmt.limit(10)
        docs_res = await db.execute(doc_stmt)
        docs = docs_res.scalars().all()

        for d in docs:
            d_vec = simple_text_embedding(f"{d.title} {d.content}")
            sim = cosine_similarity(query_vec, d_vec)
            if any(term in d.title.lower() or term in d.content.lower() for term in query.lower().split()):
                sim = min(1.0, sim + 0.3)

            results.append({
                "id": d.id,
                "source_type": "document",
                "domain": d.domain,
                "title_or_goal": d.title,
                "snippet": d.content[:200] + ("..." if len(d.content) > 200 else ""),
                "similarity_score": round(sim, 3),
                "provenance": {"doc_type": d.doc_type, "metadata": d.metadata_json},
                "created_at": d.created_at,
            })

        # Sort by similarity descending
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:limit]
