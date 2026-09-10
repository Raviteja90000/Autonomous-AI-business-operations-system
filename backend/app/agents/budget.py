import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.core.telemetry import metrics


class LLMBudgetManager:
    """Enterprise LLM Cost & Token Consumption Budget Manager."""

    # Pricing per 1,000,000 tokens (Input / Output in USD)
    PRICING_TABLE = {
        # Groq (Free Cloud tier / Low cost cloud)
        "llama-3.3-70b-versatile": {"input": 0.59, "output": 0.79},
        "llama-3.1-8b-instant": {"input": 0.05, "output": 0.08},
        "mixtral-8x7b-32768": {"input": 0.24, "output": 0.24},
        
        # Google Gemini (Google AI Studio Free Tier / Cloud)
        "gemini-1.5-flash": {"input": 0.075, "output": 0.30},
        "gemini-2.0-flash": {"input": 0.10, "output": 0.40},
        "gemini-1.5-pro": {"input": 1.25, "output": 5.00},
        
        # Local Ollama (100% Free / Self-Hosted)
        "qwen2.5:7b": {"input": 0.0, "output": 0.0},
        "qwen2.5:14b": {"input": 0.0, "output": 0.0},
        "qwen2.5:32b": {"input": 0.0, "output": 0.0},
        "llama3.2": {"input": 0.0, "output": 0.0},
        "ollama-local": {"input": 0.0, "output": 0.0},
        
        # Commercial Fallbacks
        "gpt-4o-mini": {"input": 0.15, "output": 0.60},
        "gpt-4o": {"input": 2.50, "output": 10.00},
        "claude-3-5-haiku-20241022": {"input": 0.80, "output": 4.00},
        "claude-3-5-sonnet-20241022": {"input": 3.00, "output": 15.00},
        
        # Deterministic Mock
        "mock": {"input": 0.0, "output": 0.0},
        "mock-fast-v1": {"input": 0.0, "output": 0.0},
        "mock-reasoning-v1": {"input": 0.0, "output": 0.0},
        "mock-critic-v1": {"input": 0.0, "output": 0.0},
        "mock-eval-v1": {"input": 0.0, "output": 0.0},
        "mock-adapter-v1": {"input": 0.0, "output": 0.0},
    }

    def __init__(self):
        self._current_date = datetime.now(timezone.utc).date()
        self._daily_spend_usd = 0.0
        self._monthly_spend_usd = 0.0
        self._total_input_tokens = 0
        self._total_output_tokens = 0
        self._total_calls = 0
        
        # Spend breakdown maps
        self._spend_by_provider: Dict[str, float] = {
            "groq": 0.0,
            "gemini": 0.0,
            "ollama": 0.0,
            "openai": 0.0,
            "anthropic": 0.0,
            "mock": 0.0,
        }
        self._spend_by_agent: Dict[str, float] = {
            "observer": 0.0,
            "aggregator": 0.0,
            "planner": 0.0,
            "critic": 0.0,
            "evaluator": 0.0,
            "adapter": 0.0,
        }
        self._calls_by_provider: Dict[str, int] = {
            "groq": 0,
            "gemini": 0,
            "ollama": 0,
            "openai": 0,
            "anthropic": 0,
            "mock": 0,
        }

    def _check_date_rollover(self):
        now_date = datetime.now(timezone.utc).date()
        if now_date != self._current_date:
            logger.info(f"Budget rollover: resetting daily spend from ${self._daily_spend_usd:.4f} to $0.00")
            self._daily_spend_usd = 0.0
            if now_date.month != self._current_date.month:
                self._monthly_spend_usd = 0.0
            self._current_date = now_date

    def calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        """Calculate USD cost for a given model and token count."""
        rates = self.PRICING_TABLE.get(model.lower())
        if not rates:
            # Fallback matching
            for key, val in self.PRICING_TABLE.items():
                if key in model.lower():
                    rates = val
                    break
        if not rates:
            rates = {"input": 0.50, "output": 1.00}

        cost_in = (input_tokens / 1_000_000.0) * rates["input"]
        cost_out = (output_tokens / 1_000_000.0) * rates["output"]
        return round(cost_in + cost_out, 6)

    def is_budget_exceeded(self) -> bool:
        """Returns True if daily or monthly budget limits have been breached."""
        self._check_date_rollover()
        return (
            self._daily_spend_usd >= settings.LLM_DAILY_BUDGET_USD or
            self._monthly_spend_usd >= settings.LLM_MONTHLY_BUDGET_USD
        )

    def record_usage(
        self,
        provider: str,
        model: str,
        agent_type: str,
        input_tokens: int,
        output_tokens: int,
        custom_cost: Optional[float] = None,
    ) -> float:
        """Records an LLM call, token usage, and calculates spend."""
        self._check_date_rollover()
        cost = custom_cost if custom_cost is not None else self.calculate_cost(model, input_tokens, output_tokens)

        self._daily_spend_usd += cost
        self._monthly_spend_usd += cost
        self._total_input_tokens += input_tokens
        self._total_output_tokens += output_tokens
        self._total_calls += 1

        prov_key = provider.lower()
        if prov_key in self._spend_by_provider:
            self._spend_by_provider[prov_key] += cost
            self._calls_by_provider[prov_key] += 1
        else:
            self._spend_by_provider[prov_key] = cost
            self._calls_by_provider[prov_key] = 1

        agent_key = agent_type.lower()
        if agent_key in self._spend_by_agent:
            self._spend_by_agent[agent_key] += cost
        else:
            self._spend_by_agent[agent_key] = cost

        # Update global metrics
        metrics.increment("total_llm_cost_usd", cost)
        metrics.increment("total_llm_tokens", input_tokens + output_tokens)

        return cost

    def get_summary(self) -> Dict[str, Any]:
        """Returns comprehensive real-time spend and budget telemetry."""
        self._check_date_rollover()
        daily_limit = settings.LLM_DAILY_BUDGET_USD
        monthly_limit = settings.LLM_MONTHLY_BUDGET_USD

        daily_utilization = min(round((self._daily_spend_usd / daily_limit) * 100, 2), 100.0) if daily_limit > 0 else 0.0
        monthly_utilization = min(round((self._monthly_spend_usd / monthly_limit) * 100, 2), 100.0) if monthly_limit > 0 else 0.0

        return {
            "daily_spend_usd": round(self._daily_spend_usd, 4),
            "daily_limit_usd": daily_limit,
            "daily_utilization_pct": daily_utilization,
            "monthly_spend_usd": round(self._monthly_spend_usd, 4),
            "monthly_limit_usd": monthly_limit,
            "monthly_utilization_pct": monthly_utilization,
            "total_calls": self._total_calls,
            "total_tokens": self._total_input_tokens + self._total_output_tokens,
            "total_input_tokens": self._total_input_tokens,
            "total_output_tokens": self._total_output_tokens,
            "is_budget_exceeded": self.is_budget_exceeded(),
            "spend_by_provider": {k: round(v, 4) for k, v in self._spend_by_provider.items()},
            "calls_by_provider": self._calls_by_provider,
            "spend_by_agent": {k: round(v, 4) for k, v in self._spend_by_agent.items()},
        }


# Global singleton budget manager instance
budget_manager = LLMBudgetManager()
