from abc import ABC, abstractmethod
from typing import AsyncIterator, List, Dict, Any


class LLMProvider(ABC):
    """
    Abstract base class for LLM providers.
    """

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: str = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any
    ) -> str:
        """
        Generate a single response from the LLM.
        """
        pass

    @abstractmethod
    async def stream(
        self,
        prompt: str,
        system_prompt: str = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any
    ) -> AsyncIterator[str]:
        """
        Stream responses from the LLM.
        """
        pass


def get_provider(provider_type: str = None, **kwargs: Any) -> LLMProvider:
    """
    Factory function to get the configured LLM provider.
    """
    from app.core.config import settings
    from app.llm.openai_provider import OpenAIProvider
    from app.llm.anthropic_provider import AnthropicProvider
    from app.llm.deepseek_provider import DeepSeekProvider
    from app.llm.ollama_provider import OllamaProvider
    from app.llm.gemini_provider import GeminiProvider

    provider_type = provider_type or settings.DEFAULT_LLM_PROVIDER
    
    if provider_type == "openai":
        return OpenAIProvider(**kwargs)
    elif provider_type == "anthropic":
        return AnthropicProvider(**kwargs)
    elif provider_type == "deepseek":
        return DeepSeekProvider(**kwargs)
    elif provider_type == "ollama":
        return OllamaProvider(**kwargs)
    elif provider_type == "gemini":
        return GeminiProvider(**kwargs)
    else:
        raise ValueError(f"Unsupported LLM provider: {provider_type}")
