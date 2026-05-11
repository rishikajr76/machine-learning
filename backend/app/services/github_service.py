"""
GitHub Integration Service.
Handles:
  - Webhook signature validation
  - PR diff retrieval via GitHub REST API
  - Posting review comments back to PRs
  - OAuth token exchange (optional)
"""
from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

GITHUB_API_BASE = "https://api.github.com"


class GitHubService:
    """
    Thin async wrapper around the GitHub REST API v3.
    All calls use httpx with a 30-second timeout.
    """

    def __init__(self, token: Optional[str] = None):
        self._token = token or settings.GITHUB_CLIENT_SECRET
        self._headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if self._token:
            self._headers["Authorization"] = f"Bearer {self._token}"

    # ------------------------------------------------------------------
    # Webhook validation
    # ------------------------------------------------------------------

    @staticmethod
    def verify_webhook_signature(payload_bytes: bytes, signature_header: str) -> bool:
        """
        Validate GitHub's HMAC-SHA256 webhook signature.

        Args:
            payload_bytes: Raw request body.
            signature_header: Value of the X-Hub-Signature-256 header.

        Returns:
            True if valid, False otherwise.
        """
        if not signature_header or not signature_header.startswith("sha256="):
            return False

        secret = settings.GITHUB_WEBHOOK_SECRET.encode()
        expected = "sha256=" + hmac.new(secret, payload_bytes, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature_header)

    # ------------------------------------------------------------------
    # Pull Request API
    # ------------------------------------------------------------------

    async def get_pr_diff(self, owner: str, repo: str, pr_number: int) -> str:
        """Fetch the unified diff for a pull request."""
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls/{pr_number}"
        headers = {**self._headers, "Accept": "application/vnd.github.diff"}

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            return resp.text

    async def get_pr_files(self, owner: str, repo: str, pr_number: int) -> List[Dict[str, Any]]:
        """Return the list of changed files in a PR."""
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls/{pr_number}/files"

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url, headers=self._headers)
            resp.raise_for_status()
            return resp.json()

    async def get_file_content(self, owner: str, repo: str, path: str, ref: str = "HEAD") -> str:
        """Retrieve raw file content at a given ref."""
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{path}"
        params = {"ref": ref}
        headers = {**self._headers, "Accept": "application/vnd.github.raw+json"}

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url, headers=headers, params=params)
            resp.raise_for_status()
            return resp.text

    # ------------------------------------------------------------------
    # Review comments
    # ------------------------------------------------------------------

    async def post_pr_comment(
        self,
        owner: str,
        repo: str,
        pr_number: int,
        body: str,
    ) -> Dict[str, Any]:
        """Post a top-level comment on a PR."""
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/issues/{pr_number}/comments"

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, headers=self._headers, json={"body": body})
            resp.raise_for_status()
            return resp.json()

    async def post_review(
        self,
        owner: str,
        repo: str,
        pr_number: int,
        commit_id: str,
        body: str,
        event: str = "COMMENT",  # APPROVE | REQUEST_CHANGES | COMMENT
        comments: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Submit a full code review on a PR."""
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls/{pr_number}/reviews"
        payload: Dict[str, Any] = {
            "commit_id": commit_id,
            "body": body,
            "event": event,
        }
        if comments:
            payload["comments"] = comments

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, headers=self._headers, json=payload)
            resp.raise_for_status()
            return resp.json()

    # ------------------------------------------------------------------
    # Repo metadata
    # ------------------------------------------------------------------

    async def get_repo(self, owner: str, repo: str) -> Dict[str, Any]:
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}"
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url, headers=self._headers)
            resp.raise_for_status()
            return resp.json()
