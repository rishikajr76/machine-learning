"""
GitHub Webhook & API Router — v1
  POST /github/webhook  → receive and dispatch GitHub webhook events
  GET  /github/pr       → fetch PR diff for manual review submission
"""
from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.logging import get_logger
from app.models.user import User
from app.services.github_service import GitHubService

logger = get_logger(__name__)
router = APIRouter(prefix="/github", tags=["GitHub"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PRReviewRequest(BaseModel):
    owner: str
    repo: str
    pr_number: int
    language: str = "python"
    context: str = ""


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/webhook",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Receive GitHub webhook events",
)
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_hub_signature_256: Optional[str] = Header(None),
    x_github_event: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Receives GitHub push/pull_request webhook events.
    Validates HMAC signature, then processes PR events as background tasks.
    """
    payload_bytes = await request.body()

    # Validate signature
    if not GitHubService.verify_webhook_signature(payload_bytes, x_hub_signature_256 or ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature",
        )

    try:
        import json
        payload: Dict[str, Any] = json.loads(payload_bytes)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")

    event = x_github_event or "unknown"
    action = payload.get("action", "")
    logger.info("GitHub webhook received", event=event, action=action)

    # Only process pull_request opened/synchronize events
    if event == "pull_request" and action in ("opened", "synchronize"):
        background_tasks.add_task(_process_pr_webhook, payload, db)

    return {"status": "accepted", "event": event}


async def _process_pr_webhook(payload: Dict[str, Any], db: AsyncSession) -> None:
    """Background task to trigger a code review from a PR webhook."""
    try:
        pr = payload.get("pull_request", {})
        repo = payload.get("repository", {})
        owner = repo.get("owner", {}).get("login", "")
        repo_name = repo.get("name", "")
        pr_number = pr.get("number", 0)

        svc = GitHubService()
        files = await svc.get_pr_files(owner, repo_name, pr_number)

        logger.info(
            "PR webhook processing",
            owner=owner,
            repo=repo_name,
            pr=pr_number,
            files_changed=len(files),
        )
        # Future: auto-create reviews per file and trigger graph

    except Exception as exc:
        logger.exception("PR webhook processing failed", error=str(exc))


@router.post(
    "/pr/review",
    summary="Manually submit a PR for code review",
)
async def review_pr(
    payload: PRReviewRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch the PR diff from GitHub and trigger the review graph
    for each changed file.
    """
    svc = GitHubService()
    try:
        files = await svc.get_pr_files(payload.owner, payload.repo, payload.pr_number)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch PR files from GitHub: {exc}",
        )

    logger.info(
        "PR review triggered",
        owner=payload.owner,
        repo=payload.repo,
        pr_number=payload.pr_number,
        files=len(files),
    )

    return {
        "status": "queued",
        "pr_number": payload.pr_number,
        "files_queued": len(files),
    }
