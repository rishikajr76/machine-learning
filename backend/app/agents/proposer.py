from typing import Any, Dict
from app.agents.base import BaseAgent
from app.agents.prompts.proposer_prompts import PROPOSER_SYSTEM_PROMPT, PROPOSER_USER_PROMPT
from app.llm.provider import LLMProvider
from app.core.logging import get_logger

logger = get_logger(__name__)


class ProposerAgent(BaseAgent):
    """
    The Proposer agent analyzes buggy code and produces a structured patch
    following a Chain-of-Thought reasoning process.
    """

    def __init__(self, provider: LLMProvider):
        super().__init__(provider)

    def get_system_prompt(self) -> str:
        return PROPOSER_SYSTEM_PROMPT

    async def propose(
        self,
        code: str,
        context: str = "",
        feedback: str = "",
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Generate a code patch proposal.

        Args:
            code: The buggy code snippet to fix.
            context: Error messages, stack traces, or test failure output.
            feedback: Refinement hints from the Critic on a previous iteration.

        Returns:
            Structured dict with keys: observation, hypothesis, risk_analysis,
            fix_plan, patch.
        """
        logger.info("ProposerAgent running", context_len=len(context), has_feedback=bool(feedback))

        user_prompt = PROPOSER_USER_PROMPT.format(
            code=code,
            context=context or "No additional context provided.",
            feedback=feedback or "This is the first iteration — no previous feedback.",
        )

        result = await self.run(user_prompt, **kwargs)

        # Ensure required keys are present
        for key in ("observation", "hypothesis", "risk_analysis", "fix_plan", "patch"):
            if key not in result:
                result[key] = ""

        logger.info("ProposerAgent completed", verdict_keys=list(result.keys()))
        return result
