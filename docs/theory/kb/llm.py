"""Flove KB — Pluggable LLM Backend.

Supports OpenAI-compatible, Anthropic, and Ollama local backends.
"""

import os
import json
import httpx

from retrieve import CATEGORY_NAMES

SYSTEM_PROMPT = """You are Lexy, a Flove ontology assistant. Answer using Flove's worldview.

RULES:
1. Always cite the symbion. A flove term is well-defined only by its bipolar pair.
2. Default to confluentism. Frame opposing views as bipolar complements, not enemies.
3. Simplexify. Prefer simpler-but-still-bipolar formulations.
4. Multimodal redundancy = rigour. Flag claims supported by only one source type.
5. Slow it, flow it, love it. Favor low-tech, single-file, gift-economic patterns.

When answering:
- Ground your response in the provided context from Flove papers, slides, and tables.
- If the context doesn't support a claim, say so explicitly.
- Cite your sources using the format: [source / section].
"""


class LLMBackend:
    """Base LLM backend interface."""

    def generate(self, prompt: str, context: list[dict], **kwargs) -> str:
        raise NotImplementedError


class OpenAICompatible(LLMBackend):
    """OpenAI-compatible API (works with OpenAI, Azure, LM Studio, etc.)."""

    def __init__(self, api_key: str | None = None, base_url: str | None = None, model: str = "gpt-4o-mini"):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
        self.base_url = base_url or os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.model = model or os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    def generate(self, prompt: str, context: list[dict], max_tokens: int = 1024, temperature: float = 0.7, **kwargs) -> str:
        context_text = "\n\n".join(
            f"[{c.get('citation', 'unknown')}]\n{c['text']}"
            for c in context[:5]
        )

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Context from Flove sources:\n\n{context_text}\n\nQuestion: {prompt}"},
        ]

        with httpx.Client(timeout=60) as client:
            resp = client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]


class Anthropic(LLMBackend):
    """Anthropic Claude API."""

    def __init__(self, api_key: str | None = None, model: str = "claude-3-haiku-20240307"):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
        self.model = model or os.environ.get("ANTHROPIC_MODEL", "claude-3-haiku-20240307")

    def generate(self, prompt: str, context: list[dict], max_tokens: int = 1024, temperature: float = 0.7, **kwargs) -> str:
        context_text = "\n\n".join(
            f"[{c.get('citation', 'unknown')}]\n{c['text']}"
            for c in context[:5]
        )

        with httpx.Client(timeout=120) as client:
            resp = client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": self.model,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "system": SYSTEM_PROMPT,
                    "messages": [
                        {"role": "user", "content": f"Context from Flove sources:\n\n{context_text}\n\nQuestion: {prompt}"},
                    ],
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["content"][0]["text"]


class Ollama(LLMBackend):
    """Local Ollama server."""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3.2"):
        self.base_url = base_url
        self.model = model or os.environ.get("OLLAMA_MODEL", "llama3.2")

    def generate(self, prompt: str, context: list[dict], **kwargs) -> str:
        context_text = "\n\n".join(
            f"[{c.get('citation', 'unknown')}]\n{c['text']}"
            for c in context[:5]
        )

        with httpx.Client(timeout=120) as client:
            resp = client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": f"Context from Flove sources:\n\n{context_text}\n\nQuestion: {prompt}"},
                    ],
                    "stream": False,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["message"]["content"]


def get_backend(backend_type: str | None = None, **kwargs) -> LLMBackend:
    """Factory to create LLM backend."""
    backend_type = backend_type or os.environ.get("FLOVE_LLM_BACKEND", "openai")

    backends = {
        "openai": OpenAICompatible,
        "anthropic": Anthropic,
        "ollama": Ollama,
    }

    cls = backends.get(backend_type.lower())
    if not cls:
        raise ValueError(f"Unknown backend: {backend_type}. Choose from: {', '.join(backends.keys())}")

    return cls(**kwargs)


def answer(query: str, context: list[dict], backend_type: str | None = None, **kwargs) -> str:
    """Generate an LLM answer using retrieved context."""
    backend = get_backend(backend_type, **kwargs)
    return backend.generate(query, context, **kwargs)
