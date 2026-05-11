import json
from typing import Any, Dict
from app.agents.base import BaseAgent
from app.agents.prompts.evaluator_prompts import EVALUATOR_SYSTEM_PROMPT, EVALUATOR_USER_PROMPT
from app.llm.provider import LLMProvider
from app.core.logging import get_logger

logger = get_logger(__name__)


class EvaluatorAgent(BaseAgent):
    """
    The Evaluator agent renders the final PASS/FAIL verdict after the
    Critique-and-Refine loop has completed or exhausted its iteration budget.
    It produces a quality score and a lesson for the vector memory store.
    """

    def __init__(self, provider: LLMProvider):
        super().__init__(provider)

    def get_system_prompt(self) -> str:
        return EVALUATOR_SYSTEM_PROMPT

    async def evaluate(
        self,
        original_code: str,
        patched_code: str,
        proposer_output: Dict[str, Any],
        critic_output: Dict[str, Any],
        iteration_number: int,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Produce the final evaluation of the patch.

        Args:
            original_code: The original buggy code.
            patched_code: The final patch code after all iterations.
            proposer_output: Last ProposerAgent structured output.
            critic_output: Last CriticAgent structured output.
            iteration_number: Total iterations used.

        Returns:
            Structured dict with keys: verdict, quality_score, correctness_score,
            security_score, maintainability_score, summary, remaining_issues, lesson.
        """
        logger.info(
            "EvaluatorAgent running",
            iteration=iteration_number,
            critic_verdict=critic_output.get("verdict", ""),
        )

        user_prompt = EVALUATOR_USER_PROMPT.format(
            original_code=original_code,
            patched_code=patched_code,
            proposer_output=json.dumps(proposer_output, indent=2),
            critic_output=json.dumps(critic_output, indent=2),
            iteration_number=iteration_number,
        )

        result = await self.run(user_prompt, **kwargs)

        # Normalise
        if "verdict" in result:
            result["verdict"] = str(result["verdict"]).upper()

        for score_key in ("quality_score", "correctness_score", "security_score", "maintainability_score"):
            if score_key not in result:
                result[score_key] = 0

        for key in ("summary", "lesson"):
            if key not in result:
                result[key] = ""

        if "remaining_issues" not in result:
            result["remaining_issues"] = []

        logger.info(
            "EvaluatorAgent completed",
            verdict=result.get("verdict"),
            quality_score=result.get("quality_score"),
        )
        return result
