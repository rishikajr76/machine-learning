"""
LangGraph State definition for the Critique-and-Refine workflow.
Each field represents a piece of data that flows between graph nodes.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


class ReviewGraphState(TypedDict):
    """
    Immutable snapshot of the review workflow at each step.
    LangGraph passes this object between nodes, merging updates returned
    by each node function.
    """

    # ---- Input ----
    review_id: str
    user_id: str
    file_path: str
    language: str
    original_code: str
    context: str                  # error messages / stack traces / test output

    # ---- Loop Control ----
    iteration: int                # current iteration number (1-indexed)
    max_iterations: int           # configured cap from settings
    should_continue: bool         # True → run another propose-critique cycle

    # ---- Proposer Output ----
    proposer_output: Dict[str, Any]   # full structured JSON from ProposerAgent
    patched_code: str                 # extracted patch field from proposer output

    # ---- Critic Output ----
    critic_output: Dict[str, Any]     # full structured JSON from CriticAgent
    critic_verdict: str               # "APPROVE" | "REJECT"

    # ---- Evaluator Output ----
    evaluator_output: Dict[str, Any]  # full structured JSON from EvaluatorAgent
    final_verdict: str                # "PASS" | "FAIL"
    quality_score: int

    # ---- History (for memory retrieval prompts) ----
    iteration_history: List[Dict[str, Any]]   # one entry per iteration

    # ---- Streaming / SSE ----
    websocket_events: List[Dict[str, Any]]    # events queued for broadcast

    # ---- Error handling ----
    error: Optional[str]                      # set if a node raises
