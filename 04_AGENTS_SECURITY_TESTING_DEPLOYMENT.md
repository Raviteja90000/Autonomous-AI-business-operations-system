# Multi-Agent System, Security, Testing & Deployment Guide

## 1. Multi-Agent Swarm Architecture

The platform breaks complex business reasoning into specialized, single-responsibility agents located in [backend/app/agents/](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/):

```
                                 Raw Telemetry
                                       │
                                       ▼
                             ┌───────────────────┐
                             │   Observer Agent  │
                             └─────────┬─────────┘
                                       │ Raw Observation & Anomalies
                                       ▼
                             ┌───────────────────┐
                             │  Aggregator Agent │
                             └─────────┬─────────┘
                                       │ Canonical World State
                                       ▼
    Semantic Memory ────────▶┌───────────────────┐
    & SOP Policies           │   Planner Agent   │
                             └─────────┬─────────┘
                                       │ Proposed Plan & Actions
                                       ▼
                             ┌───────────────────┐
                             │    Critic Agent   │◀─── Adversarial Review
                             └─────────┬─────────┘
                                       │ Reviewed Plan
                                       ▼
                             ┌───────────────────┐
                             │ Guardrail Engine  │◀─── Deterministic Code Rules
                             └─────────┬─────────┘
                                       │ Approved Action
                                       ▼
                             ┌───────────────────┐
                             │   Actuator Agent  │────▶ External Systems (Stripe, HubSpot)
                             └─────────┬─────────┘
                                       │ Action Side-Effects
                                       ▼
                             ┌───────────────────┐
                             │  Evaluator Agent  │
                             └─────────┬─────────┘
                                       │ Metric Deltas & Outcome
                                       ▼
                             ┌───────────────────┐
                             │   Adapter Agent   │────▶ Policy Updates & Episodic Memory
                             └───────────────────┘
```

### Agent Specification Matrix

| Agent | Class | Primary Function | Model Complexity Tier | Output Schema |
| :--- | :--- | :--- | :--- | :--- |
| **Observer** | [ObserverAgent](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/observer.py) | Ingests raw connector feeds, sanitizes text, tags anomalies with severity. | Lightweight / Fast | `{"summary": str, "anomalies": List[Anomaly]}` |
| **Aggregator** | [AggregatorAgent](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/aggregator.py) | Merges multi-connector feeds into a single consolidated `WorldState`. | Medium Reasoning | `{"state_data": dict, "aggregate_metrics": dict}` |
| **Planner** | [PlannerAgent](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/planner.py) | Formulates strategic goals, rationale, risk estimates, and ordered actions. | Strong Reasoning | `{"goal": str, "proposed_actions": List[Action]}` |
| **Critic** | [CriticAgent](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/critic.py) | Adversarial validation: checks reasoning, evidence citation, and hallucination risk. | Strong Reasoning | `{"review_status": str, "logic_score": float}` |
| **Actuator** | [ActuatorAgent](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/actuator.py) | Dispatches actions to integrations with idempotency verification and state capture. | Typed Execution | `{"result_data": dict, "side_effects": list}` |
| **Evaluator** | [EvaluatorAgent](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/evaluator.py) | Computes pre- vs post-execution metric deltas and evaluates goal fulfillment. | Medium Reasoning | `{"goal_achieved": bool, "metric_deltas": dict}` |
| **Adapter** | [AdapterAgent](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/adapter.py) | Synthesizes evaluation results to propose policy updates and store episodic learning. | Medium Reasoning | `{"proposed_changes": dict, "rationale": str}` |

---

## 2. Multi-LLM Provider Router & Fault Tolerance

The system utilizes [MultiLLMRouter](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/llm_router.py) to decouple the platform from any single AI vendor.

### Fallback Execution Chain
When an agent invokes a model, requests route sequentially through the fallback chain:
1. **Groq (Llama 3.3 70B Versatile)**: Primary ultra-low latency provider.
2. **Google Gemini (Gemini 2.0 Flash / 1.5 Flash)**: High-context secondary provider.
3. **Ollama (Qwen 2.5 7B / Llama 3)**: Local on-premise fallback without cloud dependencies.
4. **OpenAI (GPT-4o / GPT-4o-mini)**: Cloud reasoning fallback.
5. **Anthropic (Claude 3.5 Sonnet)**: Cloud reasoning fallback.
6. **Deterministic Mock Engine**: Guaranteed fail-safe simulation provider that parses intent and generates valid schema-compliant mock outputs without throwing errors.

### Circuit Breaker Pattern
* If any provider experiences 3 consecutive failures (`LLM_CIRCUIT_BREAKER_THRESHOLD`), its circuit breaker trips.
* The provider is isolated for 60 seconds (`LLM_CIRCUIT_BREAKER_RESET_SECONDS`), preventing wasted API latency.
* After 60 seconds, the provider enters a half-open trial state to test recovery.

### Automatic JSON Healing
The router automatically extracts, cleans markdown blocks, and heals truncated or malformed JSON emitted by LLMs (`clean_and_parse_json`), ensuring zero runtime crashes from schema formatting errors.

---

## 3. Token Budgeting & Cost Governance

Located in [backend/app/agents/budget.py](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/budget.py):
* **Per-Cycle Limit**: Enforces a strict maximum spend per ODAEA cycle ($0.50 default).
* **Per-Domain Daily Limit**: Enforces daily caps per business department ($10.00 default).
* **Global Daily Limit**: Organization-wide cost ceiling ($50.00 default).
* **Cost Accounting**: Every agent run writes input tokens, output tokens, latency (ms), and exact USD cost to the `AgentRun` table.

---

## 4. Prompt Engineering & Versioning

All agent prompts are centrally maintained in [backend/app/agents/prompts.py](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/prompts.py):
* **Explicit Version Strings**: e.g., `v1.2.0-planner-prod`.
* **Cryptographic SHA-256 Hashing**: Every prompt text is hashed at runtime (`prompt_hash`) and logged with the decision record for complete audit reproducibility.
* **Strict Role Segregation**: System prompts explicitly prevent agents from hallucinating authority outside their designated stage (e.g. the Planner prompt prohibits direct tool execution).

---

## 5. Security & Safety Architecture

### 5.1 Granular Role-Based Access Control (RBAC)
User permissions are verified via JWT tokens and RBAC middleware:

| Role | Dashboard | View Decisions | Approve Actions | Execute Cycles | Manage Policies | Emergency Kill Switch |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **OPERATOR** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **APPROVER** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **AUDITOR** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **VIEWER** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 5.2 Multi-Level Kill Switch Subsystem
Located in [backend/app/core/kill_switch.py](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/core/kill_switch.py):
* **GLOBAL**: Halts all autonomous actions across the entire enterprise.
* **DOMAIN**: Halts actions in a specific vertical (e.g. `finance` or `marketing`).
* **AGENT**: Disables a specific agent (e.g. `planner`).
* **INTEGRATION**: Cuts off connections to a specific third-party service (e.g. `stripe`).

### 5.3 Prompt Injection Defense
All untrusted external inputs (CRM customer notes, ticket descriptions, incoming emails) are passed through [sanitizer.py](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/sanitizer.py):
* Strips system prompt override patterns (`"ignore previous instructions"`, `"system:"`, `"eval("`).
* Explicitly tags external content in formatted delimiters: `<UNTRUSTED_EXTERNAL_DATA>` so LLMs treat it strictly as data, never as instructions.

---

## 6. Autonomy Tiers

The system enforces four distinct operational autonomy tiers:

| Tier | Name | Behavior |
| :--- | :--- | :--- |
| **Tier 0** | **Observe Only** | Autonomous execution is prohibited. Anomalies are observed and logged; no actions can be proposed or executed. |
| **Tier 1** | **Assistive (Human-in-the-Loop)** | The Planner proposes actions, but 100% of actions mandate operator approval before execution. |
| **Tier 2** | **Bounded Autonomous** *(Default)* | Low-risk, reversible actions within spend limits auto-execute; high-risk or irreversible actions route to human approval. |
| **Tier 3** | **High Autonomy** | Autonomous execution across broad scope under strict hard limits. |

---

## 7. Testing Suite & Verification Matrix

The repository includes comprehensive automated tests in [tests/](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/tests/):

```bash
# Run the entire test suite
pytest tests/ -v
```

### Test Modules

| Test File | Verification Area |
| :--- | :--- |
| **[test_guardrails.py](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/tests/test_guardrails.py)** | Evaluates max spend limits ($5,000 threshold), blast radius caps, kill switch blocks, and Autonomy Tier gating. |
| **[test_adversarial.py](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/tests/test_adversarial.py)** | Tests prompt injection attempts, forbidden action rejection, and hallucination detection. |
| **[test_idempotency.py](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/tests/test_idempotency.py)** | Verifies that duplicate actions with matching idempotency keys are never re-executed. |
| **[test_llm_router.py](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/tests/test_llm_router.py)** | Tests circuit breaker isolation, provider fallbacks, and automatic JSON healing. |
| **[test_odaea_cycle.py](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/tests/test_odaea_cycle.py)** | Tests full end-to-end execution of the 8-stage state machine from Observation to Adaptation. |
| **[test_approvals.py](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/tests/test_approvals.py)** | Validates Human-in-the-Loop approval workflows, state pauses, and rejection handling. |
| **[test_auth.py](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/tests/test_auth.py)** | Tests password hashing, JWT token issuance, session authentication, and RBAC rejection. |
| **[test_offline_eval.py](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/tests/test_offline_eval.py)** | Tests the Evaluator and Adapter offline evaluation algorithms. |
| **[test_simulation_service.py](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/tests/test_simulation_service.py)** | Validates synthetic business anomaly generation. |

---

## 8. Docker & Production Deployment

The project includes production-ready container configurations:

### Container Setup
* **`docker/Dockerfile.backend`**: Python 3.11 slim image running FastAPI with Uvicorn.
* **`docker/Dockerfile.frontend`**: Multi-stage build (Node 18 build ➔ Nginx Alpine runtime).
* **`docker/Dockerfile.worker`**: Background worker daemon container.
* **`docker-compose.yml`**: Full local stack orchestrating Frontend, Backend, Worker, and PostgreSQL.

### Running with Docker Compose
```bash
docker-compose up --build -d
```

---

## 9. Production Readiness Checklist

- [x] **Modular Architecture**: Clean separation between API, state machine, multi-agent swarm, guardrails, and integrations.
- [x] **Durable State Machine**: `ODAEAFlowEngine` persists state transitions to PostgreSQL at every step.
- [x] **Deterministic Guardrails**: Zero LLM bias; non-bypassable code rules for spend, blast radius, reversibility, and tiers.
- [x] **Human-in-the-Loop Queue**: Interactive approval workbench with risk scores and policy violation details.
- [x] **Multi-LLM Routing**: Ordered fallback chain with circuit breakers and cost budgeting.
- [x] **Idempotent Actuators**: Unique idempotency keys prevent duplicate side-effects.
- [x] **Dual Memory**: Episodic learning + semantic vector knowledge retrieval.
- [x] **Security & RBAC**: JWT authentication, role enforcement, secret isolation, and prompt injection sanitization.
- [x] **Real-Time UI**: React 18 dashboard with live WebSocket event streaming.
- [x] **Automated Tests**: Unit, guardrail, adversarial, and end-to-end test suite passing.
