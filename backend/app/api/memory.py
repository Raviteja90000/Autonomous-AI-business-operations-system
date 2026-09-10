from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.core.database import get_db
from backend.app.models.memory import MemoryEpisode, MemoryDocument
from backend.app.schemas.memory import MemoryEpisodeResponse, MemorySearchResponse, MemorySearchResult
from backend.app.memory.semantic import SemanticMemoryStore
from backend.app.auth.dependencies import require_permission
from backend.app.models.auth import User

router = APIRouter(prefix="/memory", tags=["Memory"])


@router.get("/episodes", response_model=List[MemoryEpisodeResponse])
async def list_episodes(
    domain: Optional[str] = None,
    limit: int = Query(default=30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("memory.read"))
):
    stmt = select(MemoryEpisode)
    if domain:
        stmt = stmt.where(MemoryEpisode.domain == domain.lower())
    stmt = stmt.order_by(desc(MemoryEpisode.created_at)).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/search", response_model=MemorySearchResponse)
async def search_memory(
    q: str = Query(..., min_length=2),
    domain: Optional[str] = None,
    limit: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("memory.read"))
):
    results = await SemanticMemoryStore.search(db, query=q, domain=domain, limit=limit)
    formatted = [
        MemorySearchResult(
            id=r["id"],
            source_type=r["source_type"],
            domain=r["domain"],
            title_or_goal=r["title_or_goal"],
            snippet=r["snippet"],
            similarity_score=r["similarity_score"],
            provenance=r["provenance"],
            created_at=r["created_at"]
        )
        for r in results
    ]
    return MemorySearchResponse(query=q, total_results=len(formatted), results=formatted)
