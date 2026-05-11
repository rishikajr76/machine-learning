import httpx
import json
from typing import AsyncIterator, Any
from app.llm.provider import LLMProvider
from app.core.config import settings
from app.core.exceptions import LLMError


class OllamaProvider(LLMProvider):
    def __init__(self, base_url: str = None, model: str = "codellama"):
        self.base_url = base_url or settings.OLLAMA_BASE_URL or "http://localhost:11434"
        self.model = model

    async def generate(
        self,
        prompt: str,
        system_prompt: str = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any
    ) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt if system_prompt else "",
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        
        async with httpx.AsyncClient(timeout=settings.AGENT_TIMEOUT) as client:
            try:
                response = await client.post(f"{self.base_url}/api/generate", json=payload)
                response.raise_for_status()
                return response.json().get("response", "")
            except Exception as e:
                raise LLMError(f"Ollama generation failed: {str(e)}")

    async def stream(
        self,
        prompt: str,
        system_prompt: str = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any
    ) -> AsyncIterator[str]:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt if system_prompt else "",
            "stream": True,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        
        async with httpx.AsyncClient(timeout=settings.AGENT_TIMEOUT) as client:
            try:
                async with client.stream("POST", f"{self.base_url}/api/generate", json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            data = json.loads(line)
                            yield data.get("response", "")
                            if data.get("done"):
                                break
            except Exception as e:
                raise LLMError(f"Ollama streaming failed: {str(e)}")
