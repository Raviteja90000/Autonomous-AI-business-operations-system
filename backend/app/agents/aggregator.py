from typing import Dict, Any, List
from backend.app.agents.base import AgentBase
from backend.app.agents.prompts import get_prompt_version
from backend.app.agents.model_provider import ModelProvider, ModelResponse


class AggregatorAgent(AgentBase):
    def __init__(self):
        super().__init__(
            agent_type="aggregator",
            name="World State Aggregator Agent",
            allowed_tools=["read_observations", "read_entities", "read_metrics"],
            forbidden_tools=["execute_action", "modify_policy", "write_memory"],
            prompt_version="v1.0.0"
        )

    async def aggregate(self, domain: str, snapshots: List[Dict[str, Any]], anomalies: List[Dict[str, Any]]) -> Dict[str, Any]:
        prompt_info = get_prompt_version("aggregator")
        
        # Build normalized World State
        total_entities = sum(len(s.get("entities", [])) for s in snapshots)
        anomaly_count = len(anomalies)
        
        aggregate_metrics = {
            "domain": domain,
            "total_entities_monitored": total_entities or 24,
            "active_anomalies_count": anomaly_count,
            "operational_health_score": round(max(0.4, 1.0 - (anomaly_count * 0.15)), 2),
            "data_freshness_seconds": 12,
        }

        state_data = {
            "snapshots_count": len(snapshots),
            "snapshots_summary": [s.get("summary") for s in snapshots],
            "anomalies": anomalies,
            "domain_parameters": {
                "active_lead_flow": "normal",
                "payment_gateway_status": "operational",
                "support_sla_compliance": "98.4%",
            }
        }

        return {
            "domain": domain,
            "state_data": state_data,
            "aggregate_metrics": aggregate_metrics,
            "entity_count": total_entities or 24,
            "anomaly_count": anomaly_count,
            "confidence_score": 0.95,
            "model_metadata": {
                "model_name": "mock-aggregator-v1",
                "prompt_version": prompt_info["version"],
                "prompt_hash": prompt_info["prompt_hash"],
                "input_tokens": 120,
                "output_tokens": 80,
                "cost_usd": 0.0005,
                "latency_ms": 45.0,
            }
        }
