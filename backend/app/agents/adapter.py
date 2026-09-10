from typing import Dict, Any, List
from backend.app.agents.base import AgentBase
from backend.app.agents.prompts import get_prompt_version
from backend.app.agents.model_provider import ModelProvider, ModelResponse


class AdapterAgent(AgentBase):
    def __init__(self):
        super().__init__(
            agent_type="adapter",
            name="Operations Adapter Agent",
            allowed_tools=["read_evaluations", "read_policies", "read_memory"],
            forbidden_tools=["execute_action", "modify_guardrails_directly", "bypass_admin_approval"],
            prompt_version="v1.0.0"
        )

    async def adapt(
        self,
        domain: str,
        evaluation_report: Dict[str, Any],
        historical_evals: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        prompt_info = get_prompt_version("adapter")

        user_prompt = (
            f"Domain: {domain}\n"
            f"Latest Evaluation:\n{evaluation_report}\n"
            f"Recent History Count: {len(historical_evals)}"
        )

        response: ModelResponse = await ModelProvider.generate_response(
            agent_type="adapter",
            system_prompt=prompt_info["system_prompt"],
            user_prompt=user_prompt
        )

        data = response.parsed_json
        return {
            "proposed_by_agent": "adapter",
            "success_rate": data.get("success_rate", 0.92),
            "rationale": data.get("recommendation", "Based on consistent positive outcomes, recommend increasing confidence prior for this action pattern."),
            "proposed_changes": data.get("proposed_policy_delta", {
                "domain": domain,
                "confidence_prior_delta": 0.02,
                "recommended_tier": 2
            }),
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
