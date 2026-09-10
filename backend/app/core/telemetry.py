import time
import uuid
from typing import Optional, Dict, Any
from contextvars import ContextVar

# Context variables for tracing
current_request_id: ContextVar[Optional[str]] = ContextVar("current_request_id", default=None)
current_trace_id: ContextVar[Optional[str]] = ContextVar("current_trace_id", default=None)
current_cycle_id: ContextVar[Optional[str]] = ContextVar("current_cycle_id", default=None)


def generate_trace_id() -> str:
    return uuid.uuid4().hex


def generate_request_id() -> str:
    return str(uuid.uuid4())


class MetricsRegistry:
    """In-memory aggregated metrics tracker with time-window summaries."""
    def __init__(self):
        self._counters: Dict[str, float] = {
            "cycles_total": 0,
            "cycles_successful": 0,
            "cycles_failed": 0,
            "actions_executed": 0,
            "actions_blocked": 0,
            "actions_rolled_back": 0,
            "approvals_requested": 0,
            "approvals_granted": 0,
            "approvals_rejected": 0,
            "total_tokens_consumed": 0,
            "total_cost_usd": 0.0,
        }
        self._latencies: Dict[str, list] = {
            "cycle_duration_ms": [],
            "agent_latency_ms": [],
            "guardrail_latency_ms": [],
            "api_latency_ms": [],
        }

    def increment(self, metric: str, value: float = 1.0):
        if metric in self._counters:
            self._counters[metric] += value
        else:
            self._counters[metric] = value

    def record_latency(self, metric: str, duration_ms: float):
        if metric not in self._latencies:
            self._latencies[metric] = []
        self._latencies[metric].append(duration_ms)
        # keep last 1000 data points
        if len(self._latencies[metric]) > 1000:
            self._latencies[metric] = self._latencies[metric][-1000:]

    def get_summary(self) -> Dict[str, Any]:
        avg_latencies = {}
        for k, v in self._latencies.items():
            avg_latencies[f"avg_{k}"] = round(sum(v) / len(v), 2) if v else 0.0

        return {
            "counters": self._counters.copy(),
            "latencies": avg_latencies,
            "timestamp": time.time(),
        }


metrics = MetricsRegistry()
