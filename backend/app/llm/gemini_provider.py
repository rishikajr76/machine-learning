"""
Google Gemini (AI Studio) LLM Provider implementation.
"""
from __future__ import annotations

import asyncio
from typing import AsyncIterator, Any, Optional, List, Dict

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.llm.provider import LLMProvider
from app.core.config import settings
from app.core.exceptions import LLMError

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str = None, model: str = None):
        api_key = api_key or settings.GEMINI_API_KEY
        if not api_key:
            raise LLMError("GEMINI_API_KEY is not set")
        
        genai.configure(api_key=api_key)
        self.model_name = model or settings.DEFAULT_LLM_MODEL or "gemini-1.5-pro"
        self.model = genai.GenerativeModel(self.model_name)

    async def generate(
        self,
        prompt: str,
        system_prompt: str = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any
    ) -> str:
        contents = []
        if system_prompt:
            # Prepend system prompt for Gemini
            contents.append({"role": "user", "parts": [f"SYSTEM INSTRUCTION: {system_prompt}"]})
            contents.append({"role": "model", "parts": ["Understood. I will follow those instructions."]})
        
        contents.append({"role": "user", "parts": [prompt]})

        config = GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        )

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.model.generate_content(
                    contents,
                    generation_config=config,
                    **kwargs
                )
            )
            return response.text
        except Exception as e:
            raise LLMError(f"Gemini generation failed: {str(e)}")

    async def stream(
        self,
        prompt: str,
        system_prompt: str = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any
    ) -> AsyncIterator[str]:
        # Implementation for streaming
        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [f"SYSTEM INSTRUCTION: {system_prompt}"]})
            contents.append({"role": "model", "parts": ["Understood."]})
        
        contents.append({"role": "user", "parts": [prompt]})

        config = GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        )

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.model.generate_content(
                    contents,
                    generation_config=config,
                    stream=True,
                    **kwargs
                )
            )
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            raise LLMError(f"Gemini streaming failed: {str(e)}")
