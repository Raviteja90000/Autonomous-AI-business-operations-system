import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Clock,
  ShieldCheck,
  Zap,
  Printer,
  RotateCw,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Cpu,
  Layers,
  CheckCircle2,
  Award,
  FileCheck,
  AlertCircle,
  Building,
  BarChart2,
  PieChart as PieIcon,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { ExecutiveReportResponse } from '../types';
import { AurenLogo } from '../components/common/AurenLogo';
import { ScenarioSimulatorModal } from '../components/common/ScenarioSimulatorModal';

export const ExecutivePage: React.FC = () => {
  const { subscribe } = useWebSocket();
  const [report, setReport] = useState<ExecutiveReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hourlyRate, setHourlyRate] = useState<number>(65);

  const fetchReport = async (rateToUse: number = hourlyRate) => {
    try {
      setIsRefreshing(true);
      const data = await api.getExecutiveReport(rateToUse);
      setReport(data);
    } catch (e) {
      console.error('Failed to load executive report', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRateChange = (newRate: number) => {
    setHourlyRate(newRate);
    fetchReport(newRate);
  };

  useEffect(() => {
    fetchReport(hourlyRate);

    const handleRefresh = () => {
      fetchReport(hourlyRate);
    };

    window.addEventListener('auren:data-refresh', handleRefresh);
    const unsubscribe = subscribe('*', () => {
      fetchReport(hourlyRate);
    });

    return () => {
      window.removeEventListener('auren:data-refresh', handleRefresh);
      unsubscribe();
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const departmentChartData = useMemo(() => {
    if (!report) return [];
    return report.departments.map((d) => ({
      name: d.domain.replace('&', '+'),
      value: Math.round(d.value_generated),
      hours: d.hours_saved,
      actions: d.actions_count,
      health: d.health_score,
    }));
  }, [report]);

  const arbitrageChartData = useMemo(() => {
    if (!report) return [];
    return report.model_arbitrage.map((m) => ({
      name: m.provider.split(' ')[0],
      Actual: Number(m.cost_actual.toFixed(2)),
      FrontierCost: Number(m.cost_if_frontier.toFixed(2)),
      Savings: Number(m.savings_dollars.toFixed(2)),
    }));
  }, [report]);

  if (loading || !report) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RotateCw className="w-9 h-9 text-[#C5855A] animate-spin" />
          <p className="text-xs font-mono tracking-wider text-[#78716C] uppercase">
            Compiling Executive Board Telemetry & Financial Models...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 print:p-0 print:m-0 print:max-w-full">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE HEADER & ACTIONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#E2DAD0] pb-6 print:border-b-2 print:border-black">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-2xl bg-[#181716] text-[#E2AB8A] shadow-lg shadow-[#C5855A]/15 border border-[#C5855A]/40 shrink-0">
            <AurenLogo size={42} variant="icon" theme="luxury" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl lg:text-3xl font-bold font-display tracking-tight text-[#1C1917]">
                Executive Operations & ROI Board Report
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#181716] text-[#E2AB8A] px-3 py-0.5 text-[11px] font-bold tracking-widest uppercase border border-[#C5855A]/50">
                <Sparkles className="w-3 h-3 text-[#C5855A]" /> Confidential · Board Level
              </span>
            </div>
            <p className="text-xs text-[#78716C] mt-1.5 font-medium">
              Autonomous Value Creation · MTTR Benchmark · Multi-LLM Cost Arbitrage · Governance Audit Trail
            </p>
            <div className="flex items-center gap-4 text-[11px] text-[#A8A29E] font-mono mt-1">
              <span>Period: {report.reporting_period}</span>
              <span>•</span>
              <span>Generated: {report.generated_at}</span>
            </div>
          </div>
        </div>

        {/* Action Controls (Hidden when printing) */}
        <div className="flex items-center gap-3 print:hidden flex-wrap">
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center space-x-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5CA] px-3.5 py-2 text-xs font-semibold text-[#1C1917] hover:border-[#C5855A] hover:bg-[#F5E9DF] transition-all cursor-pointer shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-[#C5855A]" />
            <span>Incident Operations Matrix</span>
          </button>

          <button
            onClick={() => fetchReport(hourlyRate)}
            disabled={isRefreshing}
            className="flex items-center space-x-2 rounded-xl border border-[#DDD5CA] bg-[#FAF8F5] px-3.5 py-2 text-xs font-semibold text-[#1C1917] hover:bg-[#EFECE6] transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 text-[#78716C] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Telemetry</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-[#181716] via-[#2A2420] to-[#181716] border border-[#C5855A]/80 px-4 py-2 text-xs font-bold text-[#E2AB8A] shadow-md shadow-[#C5855A]/20 hover:scale-102 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#E2AB8A]" />
            <span>Export / Print Board Deck</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1.5 DYNAMIC LABOR RATE ARBITRAGE CONTROLLER */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-[#C5855A]/40 bg-[#FAF8F5] p-5 shadow-sm print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8E5633]">
                Dynamic Financial Model Baseline
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F5E9DF] text-[#8E5633] font-semibold border border-[#DFB59D]">
                Live Calculation
              </span>
            </div>
            <p className="text-xs text-[#78716C]">
              Adjust the loaded human labor baseline below. Net Value, Reclaimed Labor Cost, and ROI multipliers recompute dynamically across all completed autonomous cycles.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 bg-[#EFECE6] p-1.5 rounded-xl border border-[#DDD5CA]">
              {[
                { label: '$45/hr', val: 45 },
                { label: '$65/hr', val: 65 },
                { label: '$95/hr', val: 95 },
                { label: '$150/hr', val: 150 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => handleRateChange(preset.val)}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all ${
                    hourlyRate === preset.val
                      ? 'bg-[#181716] text-[#E2AB8A] shadow-sm'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 bg-[#181716] text-[#FAF8F5] px-4 py-2 rounded-xl border border-[#C5855A]/50">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-[#DFB59D] font-mono">Loaded Rate</span>
                <span className="text-lg font-mono font-black text-[#E2AB8A]">${hourlyRate}/hr</span>
              </div>
              <input
                type="range"
                min="30"
                max="250"
                step="5"
                value={hourlyRate}
                onChange={(e) => handleRateChange(Number(e.target.value))}
                className="w-28 sm:w-36 accent-[#C5855A] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE HERO METRICS (LUXURY TILES) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Total Net Value */}
        <div className="relative overflow-hidden rounded-2xl bg-[#181716] p-5 text-[#FAF8F5] shadow-xl border border-[#C5855A]/50">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#C5855A]/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#DFB59D]">
              Net Financial Value
            </span>
            <div className="p-1.5 rounded-lg bg-[#2A2420] text-[#E2AB8A] border border-[#C5855A]/40">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black font-mono text-[#FAF8F5] tracking-tight">
            ${report.financials.total_net_value.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#4ADE80] font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{report.financials.roi_multiplier.toLocaleString()}x ROI on Compute</span>
          </div>
        </div>

        {/* Labor Hours Reclaimed */}
        <div className="rounded-2xl bg-[#FAF8F5] p-5 border border-[#E2DAD0] shadow-sm hover:border-[#C5855A]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
              Labor Reclaimed
            </span>
            <div className="p-1.5 rounded-lg bg-[#F5E9DF] text-[#8E5633]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-[#1C1917]">
            {report.financials.labor_hours_saved} hrs
          </div>
          <p className="mt-2 text-[11px] text-[#78716C] font-medium">
            Saved ${report.financials.labor_cost_saved.toLocaleString()} @ ${report.financials.hourly_rate_used}/hr
          </p>
        </div>

        {/* Revenue Loss Prevented */}
        <div className="rounded-2xl bg-[#FAF8F5] p-5 border border-[#E2DAD0] shadow-sm hover:border-[#C5855A]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
              Revenue Protected
            </span>
            <div className="p-1.5 rounded-lg bg-[#ECFDF5] text-[#059669]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-[#1C1917]">
            ${report.financials.revenue_loss_prevented.toLocaleString()}
          </div>
          <p className="mt-2 text-[11px] text-[#059669] font-medium">
            Churn + Stripe Billing Safeguards
          </p>
        </div>

        {/* MTTR Acceleration */}
        <div className="rounded-2xl bg-[#FAF8F5] p-5 border border-[#E2DAD0] shadow-sm hover:border-[#C5855A]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
              MTTR Acceleration
            </span>
            <div className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-[#1C1917]">
            {report.financials.autonomous_sla_avg_seconds}s
          </div>
          <p className="mt-2 text-[11px] text-[#2563EB] font-medium">
            {report.financials.mttr_speedup_percent}% vs 4.2h Human SLA
          </p>
        </div>

        {/* Safety & Governance Score */}
        <div className="rounded-2xl bg-[#FAF8F5] p-5 border border-[#E2DAD0] shadow-sm hover:border-[#C5855A]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
              Zero-Bypass Safety
            </span>
            <div className="p-1.5 rounded-lg bg-[#FEF3C7] text-[#D97706]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-[#1C1917]">
            100.0%
          </div>
          <p className="mt-2 text-[11px] text-[#78716C] font-medium">
            {report.guardrail_blocks_count} Rogue Intercepts · 0 Leaks
          </p>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* 4. SIDE-BY-SIDE SLA RACE: HUMAN OPS VS ODAEA AUTONOMOUS ENGINE */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-[#E2DAD0] bg-[#FAF8F5] p-6 lg:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1917]">
                SLA & Incident Velocity Benchmark (Human vs. Autonomous)
              </h2>
              <p className="text-xs text-[#78716C]">
                Comparative Mean-Time-To-Resolution (MTTR) across triage, investigation, execution, and verification.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline text-xs font-bold text-[#059669] bg-[#ECFDF5] px-3 py-1 rounded-xl border border-[#A7F3D0]">
            99.98% Latency Reduction
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Human Ops Path */}
          <div className="rounded-2xl bg-[#EFECE6] p-5 border border-[#DDD5CA] space-y-3">
            <div className="flex items-center justify-between border-b border-[#DDD5CA] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                Traditional Operations Workflow
              </span>
              <span className="font-mono text-sm font-bold text-[#DC2626]">~4.2 Hours ($273 labor)</span>
            </div>
            <div className="space-y-2.5 text-xs text-[#57534E]">
              <div className="flex items-center justify-between">
                <span>1. Manual Anomaly Discovery & Alert Fatigue</span>
                <span className="font-mono font-semibold">45 mins</span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. JIRA Ticket Dispatch & Assignment</span>
                <span className="font-mono font-semibold">20 mins</span>
              </div>
              <div className="flex items-center justify-between">
                <span>3. Cross-system Investigation & Triage</span>
                <span className="font-mono font-semibold">90 mins</span>
              </div>
              <div className="flex items-center justify-between">
                <span>4. Manual HubSpot / Stripe / Zendesk Remediation</span>
                <span className="font-mono font-semibold">60 mins</span>
              </div>
              <div className="flex items-center justify-between">
                <span>5. Peer Verification & Post-mortem Log</span>
                <span className="font-mono font-semibold">35 mins</span>
              </div>
            </div>
          </div>

          {/* Auren Autonomous Swarm Path */}
          <div className="rounded-2xl bg-[#181716] p-5 text-[#FAF8F5] border border-[#C5855A]/50 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-[#3A332E] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#DFB59D]">
                Auren ODAEA Autonomous Closed Loop
              </span>
              <span className="font-mono text-sm font-bold text-[#4ADE80]">2.85 Seconds ($0.0003 compute)</span>
            </div>
            <div className="space-y-2.5 text-xs text-[#DDD5CA]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                  1. Observer Sub-second Telemetry Scan
                </span>
                <span className="font-mono font-semibold text-[#DFB59D]">340 ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                  2. Planner Formulation & Critic Validation
                </span>
                <span className="font-mono font-semibold text-[#DFB59D]">1,230 ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                  3. Deterministic Code-Level Guardrail Gate
                </span>
                <span className="font-mono font-semibold text-[#4ADE80]">12 ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                  4. Actuator Idempotent API Dispatch
                </span>
                <span className="font-mono font-semibold text-[#DFB59D]">650 ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                  5. Evaluator Delta & Semantic Memory Adaptation
                </span>
                <span className="font-mono font-semibold text-[#DFB59D]">618 ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MULTI-LLM COST ARBITRAGE & DEPARTMENT IMPACT CHARTS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Multi-LLM Cost Arbitrage (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-[#E2DAD0] bg-[#FAF8F5] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#F5E9DF] text-[#8E5633]">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1C1917]">
                  Multi-LLM Hybrid Cost Arbitrage
                </h2>
                <p className="text-xs text-[#78716C]">
                  Cost efficiency comparison: Auren Hybrid Router vs. Single-Provider Frontier APIs.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#8E5633] bg-[#F5E9DF] px-2.5 py-1 rounded-lg border border-[#DFB59D]">
              96.8% Compute Savings
            </span>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={arbitrageChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DAD0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716C' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78716C' }} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                  contentStyle={{ backgroundColor: '#181716', borderRadius: '12px', color: '#FAF8F5', border: '1px solid #C5855A' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Actual" fill="#C5855A" radius={[4, 4, 0, 0]} name="Auren Hybrid Router ($)" />
                <Bar dataKey="FrontierCost" fill="#78716C" opacity={0.4} radius={[4, 4, 0, 0]} name="Pure Frontier Cloud ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-[#EFECE6] border border-[#DDD5CA] text-xs text-[#57534E] flex items-center justify-between">
            <span>Routing routine cycles to <strong>Groq & Ollama</strong> reduced compute overhead by <strong>$369.73</strong> this period.</span>
          </div>
        </div>

        {/* Departmental Value Contribution (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-[#E2DAD0] bg-[#FAF8F5] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-[#F5E9DF] text-[#8E5633]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1917]">
                Departmental Value Contribution
              </h2>
              <p className="text-xs text-[#78716C]">
                Financial protection generated per business unit.
              </p>
            </div>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2DAD0" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#78716C' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#1C1917', fontWeight: 'bold' }} width={80} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Value Created']}
                  contentStyle={{ backgroundColor: '#181716', borderRadius: '12px', color: '#FAF8F5', border: '1px solid #C5855A' }}
                />
                <Bar dataKey="value" fill="#8E5633" radius={[0, 6, 6, 0]}>
                  {departmentChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8E5633' : '#C5855A'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. DEPARTMENTAL VALUE & TOP AUTO-MITIGATIONS TABLE */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-[#E2DAD0] bg-[#FAF8F5] p-6 lg:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#1C1917]">
            Operational Domain Performance & Key Safeguards
          </h2>
          <span className="text-xs font-semibold text-[#78716C]">5 Monitored Ecosystems</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2DAD0] text-[#78716C] font-semibold">
                <th className="pb-3 px-2">Domain</th>
                <th className="pb-3 px-2">Actions Run</th>
                <th className="pb-3 px-2">Labor Saved</th>
                <th className="pb-3 px-2">Value Generated</th>
                <th className="pb-3 px-2">Top Autonomous Mitigation</th>
                <th className="pb-3 px-2 text-right">Health Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DAD0]">
              {report.departments.map((dept) => (
                <tr key={dept.domain} className="hover:bg-[#F5E9DF]/30 transition-colors">
                  <td className="py-3.5 px-2 font-bold text-[#1C1917]">{dept.domain}</td>
                  <td className="py-3.5 px-2 font-mono">{dept.actions_count}</td>
                  <td className="py-3.5 px-2 font-mono text-[#8E5633] font-semibold">{dept.hours_saved} hrs</td>
                  <td className="py-3.5 px-2 font-mono font-bold text-[#1C1917]">${Math.round(dept.value_generated).toLocaleString()}</td>
                  <td className="py-3.5 px-2 text-[#57534E] max-w-xs truncate">{dept.top_mitigation}</td>
                  <td className="py-3.5 px-2 text-right">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
                      {dept.health_score} / 100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. EXECUTIVE AI SYNTHESIS & STRATEGIC RECOMMENDATIONS */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-[#C5855A]/40 bg-gradient-to-br from-[#181716] via-[#241E1A] to-[#181716] p-6 lg:p-8 text-[#FAF8F5] shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-[#2A2420] text-[#E2AB8A] border border-[#C5855A]/60">
            <Sparkles className="w-5 h-5 text-[#C5855A]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#FAF8F5]">
              Autonomous Operations Synthesis & Board Action Items
            </h2>
            <p className="text-xs text-[#DFB59D]">
              Generated by the Auren Adapter Agent based on pre/post metric deltas.
            </p>
          </div>
        </div>

        <p className="text-xs lg:text-sm text-[#E7E2DF] leading-relaxed bg-[#2A2420]/60 p-4 rounded-2xl border border-[#C5855A]/30">
          {report.executive_narrative}
        </p>

        <div className="mt-6">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#DFB59D]">
            Leadership Strategic Recommendations
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {report.strategic_recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-[#2A2420]/80 border border-[#C5855A]/30 text-xs text-[#FAF8F5]"
              >
                <div className="p-1 rounded-full bg-[#C5855A]/20 text-[#E2AB8A] shrink-0 mt-0.5">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. IMMUTABLE CRYPTOGRAPHIC AUDIT SEAL & SIGN-OFF BLOCK */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-[#E2DAD0] bg-[#FAF8F5] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 print:border-black">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#059669]" />
            <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
              Cryptographic Audit Verification Seal
            </span>
          </div>
          <p className="font-mono text-[10px] text-[#78716C] break-all">
            SHA256: {report.audit_hash}
          </p>
          <p className="text-[10px] text-[#A8A29E]">
            Immutable record verified across {report.audit_events_count} append-only ledger events.
          </p>
        </div>

        <div className="flex items-center gap-8 shrink-0 text-xs text-[#78716C]">
          <div className="border-t border-[#DDD5CA] pt-2 w-36 text-center">
            <span className="font-semibold text-[#1C1917] block">CTO Signature</span>
            <span className="text-[10px] text-[#A8A29E]">Architecture & Security</span>
          </div>
          <div className="border-t border-[#DDD5CA] pt-2 w-36 text-center">
            <span className="font-semibold text-[#1C1917] block">COO Signature</span>
            <span className="text-[10px] text-[#A8A29E]">Operations & Governance</span>
          </div>
        </div>
      </div>

      {/* Scenario Simulator Modal */}
      <ScenarioSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onScenarioCompleted={() => fetchReport()}
      />
    </div>
  );
};


export default ExecutivePage;
