"""
Review API Router — v1
Endpoints:
  POST   /reviews/                → create + enqueue review
  GET    /reviews/                → list user reviews
  GET    /reviews/{review_id}     → get single review
  POST   /reviews/{review_id}/run → trigger graph execution (sync, for dev)
  DELETE /reviews/{review_id}     → soft-delete review
"""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundError
from app.core.websocket_manager import ws_manager
from app.llm.provider import LLMProvider
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewRead
from app.services.review_service import ReviewService

router = APIRouter(prefix="/reviews", tags=["Reviews"])


def _get_review_service(
    db: AsyncSession = Depends(get_db),
) -> ReviewService:
    from app.llm.provider import get_provider
    provider = get_provider()
    return ReviewService(db=db, provider=provider, ws_manager=ws_manager)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new code review",
)
async def create_review(
    payload: ReviewCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    svc: ReviewService = Depends(_get_review_service),
):
    """
    Create a review record and immediately enqueue the Critique-and-Refine
    graph as a background task.  The caller should then subscribe to the
    WebSocket endpoint `ws /ws/{review_id}` for live progress events.
    """
    review = await svc.create_review(
        user_id=str(current_user.id),
        file_path=payload.file_path,
        language=payload.language,
        original_code=payload.original_code,
        context=payload.context or "",
        github_pr_url=payload.github_pr_url,
    )

    # Fire-and-forget: run the graph in the background
    background_tasks.add_task(
        svc.run_review,
        review_id=str(review.id),
        user_id=str(current_user.id),
    )

    return review


@router.get(
    "/",
    response_model=List[ReviewRead],
    summary="List all reviews for the current user",
)
async def list_reviews(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    svc: ReviewService = Depends(_get_review_service),
):
    return await svc.list_reviews(str(current_user.id), skip=skip, limit=limit)


@router.get(
    "/{review_id}",
    response_model=ReviewRead,
    summary="Get a single review by ID",
)
async def get_review(
    review_id: str,
    current_user: User = Depends(get_current_user),
    svc: ReviewService = Depends(_get_review_service),
):
    try:
        return await svc.get_review(review_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post(
    "/{review_id}/run",
    response_model=ReviewRead,
    summary="(Dev) Run review graph synchronously",
)
async def run_review_sync(
    review_id: str,
    current_user: User = Depends(get_current_user),
    svc: ReviewService = Depends(_get_review_service),
):
    """
    Runs the full LangGraph pipeline synchronously — useful for testing
    without a Celery worker.  Not recommended for production.
    """
    try:
        return await svc.run_review(review_id=review_id, user_id=str(current_user.id))
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
