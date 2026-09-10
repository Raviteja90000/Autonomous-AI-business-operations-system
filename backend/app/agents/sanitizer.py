import re
import html
from typing import Dict, Any, Union


class PromptSanitizer:
    """Sanitizes untrusted external text and marks it as isolated, non-instruction data."""

    INJECTION_PATTERNS = [
        re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
        re.compile(r"disregard\s+(all\s+)?prior\s+rules", re.IGNORECASE),
        re.compile(r"system\s*:\s*", re.IGNORECASE),
        re.compile(r"you\s+are\s+now\s+in\s+developer\s+mode", re.IGNORECASE),
        re.compile(r"bypass\s+all\s+guardrails", re.IGNORECASE),
        re.compile(r"execute\s+tool\s*:\s*", re.IGNORECASE),
        re.compile(r"as\s+an\s+ai\s+administrator", re.IGNORECASE),
        re.compile(r"jailbreak", re.IGNORECASE),
    ]

    @classmethod
    def sanitize_text(cls, text: str, source_label: str = "untrusted_data") -> str:
        if not text:
            return ""

        cleaned = html.escape(str(text))
        
        # Check for injection indicators and neutralize
        for pattern in cls.INJECTION_PATTERNS:
            if pattern.search(cleaned):
                cleaned = pattern.sub(r"[SUSPICIOUS_INSTRUCTION_REDACTED]", cleaned)

        # Wrap in unambiguous non-executable data boundary
        return (
            f"\n<UNTRUSTED_DATA source='{source_label}'>\n"
            f"{cleaned}\n"
            f"</UNTRUSTED_DATA>\n"
        )

    @classmethod
    def sanitize_payload(cls, data: Union[Dict[str, Any], list, str]) -> Any:
        if isinstance(data, dict):
            return {k: cls.sanitize_payload(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [cls.sanitize_payload(item) for item in data]
        elif isinstance(data, str):
            # If string is longer than 50 chars or contains potential prompt injection
            return cls.sanitize_text(data)
        return data
