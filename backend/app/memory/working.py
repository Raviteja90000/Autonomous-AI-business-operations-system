from typing import Dict, Any, List


class WorkingMemoryContext:
    """Working Memory buffer holding short-term operational state during an active ODAEA cycle."""
    def __init__(self, cycle_id: str, domain: str):
        self.cycle_id = cycle_id
        self.domain = domain
        self.active_signals: Dict[str, Any] = {}
        self.context_flags: Dict[str, Any] = {}
        self.temporary_findings: List[str] = []

    def set_signal(self, key: str, value: Any):
        self.active_signals[key] = value

    def add_finding(self, finding: str):
        self.temporary_findings.append(finding)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cycle_id": self.cycle_id,
            "domain": self.domain,
            "signals": self.active_signals,
            "findings": self.temporary_findings,
        }
