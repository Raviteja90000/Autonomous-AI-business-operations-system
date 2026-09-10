# Autonomous AI Business Operations Manager (Auren Ops)

[![Production Status](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)](#)
[![Architecture](https://img.shields.io/badge/Architecture-ODAEA%20Closed--Loop-blue.svg)](#)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11+-009688.svg)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20Vite%20%7C%20TailwindCSS-61DAFB.svg)](#)
[![AI Routing](https://img.shields.io/badge/Multi--LLM-Groq%20%7C%20Gemini%20%7C%20Ollama%20%7C%20OpenAI%20%7C%20Anthropic-ff69b4.svg)](#)
[![Integrations](https://img.shields.io/badge/Connectors-Resend%20%7C%20GitHub%20%7C%20Stripe%20%7C%20HubSpot-orange.svg)](#)

---

## 1. Project Overview

The **Autonomous AI Business Operations Manager (Auren Ops)** is an enterprise-grade, closed-loop autonomous operations control plane designed to run core business functions across Sales, Support, Finance, and Marketing with rigorous safety and observability.

> [!IMPORTANT]
> **This is NOT a conversational chatbot.**
> The platform continuously monitors connected enterprise systems, detects operational anomalies, formulates bounded action plans via multi-agent reasoning, passes decisions through a zero-bypass deterministic guardrail engine, executes approved actions through typed integrations, empirically evaluates metric deltas, and self-adapts policies and memory over time.

---

## 2. Core Architecture: The ODAEA Cycle

The system executes an 8-stage state machine implementing the **ODAEA** (**O**bserve ➔ **D**ecide ➔ **A**ct ➔ **E**valuate ➔ **A**dapt) paradigm:

```
  ┌──────────────────────────────────────────────────────────────┐
  │                    1. OBSERVE & AGGREGATE                    │
  │   Ingest raw telemetry, sanitize inputs, detect anomalies    │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                    2. DECIDE & CRITIQUE                      │
  │   Planner formulates actions ➔ Critic checks logic & risk     │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                 3. DETERMINISTIC GUARDRAIL                   │
  │   Zero LLM bias: Enforce spend limits, tiers, kill switches  │
  └──────────────┬───────────────────────────────┬───────────────┘
                 │ (Requires Approval)           │ (Allowed)
                 ▼                               ▼
  ┌──────────────────────────────┐ ┌─────────────────────────────┐
  │  4. HUMAN-IN-THE-LOOP QUEUE  │ │      5. ACT (ACTUATOR)      │
  │  Operator approves or rejects│─┘ Idempotent external actions │
  └──────────────────────────────┘ └─────────────┬───────────────┘
                                                 │
                                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                   6. EVALUATE & ADAPT                        │
  │   Measure pre/post metric deltas ➔ Propose policy updates    │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │              7. EPISODIC & SEMANTIC MEMORY                   │
  │   Store outcome for few-shot learning ➔ Next cycle           │
  └──────────────────────────────────────────────────────────────┘
```

---

## 3. Key Capabilities & Features

### 🤖 Multi-Agent Swarm
* **[Observer](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/observer.py)**: Telemetry ingestion, data sanitization, and statistical anomaly detection.
* **[Aggregator](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/aggregator.py)**: Canonical world state synthesis across disparate data streams.
* **[Planner](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/planner.py)**: Strategic goal generation and action proposal formulation.
* **[Critic](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/critic.py)**: Adversarial validation, hallucination checks, and blast radius auditing.
* **[Actuator](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/actuator.py)**: Idempotent tool execution with comprehensive side-effect logging.
* **[Evaluator](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/evaluator.py)**: Empirical before-and-after outcome measurement against quantitative KPIs.
* **[Adapter](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/backend/app/agents/adapter.py)**: Dynamic confidence prior updates and versioned policy amendment proposals.

### 🛡️ Deterministic Safety & Governance
* **Zero-Bypass Guardrail Engine**: Code-level deterministic policy enforcement that cannot be circumvented by LLM prompts.
* **4 Autonomy Tiers**:
  * **Tier 0 (Observe Only)**: Monitoring and telemetry collection only.
  * **Tier 1 (Human Approval)**: All decisions pause for human operator sign-off.
  * **Tier 2 (Bounded Autonomous - Default)**: Low/medium risk actions run autonomously within strict spend and blast radius bounds.
  * **Tier 3 (High Autonomy)**: Autonomous execution within broad organizational boundaries.
* **Granular Kill Switches**: Instant emergency shutdown at `GLOBAL`, `DOMAIN`, `AGENT`, or `INTEGRATION` scope.
* **Cryptographic Audit Trail**: Immutable logging of every cycle, prompt hash, decision rationale, approval, and external API side-effect.

### 🧠 Enterprise Multi-LLM Fallback Chain
* Ordered execution with automated circuit breakers and JSON healing:
  $$\text{Groq (Llama 3.3 70B)} \longrightarrow \text{Google Gemini} \longrightarrow \text{Local Ollama (Qwen 2.5)} \longrightarrow \text{OpenAI / Anthropic} \longrightarrow \text{Heuristic Mock}$$
* Real-time token usage, latency, and cost accounting per agent and model provider.

### 🔌 Live Production Integrations & Connectors
* **Email Gateway (Resend)**: Live email delivery with sandbox routing to verified inbox (`RESEND_TEST_RECIPIENT`), executive banner metadata tagging, and one-click UI test dispatch.
* **Customer Support (GitHub Issues & Zendesk)**: Syncs customer support tickets into real-world issues and incident workflows.
* **Finance & Billing (Stripe)**: Live test mode dispute defense, refund quarantine, and payment telemetry.
* **CRM (HubSpot)**: Enterprise lead conversion scoring, deal stall alerts, and contact outreach synchronization.
* **Marketing (Google Ads)**: Campaign CPA anomaly detection and autonomous budget pacing.

### ⚡ Operations UI & Command Center
* **Auren Luxury Design System**: Tailored warm copper, obsidian, and cream palette (`#FAF8F5`, `#8E5633`, `#C5855A`, `#181716`) with modern typography.
* **God Mode Simulator**: Interactive scenario launcher for high-stakes business crises (Enterprise Lead Churn, Stripe Dispute Waves, Support Ticket Storms, CPA Spikes) with live WebSocket event streaming.
* **Executive Board Report**: Live financial ROI calculation, human labor hours saved, prevented revenue loss, and executive action summaries.
* **Streamlined Navigation**: Clean top header bar featuring one-click Board Reports, God Mode Simulator, real-time connection status, autonomy tier controls, and global kill switch.

---

## 4. Repository Structure

```text
Autonomous AI Business Operations Manager/
├── backend/                        # FastAPI Backend Application
│   └── app/
│       ├── agents/                 # Multi-agent swarm (Observer, Planner, Critic, etc.) & Multi-LLM router
│       ├── api/                    # 16 REST router modules & WebSocket streaming endpoints
│       ├── auth/                   # JWT & PBKDF2 authentication services & RBAC
│       ├── core/                   # Config, database, logging, kill-switch, telemetry
│       ├── guardrails/             # Deterministic rules engine & risk calculator
│       ├── integrations/           # CRM, Finance, Support, Email, Marketing connectors
│       ├── memory/                 # Episodic memory manager & Semantic vector store
│       ├── models/                 # SQLAlchemy 2.0 Async database models
│       ├── schemas/                # Pydantic v2 request/response schemas
│       ├── services/               # Simulation, Seed, and Policy services
│       ├── workflow/               # ODAEAFlowEngine state machine
│       └── main.py                 # FastAPI application entrypoint & middleware
├── frontend/                       # React 18 + TypeScript Control Center
│   └── src/
│       ├── components/             # Reusable UI components (ODAEA Visualizer, KPIs, Modals)
│       ├── context/                # AuthContext, WebSocketContext, SplashContext
│       ├── pages/                  # 15 operations pages (Dashboard, Actions, Approvals, Integrations, etc.)
│       ├── services/               # Typed API client services
│       └── App.tsx                 # Routing and shell navigation
├── workers/
│   └── worker.py                   # Async background worker for recurring domain cycles
├── docker/                         # Dockerfiles & Nginx reverse proxy configs
├── policies/                       # Default YAML business policy definitions
├── scripts/                        # Startup scripts (PowerShell, Bash, E2E verify)
├── tests/                          # Comprehensive pytest test suite (10 test modules)
├── docker-compose.yml              # Multi-container local orchestration
├── .env.development               # Active local development configuration
└── .env.example                    # Environment configuration template
```

---

## 5. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, TailwindCSS, Lucide React, Recharts, Vite |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0 (Async), HTTPX, Uvicorn |
| **Database** | SQLite via `aiosqlite` (Default local) / PostgreSQL, Alembic |
| **AI / Multi-LLM** | Groq (Llama 3.3 70B), Google Gemini, Local Ollama (Qwen 2.5), OpenAI GPT-4o, Anthropic Claude |
| **Live Connectors** | Resend (Email), GitHub API (Support), Stripe (Billing), HubSpot (CRM), Google Ads |
| **Security & Governance** | JWT (PyJWT), Cryptography, Deterministic Guardrail Engine, Granular RBAC |
| **Observability** | OpenTelemetry, Prometheus metrics, Structured JSON logging, WebSocket events |
| **Deployment** | Docker, Docker Compose, Nginx |

---

## 6. Quickstart & Local Setup

### Option A: Automated PowerShell Startup (Windows)

```powershell
# From the project root:
.\scripts\start.ps1
```

This script automatically:
1. Initializes and seeds the database with initial enterprise operational state.
2. Starts the FastAPI backend server on `http://127.0.0.1:8000`.
3. Starts the background worker for scheduled domain cycles.
4. Starts the Vite frontend dev server on `http://localhost:5173`.

---

### Option B: Manual Step-by-Step Setup

#### 1. Environment Configuration
Copy `.env.example` to `.env` or `.env.development`:
```bash
cp .env.example .env.development
```
Key configuration parameters:
* `EMAIL_CONNECTOR_TYPE=resend` (or `mock`)
* `RESEND_API_KEY=re_...`
* `RESEND_TEST_RECIPIENT=your_email@example.com`
* `RESEND_ROUTE_TO_TEST_INBOX=true`
* `SUPPORT_CONNECTOR_TYPE=github` (or `mock`)
* `GITHUB_TOKEN=ghp_...`
* `GITHUB_REPO=your_user/your_repo`

#### 2. Backend Setup & Startup
```bash
# From the project root:
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r backend/requirements.txt

# Run the FastAPI server:
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
* Interactive API Documentation (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
* Health Check: [http://localhost:8000/health](http://localhost:8000/health)

#### 3. Background Worker (Optional / Separate Terminal)
```bash
python -m workers.worker
```

#### 4. Frontend Setup & Startup
```bash
cd frontend
npm install
npm run dev
```
* Control Center UI: [http://localhost:5173](http://localhost:5173)

---

### Option C: Running with Docker Compose

```bash
docker-compose up --build -d
```

---

## 7. Default Demo Accounts & Roles

The database is seeded with preset enterprise accounts for immediate 1-click role testing:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@ops.ai` | `AdminPass123!` | Full system control, Kill switches, Policies, Integrations, LLM settings |
| **Operator** | `operator@ops.ai` | `OperatorPass123!` | Trigger cycles, Review & approve actions, Monitor business health |
| **Approver** | `approver@ops.ai` | `ApproverPass123!` | Human-in-the-loop queue decision maker (Approve / Reject) |
| **Auditor** | `auditor@ops.ai` | `AuditorPass123!` | Read-only inspection of decisions, audit trails, and evaluations |
| **Viewer** | `viewer@ops.ai` | `ViewerPass123!` | Read-only dashboard overview and telemetry |

---

## 8. Testing & Verification

Run the comprehensive test suite to validate guardrails, multi-agent contracts, and safety isolation:

```bash
# Run full pytest suite:
pytest tests/ -v

# Run the end-to-end operational verification script:
python scripts/e2e_verify.py
```

### Test Suite Highlights
* **[`test_guardrails.py`](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/tests/test_guardrails.py)**: Validates spend thresholds, blast radius limits, kill switch blocks, and tier gating.
* **[`test_adversarial.py`](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/tests/test_adversarial.py)**: Validates prompt injection defense, policy violations, and hallucination rejection.
* **[`test_idempotency.py`](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/tests/test_idempotency.py)**: Verifies that duplicate actions cannot be executed twice.
* **[`test_llm_router.py`](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/tests/test_llm_router.py)**: Validates circuit breakers, provider fallbacks, and JSON healing.
* **[`test_odaea_cycle.py`](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/tests/test_odaea_cycle.py)**: Tests the full 8-stage state machine flow end-to-end.

---

## 9. Architectural Documentation

For deep technical specifications, refer to the companion architecture guides:
* 📘 **[Backend Architecture Specification (02_ARCHITECTURE_BACKEND.md)](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/02_ARCHITECTURE_BACKEND.md)**
* 🎨 **[Frontend & UI Architecture Specification (03_FRONTEND_UI.md)](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/03_FRONTEND_UI.md)**
* 🛡️ **[Multi-Agent, Security & Deployment Guide (04_AGENTS_SECURITY_TESTING_DEPLOYMENT.md)](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/04_AGENTS_SECURITY_TESTING_DEPLOYMENT.md)**

---

<p align="center">
  <sub>Built for mission-critical autonomous business operations with enterprise safety and observability.</sub>
</p>
