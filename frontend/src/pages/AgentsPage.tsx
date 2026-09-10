import React, { useState, useEffect } from 'react';
import {
  Bot,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Clock,
  DollarSign,
  Zap,
  Layers,
  ArrowRight,
  Server,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { api } from '../services/api';
import {
  AgentCardInfo,
  LLMRouterStatus,
  LLMBudgetSummary,
  LLMTestResponse,
} from '../types';

export const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<AgentCardInfo[]>([]);
  const [routerStatus, setRouterStatus] = useState<LLMRouterStatus | null>(null);
  const [budgetSummary, setBudgetSummary] = useState<LLMBudgetSummary | null>(null);
  const [testResult, setTestResult] = useState<LLMTestResponse | null>(null);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [agentCards, routerData, budgetData] = await Promise.all([
        api.getAgentCards(),
        api.getLLMRouterStatus().catch(() => null),
        api.getLLMBudgetSummary().catch(() => null),
      ]);
      setAgents(agentCards);
      if (routerData) setRouterStatus(routerData);
      if (budgetData) setBudgetSummary(budgetData);
    } catch (e) {
      console.error('Failed to load agent info', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestRouter = async (agentType: string = 'observer') => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testLLMRouter(agentType, 'Execute operational signal analysis and verify anomalies.');
      setTestResult(res);
      // Reload budget & router after test
      loadData();
    } catch (e: any) {
      console.error('Failed to test LLM router', e);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 text-[#1C1917]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-[#1C1917]">
            Autonomous Agent Fleet & Multi-LLM Gateway
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Free Cloud + Local Private Fallback Router: Groq ➔ Google Gemini ➔ Local Ollama (Qwen) ➔ Heuristics
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#DDD5CA] bg-[#FAF8F5] hover:border-[#C5855A] text-xs font-semibold text-[#8E5633] transition-all shadow-sm cursor-pointer self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Multi-LLM Fallback Gateway Matrix */}
      <div className="auren-card p-6 border border-[#E2DAD0] shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#E2DAD0]/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-[#181716] text-[#E2AB8A] shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-display text-[#1C1917] uppercase tracking-wider">
                Multi-LLM Fallback & Self-Healing Gateway
              </h2>
              <p className="text-xs text-[#78716C]">
                100% Free & Private Chain with automatic 429 rate limit failover and circuit breaker isolation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTestRouter('observer')}
              disabled={testing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#181716] hover:bg-[#2A2724] text-xs font-bold text-[#FAF8F5] border border-[#35312C] transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-[#E2AB8A]" />
              <span>{testing ? 'Testing Router Chain...' : 'Run Live Diagnostic Test'}</span>
            </button>
          </div>
        </div>

        {/* Fallback Chain Flow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 1. Groq */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DAD0] relative space-y-3 hover:border-[#C5855A] transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#F5E9DF] text-[#8E5633] border border-[#DFB59D]">
                1. PRIMARY (CLOUD)
              </span>
              {routerStatus?.providers?.groq?.is_healthy ? (
                <span className="flex items-center gap-1 text-[10px] text-[#15803D] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" /> Ready
                </span>
              ) : (
                <span className="text-[10px] text-[#A8A29E] font-medium">Standby</span>
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#1C1917]">Groq Cloud</h4>
              <p className="text-[11px] font-mono text-[#8E5633] font-semibold">
                {routerStatus?.providers?.groq?.model || 'llama-3.3-70b-versatile'}
              </p>
              <span className="text-[10px] text-[#78716C] block mt-0.5">500+ tok/s · 100% Free Tier</span>
            </div>

            <div className="pt-2 border-t border-[#E2DAD0]/70 flex items-center justify-between text-[10px] text-[#78716C]">
              <span>Successes: {routerStatus?.providers?.groq?.total_successes || 0}</span>
              <span>Failures: {routerStatus?.providers?.groq?.total_failures || 0}</span>
            </div>
          </div>

          {/* 2. Google Gemini */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DAD0] relative space-y-3 hover:border-[#C5855A] transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#EFECE6] text-[#475569] border border-[#DDD5CA]">
                2. SECONDARY (CLOUD)
              </span>
              {routerStatus?.providers?.gemini?.is_healthy ? (
                <span className="flex items-center gap-1 text-[10px] text-[#15803D] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Ready
                </span>
              ) : (
                <span className="text-[10px] text-[#A8A29E] font-medium">Add Key</span>
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#1C1917]">Google Gemini</h4>
              <p className="text-[11px] font-mono text-[#475569] font-semibold">
                {routerStatus?.providers?.gemini?.model || 'gemini-1.5-flash'}
              </p>
              <span className="text-[10px] text-[#78716C] block mt-0.5">AI Studio Free (1,500 RPD)</span>
            </div>

            <div className="pt-2 border-t border-[#E2DAD0]/70 flex items-center justify-between text-[10px] text-[#78716C]">
              <span>Successes: {routerStatus?.providers?.gemini?.total_successes || 0}</span>
              <span>Failures: {routerStatus?.providers?.gemini?.total_failures || 0}</span>
            </div>
          </div>

          {/* 3. Local Ollama */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DAD0] relative space-y-3 hover:border-[#C5855A] transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                3. LOCAL & PRIVATE
              </span>
              {routerStatus?.providers?.ollama?.is_reachable ? (
                <span className="flex items-center gap-1 text-[10px] text-[#15803D] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" /> Online
                </span>
              ) : (
                <span className="text-[10px] text-[#A8A29E] font-medium">Offline</span>
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#1C1917]">Local Ollama</h4>
              <p className="text-[11px] font-mono text-[#0369A1] font-semibold">
                {routerStatus?.providers?.ollama?.target_model || 'qwen2.5:7b'}
              </p>
              <span className="text-[10px] text-[#78716C] block mt-0.5">
                {routerStatus?.providers?.ollama?.is_reachable
                  ? `localhost:11434 (${routerStatus?.providers?.ollama?.installed_models?.length || 0} models)`
                  : 'Start `ollama run qwen2.5`'}
              </span>
            </div>

            <div className="pt-2 border-t border-[#E2DAD0]/70 flex items-center justify-between text-[10px] text-[#78716C]">
              <span>Successes: {routerStatus?.providers?.ollama?.total_successes || 0}</span>
              <span>Failures: {routerStatus?.providers?.ollama?.total_failures || 0}</span>
            </div>
          </div>

          {/* 4. Deterministic Heuristics */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DAD0] relative space-y-3 hover:border-[#C5855A] transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                4. SAFETY NET
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[#15803D] font-bold">
                <CheckCircle2 className="w-3 h-3 text-[#16A34A]" /> Always On
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#1C1917]">Deterministic Engine</h4>
              <p className="text-[11px] font-mono text-[#15803D] font-semibold">
                heuristic-odaea-v1
              </p>
              <span className="text-[10px] text-[#78716C] block mt-0.5">Zero Dependency · Instant</span>
            </div>

            <div className="pt-2 border-t border-[#E2DAD0]/70 flex items-center justify-between text-[10px] text-[#78716C]">
              <span>Successes: {routerStatus?.providers?.mock?.total_successes || 0}</span>
              <span>Failures: 0</span>
            </div>
          </div>
        </div>

        {/* Live Test Feedback Banner */}
        {testResult && (
          <div className="p-4 rounded-2xl bg-[#F5E9DF] border border-[#DFB59D] space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8E5633]" />
                <span className="text-xs font-bold text-[#8E5633] uppercase tracking-wider">
                  Diagnostic Router Test Result
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#1C1917] font-semibold">
                {testResult.latency_ms}ms · {testResult.input_tokens + testResult.output_tokens} tokens
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#1C1917]">
              <span><strong>Provider Used:</strong> <code className="px-1.5 py-0.5 bg-white/70 rounded border border-[#DDD5CA] font-mono">{testResult.provider_used} ({testResult.model_name})</code></span>
              <span><strong>Cost:</strong> <span className="font-mono font-bold text-[#15803D]">${testResult.cost_usd.toFixed(6)}</span></span>
              {testResult.fallback_occurred && (
                <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] rounded-full text-[10px] font-bold">
                  Fallback Triggered
                </span>
              )}
            </div>
          </div>
        )}

        {/* Budget & Spend Progress Bar */}
        {budgetSummary && (
          <div className="p-4 rounded-2xl bg-[#EFECE6] border border-[#DDD5CA] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#8E5633]" />
                <span className="font-bold text-[#1C1917]">Daily LLM Spend vs. Guardrail Budget</span>
              </div>
              <div className="font-mono text-xs">
                <strong className="text-[#8E5633]">${budgetSummary.daily_spend_usd.toFixed(4)}</strong>
                <span className="text-[#78716C]"> / ${budgetSummary.daily_limit_usd.toFixed(2)} USD ({budgetSummary.daily_utilization_pct}%)</span>
              </div>
            </div>

            <div className="w-full h-2 rounded-full bg-[#DDD5CA] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#15803D] via-[#C5855A] to-[#DC2626] transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(budgetSummary.daily_utilization_pct, 1)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((ag) => (
          <div
            key={ag.agent_type}
            className="auren-card p-6 shadow-sm space-y-4 hover:border-[#C5855A]/50 transition-all"
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2DAD0]/80">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-[#F5E9DF] border border-[#DFB59D] text-[#8E5633]">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-[#1C1917]">{ag.name}</h3>
                  <span className="text-[10px] font-mono text-[#8E5633] font-bold">{ag.model}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                {ag.status}
              </span>
            </div>

            <p className="text-xs text-[#78716C] min-h-[36px] font-medium leading-relaxed">{ag.description}</p>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-[#E2DAD0]/70">
              <div className="p-2.5 rounded-xl bg-[#EFECE6] border border-[#DDD5CA]">
                <span className="text-[10px] text-[#78716C] block">Success Rate</span>
                <strong className="text-xs font-mono text-[#15803D]">{ag.success_rate_percentage}%</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#EFECE6] border border-[#DDD5CA]">
                <span className="text-[10px] text-[#78716C] block">Avg Latency</span>
                <strong className="text-xs font-mono text-[#8E5633]">{ag.average_latency_ms}ms</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#EFECE6] border border-[#DDD5CA]">
                <span className="text-[10px] text-[#78716C] block">Total Runs</span>
                <strong className="text-xs font-mono text-[#1C1917]">{ag.total_runs}</strong>
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-1.5 pt-2 border-t border-[#E2DAD0]/70">
              <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-widest block">
                Allowed Permissions
              </span>
              <div className="flex flex-wrap gap-1">
                {ag.permissions.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center text-[9px] px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#DDD5CA] text-[#78716C] font-mono"
                  >
                    <ShieldCheck className="w-2.5 h-2.5 text-[#15803D] mr-1" />
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Forbidden Actions */}
            <div className="space-y-1.5 pt-2 border-t border-[#E2DAD0]/70">
              <span className="text-[10px] font-bold text-[#B91C1C] uppercase tracking-widest block">
                Sandboxed Restrictions
              </span>
              <div className="flex flex-wrap gap-1">
                {ag.forbidden_actions.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center text-[9px] px-2 py-0.5 rounded-md bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] font-mono"
                  >
                    <ShieldAlert className="w-2.5 h-2.5 mr-1 text-[#DC2626]" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
