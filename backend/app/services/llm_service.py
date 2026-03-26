"""
Shared LLM service — Gemini 2.5 Flash.
All agents call generate_text() instead of using Anthropic/OpenAI directly.
"""
from __future__ import annotations
from app.config import settings

_gemini_client = None


def _get_client():
    global _gemini_client
    if _gemini_client is None:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        _gemini_client = genai.GenerativeModel(settings.gemini_model)
    return _gemini_client


def generate_text(prompt: str, max_tokens: int = 500) -> str:
    """
    Call Gemini and return the text response.
    Falls back to empty string if API key not set or call fails.
    """
    if not settings.gemini_api_key:
        return ""
    try:
        client = _get_client()
        response = client.generate_content(
            prompt,
            generation_config={"max_output_tokens": max_tokens, "temperature": 0.3},
        )
        return response.text.strip()
    except Exception as e:
        print(f"[LLM] Gemini error: {e}")
        return ""
