from typing import Dict, Any, List
from backend.app.agents.base import AgentBase
from backend.app.agents.prompts import get_prompt_version
from backend.app.agents.sanitizer import PromptSanitizer
from backend.app.agents.model_provider import ModelProvider, ModelResponse


class ObserverAgent(AgentBase):
    def __init__(self):
        super().__init__(
            agent_type="observer",
            name="Domain Observer Agent",
            allowed_tools=["read_crm", "read_finance", "read_support", "read_marketing", "read_metrics"],
            forbidden_tools=["execute_action", "modify_policy", "write_memory"],
            prompt_version="v1.0.0"
        )

    async def observe(self, domain: str, raw_connector_data: Dict[str, Any]) -> Dict[str, Any]:
        prompt_info = get_prompt_version("observer")
        
        # Sanitize untrusted input from external connector
        sanitized_input = PromptSanitizer.sanitize_payload(raw_connector_data)
        
        user_prompt = f"Domain: {domain}\nData:\n{sanitized_input}"
        
        response: ModelResponse = await ModelProvider.generate_response(
            agent_type="observer",
            system_prompt=prompt_info["system_prompt"],
            user_prompt=user_prompt
        )

        return {
            "summary": response.parsed_json.get("summary", f"Observation in domain '{domain}' completed."),
            "anomalies": response.parsed_json.get("anomalies_detected", []),
            "confidence": response.parsed_json.get("confidence", 0.9),
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
