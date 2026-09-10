from typing import Dict, Any, Optional
from backend.app.agents.llm_router import llm_router, ModelResult


class ModelResponse:
    """Compatibility response model wrapper for all ODAEA agent services."""
    def __init__(
        self,
        content: str,
        parsed_json: Optional[Dict[str, Any]] = None,
        input_tokens: int = 250,
        output_tokens: int = 150,
        cost_usd: float = 0.002,
        latency_ms: float = 120.0,
        model_name: str = "llama-3.3-70b-versatile",
        provider: str = "groq",
        fallback_occurred: bool = False,
        fallback_reason: Optional[str] = None,
    ):
        self.content = content
        self.parsed_json = parsed_json or {}
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens
        self.cost_usd = cost_usd
        self.latency_ms = latency_ms
        self.model_name = model_name
        self.provider = provider
        self.fallback_occurred = fallback_occurred
        self.fallback_reason = fallback_reason


class ModelProvider:
    """
    Enterprise AI Model Gateway with automatic Multi-LLM failover:
    Groq ➔ Google Gemini ➔ Local Ollama (Qwen) ➔ Deterministic Heuristics.
    """

    @classmethod
    async def generate_response(
        cls,
        agent_type: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
    ) -> ModelResponse:
        """
        Routes the agent reasoning prompt through the multi-provider fallback router.
        """
        res: ModelResult = await llm_router.generate_with_fallback(
            agent_type=agent_type,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
        )

        return ModelResponse(
            content=res.content,
            parsed_json=res.parsed_json,
            input_tokens=res.input_tokens,
            output_tokens=res.output_tokens,
            cost_usd=res.cost_usd,
            latency_ms=res.latency_ms,
            model_name=res.model_name,
            provider=res.provider,
            fallback_occurred=res.fallback_occurred,
            fallback_reason=res.fallback_reason,
        )
