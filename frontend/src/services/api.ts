import {
  User,
  DashboardOverview,
  ODAEACycle,
  DecisionRecord,
  ApprovalRequest,
  ActionExecution,
  EvaluationReport,
  PolicyVersion,
  PolicyUpdate,
  MemoryEpisode,
  AgentCardInfo,
  AgentRun,
  PromptVersion,
  IntegrationItem,
  AuditEvent,
  HealthResponse,
  ObservationAnomaly,
  ObservationSnapshot,
  LLMRouterStatus,
  LLMBudgetSummary,
  LLMTestResponse,
  SimulationScenario,
  SimulationRunResult,
  ExecutiveReportResponse,
} from '../types';





const getApiBase = (): string => {
  const env = (import.meta as any).env;
  const envUrl = env?.VITE_API_URL;
  if (!envUrl) return '/api';
  const clean = String(envUrl).trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_BASE = getApiBase();

class ApiClient {
  private token: string | null = localStorage.getItem('auth_token');

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Clear token on auth failure
      this.setToken(null);
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    if (!res.ok) {
      let errorMsg = `API Error ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.error?.message) {
          errorMsg = errJson.error.message;
        } else if (errJson?.detail) {
          errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch (e) {
        // use default errorMsg
      }
      throw new Error(errorMsg);
    }

    return res.json() as Promise<T>;
  }

  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Dashboard & Executive
  async getDashboardOverview(autonomyTier: number = 2): Promise<DashboardOverview> {
    return this.request<DashboardOverview>(`/dashboard/overview?autonomy_tier=${autonomyTier}`);
  }

  async getExecutiveReport(hourlyRate: number = 65): Promise<ExecutiveReportResponse> {
    return this.request<ExecutiveReportResponse>(`/dashboard/executive-report?hourly_rate=${hourlyRate}`);
  }


  // Cycles
  async getCycles(domain?: string, status?: string): Promise<ODAEACycle[]> {
    let url = '/cycles';
    const params = new URLSearchParams();
    if (domain) params.append('domain', domain);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request<ODAEACycle[]>(url);
  }

  async getCycleById(id: string): Promise<ODAEACycle> {
    return this.request<ODAEACycle>(`/cycles/${id}`);
  }

  async triggerCycle(
    domain: string,
    triggerType: string = 'MANUAL',
    autonomyTier: number = 2,
    ticketData?: {
      subject: string;
      amount_usd: number;
      customer_email: string;
      charge_id?: string;
      description?: string;
    }
  ): Promise<ODAEACycle> {
    return this.request<ODAEACycle>(`/cycles/trigger?autonomy_tier=${autonomyTier}`, {
      method: 'POST',
      body: JSON.stringify({ domain, trigger_type: triggerType, ticket_data: ticketData }),
    });
  }

  // Observations
  async getSnapshots(domain?: string): Promise<ObservationSnapshot[]> {
    return this.request<ObservationSnapshot[]>(domain ? `/observations/snapshots?domain=${domain}` : '/observations/snapshots');
  }

  async getAnomalies(domain?: string, resolved?: boolean): Promise<ObservationAnomaly[]> {
    let url = '/observations/anomalies';
    const params = new URLSearchParams();
    if (domain) params.append('domain', domain);
    if (resolved !== undefined) params.append('resolved', String(resolved));
    if (params.toString()) url += `?${params.toString()}`;
    return this.request<ObservationAnomaly[]>(url);
  }

  // Decisions
  async getDecisions(domain?: string, status?: string): Promise<DecisionRecord[]> {
    let url = '/decisions';
    const params = new URLSearchParams();
    if (domain) params.append('domain', domain);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request<DecisionRecord[]>(url);
  }

  async getDecisionById(id: string): Promise<DecisionRecord> {
    return this.request<DecisionRecord>(`/decisions/${id}`);
  }

  // Approvals
  async getApprovals(domain?: string): Promise<ApprovalRequest[]> {
    return this.request<ApprovalRequest[]>(domain ? `/approvals?domain=${domain}` : '/approvals');
  }

  async decideApproval(approvalId: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES', notes?: string): Promise<ApprovalRequest> {
    return this.request<ApprovalRequest>(`/approvals/${approvalId}/decide`, {
      method: 'POST',
      body: JSON.stringify({ action, notes }),
    });
  }

  // Actions
  async getActions(targetSystem?: string, status?: string): Promise<ActionExecution[]> {
    let url = '/actions';
    const params = new URLSearchParams();
    if (targetSystem) params.append('target_system', targetSystem);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request<ActionExecution[]>(url);
  }

  async rollbackAction(actionId: string, reason: string): Promise<ActionExecution> {
    return this.request<ActionExecution>(`/actions/${actionId}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Evaluations
  async getEvaluations(domain?: string): Promise<EvaluationReport[]> {
    return this.request<EvaluationReport[]>(domain ? `/evaluations?domain=${domain}` : '/evaluations');
  }

  // Agents & Multi-LLM Router
  async getAgentCards(): Promise<AgentCardInfo[]> {
    return this.request<AgentCardInfo[]>('/agents/cards');
  }

  async getAgentRuns(agentType?: string): Promise<AgentRun[]> {
    return this.request<AgentRun[]>(agentType ? `/agents/runs?agent_type=${agentType}` : '/agents/runs');
  }

  async getPrompts(): Promise<PromptVersion[]> {
    return this.request<PromptVersion[]>('/agents/prompts');
  }

  async getLLMRouterStatus(): Promise<LLMRouterStatus> {
    return this.request<LLMRouterStatus>('/agents/router/status');
  }

  async getLLMBudgetSummary(): Promise<LLMBudgetSummary> {
    return this.request<LLMBudgetSummary>('/agents/budget/summary');
  }

  async testLLMRouter(agentType: string = 'observer', prompt: string = 'Run diagnostic system observation'): Promise<LLMTestResponse> {
    return this.request<LLMTestResponse>(`/agents/router/test?agent_type=${agentType}&prompt=${encodeURIComponent(prompt)}`, {
      method: 'POST',
    });
  }


  // Memory
  async getEpisodes(domain?: string): Promise<MemoryEpisode[]> {
    return this.request<MemoryEpisode[]>(domain ? `/memory/episodes?domain=${domain}` : '/memory/episodes');
  }

  async searchMemory(query: string, domain?: string): Promise<{ query: string; total_results: number; results: any[] }> {
    let url = `/memory/search?q=${encodeURIComponent(query)}`;
    if (domain) url += `&domain=${domain}`;
    return this.request<{ query: string; total_results: number; results: any[] }>(url);
  }

  // Policies
  async getPolicyVersions(): Promise<PolicyVersion[]> {
    return this.request<PolicyVersion[]>('/policies/versions');
  }

  async getActivePolicy(): Promise<PolicyVersion> {
    return this.request<PolicyVersion>('/policies/active');
  }

  async getPolicyUpdates(deduplicate: boolean = true): Promise<PolicyUpdate[]> {
    return this.request<PolicyUpdate[]>(`/policies/updates?deduplicate=${deduplicate}`);
  }

  async decidePolicyUpdate(updateId: string, action: 'ACCEPT' | 'REJECT' | 'DISMISS', notes?: string): Promise<PolicyUpdate> {
    return this.request<PolicyUpdate>(`/policies/updates/${updateId}/decide`, {
      method: 'POST',
      body: JSON.stringify({ action, notes }),
    });
  }

  // Integrations
  async getIntegrations(): Promise<IntegrationItem[]> {
    return this.request<IntegrationItem[]>('/integrations');
  }

  async testIntegration(integrationId: string): Promise<any> {
    return this.request<any>(`/integrations/${integrationId}/test`, {
      method: 'POST',
      body: JSON.stringify({ integration_id: integrationId }),
    });
  }

  async sendIntegrationTestEmail(integrationId: string, recipient?: string): Promise<any> {
    return this.request<any>(`/integrations/${integrationId}/send-test`, {
      method: 'POST',
      body: JSON.stringify({ recipient }),
    });
  }

  // Audit
  async getAuditEvents(filters: { domain?: string; actor_type?: string; action?: string; result?: string } = {}): Promise<AuditEvent[]> {
    const params = new URLSearchParams();
    if (filters.domain) params.append('domain', filters.domain);
    if (filters.actor_type) params.append('actor_type', filters.actor_type);
    if (filters.action) params.append('action', filters.action);
    if (filters.result) params.append('result', filters.result);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<AuditEvent[]>(`/audit/events${qs}`);
  }

  // Health
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // Simulations & God Mode Scenarios
  async getSimulationScenarios(): Promise<SimulationScenario[]> {
    return this.request<SimulationScenario[]>('/simulations/scenarios');
  }

  async runSimulation(scenarioId: string, autonomyTier: number = 2, sendLiveActions: boolean = true): Promise<SimulationRunResult> {
    return this.request<SimulationRunResult>(`/simulations/run/${scenarioId}`, {
      method: 'POST',
      body: JSON.stringify({ autonomy_tier: autonomyTier, send_live_actions: sendLiveActions }),
    });
  }

  // Settings & Kill Switch
  async getSettings(): Promise<any> {
    return this.request<any>('/settings');
  }

  async toggleKillSwitch(scope: string, active: boolean, target?: string): Promise<any> {
    return this.request<any>('/settings/kill-switch', {
      method: 'POST',
      body: JSON.stringify({ scope, active, target }),
    });
  }
}

export const api = new ApiClient();

