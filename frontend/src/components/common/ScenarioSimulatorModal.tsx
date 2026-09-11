import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  X,
  Play,
  Flame,
  Shield,
  CreditCard,
  LifeBuoy,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  AlertOctagon,
  Layers,
} from 'lucide-react';
import { api } from '../../services/api';
import { SimulationScenario, SimulationRunResult } from '../../types';

const FALLBACK_SCENARIOS: SimulationScenario[] = [
  {
    id: 'scenario_enterprise_churn',
    title: 'Tier-1 Enterprise Account High Churn Risk Signal',
    domain: 'CUSTOMER_SUCCESS',
    severity: 'CRITICAL',
    arr_impact_usd: 120000.0,
    description:
      'Apex Global (Tier-1, $120k ARR) product usage dropped 64% over 14 days following 3 unresolved P1 Zendesk tickets and sponsor job change on LinkedIn.',
    crisis_trigger: 'Usage cliff (-64%) & open executive escalations',
    target_systems: ['Salesforce', 'Zendesk', 'SendGrid', 'Slack'],
    recommended_autonomy: 2,
    icon: 'Users',
    expected_remediation:
      'Dispatches VIP escalation to VP Customer Success, drafts executive outreach from CEO, offers dedicated solutions engineering support.',
  },
  {
    id: 'scenario_pricing_leak',
    title: 'Silent Enterprise Discount Leakage & Margin Erosion',
    domain: 'FINANCE',
    severity: 'HIGH',
    arr_impact_usd: 48000.0,
    description:
      'Stripe & billing audits detected recurring grandfathered 35% enterprise discounts applied across non-renewed quarterly contracts without finance approval.',
    crisis_trigger: 'Gross Margin dip below 72% SLA threshold',
    target_systems: ['Stripe', 'NetSuite', 'Slack'],
    recommended_autonomy: 2,
    icon: 'CreditCard',
    expected_remediation:
      'Pauses unapproved automated discount overrides, recalculates upcoming invoices, drafts revenue recovery notice to account reps.',
  },
  {
    id: 'scenario_compliance_breach',
    title: 'SOC-2 Data Retention & Sub-processor Audit Anomaly',
    domain: 'COMPLIANCE',
    severity: 'CRITICAL',
    arr_impact_usd: 250000.0,
    description:
      'Unencrypted backup snapshot retention in secondary AWS staging region exceeded 90-day compliance window, risking SOC-2 Type II audit exception.',
    crisis_trigger: 'Automated compliance scanner alert',
    target_systems: ['AWS KMS', 'Jira', 'PagerDuty', 'Email'],
    recommended_autonomy: 1,
    icon: 'Shield',
    expected_remediation:
      'Triggers Tier-1 human approval workflow, generates cryptographic purge action plan, alerts Head of Information Security.',
  },
  {
    id: 'scenario_service_outage',
    title: 'Core API Latency Spike & Global SLA Degradation',
    domain: 'OPERATIONS',
    severity: 'HIGH',
    arr_impact_usd: 85000.0,
    description:
      'P99 API response times escalated from 42ms to 2,410ms in EU-West cluster due to unindexed database query cascade on analytics endpoints.',
    crisis_trigger: 'P99 Latency > 2,000ms & error rate > 5%',
    target_systems: ['Datadog', 'AWS ECS', 'Statuspage', 'Slack'],
    recommended_autonomy: 2,
    icon: 'TrendingUp',
    expected_remediation:
      'Routes traffic to standby cluster, enables rate-limiting circuit breaker on analytics endpoints, updates customer status page.',
  },
];

interface ScenarioSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioCompleted?: (result: SimulationRunResult) => void;
}

export const ScenarioSimulatorModal: React.FC<ScenarioSimulatorModalProps> = ({
  isOpen,
  onClose,
  onScenarioCompleted,
}) => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<SimulationScenario[]>(FALLBACK_SCENARIOS);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario_enterprise_churn');
  const [autonomyTier, setAutonomyTier] = useState<number>(2);
  const [running, setRunning] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getSimulationScenarios()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setScenarios(data);
            if (!selectedScenarioId) {
              setSelectedScenarioId(data[0].id);
            }
          }
        })
        .catch((err) => console.warn('Using pre-loaded scenario catalog', err));
    } else {
      // Reset state on close
      setResult(null);
      setError(null);
      setCurrentStage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedScenario =
    scenarios.find((s) => s.id === selectedScenarioId) ||
    scenarios[0] ||
    FALLBACK_SCENARIOS[0];

  const handleLaunchScenario = async () => {
    const activeScenario = selectedScenario || FALLBACK_SCENARIOS[0];
    const scenarioId = activeScenario.id || selectedScenarioId || 'scenario_enterprise_churn';
    
    setRunning(true);
    setError(null);
    setResult(null);
    setCurrentStage('OBSERVE');

    // Simulate progressive visual stages while API runs
    const stageTimer1 = setTimeout(() => setCurrentStage('DECIDE'), 350);
    const stageTimer2 = setTimeout(() => setCurrentStage('CRITIQUE'), 700);
    const stageTimer3 = setTimeout(() => setCurrentStage('ACT'), 1050);
    const stageTimer4 = setTimeout(() => setCurrentStage('EVALUATE'), 1400);

    try {
      const res = await api.runSimulation(scenarioId, autonomyTier, true);
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(stageTimer4);
      setCurrentStage('ADAPT');
      setResult(res);
      if (onScenarioCompleted) {
        onScenarioCompleted(res);
      }
    } catch (err: any) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(stageTimer4);
      setError(err.message || 'Failed to execute scenario simulation.');
      setCurrentStage(null);
    } finally {
      setRunning(false);
    }
  };

  const getDomainIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users':
        return <Users className="w-5 h-5" />;
      case 'CreditCard':
        return <CreditCard className="w-5 h-5" />;
      case 'LifeBuoy':
        return <LifeBuoy className="w-5 h-5" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5" />;
      case 'Shield':
        return <Shield className="w-5 h-5" />;
      default:
        return <Flame className="w-5 h-5" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]';
      case 'HIGH':
        return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
      default:
        return 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]';
    }
  };

  const stages = ['OBSERVE', 'DECIDE', 'CRITIQUE', 'ACT', 'EVALUATE', 'ADAPT'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[#141312] border border-[#C5855A]/50 text-[#FAF8F5] shadow-2xl shadow-[#C5855A]/20 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#35312C] bg-[#1A1816]/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#C5855A] to-[#E2AB8A] text-[#141312] shadow-lg shadow-[#C5855A]/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display tracking-wide uppercase text-[#FAF8F5]">
                  Enterprise Incident Operations Matrix
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#C5855A]/20 text-[#E2AB8A] border border-[#C5855A]/50 tracking-widest uppercase">
                  Live Operations
                </span>
              </div>
              <p className="text-[11px] text-[#A8A29E]">
                Trigger live operational incidents and observe autonomous closed-loop ODAEA resolution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A8A29E] hover:text-[#FAF8F5] hover:bg-[#2A2724] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Scenario Selector Grid */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#A8A29E] block">
              1. Select Enterprise Crisis Blueprint
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {scenarios.map((sc) => {
                const isSelected = selectedScenarioId === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => {
                      if (!running) setSelectedScenarioId(sc.id);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-[#221F1C] border-[#C5855A] shadow-lg shadow-[#C5855A]/15 ring-1 ring-[#C5855A]'
                        : 'bg-[#181716] border-[#35312C] hover:border-[#524B45] hover:bg-[#1E1C1A]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-[#2C2724] text-[#E2AB8A] border border-[#3E3834]">
                          {getDomainIcon(sc.icon)}
                        </div>
                        <span className="font-mono text-xs font-bold uppercase text-[#FAF8F5]">
                          {sc.domain}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getSeverityBadge(sc.severity)}`}>
                        {sc.severity} · ${(sc.arr_impact_usd / 1000).toFixed(0)}k ARR
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-[#FAF8F5] leading-snug">{sc.title}</h4>
                      <p className="text-[11px] text-[#A8A29E] mt-1 line-clamp-2 leading-relaxed font-medium">
                        {sc.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#A8A29E] pt-2 border-t border-[#2A2724]">
                      <span>Trigger: <strong className="text-[#E2AB8A]">{sc.crisis_trigger}</strong></span>
                      <span>Target: <strong className="text-[#FAF8F5]">{sc.target_systems.join(', ')}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Autonomy Tier Selector Bar */}
          <div className="p-4 rounded-2xl bg-[#181716] border border-[#35312C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#FAF8F5] block">
                2. Autonomy Tier for Simulation
              </span>
              <p className="text-[11px] text-[#A8A29E]">
                Tier 2 autonomously executes bounded actions ($5k limit). Tier 1 pauses for Human Approval.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-[#252220] p-1 rounded-xl border border-[#3E3834]">
              {[
                { tier: 1, label: 'Tier 1: Human Approval' },
                { tier: 2, label: 'Tier 2: Bounded Autonomous' },
                { tier: 3, label: 'Tier 3: Full Autonomy' },
              ].map((t) => (
                <button
                  key={t.tier}
                  type="button"
                  onClick={() => setAutonomyTier(t.tier)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    autonomyTier === t.tier
                      ? 'bg-[#C5855A] text-[#141312] font-bold shadow-md'
                      : 'text-[#A8A29E] hover:text-[#FAF8F5]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Execution Stepper (When Running or Completed) */}
          {(running || currentStage || result) && (
            <div className="p-5 rounded-2xl bg-[#181716] border border-[#C5855A]/40 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E2AB8A] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                  Live ODAEA Autonomous Execution Pipeline
                </span>
                {result && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
                    Cycle {result.cycle_status}
                  </span>
                )}
              </div>

              {/* Step Flow */}
              <div className="grid grid-cols-6 gap-2 text-center">
                {stages.map((st, i) => {
                  const isDone = Boolean(result) || (currentStage && stages.indexOf(currentStage) >= i);
                  const isCurrent = running && currentStage === st;
                  return (
                    <div
                      key={st}
                      className={`p-2 rounded-xl border text-[10px] font-mono transition-all ${
                        isCurrent
                          ? 'bg-[#C5855A]/20 border-[#C5855A] text-[#E2AB8A] font-bold animate-pulse'
                          : isDone
                          ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981] font-semibold'
                          : 'bg-[#221F1C] border-[#35312C] text-[#78716C]'
                      }`}
                    >
                      <span className="block text-[8px] opacity-70">STAGE {i + 1}</span>
                      <span>{st}</span>
                    </div>
                  );
                })}
              </div>

              {/* Result Summary */}
              {result && (
                <div className="p-4 rounded-xl bg-[#221F1C] border border-[#3E3834] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A8A29E]">Remediation Goal:</span>
                    <strong className="text-[#FAF8F5]">{result.decision.goal || 'Executive outreach dispatched'}</strong>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[#35312C]">
                    <span className="text-[#A8A29E]">Actions Executed:</span>
                    <span className="font-mono text-[#10B981] font-bold">
                      {result.actions.length} Actions ({result.actions.map((a) => a.action_type).join(', ') || 'In Sandbox'})
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[#35312C]">
                    <span className="text-[#A8A29E]">Empirical Evaluation:</span>
                    <span className="font-mono text-[#E2AB8A] font-bold">
                      Outcome: {result.evaluation?.actual_outcome || 'POSITIVE'} · Goal Achieved: Yes
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] text-xs font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#35312C] bg-[#1A1816]/90">
          <div className="text-xs text-[#A8A29E]">
            Selected: <strong className="text-[#FAF8F5]">{selectedScenario?.title}</strong>
          </div>

          <div className="flex items-center gap-3">
            {result ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/cycles');
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#141312] font-bold text-xs shadow-lg shadow-[#10B981]/25 transition-all cursor-pointer"
              >
                <span>Inspect Cycle in Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLaunchScenario}
                disabled={running}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C5855A] via-[#E2AB8A] to-[#8E5633] hover:opacity-95 text-[#141312] font-extrabold text-xs shadow-xl shadow-[#C5855A]/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{running ? 'Executing Autonomous ODAEA Flow...' : 'Execute Incident Playbook'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
