import threading
from typing import Dict, Optional, Set
from datetime import datetime, timezone


class KillSwitchManager:
    """Thread-safe multi-tier kill switch manager."""
    def __init__(self):
        self._lock = threading.Lock()
        self._global_active: bool = False
        self._domain_switches: Dict[str, bool] = {
            "sales": False,
            "finance": False,
            "support": False,
            "marketing": False,
            "operations": False,
        }
        self._agent_switches: Dict[str, bool] = {
            "observer": False,
            "aggregator": False,
            "planner": False,
            "critic": False,
            "actuator": False,
            "evaluator": False,
            "adapter": False,
        }
        self._integration_switches: Dict[str, bool] = {
            "crm": False,
            "finance": False,
            "support": False,
            "email": False,
            "marketing": False,
        }
        self._updated_at: str = datetime.now(timezone.utc).isoformat()
        self._updated_by: str = "system"

    def is_global_active(self) -> bool:
        with self._lock:
            return self._global_active

    def is_domain_active(self, domain: str) -> bool:
        with self._lock:
            return self._global_active or self._domain_switches.get(domain.lower(), False)

    def is_agent_active(self, agent: str) -> bool:
        with self._lock:
            return self._global_active or self._agent_switches.get(agent.lower(), False)

    def is_integration_active(self, integration: str) -> bool:
        with self._lock:
            return self._global_active or self._integration_switches.get(integration.lower(), False)

    def set_global(self, active: bool, actor: str = "admin") -> None:
        with self._lock:
            self._global_active = active
            self._updated_at = datetime.now(timezone.utc).isoformat()
            self._updated_by = actor

    def set_domain(self, domain: str, active: bool, actor: str = "admin") -> None:
        with self._lock:
            self._domain_switches[domain.lower()] = active
            self._updated_at = datetime.now(timezone.utc).isoformat()
            self._updated_by = actor

    def set_agent(self, agent: str, active: bool, actor: str = "admin") -> None:
        with self._lock:
            self._agent_switches[agent.lower()] = active
            self._updated_at = datetime.now(timezone.utc).isoformat()
            self._updated_by = actor

    def set_integration(self, integration: str, active: bool, actor: str = "admin") -> None:
        with self._lock:
            self._integration_switches[integration.lower()] = active
            self._updated_at = datetime.now(timezone.utc).isoformat()
            self._updated_by = actor

    def get_state(self) -> dict:
        with self._lock:
            return {
                "global": self._global_active,
                "domains": self._domain_switches.copy(),
                "agents": self._agent_switches.copy(),
                "integrations": self._integration_switches.copy(),
                "updated_at": self._updated_at,
                "updated_by": self._updated_by,
            }


kill_switch = KillSwitchManager()
