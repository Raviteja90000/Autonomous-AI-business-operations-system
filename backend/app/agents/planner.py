from typing import Dict, Any, List, Optional
from backend.app.agents.base import AgentBase
from backend.app.agents.prompts import get_prompt_version
from backend.app.agents.model_provider import ModelProvider, ModelResponse


class PlannerAgent(AgentBase):
    def __init__(self):
        super().__init__(
            agent_type="planner",
            name="Decision Planner Agent",
            allowed_tools=["read_world_state", "read_policies", "read_memory"],
            forbidden_tools=["execute_action", "modify_policy", "modify_guardrails", "write_audit"],
            prompt_version="v1.0.0"
        )

    async def plan(
        self,
        domain: str,
        world_state: Dict[str, Any],
        policy_rules: Dict[str, Any],
        memory_context: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        prompt_info = get_prompt_version("planner")

        user_prompt = (
            f"Domain: {domain}\n"
            f"WorldState:\n{world_state}\n"
            f"Policy Rules:\n{policy_rules}\n"
            f"Memory Context:\n{memory_context}"
        )

        response: ModelResponse = await ModelProvider.generate_response(
            agent_type="planner",
            system_prompt=prompt_info["system_prompt"],
            user_prompt=user_prompt
        )

        data = response.parsed_json
        return {
            "goal": data.get("goal", f"Maintain optimal operations in {domain}"),
            "rationale_summary": data.get("rationale_summary", "Operational review indicated targeted intervention required."),
            "confidence": data.get("confidence", 0.9),
            "estimated_cost_usd": data.get("estimated_cost_usd", 0.0),
            "blast_radius_count": data.get("blast_radius_count", 1),
            "risk_level": data.get("risk_level", "LOW"),
            "reversibility": data.get("reversibility", "REVERSIBLE"),
            "proposed_actions": data.get("proposed_actions", []),
            "evidence": data.get("evidence", []),
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
