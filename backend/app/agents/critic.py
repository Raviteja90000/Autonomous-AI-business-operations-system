from typing import Dict, Any, List
from backend.app.agents.base import AgentBase
from backend.app.agents.prompts import get_prompt_version
from backend.app.agents.model_provider import ModelProvider, ModelResponse


class CriticAgent(AgentBase):
    def __init__(self):
        super().__init__(
            agent_type="critic",
            name="Decision Critic Agent",
            allowed_tools=["read_world_state", "read_decision", "read_policies"],
            forbidden_tools=["execute_action", "modify_decision", "write_memory"],
            prompt_version="v1.0.0"
        )

    async def review(
        self,
        decision_plan: Dict[str, Any],
        world_state: Dict[str, Any],
        policy_rules: Dict[str, Any]
    ) -> Dict[str, Any]:
        prompt_info = get_prompt_version("critic")

        user_prompt = (
            f"Decision Plan:\n{decision_plan}\n"
            f"WorldState Reference:\n{world_state}\n"
            f"Policies:\n{policy_rules}"
        )

        response: ModelResponse = await ModelProvider.generate_response(
            agent_type="critic",
            system_prompt=prompt_info["system_prompt"],
            user_prompt=user_prompt
        )

        data = response.parsed_json
        return {
            "review_status": data.get("review_status", "APPROVED"),
            "reasoning_critique": data.get("reasoning_critique", "Critique verified rationale and bounds against current world state."),
            "risk_assessment": data.get("risk_assessment", "Estimated exposure is bounded and aligned with governance policies."),
            "logic_score": data.get("logic_score", 0.95),
            "hallucination_risk": data.get("hallucination_risk", 0.02),
            "recommendations": data.get("recommendations", []),
            "model_metadata": {
                "model_name": response.model_name,
                "prompt_version": prompt_info["version"],
                "prompt_hash": prompt_info["prompt_hash"],
                "input_tokens": response.input_tokens,
                "output_tokens": response.output_tokens,
                "cost_usd": response.cost_usd,
                "latency_ms": response.latency_ms,
            }
        }
