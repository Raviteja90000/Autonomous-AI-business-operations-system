# Frontend Architecture & UI Specification

## 1. Objective & Design Philosophy

The frontend of the **Autonomous AI Business Operations Manager** is built with **React 18**, **TypeScript**, **TailwindCSS**, and **Vite**. 

It is designed as an **Enterprise AI Operations Control Center** — providing complete operational visibility, real-time cycle telemetry, Human-in-the-Loop review queues, and instant emergency controls.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Top Bar: Organization | Status Indicator | Autonomy Tier | Kill Switch | Profile │
├──────────────┬──────────────────────────────────────────────────────────────┤
│              │                                                              │
│ Sidebar      │                     Main Operations View                     │
│              │                                                              │
│ • Dashboard  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│ • Cycles     │  │ Business KPI │  │ Active Cycle │  │ Approvals    │         │
│ • Decisions  │  └──────────────┘  └──────────────┘  └──────────────┘         │
│ • Approvals  │                                                              │
│ • Actions    │  ┌─────────────────────────────────────────────────────────┐  │
│ • Evaluates  │  │            Live ODAEA Cycle State Visualizer             │  │
│ • Agents     │  └─────────────────────────────────────────────────────────┘  │
│ • Memory     │                                                              │
│ • Policies   │  ┌─────────────────────────────────────────────────────────┐  │
│ • Connectors │  │            Active Anomalies & Decision Feeds             │  │
│ • Audit Logs │  └─────────────────────────────────────────────────────────┘  │
│ • System     │                                                              │
│ • Settings   │                                                              │
│              │                                                              │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 2. Design System & Aesthetics

* **Dark-First Command Center Palette**: Sleek slate and obsidian dark theme (`bg-slate-950`, `bg-slate-900/80`, `border-slate-800`).
* **High Contrast Status Accents**:
  * 🟢 **Success / Active**: Emerald (`#10B981`)
  * 🔵 **Running / Processing**: Cyan & Blue (`#06B6D4`, `#3B82F6`)
  * 🟡 **Requires Approval / Warning**: Amber (`#F59E0B`)
  * 🔴 **Blocked / Anomaly / Kill Switch**: Rose & Red (`#F43F5E`, `#EF4444`)
  * 🟣 **AI / Reasoning / Memory**: Violet & Indigo (`#8B5CF6`, `#6366F1`)
* **Glassmorphism & Cards**: Translucent dark surfaces with subtle borders (`backdrop-blur-md border border-slate-800/80 rounded-xl`).
* **Typography**: Clean, readable sans-serif typography with monospace font styling for UUIDs, idempotency keys, and trace IDs.

---

## 3. Application Layout & Navigation (`App.tsx`)

The main application shell ([frontend/src/App.tsx](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/App.tsx)) encapsulates:

1. **Authentication Provider (`AuthContext`)**: Manages JWT tokens, authenticated user state, and RBAC permissions.
2. **WebSocket Provider (`WebSocketContext`)**: Establishes a single resilient WebSocket connection to `/ws/events` with auto-reconnection and toast notifications.
3. **Collapsible Sidebar Navigation**: Direct access to all 14 operational pages with live badge counts for pending approvals and critical anomalies.
4. **Global Top Bar**:
   * Current Autonomy Tier badge (Tier 0 to Tier 3).
   * Global System Health indicator.
   * Emergency Kill Switch indicator.
   * Active User Profile badge and role indicator.

---

## 4. Complete Operations Page Reference

The frontend includes 14 dedicated operational pages in [frontend/src/pages/](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/pages/):

### 1. Executive Dashboard ([DashboardPage.tsx](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/pages/DashboardPage.tsx))
* **Top KPI Row**: Business Health score, Active Cycles count, Autonomous Actions executed, Pending Approvals queue, Success Rate %, and Guardrail Block count.
* **Live ODAEA Cycle Visualizer**: Shows current active cycle domain, stage, and progression bar.
* **Active Anomaly Feed**: Severity-coded anomaly cards with one-click "Investigate" and "Trigger Cycle" buttons.
* **Quick Simulation Hub**: Instant injection of demo anomalies (e.g. churn risk, payment failure, SLA breach) for demonstrations.

### 2. ODAEA Cycles Monitor ([CyclesPage.tsx](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/pages/CyclesPage.tsx))
* **Cycle Trigger Bar**: Manually launch domain cycles (`sales`, `finance`, `support`, `marketing`, `operations`) in selectable Autonomy Tiers (0, 1, 2, 3).
* **Interactive 8-Stage Pipeline**: Visualizes `OBSERVE ➔ AGGREGATE ➔ DECIDE ➔ CRITIQUE ➔ GUARDRAIL ➔ ACT ➔ EVALUATE ➔ ADAPT`.
* **Cycle History Table**: Complete historical cycle logs with duration, status, and drill-down inspection.

### 3. Decisions & Evidence ([DecisionsPage.tsx](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/pages/DecisionsPage.tsx))
* **Decision Cards**: Displays goal formulation, strategic rationale, estimated cost ($), blast radius, and confidence score.
* **Adversarial Critique Badge**: Displays Critic review status, logic score, and hallucination risk assessment.
* **Evidence Drawer**: Shows observations and metric snippets cited by the Planner Agent.

### 4. Human-in-the-Loop Approvals ([ApprovalsPage.tsx](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/pages/ApprovalsPage.tsx))
* **Pending Approval Cards**: Shows gated actions requiring human sign-off.
* **Risk & Impact Breakdown**: Visualizes target system, payload summary, estimated spend, blast radius, and policy violation reason.
* **Interactive Decision Actions**: "Approve & Execute" or "Reject & Abort" with mandatory reviewer reason logging.

### 5. Autonomous Actions ([ActionsPage.tsx](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/pages/ActionsPage.tsx))
* **Execution History**: Full log of physical tool actions executed against integrations.
* **Idempotency Key Verifier**: Shows cryptographic idempotency keys preventing duplicate operations.
* **Side-Effects Diff Viewer**: JSON diff comparing before-and-after entity states.

### 6. Evaluations & Outcomes ([EvaluationsPage.tsx](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/pages/EvaluationsPage.tsx))
* **Metric Impact Reports**: Pre-action vs post-action metric comparisons.
* **Goal Achievement Rating**: Visual confirmation of whether the strategic operational goal was fulfilled.
* **Adaptation Insights**: Notes generated by the Evaluator Agent for policy learning.

### 7. Agent Swarm Telemetry ([AgentsPage.tsx](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/pages/AgentsPage.tsx))
* **Agent Cards**: Live status for Observer, Aggregator, Planner, Critic, Actuator, Evaluator, and Adapter.
* **Telemetry Gauges**: Token consumption (input/output), total LLM spend ($), average response latency (ms), and prompt versions.
* **Multi-LLM Fallback Log**: Visualizes which provider served each request (`Groq`, `Gemini`, `Ollama`, `OpenAI`).

### 8. Memory Browser ([MemoryPage.tsx](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/pages/MemoryPage.tsx))
* **Episodic Memory Tab**: Chronological history of operational episodes, actions taken, and recorded reinforcement rewards.
* **Semantic Vector Knowledgebase**: Vector search interface for corporate SOPs, domain policies, and best practices.

### 9. Policies & Rules ([PoliciesPage.tsx](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/pages/PoliciesPage.tsx))
* **Active Policy Viewer**: Inspects active JSON/YAML rules, domain action registries, and spend limits.
* **Adapter Proposal Review**: Shows policy update suggestions formulated by the Adapter Agent.

### 10. Integrations & Connectors ([IntegrationsPage.tsx](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/pages/IntegrationsPage.tsx))
* **Connector Status Grid**: HubSpot/Salesforce CRM, Stripe Billing, Zendesk Support, Resend Email, and Google/Meta Ads.
* **Live vs Mock Toggle**: Visual indicator of whether connectors are running in live API or standalone simulation mode.

### 11. Immutable Audit Trail ([AuditPage.tsx](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/pages/AuditPage.tsx))
* **Tamper-Evident Event Log**: Searchable by actor (Agent/User), domain, risk level, and date.
* **Trace ID Drill-down**: Links audit events directly to the correlation ID of the cycle that initiated it.

### 12. Subsystem Health Matrix ([HealthPage.tsx](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/pages/HealthPage.tsx))
* **Component Health Grid**: Real-time heartbeat checks for API Gateway, PostgreSQL Database, Background Worker Daemon, Multi-LLM Providers, and WebSocket Server.

### 13. Settings & Emergency Controls ([SettingsPage.tsx](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/pages/SettingsPage.tsx))
* **Kill Switch Matrix**: Immediate toggles for Global kill switch, domain-level switches, agent switches, and integration switches.
* **Autonomy Tier Slider**: Configure default operational tier (Tier 0: Observe Only to Tier 3: High Autonomy).

### 14. Authentication & Role Switcher ([LoginPage.tsx](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/pages/LoginPage.tsx))
* **JWT Login**: Standard credentials form.
* **One-Click Role Switcher**: Quick demo buttons for logging in as **Administrator**, **Operations Manager**, or **Auditor**.

---

## 5. Real-Time WebSocket Events

The frontend listens to real-time events broadcast from the backend WebSocket hub:

| WebSocket Event | UI Reaction |
| :--- | :--- |
| `cycle_started` | Highlights the active cycle in the dashboard and timeline. |
| `observation_created` | Appends new anomalies to the live feed and updates entity counters. |
| `decision_created` | Renders proposed actions, risk scores, and evidence links. |
| `approval_required` | Increments pending approval badge and displays action review modal. |
| `action_started` | Animates the Actuator execution step in the cycle timeline. |
| `action_completed` | Updates action log table and plays completion sound/toast. |
| `evaluation_completed`| Renders metric delta charts and goal achievement badge. |
| `guardrail_blocked` | Displays high-visibility safety block alert with violated policy rules. |
| `kill_switch_triggered`| Displays critical banner across the top bar. |

---

## 6. Reusable Component Library

Located in [frontend/src/components/](file:///c:/Projects/Autonomous%20AI%20Business%20Operations%20Manager/frontend/src/components/):
* **`KpiCard`**: Stat card with title, numeric value, delta percentage, icon, and status styling.
* **`StatusBadge`**: Standardized badge for cycles, evaluations, risks, and health states.
* **`CycleTimeline`**: Step-by-step 8-stage progress tracker with animated pulsing current states.
* **`AnomalyCard`**: Severity-coded card displaying entity ID, description, and recommended action.
* **`ConfirmDialog`**: Modal for confirming destructive actions or kill switch toggles.
