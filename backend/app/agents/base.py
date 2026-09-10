import time
import hashlib
from typing import List, Set, Dict, Any, Optional
from backend.app.core.exceptions import PermissionDeniedError
from backend.app.core.logging import logger


class AgentBase:
    """Base class for all ODAEA agents with tool permission sandboxing."""
    def __init__(
        self,
        agent_type: str,
        name: str,
        allowed_tools: List[str],
        forbidden_tools: List[str],
        prompt_version: str = "v1.0.0",
    ):
        self.agent_type = agent_type
        self.name = name
        self.allowed_tools: Set[str] = set(allowed_tools)
        self.forbidden_tools: Set[str] = set(forbidden_tools)
        self.prompt_version = prompt_version

    def verify_tool_permission(self, tool_name: str) -> None:
        if tool_name in self.forbidden_tools:
            raise PermissionDeniedError(
                f"Agent '{self.name}' ({self.agent_type}) is explicitly forbidden from executing tool '{tool_name}'."
            )
        if tool_name not in self.allowed_tools:
            raise PermissionDeniedError(
                f"Agent '{self.name}' ({self.agent_type}) does not possess permission for tool '{tool_name}'."
            )

    @staticmethod
    def compute_hash(text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()
