"""
Memory API Router — v1
Endpoints for inspecting and querying the vector memory store.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.memory.retriever import memory_service
from app.models.user import User

router = APIRouter(prefix="/memory", tags=["Vector Memory"])


class LessonQuery(BaseModel):
    query: str
    language: Optional[str] = None
    n_results: int = 5


class LessonResult(BaseModel):
    document: str
    metadata: Dict[str, Any]
    distance: float


@router.post(
    "/search",
    response_model=List[LessonResult],
    summary="Semantic search over stored review lessons",
)
async def search_memory(
    payload: LessonQuery,
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve the top-k most similar lessons from ChromaDB.
    Useful for debugging and introspecting agent memory.
    """
    results = await memory_service.retrieve_similar(
        query=payload.query,
        language=payload.language,
        n_results=payload.n_results,
    )
    return results


@router.get(
    "/count",
    summary="Get total number of stored lessons",
)
async def memory_count(
    current_user: User = Depends(get_current_user),
):
    from app.memory.chroma_client import chroma_client
    count = await chroma_client.count()
    return {"count": count}
