from typing import AsyncIterator, Any
from anthropic import AsyncAnthropic
from app.llm.provider import LLMProvider
from app.core.config import settings
from app.core.exceptions import LLMError


class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str = None, model: str = "claude-3-5-sonnet-20240620"):
        self.client = AsyncAnthropic(api_key=api_key or settings.ANTHROPIC_API_KEY)
        self.model = model

    async def generate(
        self,
        prompt: str,
        system_prompt: str = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any
    ) -> str:
        try:
            response = await self.client.messages.create(
                model=self.model,
                system=system_prompt if system_prompt else "",
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            return response.content[0].text
        except Exception as e:
            raise LLMError(f"Anthropic generation failed: {str(e)}")

    async def stream(
        self,
        prompt: str,
        system_prompt: str = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any
    ) -> AsyncIterator[str]:
        try:
            async with self.client.messages.stream(
                model=self.model,
                system=system_prompt if system_prompt else "",
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except Exception as e:
            raise LLMError(f"Anthropic streaming failed: {str(e)}")
