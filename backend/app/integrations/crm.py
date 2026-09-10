import time
from typing import Dict, Any, Tuple
from backend.app.integrations.base import BaseIntegration


class CRMIntegration(BaseIntegration):
    def __init__(self, is_mock: bool = True):
        super().__init__(name="HubSpot CRM Connector", domain="sales", connector_type="crm", is_mock=is_mock)

    async def fetch_observations(self) -> Dict[str, Any]:
        return {
            "source": "hubspot_crm",
            "entities": [
                {
                    "entity_type": "lead",
                    "entity_id": "LEAD-9042",
                    "attributes": {
                        "company": "Acme Corp",
                        "arr_potential_usd": 48000.0,
                        "lead_score": 92,
                        "last_activity_hours_ago": 48.2,
                        "status": "dormant_post_demo"
                    },
                    "risk_indicator": 0.65
                },
                {
                    "entity_type": "lead",
                    "entity_id": "LEAD-9043",
                    "attributes": {
                        "company": "Globex Systems",
                        "arr_potential_usd": 12000.0,
                        "lead_score": 74,
                        "last_activity_hours_ago": 6.5,
                        "status": "qualified"
                    },
                    "risk_indicator": 0.1
                }
            ],
            "metrics": {
                "active_pipeline_value_usd": 482000.0,
                "deal_velocity_days": 18.4,
                "conversion_rate": 0.28
            }
        }

    async def validate_action(self, action_type: str, payload: Dict[str, Any]) -> Tuple[bool, str]:
        if action_type == "update_lead_score":
            if "lead_id" not in payload:
                return False, "Missing 'lead_id' in payload"
            return True, "Valid lead score update payload"
        elif action_type == "assign_account_rep":
            if "lead_id" not in payload or "rep_id" not in payload:
                return False, "Missing 'lead_id' or 'rep_id'"
            return True, "Valid account rep assignment"
        return True, "Validation passed"

    async def execute_action(self, action_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "SUCCESS",
            "external_id": f"crm_evt_{int(time.time())}",
            "action_type": action_type,
            "updated_fields": payload,
            "side_effects": [
                {
                    "entity_type": "lead",
                    "entity_id": payload.get("lead_id", "LEAD-UNKNOWN"),
                    "before": {"score": 85},
                    "after": {"score": payload.get("new_score", 95)}
                }
            ]
        }

    async def rollback_action(self, action_type: str, rollback_payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "ROLLED_BACK",
            "reverted_fields": rollback_payload,
            "message": "Reverted CRM attributes to pre-execution state."
        }

    async def test_connection(self) -> Dict[str, Any]:
        return {
            "success": True,
            "latency_ms": 28.5,
            "status": "CONNECTED",
            "message": "HubSpot CRM API responding normally (Mock Mode)."
        }
