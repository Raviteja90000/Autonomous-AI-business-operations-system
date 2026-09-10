import time
from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple


class BaseIntegration(ABC):
    """Abstract Base Class for all external business system integrations."""
    def __init__(self, name: str, domain: str, connector_type: str, is_mock: bool = True):
        self.name = name
        self.domain = domain
        self.connector_type = connector_type
        self.is_mock = is_mock

    @abstractmethod
    async def fetch_observations(self) -> Dict[str, Any]:
        """Observes and extracts normalized entities & signals from target system."""
        pass

    @abstractmethod
    async def validate_action(self, action_type: str, payload: Dict[str, Any]) -> Tuple[bool, str]:
        """Validates payload schema and external prerequisites before execution."""
        pass

    @abstractmethod
    async def execute_action(self, action_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Executes action on the external system with side-effect tracking."""
        pass

    @abstractmethod
    async def rollback_action(self, action_type: str, rollback_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Attempts safe rollback of side effects."""
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Performs health check / ping to integration endpoint."""
        pass
