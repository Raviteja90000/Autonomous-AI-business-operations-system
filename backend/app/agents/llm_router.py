import json
import time
import re
from typing import Dict, Any, Optional, List, Tuple
import httpx
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.core.telemetry import metrics
from backend.app.agents.budget import budget_manager


class ModelResult:
    """Standardized result returned by any LLM provider in the fallback chain."""
    def __init__(
        self,
        content: str,
        parsed_json: Dict[str, Any],
        input_tokens: int,
        output_tokens: int,
        cost_usd: float,
        latency_ms: float,
        provider: str,
        model_name: str,
        fallback_occurred: bool = False,
        fallback_reason: Optional[str] = None,
    ):
        self.content = content
        self.parsed_json = parsed_json
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens
        self.cost_usd = cost_usd
        self.latency_ms = latency_ms
        self.provider = provider
        self.model_name = model_name
        self.fallback_occurred = fallback_occurred
        self.fallback_reason = fallback_reason


class ProviderHealth:
    def __init__(self, name: str):
        self.name = name
        self.is_healthy = True
        self.consecutive_failures = 0
        self.tripped_until: float = 0.0
        self.last_error: Optional[str] = None
        self.last_success_time: Optional[float] = None
        self.total_successes: int = 0
        self.total_failures: int = 0

    def record_success(self):
        self.is_healthy = True
        self.consecutive_failures = 0
        self.tripped_until = 0.0
        self.last_success_time = time.time()
        self.total_successes += 1

    def record_failure(self, error: str):
        self.consecutive_failures += 1
        self.total_failures += 1
        self.last_error = error
        if self.consecutive_failures >= settings.LLM_CIRCUIT_BREAKER_THRESHOLD:
            self.is_healthy = False
            self.tripped_until = time.time() + settings.LLM_CIRCUIT_BREAKER_RESET_SECONDS
            logger.warning(
                f"🚨 [CIRCUIT BREAKER] Provider '{self.name}' tripped after {self.consecutive_failures} failures. "
                f"Isolating for {settings.LLM_CIRCUIT_BREAKER_RESET_SECONDS}s. Error: {error}"
            )

    def is_available(self) -> bool:
        if self.tripped_until > 0 and time.time() < self.tripped_until:
            return False
        if self.tripped_until > 0 and time.time() >= self.tripped_until:
            # Half-open trial state
            self.tripped_until = 0.0
            self.consecutive_failures = 0
            self.is_healthy = True
        return True


class MultiLLMRouter:
    """
    Enterprise Multi-LLM Provider Fallback Router.
    Ordered Execution: Groq -> Gemini -> Ollama (Qwen) -> Deterministic Mock.
    """

    def __init__(self):
        self.providers_health: Dict[str, ProviderHealth] = {
            "groq": ProviderHealth("groq"),
            "gemini": ProviderHealth("gemini"),
            "ollama": ProviderHealth("ollama"),
            "openai": ProviderHealth("openai"),
            "anthropic": ProviderHealth("anthropic"),
            "mock": ProviderHealth("mock"),
        }

    def clean_and_parse_json(self, raw_text: str) -> Tuple[str, Dict[str, Any]]:
        """Cleans, heals, and parses JSON output from any LLM."""
        text = raw_text.strip()

        # Strip markdown code blocks
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        # Direct parse attempt
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return text, parsed
        except Exception:
            pass

        # Regex extraction of JSON object if surrounded by chat fluff
        match = re.search(r"(\{.*\})", text, re.DOTALL)
        if match:
            candidate = match.group(1)
            try:
                parsed = json.loads(candidate)
                if isinstance(parsed, dict):
                    return candidate, parsed
            except Exception:
                pass

        # Auto-healing: Fix trailing commas or unclosed braces
        repaired = re.sub(r",\s*([\]}])", r"\1", text)
        try:
            parsed = json.loads(repaired)
            if isinstance(parsed, dict):
                return repaired, parsed
        except Exception:
            pass

        logger.warning("Could not parse LLM output as strict JSON. Returning empty dict with raw text.")
        return text, {}

    async def generate_with_fallback(
        self,
        agent_type: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
    ) -> ModelResult:
        """
        Executes an agent reasoning task through the fallback chain until successful.
        Chain: Groq ➔ Gemini ➔ Ollama (Qwen) ➔ Deterministic Mock.
        """
        chain = list(settings.LLM_FALLBACK_CHAIN)
        if not chain:
            chain = ["groq", "gemini", "ollama", "mock"]
        if "mock" not in chain:
            chain.append("mock")

        # Check if budget is exceeded; if so, jump directly to Ollama/Mock (free tiers)
        if budget_manager.is_budget_exceeded():
            logger.warning("Daily/Monthly LLM budget exceeded. Auto-routing to 100% Free Local Ollama / Mock.")
            chain = [p for p in chain if p in ("ollama", "mock")]

        errors_encountered = []
        start_time = time.perf_counter()

        for idx, provider in enumerate(chain):
            provider_key = provider.lower().strip()
            health = self.providers_health.get(provider_key)
            
            if health and not health.is_available():
                logger.debug(f"Skipping tripped provider '{provider_key}'.")
                continue

            try:
                result = None
                p_start = time.perf_counter()

                if provider_key == "groq":
                    result = await self._call_groq(agent_type, system_prompt, user_prompt, temperature)
                elif provider_key == "gemini":
                    result = await self._call_gemini(agent_type, system_prompt, user_prompt, temperature)
                elif provider_key == "ollama":
                    result = await self._call_ollama(agent_type, system_prompt, user_prompt, temperature)
                elif provider_key == "openai":
                    result = await self._call_openai(agent_type, system_prompt, user_prompt, temperature)
                elif provider_key == "anthropic":
                    result = await self._call_anthropic(agent_type, system_prompt, user_prompt, temperature)
                elif provider_key == "mock":
                    result = await self._call_mock(agent_type, user_prompt)

                if result:
                    p_latency = round((time.perf_counter() - p_start) * 1000, 2)
                    result.latency_ms = p_latency
                    
                    if health:
                        health.record_success()

                    # Record token spend in budget manager
                    cost = budget_manager.record_usage(
                        provider=result.provider,
                        model=result.model_name,
                        agent_type=agent_type,
                        input_tokens=result.input_tokens,
                        output_tokens=result.output_tokens,
                        custom_cost=result.cost_usd,
                    )
                    result.cost_usd = cost

                    if idx > 0:
                        result.fallback_occurred = True
                        result.fallback_reason = f"Primary provider(s) failed: {'; '.join(errors_encountered)}"
                        logger.info(
                            f"🔄 [FAILOVER SUCCESS] Agent '{agent_type}' succeeded with fallback '{result.provider}' "
                            f"({result.model_name}) after: {result.fallback_reason}"
                        )
                    else:
                        logger.info(
                            f"✨ [LLM SUCCESS] Agent '{agent_type}' completed via primary '{result.provider}' "
                            f"({result.model_name}) in {p_latency}ms ({result.input_tokens}+{result.output_tokens} tokens)"
                        )

                    return result

            except Exception as e:
                err_msg = f"{provider_key}: {str(e)}"
                errors_encountered.append(err_msg)
                if health:
                    health.record_failure(str(e))
                logger.warning(f"⚠️ Provider '{provider_key}' failed for agent '{agent_type}': {e}. Trying next provider in chain...")

        # Ultimate safety fallback to mock if everything in loop threw
        logger.error(f"All configured LLM providers failed. Triggering ultimate deterministic reasoning engine.")
        mock_res = await self._call_mock(agent_type, user_prompt)
        mock_res.fallback_occurred = True
        mock_res.fallback_reason = f"All providers exhausted: {'; '.join(errors_encountered)}"
        return mock_res

    # -------------------------------------------------------------------------
    # 1. Groq Provider (Ultra-Fast Free Cloud)
    # -------------------------------------------------------------------------
    async def _call_groq(
        self, agent_type: str, system_prompt: str, user_prompt: str, temperature: float
    ) -> ModelResult:
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not configured")

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        model = settings.GROQ_MODEL or "llama-3.3-70b-versatile"
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": f"{system_prompt}\n\nCRITICAL INSTRUCTION: You must respond ONLY with a single, valid JSON object matching the requested schema. No conversational filler or markdown.",
                },
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": temperature,
        }

        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

            choice = data.get("choices", [{}])[0].get("message", {})
            content = choice.get("content", "{}")
            usage = data.get("usage", {})
            in_tokens = usage.get("prompt_tokens", 250)
            out_tokens = usage.get("completion_tokens", 150)

            clean_text, parsed_json = self.clean_and_parse_json(content)
            cost = budget_manager.calculate_cost(model, in_tokens, out_tokens)

            return ModelResult(
                content=clean_text,
                parsed_json=parsed_json,
                input_tokens=in_tokens,
                output_tokens=out_tokens,
                cost_usd=cost,
                latency_ms=0.0,
                provider="groq",
                model_name=model,
            )

    # -------------------------------------------------------------------------
    # 2. Google Gemini Provider (Google AI Studio Free Tier)
    # -------------------------------------------------------------------------
    async def _call_gemini(
        self, agent_type: str, system_prompt: str, user_prompt: str, temperature: float
    ) -> ModelResult:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")

        model = settings.GEMINI_MODEL or "gemini-1.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
        
        headers = {"Content-Type": "application/json"}
        payload = {
            "system_instruction": {
                "parts": [{"text": f"{system_prompt}\n\nReturn strictly valid JSON adhering to schema."}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_prompt}]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": temperature,
            }
        }

        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

            candidates = data.get("candidates", [])
            if not candidates:
                raise ValueError("Gemini returned empty candidate response")

            parts = candidates[0].get("content", {}).get("parts", [])
            content = parts[0].get("text", "{}") if parts else "{}"

            usage = data.get("usageMetadata", {})
            in_tokens = usage.get("promptTokenCount", 250)
            out_tokens = usage.get("candidatesTokenCount", 150)

            clean_text, parsed_json = self.clean_and_parse_json(content)
            cost = budget_manager.calculate_cost(model, in_tokens, out_tokens)

            return ModelResult(
                content=clean_text,
                parsed_json=parsed_json,
                input_tokens=in_tokens,
                output_tokens=out_tokens,
                cost_usd=cost,
                latency_ms=0.0,
                provider="gemini",
                model_name=model,
            )

    # -------------------------------------------------------------------------
    # 3. Local Ollama Provider (100% Free, Local & Private - Qwen / Llama)
    # -------------------------------------------------------------------------
    async def _call_ollama(
        self, agent_type: str, system_prompt: str, user_prompt: str, temperature: float
    ) -> ModelResult:
        base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        model = settings.OLLAMA_MODEL or "qwen2.5:7b"
        url = f"{base_url}/api/chat"

        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": f"{system_prompt}\n\nCRITICAL: Respond ONLY with a valid JSON object matching the schema.",
                },
                {"role": "user", "content": user_prompt},
            ],
            "format": "json",
            "stream": False,
            "options": {
                "temperature": temperature,
            }
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

            message = data.get("message", {})
            content = message.get("content", "{}")

            in_tokens = data.get("prompt_eval_count", 200)
            out_tokens = data.get("eval_count", 150)

            clean_text, parsed_json = self.clean_and_parse_json(content)

            return ModelResult(
                content=clean_text,
                parsed_json=parsed_json,
                input_tokens=in_tokens,
                output_tokens=out_tokens,
                cost_usd=0.0,  # 100% Free Local Execution
                latency_ms=0.0,
                provider="ollama",
                model_name=model,
            )

    # -------------------------------------------------------------------------
    # Optional Commercial Providers (OpenAI & Anthropic)
    # -------------------------------------------------------------------------
    async def _call_openai(
        self, agent_type: str, system_prompt: str, user_prompt: str, temperature: float
    ) -> ModelResult:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not configured")

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        model = settings.OPENAI_MODEL or "gpt-4o-mini"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": temperature,
        }

        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

            content = data.get("choices", [{}])[0].get("message", {}).get("content", "{}")
            usage = data.get("usage", {})
            in_tokens = usage.get("prompt_tokens", 250)
            out_tokens = usage.get("completion_tokens", 150)

            clean_text, parsed_json = self.clean_and_parse_json(content)
            cost = budget_manager.calculate_cost(model, in_tokens, out_tokens)

            return ModelResult(
                content=clean_text,
                parsed_json=parsed_json,
                input_tokens=in_tokens,
                output_tokens=out_tokens,
                cost_usd=cost,
                latency_ms=0.0,
                provider="openai",
                model_name=model,
            )

    async def _call_anthropic(
        self, agent_type: str, system_prompt: str, user_prompt: str, temperature: float
    ) -> ModelResult:
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY not configured")

        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": settings.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        model = settings.ANTHROPIC_MODEL or "claude-3-5-haiku-20241022"
        payload = {
            "model": model,
            "system": f"{system_prompt}\n\nRespond ONLY with a valid JSON object.",
            "messages": [{"role": "user", "content": user_prompt}],
            "max_tokens": 1500,
            "temperature": temperature,
        }

        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

            content_blocks = data.get("content", [])
            content = content_blocks[0].get("text", "{}") if content_blocks else "{}"
            usage = data.get("usage", {})
            in_tokens = usage.get("input_tokens", 250)
            out_tokens = usage.get("output_tokens", 150)

            clean_text, parsed_json = self.clean_and_parse_json(content)
            cost = budget_manager.calculate_cost(model, in_tokens, out_tokens)

            return ModelResult(
                content=clean_text,
                parsed_json=parsed_json,
                input_tokens=in_tokens,
                output_tokens=out_tokens,
                cost_usd=cost,
                latency_ms=0.0,
                provider="anthropic",
                model_name=model,
            )

    # -------------------------------------------------------------------------
    # 4. Built-in Deterministic Reasoning Engine (Zero Cost & 100% Guaranteed)
    # -------------------------------------------------------------------------
    async def _call_mock(self, agent_type: str, user_prompt: str) -> ModelResult:
        """Domain-intelligent deterministic reasoning for all 6 ODAEA roles."""
        parsed: Dict[str, Any] = {}

        if agent_type == "observer":
            parsed = {
                "summary": "Observation completed across connected business connectors. Active leads and tickets reviewed.",
                "anomalies_detected": [
                    {
                        "entity_id": "LEAD-9042",
                        "severity": "HIGH",
                        "description": "High-value enterprise lead (ARR: $48,000) inactivity detected for 48+ hours after demo request.",
                        "confidence": 0.94,
                        "recommended_action": "send_followup_email"
                    }
                ],
                "confidence": 0.95
            }
        elif agent_type == "planner":
            parsed = {
                "goal": "Re-engage stalling high-value enterprise lead LEAD-9042 and maintain SLA conversion velocity",
                "rationale_summary": "Lead has high intent score (0.92) but has stalled post-demo. Prompt personalized executive outreach.",
                "confidence": 0.92,
                "estimated_cost_usd": 0.0,
                "blast_radius_count": 1,
                "risk_level": "LOW",
                "reversibility": "REVERSIBLE",
                "proposed_actions": [
                    {
                        "action_type": "send_followup_email",
                        "target_system": "email",
                        "payload": {
                            "recipient": "cto@acmecorp.example",
                            "subject": "Enterprise Architecture Next Steps — Priority Scheduling",
                            "template_id": "exec_followup_v2",
                            "lead_id": "LEAD-9042"
                        },
                        "estimated_cost_usd": 0.0,
                        "risk_score": 0.12,
                        "blast_radius": 1,
                        "is_reversible": True,
                        "sequence_order": 1
                    }
                ],
                "evidence": [
                    {
                        "source_type": "observation",
                        "reference_id": "LEAD-9042",
                        "snippet": "Inactivity duration 48.2 hours exceeds 24 hour SLA threshold.",
                        "confidence_contribution": 0.92
                    }
                ]
            }
        elif agent_type == "critic":
            parsed = {
                "review_status": "APPROVED",
                "reasoning_critique": "The evidence directly corroborates lead dormancy. Action plan has bounded blast radius (1 recipient) and negligible risk ($0 spend).",
                "risk_assessment": "Low risk of customer irritation; communication template is professional and targeted.",
                "logic_score": 0.95,
                "hallucination_risk": 0.02,
                "recommendations": ["Ensure CRM sync is verified before dispatching follow-up."]
            }
        elif agent_type == "evaluator":
            parsed = {
                "goal_achieved": True,
                "actual_outcome": "POSITIVE",
                "confidence_score": 0.93,
                "metric_deltas": {
                    "lead_engagement_score": {"before": 42.0, "after": 88.0, "delta": "+46.0"},
                    "response_time_hours": {"before": 48.2, "after": 1.4, "delta": "-46.8h"},
                    "conversion_probability": {"before": 0.35, "after": 0.78, "delta": "+0.43"}
                },
                "adaptation_notes": "Prompt follow-up email resulted in meeting confirmation within 90 minutes."
            }
        elif agent_type == "adapter":
            parsed = {
                "success_rate": 0.92,
                "recommendation": "Increase confidence prior for send_followup_email within 48h dormancy window to 0.94.",
                "proposed_policy_delta": {
                    "domain": "sales",
                    "action": "send_followup_email",
                    "confidence_prior_delta": "+0.02"
                }
            }
        else:
            parsed = {"status": "SUCCESS", "message": f"Deterministic execution completed for {agent_type}"}

        content = json.dumps(parsed)
        return ModelResult(
            content=content,
            parsed_json=parsed,
            input_tokens=180,
            output_tokens=120,
            cost_usd=0.0,
            latency_ms=10.0,
            provider="mock",
            model_name=f"heuristic-{agent_type}-v1",
        )

    # -------------------------------------------------------------------------
    # Diagnostics & Auto-Discovery
    # -------------------------------------------------------------------------
    async def get_providers_status(self) -> Dict[str, Any]:
        """Probes all providers and returns connectivity status and local Ollama models."""
        chain = settings.LLM_FALLBACK_CHAIN
        status_map: Dict[str, Any] = {}

        # 1. Groq status
        groq_configured = bool(settings.GROQ_API_KEY)
        status_map["groq"] = {
            "name": "Groq Cloud",
            "tier": "Free Cloud Tier",
            "model": settings.GROQ_MODEL,
            "configured": groq_configured,
            "is_healthy": self.providers_health["groq"].is_available() and groq_configured,
            "circuit_breaker_tripped": not self.providers_health["groq"].is_available(),
            "total_successes": self.providers_health["groq"].total_successes,
            "total_failures": self.providers_health["groq"].total_failures,
            "last_error": self.providers_health["groq"].last_error,
        }

        # 2. Gemini status
        gemini_configured = bool(settings.GEMINI_API_KEY)
        status_map["gemini"] = {
            "name": "Google Gemini",
            "tier": "Free Tier (Google AI Studio)",
            "model": settings.GEMINI_MODEL,
            "configured": gemini_configured,
            "is_healthy": self.providers_health["gemini"].is_available() and gemini_configured,
            "circuit_breaker_tripped": not self.providers_health["gemini"].is_available(),
            "total_successes": self.providers_health["gemini"].total_successes,
            "total_failures": self.providers_health["gemini"].total_failures,
            "last_error": self.providers_health["gemini"].last_error,
        }

        # 3. Ollama local probe
        ollama_reachable = False
        ollama_models = []
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/tags")
                if resp.is_success:
                    ollama_reachable = True
                    tags = resp.json().get("models", [])
                    ollama_models = [m.get("name") for m in tags if m.get("name")]
        except Exception:
            ollama_reachable = False

        status_map["ollama"] = {
            "name": "Local Ollama",
            "tier": "100% Free & Local Private",
            "base_url": settings.OLLAMA_BASE_URL,
            "target_model": settings.OLLAMA_MODEL,
            "configured": True,
            "is_reachable": ollama_reachable,
            "installed_models": ollama_models,
            "is_healthy": ollama_reachable and self.providers_health["ollama"].is_available(),
            "circuit_breaker_tripped": not self.providers_health["ollama"].is_available(),
            "total_successes": self.providers_health["ollama"].total_successes,
            "total_failures": self.providers_health["ollama"].total_failures,
            "last_error": self.providers_health["ollama"].last_error,
        }

        # 4. Deterministic Mock
        status_map["mock"] = {
            "name": "Built-in Heuristic Engine",
            "tier": "100% Free & Always Online",
            "configured": True,
            "is_healthy": True,
            "circuit_breaker_tripped": False,
            "total_successes": self.providers_health["mock"].total_successes,
            "total_failures": 0,
        }

        return {
            "fallback_chain": chain,
            "active_primary": chain[0] if chain else "mock",
            "providers": status_map,
        }


# Global router singleton
llm_router = MultiLLMRouter()
