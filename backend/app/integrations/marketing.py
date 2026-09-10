import time
from typing import Dict, Any, Tuple
from backend.app.integrations.base import BaseIntegration


class MarketingIntegration(BaseIntegration):
    def __init__(self, is_mock: bool = True):
        super().__init__(name="Google/Meta Ads Connector", domain="marketing", connector_type="marketing", is_mock=is_mock)

    async def fetch_observations(self) -> Dict[str, Any]:
        return {
            "source": "ads_platform",
            "entities": [
                {
                    "entity_type": "campaign",
                    "entity_id": "CAMP-2026-Q1",
                    "attributes": {
                        "name": "Enterprise Search US",
                        "daily_spend_usd": 450.0,
                        "roas": 3.8,
                        "status": "active"
                    },
                    "risk_indicator": 0.05
                }
            ],
            "metrics": {
                "total_ad_spend_mtd_usd": 12800.0,
                "overall_roas": 3.4,
                "cpc_usd": 2.45
            }
        }

    async def validate_action(self, action_type: str, payload: Dict[str, Any]) -> Tuple[bool, str]:
        if "campaign_id" not in payload and "ad_set_id" not in payload:
            return False, "Missing campaign_id or ad_set_id"
        return True, "Valid marketing payload"

    async def execute_action(self, action_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "SUCCESS",
            "external_id": f"ad_{int(time.time())}",
            "action_type": action_type,
            "side_effects": [
                {
                    "entity_type": "campaign",
                    "entity_id": payload.get("campaign_id", "CAMP-UNKNOWN"),
                    "before": {"bid": 2.5},
                    "after": {"bid": payload.get("new_bid", 2.8)}
                }
            ]
        }

    async def rollback_action(self, action_type: str, rollback_payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "ROLLED_BACK",
            "reverted_fields": rollback_payload,
            "message": "Restored ad campaign budget/bid."
        }

    async def test_connection(self) -> Dict[str, Any]:
        return {
            "success": True,
            "latency_ms": 41.0,
            "status": "CONNECTED",
            "message": "Marketing Ads API responding normally (Mock Mode)."
        }
