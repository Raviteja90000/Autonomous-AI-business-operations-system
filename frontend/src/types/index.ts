export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: string[];
  permissions: string[];
  created_at: string;
}

export interface KpiMetric {
  title: string;
  value: string;
  numeric_value: number;
  change_percentage: number;
  time_range: string;
  status: 'positive' | 'neutral' | 'warning' | 'critical';
  sparkline: number[];
}

export interface DomainHealthItem {
  domain: string;
  health_score: number;
  status: string;
  active_anomalies: number;
  pending_approvals: number;
  autonomy_tier: number;
  success_rate: number;
}

export interface DashboardOverview {
  kpis: {
    business_health: KpiMetric;
    active_cycles: KpiMetric;
    autonomous_actions: KpiMetric;
    pending_approvals: KpiMetric;
    success_rate: KpiMetric;
    guardrail_blocks: KpiMetric;
  };
  current_autonomy_tier: number;
  global_kill_switch: boolean;
  domain_health: DomainHealthItem[];
  recent_cycles: ODAEACycle[];
  active_anomalies: ObservationAnomaly[];
  pending_approvals: ApprovalRequest[];
  recent_actions: ActionExecution[];
  live_activity: AuditEvent[];
}

export interface ODAEACycle {
  id: string;
  organization_id?: string;
  domain: string;
  status: 'PENDING' | 'OBSERVING' | 'DECIDING' | 'CRITIQUING' | 'GUARDRAIL_CHECK' | 'AWAITING_APPROVAL' | 'ACTING' | 'EVALUATING' | 'ADAPTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  trigger_type: string;
  correlation_id: string;
  started_at: string;
  completed_at?: string;
  current_stage: string;
  stage_progress: Record<string, string>;
  metadata_json: Record<string, any>;
  error_message?: string;
  created_at: string;
  world_states?: WorldState[];
}

export interface CycleDetail extends ODAEACycle {
  decision?: DecisionRecord;
  actions?: ActionExecution[];
  evaluation?: EvaluationReport;
  approval?: ApprovalRequest;
}

export interface WorldState {
  id: string;
  cycle_id: string;
  domain: string;
  state_data: Record<string, any>;
  aggregate_metrics: Record<string, any>;
  entity_count: number;
  anomaly_count: number;
  confidence_score: number;
  created_at: string;
}

export interface ObservationAnomaly {
  id: string;
  snapshot_id?: string;
  cycle_id?: string;
  domain: string;
  entity_id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  confidence: number;
  recommended_action: string;
  is_resolved: boolean;
  detected_at: string;
}

export interface ObservationSnapshot {
  id: string;
  cycle_id: string;
  domain: string;
  source_system: string;
  raw_data_summary: string;
  payload: Record<string, any>;
  status: string;
  detected_at: string;
  entities: any[];
  anomalies: ObservationAnomaly[];
}

export interface DecisionAction {
  id: string;
  decision_id: string;
  action_type: string;
  target_system: string;
  payload: Record<string, any>;
  estimated_cost_usd: number;
  risk_score: number;
  blast_radius: number;
  is_reversible: boolean;
  sequence_order: number;
}

export interface DecisionEvidence {
  id: string;
  decision_id: string;
  source_type: string;
  reference_id: string;
  snippet: string;
  confidence_contribution: number;
}

export interface DecisionRecord {
  id: string;
  cycle_id: string;
  domain: string;
  goal: string;
  rationale_summary: string;
  confidence: number;
  estimated_cost_usd: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  blast_radius_count: number;
  reversibility: 'REVERSIBLE' | 'IRREVERSIBLE' | 'PARTIALLY_REVERSIBLE';
  status: string;
  critic_approved?: boolean;
  guardrail_status?: string;
  actions: DecisionAction[];
  evidence: DecisionEvidence[];
  created_at: string;
}

export interface CriticReview {
  id: string;
  decision_id: string;
  cycle_id: string;
  review_status: string;
  reasoning_critique: string;
  risk_assessment: string;
  logic_score: number;
  hallucination_risk: number;
  recommendations: string[];
  created_at: string;
}

export interface ApprovalEvent {
  id: string;
  approval_request_id: string;
  reviewer_id?: string;
  reviewer_email: string;
  action: string;
  notes?: string;
  decided_at: string;
}

export interface ApprovalRequest {
  id: string;
  decision_id: string;
  cycle_id: string;
  action_id?: string;
  domain: string;
  requested_by_agent: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  cost_usd: number;
  blast_radius_count: number;
  summary: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'EXPIRED';
  expires_at?: string;
  created_at: string;
  events?: ApprovalEvent[];
}

export interface ActionExecution {
  id: string;
  decision_id: string;
  cycle_id: string;
  action_type: string;
  target_system: string;
  idempotency_key: string;
  payload_summary: Record<string, any>;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
  started_at: string;
  completed_at?: string;
  result_data: Record<string, any>;
  error_message?: string;
  side_effects?: ActionSideEffect[];
  rollback_records?: RollbackRecord[];
}

export interface ActionSideEffect {
  id: string;
  action_execution_id: string;
  entity_type: string;
  entity_id: string;
  before_state: Record<string, any>;
  after_state: Record<string, any>;
}

export interface RollbackRecord {
  id: string;
  action_execution_id: string;
  status: string;
  initiated_by: string;
  initiated_at: string;
  completed_at?: string;
  rollback_payload: Record<string, any>;
  error_message?: string;
}

export interface EvaluationReport {
  id: string;
  cycle_id: string;
  action_execution_id?: string;
  domain: string;
  before_metrics: Record<string, any>;
  after_metrics: Record<string, any>;
  metric_deltas: Record<string, any>;
  expected_effect: Record<string, any>;
  actual_outcome: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  goal_achieved: boolean;
  confidence_score: number;
  adaptation_notes?: string;
  created_at: string;
}

export interface PolicyVersion {
  id: string;
  version_number: string;
  name: string;
  description: string;
  rules_yaml: string;
  rules_json: Record<string, any>;
  is_active: boolean;
  effective_date: string;
  author: string;
  approved_by?: string;
  created_at: string;
}

export interface PolicyUpdate {
  id: string;
  evaluation_id?: string;
  proposed_by_agent: string;
  proposed_changes: Record<string, any>;
  rationale: string;
  status: string;
  created_at: string;
  occurrence_count?: number;
}

export interface MemoryEpisode {
  id: string;
  domain: string;
  cycle_id?: string;
  episode_summary: string;
  goal: string;
  actions_taken: any[];
  outcome: string;
  reward_score: number;
  importance: number;
  confidence: number;
  provenance: Record<string, any>;
  created_at: string;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version: string;
  agent_type: string;
  system_prompt: string;
  template: string;
  approved_by: string;
  status: string;
  prompt_hash: string;
  created_at: string;
}

export interface AgentCardInfo {
  agent_type: string;
  name: string;
  description: string;
  model: string;
  prompt_version: string;
  status: string;
  success_rate_percentage: number;
  average_latency_ms: number;
  total_runs: number;
  total_cost_usd: number;
  permissions: string[];
  forbidden_actions: string[];
}

export interface AgentRun {
  id: string;
  cycle_id: string;
  agent_type: string;
  model_name: string;
  prompt_version: string;
  prompt_hash: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  latency_ms: number;
  status: string;
  error_message?: string;
  created_at: string;
}

export interface IntegrationItem {
  id: string;
  name: string;
  domain: string;
  connector_type: string;
  status: string;
  is_mock: boolean;
  config: Record<string, any>;
  last_sync_at: string;
  last_health_check_at: string;
  error_rate_percentage: number;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor_id: string;
  actor_type: string;
  actor_email: string;
  action: string;
  domain: string;
  resource_type: string;
  resource_id: string;
  result: string;
  risk_level: string;
  trace_id: string;
  request_id?: string;
  details: Record<string, any>;
}

export interface ComponentHealth {
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  latency_ms: number;
  message: string;
  details?: Record<string, any>;
}

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  uptime_seconds: number;
  components: ComponentHealth[];
}

export interface LLMProviderDetail {
  name: string;
  tier: string;
  model?: string;
  base_url?: string;
  target_model?: string;
  configured: boolean;
  is_healthy: boolean;
  is_reachable?: boolean;
  installed_models?: string[];
  circuit_breaker_tripped: boolean;
  total_successes: number;
  total_failures: number;
  last_error?: string | null;
}

export interface LLMRouterStatus {
  fallback_chain: string[];
  active_primary: string;
  providers: {
    groq: LLMProviderDetail;
    gemini: LLMProviderDetail;
    ollama: LLMProviderDetail;
    mock: LLMProviderDetail;
    [key: string]: LLMProviderDetail;
  };
}

export interface LLMBudgetSummary {
  daily_spend_usd: number;
  daily_limit_usd: number;
  daily_utilization_pct: number;
  monthly_spend_usd: number;
  monthly_limit_usd: number;
  monthly_utilization_pct: number;
  total_calls: number;
  total_tokens: number;
  total_input_tokens: number;
  total_output_tokens: number;
  is_budget_exceeded: boolean;
  spend_by_provider: Record<string, number>;
  calls_by_provider: Record<string, number>;
  spend_by_agent: Record<string, number>;
}

export interface LLMTestResponse {
  status: string;
  provider_used: string;
  model_name: string;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  fallback_occurred: boolean;
  fallback_reason?: string | null;
  parsed_json: Record<string, any>;
}

export interface AgentCardInfo {
  agent_type: string;
  name: string;
  description: string;
  model: string;
  prompt_version: string;
  status: string;
  success_rate_percentage: number;
  average_latency_ms: number;
  total_runs: number;
  total_cost_usd: number;
  permissions: string[];
  forbidden_actions: string[];
}

export interface AgentRun {
  id: string;
  cycle_id: string;
  agent_type: string;
  model_name: string;
  prompt_version: string;
  prompt_hash: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  latency_ms: number;
  status: string;
  error_message?: string;
  created_at: string;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version: string;
  agent_type: string;
  system_prompt: string;
  template: string;
  approved_by: string;
  status: string;
  prompt_hash: string;
  created_at: string;
}

export interface SimulationScenario {
  id: string;
  title: string;
  domain: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  arr_impact_usd: number;
  description: string;
  crisis_trigger: string;
  target_systems: string[];
  recommended_autonomy: number;
  icon: string;
  expected_remediation: string;
}

export interface SimulationRunResult {
  status: string;
  scenario_id: string;
  title: string;
  cycle_id: string;
  cycle_status: string;
  domain: string;
  autonomy_tier: number;
  correlation_id: string;
  stage_progress: Record<string, string>;
  decision: {
    goal?: string;
    confidence: number;
    risk_level: string;
    actions_count: number;
  };
  actions: Array<{
    action_type: string;
    target_system: string;
    status: string;
    execution_time_ms?: number;
  }>;
  evaluation?: {
    actual_outcome: string;
    goal_achieved: boolean;
    metric_deltas?: Record<string, any>;
  };
}

export interface ExecutiveFinancials {
  total_net_value: number;
  labor_hours_saved: number;
  labor_cost_saved: number;
  revenue_loss_prevented: number;
  ai_compute_cost: number;
  roi_multiplier: number;
  hourly_rate_used: number;
  human_sla_avg_minutes: number;
  autonomous_sla_avg_seconds: number;
  mttr_speedup_percent: number;
}

export interface DepartmentValue {
  domain: string;
  actions_count: number;
  value_generated: number;
  incidents_prevented: number;
  top_mitigation: string;
  health_score: number;
  hours_saved: number;
}

export interface ModelArbitrageItem {
  provider: string;
  tokens_processed: number;
  cost_actual: number;
  cost_if_frontier: number;
  savings_dollars: number;
  savings_percentage: number;
}

export interface ExecutiveReportResponse {
  generated_at: string;
  reporting_period: string;
  financials: ExecutiveFinancials;
  departments: DepartmentValue[];
  model_arbitrage: ModelArbitrageItem[];
  governance_score: number;
  guardrail_blocks_count: number;
  zero_hallucination_adherence: number;
  audit_events_count: number;
  executive_narrative: string;
  strategic_recommendations: string[];
  audit_hash: string;
}
