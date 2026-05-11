from typing import Any, Dict
from app.agents.base import BaseAgent
from app.agents.prompts.critic_prompts import CRITIC_SYSTEM_PROMPT, CRITIC_USER_PROMPT
from app.llm.provider import LLMProvider
from app.core.logging import get_logger

logger = get_logger(__name__)


class CriticAgent(BaseAgent):
    """
    The Critic agent performs adversarial review of a proposed patch, hunting
    for edge cases, security issues, regressions, and logical errors.
    """

    def __init__(self, provider: LLMProvider):
        super().__init__(provider)

    def get_system_prompt(self) -> str:
        return CRITIC_SYSTEM_PROMPT

    async def critique(
        self,
        original_code: str,
        patched_code: str,
        proposer_output: Dict[str, Any],
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Adversarially review a patch.

        Args:
            original_code: The original buggy code.
            patched_code: The patch produced by the ProposerAgent.
            proposer_output: The full structured output from the ProposerAgent.

        Returns:
            Structured dict with keys: correctness, edge_cases, regressions,
            security_issues, performance_issues, verdict, justification,
            refinement_hints.
        """
        logger.info(
            "CriticAgent running",
            proposer_verdict=proposer_output.get("hypothesis", "")[:80],
        )

        user_prompt = CRITIC_USER_PROMPT.format(
            original_code=original_code,
            patched_code=patched_code,
            observation=proposer_output.get("observation", ""),
            hypothesis=proposer_output.get("hypothesis", ""),
            fix_plan=proposer_output.get("fix_plan", ""),
        )

        result = await self.run(user_prompt, **kwargs)

        # Normalise verdict to uppercase
        if "verdict" in result:
            result["verdict"] = str(result["verdict"]).upper()

        for key in (
            "correctness", "edge_cases", "regressions", "security_issues",
            "performance_issues", "verdict", "justification", "refinement_hints",
        ):
            if key not in result:
                result[key] = "" if key != "edge_cases" else []

        logger.info("CriticAgent completed", verdict=result.get("verdict"))
        return result
