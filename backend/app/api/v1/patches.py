"""
Patches API Router — v1
Read-only access to the iteration patches produced by the review graph.
"""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundError
from app.db.repositories.iteration_repo import IterationRepository
from app.models.user import User
from app.schemas.patch import PatchRead

router = APIRouter(prefix="/patches", tags=["Patches"])


@router.get(
    "/review/{review_id}",
    response_model=List[PatchRead],
    summary="List all patches (iterations) for a review",
)
async def list_patches(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all propose-critique iteration records for a review."""
    repo = IterationRepository(db)
    try:
        iterations = await repo.list_by_review(review_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return [PatchRead.model_validate(it) for it in iterations]


@router.get(
    "/{iteration_id}",
    response_model=PatchRead,
    summary="Get a specific iteration/patch by ID",
)
async def get_patch(
    iteration_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = IterationRepository(db)
    try:
        it = await repo.get_or_404(iteration_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return PatchRead.model_validate(it)
