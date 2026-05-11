import json
import re
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, AsyncIterator
from app.llm.provider import LLMProvider
from app.core.logging import get_logger
from app.core.exceptions import LLMError

logger = get_logger(__name__)


class BaseAgent(ABC):
    def __init__(self, provider: LLMProvider):
        self.provider = provider

    @abstractmethod
    def get_system_prompt(self) -> str:
        pass

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """
        Extract JSON from a string that might contain markdown blocks.
        """
        try:
            # Try parsing the whole thing first
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to find JSON inside triple backticks
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass
            
            # Fallback: find anything that looks like a JSON object
            match = re.search(r"(\{.*\})", text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass
            
            raise LLMError("Failed to extract valid JSON from LLM response")

    async def run(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        """
        Execute the agent logic and return structured output.
        """
        system_prompt = self.get_system_prompt()
        response_text = await self.provider.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            **kwargs
        )
        return self._extract_json(response_text)

    async def stream(self, prompt: str, **kwargs: Any) -> AsyncIterator[str]:
        """
        Stream the raw reasoning tokens from the agent.
        """
        system_prompt = self.get_system_prompt()
        async for chunk in self.provider.stream(
            prompt=prompt,
            system_prompt=system_prompt,
            **kwargs
        ):
            yield chunk
