"""
Loop controller — decides whether to run another Critique-and-Refine iteration
or to exit the loop and hand off to the Evaluator.
"""
from __future__ import annotations

from typing import Literal
from app.agents.graph_state import ReviewGraphState
from app.core.logging import get_logger

logger = get_logger(__name__)


def should_loop(state: ReviewGraphState) -> Literal["continue", "evaluate"]:
    """
    LangGraph conditional-edge function.

    Returns:
        "continue"  → run another propose-critique cycle
        "evaluate"  → hand off to the EvaluatorAgent and finish
    """
    iteration = state.get("iteration", 1)
    max_iterations = state.get("max_iterations", 3)
    critic_verdict = state.get("critic_verdict", "REJECT")
    error = state.get("error")

    # Always exit on error
    if error:
        logger.warning("Loop exiting early due to error", error=error)
        return "evaluate"

    # Critic approved — no need to iterate further
    if critic_verdict == "APPROVE":
        logger.info("Critic approved patch — exiting loop", iteration=iteration)
        return "evaluate"

    # Exhausted the iteration budget
    if iteration >= max_iterations:
        logger.info(
            "Iteration budget exhausted — exiting loop",
            iteration=iteration,
            max_iterations=max_iterations,
        )
        return "evaluate"

    logger.info(
        "Critic rejected patch — continuing loop",
        iteration=iteration,
        max_iterations=max_iterations,
    )
    return "continue"
