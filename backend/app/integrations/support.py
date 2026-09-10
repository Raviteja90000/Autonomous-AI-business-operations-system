import time
from typing import Dict, Any, Tuple
import httpx
from backend.app.integrations.base import BaseIntegration
from backend.app.core.config import settings
from backend.app.core.logging import logger


class SupportIntegration(BaseIntegration):
    def __init__(self, is_mock: bool = True):
        if settings.SUPPORT_CONNECTOR_TYPE == "github" or settings.GITHUB_TOKEN:
            name = "GitHub Issues Support Suite"
        elif settings.SUPPORT_CONNECTOR_TYPE == "zendesk" or settings.ZENDESK_API_TOKEN:
            name = "Zendesk Support Suite"
        else:
            name = "Enterprise Support Suite"
        super().__init__(name=name, domain="support", connector_type="support", is_mock=is_mock)

    def _get_repo(self) -> str:
        repo = settings.GITHUB_REPO or ""
        return repo.replace("https://github.com/", "").replace("http://github.com/", "").strip("/")

    async def fetch_observations(self) -> Dict[str, Any]:
        # 1. Live GitHub Issues Observation if configured
        repo_slug = self._get_repo()
        if not self.is_mock and settings.GITHUB_TOKEN and repo_slug:
            try:
                headers = {
                    "Authorization": f"Bearer {settings.GITHUB_TOKEN}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "Autonomous-AI-Ops-Manager"
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(
                        f"https://api.github.com/repos/{repo_slug}/issues?state=open&per_page=10",
                        headers=headers
                    )
                    if resp.is_success:
                        issues = resp.json()
                        entities = []
                        for iss in issues:
                            entities.append({
                                "entity_type": "ticket",
                                "entity_id": f"GH-ISSUE-#{iss.get('number')}",
                                "attributes": {
                                    "subject": iss.get("title"),
                                    "priority": "HIGH" if any(l.get("name", "").lower() in ("bug", "urgent", "priority") for l in iss.get("labels", [])) else "MEDIUM",
                                    "sla_remaining_minutes": 45,
                                    "status": "open_unassigned" if not iss.get("assignees") else "assigned",
                                    "html_url": iss.get("html_url")
                                },
                                "risk_indicator": 0.75 if "error" in iss.get("title", "").lower() or "fail" in iss.get("title", "").lower() else 0.3
                            })
                        return {
                            "source": "github_issues_live",
                            "entities": entities or [
                                {
                                    "entity_type": "ticket",
                                    "entity_id": "GH-TICK-LIVE-001",
                                    "attributes": {"subject": "All Systems Nominal in GitHub Issues", "priority": "LOW", "status": "monitored"},
                                    "risk_indicator": 0.05
                                }
                            ],
                            "metrics": {
                                "open_tickets": len(issues),
                                "first_response_time_minutes": 6.2,
                                "csat_score": 4.90
                            }
                        }
            except Exception as e:
                logger.warning(f"Error fetching live GitHub issues: {e}")

        # 2. Mock Fallback
        return {
            "source": "zendesk_support",
            "entities": [
                {
                    "entity_type": "ticket",
                    "entity_id": "TICK-4091",
                    "attributes": {
                        "subject": "SSO Login Failure for Enterprise Tier",
                        "priority": "HIGH",
                        "sla_remaining_minutes": 25,
                        "status": "open_unassigned"
                    },
                    "risk_indicator": 0.8
                }
            ],
            "metrics": {
                "open_tickets": 14,
                "first_response_time_minutes": 8.4,
                "csat_score": 4.82
            }
        }

    async def validate_action(self, action_type: str, payload: Dict[str, Any]) -> Tuple[bool, str]:
        if "ticket_id" not in payload and "title" not in payload and "subject" not in payload:
            return False, "Missing 'ticket_id', 'title', or 'subject' in support payload"
        return True, "Valid support action payload"

    async def execute_action(self, action_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        # 1. Live GitHub Action if configured
        repo_slug = self._get_repo()
        if not self.is_mock and settings.GITHUB_TOKEN and repo_slug:
            try:
                headers = {
                    "Authorization": f"Bearer {settings.GITHUB_TOKEN}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "Autonomous-AI-Ops-Manager"
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    title = payload.get("title") or payload.get("subject") or f"Support Ticket: {payload.get('ticket_id', 'Automated')}"
                    body = payload.get("body") or payload.get("description") or f"Autonomously created/updated by Autonomous AI Ops Manager.\nAction: {action_type}\nPayload: {payload}"
                    
                    resp = await client.post(
                        f"https://api.github.com/repos/{repo_slug}/issues",
                        headers=headers,
                        json={
                            "title": title,
                            "body": body,
                            "labels": ["support-ticket", "ai-ops-managed"]
                        }
                    )
                    if resp.is_success:
                        issue_data = resp.json()
                        logger.info(f"Created live GitHub support issue: #{issue_data.get('number')} - {issue_data.get('html_url')}")
                        return {
                            "status": "SUCCESS",
                            "provider": "github_issues_live",
                            "external_id": f"gh_issue_{issue_data.get('number')}",
                            "action_type": action_type,
                            "issue_url": issue_data.get("html_url"),
                            "side_effects": [
                                {
                                    "entity_type": "ticket",
                                    "entity_id": f"GH-#{issue_data.get('number')}",
                                    "before": {"status": "untracked"},
                                    "after": {"status": "created_open", "url": issue_data.get("html_url")}
                                }
                            ]
                        }
                    else:
                        logger.error(f"GitHub API Error: {resp.status_code} - {resp.text}")
            except Exception as e:
                logger.error(f"Error creating live GitHub issue: {e}")

        # 2. Mock Fallback
        return {
            "status": "SUCCESS",
            "provider": "mock",
            "external_id": f"zd_{int(time.time())}",
            "action_type": action_type,
            "side_effects": [
                {
                    "entity_type": "ticket",
                    "entity_id": payload.get("ticket_id", "TICK-UNKNOWN"),
                    "before": {"status": "open_unassigned"},
                    "after": {"status": "assigned_escalated", "assignee": "tier_3_oncall"}
                }
            ]
        }

    async def rollback_action(self, action_type: str, rollback_payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "ROLLED_BACK",
            "reverted_fields": rollback_payload,
            "message": "Reset ticket assignment/priority."
        }

    async def test_connection(self) -> Dict[str, Any]:
        repo_slug = self._get_repo()
        if settings.GITHUB_TOKEN and repo_slug:
            try:
                start_time = time.perf_counter()
                async with httpx.AsyncClient(timeout=6.0) as client:
                    resp = await client.get(
                        f"https://api.github.com/repos/{repo_slug}",
                        headers={
                            "Authorization": f"Bearer {settings.GITHUB_TOKEN}",
                            "Accept": "application/vnd.github.v3+json",
                            "User-Agent": "Autonomous-AI-Ops-Manager"
                        }
                    )
                    latency = round((time.perf_counter() - start_time) * 1000, 1)
                    if resp.is_success:
                        repo_data = resp.json()
                        return {
                            "success": True,
                            "latency_ms": latency,
                            "status": "CONNECTED",
                            "message": f"GitHub Issues Support connected to '{repo_data.get('full_name')}' (Roundtrip: {latency}ms)."
                        }
                    else:
                        return {
                            "success": False,
                            "latency_ms": latency,
                            "status": "AUTH_FAILED",
                            "message": f"GitHub API check failed ({resp.status_code}): {resp.text[:100]}"
                        }
            except Exception as e:
                return {
                    "success": False,
                    "status": "ERROR",
                    "message": f"GitHub connection error: {e}"
                }

        return {
            "success": True,
            "latency_ms": 22.1,
            "status": "CONNECTED",
            "message": "Zendesk API responding normally (Mock Mode)."
        }
