from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class MemorySearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    domain: Optional[str] = None
    limit: int = Field(default=5, ge=1, le=50)


class MemoryEpisodeResponse(BaseModel):
    id: str
    domain: str
    cycle_id: Optional[str] = None
    episode_summary: str
    goal: str
    actions_taken: List[Any] = []
    outcome: str
    reward_score: float
    importance: float
    confidence: float
    provenance: Dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True


class MemorySearchResult(BaseModel):
    id: str
    source_type: str  # episode | document
    domain: str
    title_or_goal: str
    snippet: str
    similarity_score: float
    provenance: Dict[str, Any] = {}
    created_at: datetime


class MemorySearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[MemorySearchResult] = []
