"""
LangGraph Critique-and-Refine Review Graph.

Nodes:
    propose  → ProposerAgent generates a patch
    critique → CriticAgent adversarially reviews the patch
    evaluate → EvaluatorAgent renders the final PASS/FAIL verdict

Edges:
    START ──► propose ──► critique ──► [should_loop] ──┬──► evaluate ──► END
                              ▲                        │
                              └────────────────────────┘  (continue branch)
"""
from __future__ import annotations

import asyncio
from typing import Any, Dict

from langgraph.graph import StateGraph, END

from app.agents.graph_state import ReviewGraphState
from app.agents.proposer import ProposerAgent
from app.agents.critic import CriticAgent
from app.agents.evaluator import EvaluatorAgent
from app.agents.loop_controller import should_loop
from app.llm.provider import LLMProvider
from app.core.logging import get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Node factories
# ---------------------------------------------------------------------------

def make_propose_node(proposer: ProposerAgent):
    """Return an async graph node that runs the ProposerAgent."""

    async def propose(state: ReviewGraphState) -> Dict[str, Any]:
        iteration = state.get("iteration", 1)
        logger.info("Graph node: propose", iteration=iteration)

        # Retrieve past lessons from history for richer context
        history_context = _build_history_context(state)

        try:
            output = await proposer.propose(
                original_code=state["original_code"],
                context=state.get("context", ""),
                language=state.get("language", "python"),
                history_context=history_context,
            )
        except Exception as exc:
            logger.exception("ProposerAgent failed", error=str(exc))
            return {"error": f"ProposerAgent error: {exc}"}

        patched_code = output.get("patched_code", state["original_code"])

        # Queue a streaming event
        event = {
            "type": "propose",
            "iteration": iteration,
            "summary": output.get("reasoning_summary", ""),
        }

        return {
            "proposer_output": output,
            "patched_code": patched_code,
            "websocket_events": state.get("websocket_events", []) + [event],
            "error": None,
        }

    return propose


def make_critique_node(critic: CriticAgent):
    """Return an async graph node that runs the CriticAgent."""

    async def critique(state: ReviewGraphState) -> Dict[str, Any]:
        if state.get("error"):
            return {}  # skip on prior error

        iteration = state.get("iteration", 1)
        logger.info("Graph node: critique", iteration=iteration)

        try:
            output = await critic.critique(
                original_code=state["original_code"],
                patched_code=state["patched_code"],
                proposer_output=state.get("proposer_output", {}),
                language=state.get("language", "python"),
            )
        except Exception as exc:
            logger.exception("CriticAgent failed", error=str(exc))
            return {"error": f"CriticAgent error: {exc}"}

        verdict = output.get("verdict", "REJECT")

        # Archive this iteration into history
        iteration_record = {
            "iteration": iteration,
            "patched_code": state["patched_code"],
            "proposer_output": state.get("proposer_output", {}),
            "critic_output": output,
            "critic_verdict": verdict,
        }

        event = {
            "type": "critique",
            "iteration": iteration,
            "verdict": verdict,
            "issues": output.get("issues", []),
        }

        return {
            "critic_output": output,
            "critic_verdict": verdict,
            "iteration": iteration + 1,
            "iteration_history": state.get("iteration_history", []) + [iteration_record],
            "websocket_events": state.get("websocket_events", []) + [event],
            "error": None,
        }

    return critique


def make_evaluate_node(evaluator: EvaluatorAgent):
    """Return an async graph node that runs the EvaluatorAgent."""

    async def evaluate(state: ReviewGraphState) -> Dict[str, Any]:
        logger.info("Graph node: evaluate")

        if state.get("error"):
            # Degrade gracefully — mark FAIL without calling the LLM
            return {
                "evaluator_output": {},
                "final_verdict": "FAIL",
                "quality_score": 0,
            }

        iterations_used = state.get("iteration", 1) - 1

        try:
            output = await evaluator.evaluate(
                original_code=state["original_code"],
                patched_code=state["patched_code"],
                proposer_output=state.get("proposer_output", {}),
                critic_output=state.get("critic_output", {}),
                iteration_number=iterations_used,
            )
        except Exception as exc:
            logger.exception("EvaluatorAgent failed", error=str(exc))
            return {
                "evaluator_output": {},
                "final_verdict": "FAIL",
                "quality_score": 0,
                "error": f"EvaluatorAgent error: {exc}",
            }

        event = {
            "type": "evaluate",
            "verdict": output.get("verdict"),
            "quality_score": output.get("quality_score"),
            "summary": output.get("summary", ""),
        }

        return {
            "evaluator_output": output,
            "final_verdict": output.get("verdict", "FAIL"),
            "quality_score": output.get("quality_score", 0),
            "websocket_events": state.get("websocket_events", []) + [event],
        }

    return evaluate


# ---------------------------------------------------------------------------
# Graph builder
# ---------------------------------------------------------------------------

def build_review_graph(provider: LLMProvider) -> StateGraph:
    """
    Compile and return the LangGraph StateGraph for the review workflow.

    Args:
        provider: An instantiated LLMProvider used by all agents.

    Returns:
        A compiled LangGraph graph ready for `.ainvoke()`.
    """
    proposer = ProposerAgent(provider)
    critic = CriticAgent(provider)
    evaluator = EvaluatorAgent(provider)

    graph = StateGraph(ReviewGraphState)

    # Register nodes
    graph.add_node("propose", make_propose_node(proposer))
    graph.add_node("critique", make_critique_node(critic))
    graph.add_node("evaluate", make_evaluate_node(evaluator))

    # Linear edges
    graph.set_entry_point("propose")
    graph.add_edge("propose", "critique")

    # Conditional edge: loop or evaluate
    graph.add_conditional_edges(
        "critique",
        should_loop,
        {
            "continue": "propose",
            "evaluate": "evaluate",
        },
    )

    graph.add_edge("evaluate", END)

    return graph.compile()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_history_context(state: ReviewGraphState) -> str:
    """Summarise past iterations into a compact string for prompt injection."""
    history = state.get("iteration_history", [])
    if not history:
        return ""

    lines = ["## Previous iteration summaries\n"]
    for record in history:
        i = record.get("iteration", "?")
        critic_verdict = record.get("critic_verdict", "?")
        issues = record.get("critic_output", {}).get("issues", [])
        issue_list = "\n".join(f"  - {iss}" for iss in issues[:5])
        lines.append(
            f"### Iteration {i} — Critic verdict: {critic_verdict}\n"
            f"{issue_list or '  (no specific issues listed)'}"
        )

    return "\n".join(lines)
