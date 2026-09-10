import pytest
from unittest.mock import patch, AsyncMock
from backend.app.agents.llm_router import MultiLLMRouter, ProviderHealth, ModelResult
from backend.app.agents.budget import LLMBudgetManager


@pytest.mark.asyncio
async def test_json_healing_and_cleaning():
    router = MultiLLMRouter()

    # 1. Clean markdown wrapped json
    raw1 = "```json\n{\"status\": \"OK\", \"score\": 0.95}\n```"
    text1, parsed1 = router.clean_and_parse_json(raw1)
    assert parsed1 == {"status": "OK", "score": 0.95}

    # 2. Text with leading/trailing banter
    raw2 = "Here is the resulting analysis:\n{\"anomalies\": 2, \"risk\": \"LOW\"}\nHope this helps!"
    text2, parsed2 = router.clean_and_parse_json(raw2)
    assert parsed2 == {"anomalies": 2, "risk": "LOW"}

    # 3. Trailing comma auto-healing
    raw3 = "{\"action\": \"send_email\", \"count\": 1,}"
    text3, parsed3 = router.clean_and_parse_json(raw3)
    assert parsed3.get("action") == "send_email"
    assert parsed3.get("count") == 1


@pytest.mark.asyncio
async def test_budget_manager_cost_calculation():
    budget = LLMBudgetManager()

    # Groq Llama 3.3 70B cost calculation
    cost = budget.calculate_cost("llama-3.3-70b-versatile", 1000, 500)
    assert cost > 0.0
    assert cost < 0.01

    # Local Ollama / Mock should be 0.00
    ollama_cost = budget.calculate_cost("qwen2.5:7b", 5000, 2000)
    assert ollama_cost == 0.0

    mock_cost = budget.calculate_cost("mock-reasoning-v1", 1000, 1000)
    assert mock_cost == 0.0


@pytest.mark.asyncio
async def test_router_fallback_to_mock_on_provider_errors():
    router = MultiLLMRouter()

    # When Groq, Gemini, and Ollama all raise errors, router should cleanly fall back to deterministic mock
    with patch.object(router, '_call_groq', side_effect=Exception("Rate limit 429")), \
         patch.object(router, '_call_gemini', side_effect=Exception("API key missing")), \
         patch.object(router, '_call_ollama', side_effect=Exception("Connection refused")):
        
        result = await router.generate_with_fallback(
            agent_type="planner",
            system_prompt="Test system",
            user_prompt="Test prompt",
        )

        assert result is not None
        assert result.provider == "mock"
        assert result.fallback_occurred is True
        assert result.parsed_json is not None
        assert "goal" in result.parsed_json or "status" in result.parsed_json


@pytest.mark.asyncio
async def test_circuit_breaker_tripping():
    health = ProviderHealth("test_groq")
    assert health.is_available() is True

    # Record 3 failures
    health.record_failure("Error 1")
    health.record_failure("Error 2")
    health.record_failure("Error 3")

    assert health.is_available() is False
    assert health.consecutive_failures == 3
    assert health.tripped_until > 0

    # Record success resets it
    health.record_success()
    assert health.is_available() is True
    assert health.consecutive_failures == 0
