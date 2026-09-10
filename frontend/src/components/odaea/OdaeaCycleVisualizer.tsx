import React from 'react';
import {
  Eye,
  Brain,
  SearchCode,
  ShieldCheck,
  Zap,
  BarChart,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { ODAEACycle } from '../../types';

interface OdaeaVisualizerProps {
  activeCycle?: ODAEACycle;
  onSelectStage?: (stage: string) => void;
}

export const OdaeaCycleVisualizer: React.FC<OdaeaVisualizerProps> = ({
  activeCycle,
  onSelectStage,
}) => {
  const stages = [
    { key: 'OBSERVE', name: 'Observe', agent: 'Observer Agent', icon: Eye },
    { key: 'DECIDE', name: 'Decide', agent: 'Planner Agent', icon: Brain },
    { key: 'CRITIQUE', name: 'Critique', agent: 'Critic Agent', icon: SearchCode },
    { key: 'GUARDRAIL', name: 'Guardrail', agent: 'Deterministic Engine', icon: ShieldCheck },
    { key: 'ACT', name: 'Act', agent: 'Actuator & Idempotency', icon: Zap },
    { key: 'EVALUATE', name: 'Evaluate', agent: 'Evaluator Agent', icon: BarChart },
    { key: 'ADAPT', name: 'Adapt', agent: 'Adapter Agent', icon: RefreshCw },
  ];

  const currentStage = activeCycle?.current_stage?.toUpperCase() || 'COMPLETED';
  const cycleStatus = activeCycle?.status?.toUpperCase() || 'IDLE';

  const getStageState = (stageKey: string) => {
    if (!activeCycle) return 'idle';
    if (cycleStatus === 'COMPLETED') return 'completed';
    const progress = activeCycle.stage_progress || {};
    if (progress[stageKey] === 'COMPLETED') return 'completed';
    if (progress[stageKey] === 'RUNNING' || currentStage === stageKey) return 'running';
    if (progress[stageKey] === 'PENDING') return 'pending';
    return 'idle';
  };

  return (
    <div className="auren-card p-6 relative overflow-hidden shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2DAD0]/80">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#C5855A] animate-pulse" />
            <h3 className="text-base font-bold font-display tracking-tight text-[#1C1917]">
              ODAEA Closed-Loop Pipeline Visualizer
            </h3>
          </div>
          <p className="text-xs text-[#78716C] mt-0.5">
            Real-time stage-by-stage autonomous observation, decision planning, critique, guardrails, and adaptation.
          </p>
        </div>

        {activeCycle && (
          <div className="flex items-center space-x-2.5 text-xs">
            <div className="px-3 py-1 rounded-xl bg-[#EFECE6] border border-[#DDD5CA] font-mono text-[#8E5633]">
              ID: {activeCycle.id.substring(0, 8)}...
            </div>
            <div className="px-3 py-1 rounded-xl bg-[#EFECE6] border border-[#DDD5CA] uppercase font-semibold text-[#78716C]">
              Domain: <span className="text-[#1C1917] font-bold">{activeCycle.domain}</span>
            </div>
            <div
              className={`px-3 py-1 rounded-xl font-bold text-[11px] uppercase tracking-wider border ${
                cycleStatus === 'COMPLETED'
                  ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                  : cycleStatus === 'AWAITING_APPROVAL'
                  ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A] animate-pulse'
                  : 'bg-[#F5E9DF] text-[#8E5633] border-[#DFB59D] animate-pulse'
              }`}
            >
              {cycleStatus}
            </div>
          </div>
        )}
      </div>

      {/* 7-Stage Pipeline Visualizer */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {stages.map((stg, idx) => {
          const state = getStageState(stg.key);
          const isCompleted = state === 'completed';
          const isRunning = state === 'running';

          return (
            <div
              key={stg.key}
              onClick={() => onSelectStage && onSelectStage(stg.key)}
              className={`relative rounded-2xl p-3.5 border transition-all cursor-pointer ${
                isRunning
                  ? 'bg-[#F5E9DF] border-[#C5855A] shadow-md ring-2 ring-[#C5855A]/30 scale-[1.02]'
                  : isCompleted
                  ? 'bg-[#FAF8F5] border-[#86EFAC] hover:border-[#16A34A]'
                  : 'bg-[#EFECE6]/60 border-[#DDD5CA] hover:border-[#C5855A]/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div
                  className={`p-2 rounded-xl border ${
                    isRunning
                      ? 'bg-[#C5855A] text-white border-[#B27045] shadow-sm animate-bounce'
                      : isCompleted
                      ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]'
                      : 'bg-[#EFECE6] border-[#DDD5CA] text-[#78716C]'
                  }`}
                >
                  <stg.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-[#A8A29E]">0{idx + 1}</span>
              </div>

              <h4 className="text-xs font-bold text-[#1C1917] font-display">{stg.name}</h4>
              <p className="text-[10px] text-[#78716C] truncate mt-0.5">{stg.agent}</p>

              <div className="mt-3 flex items-center justify-between text-[10px] pt-2 border-t border-[#E2DAD0]/80">
                {isRunning ? (
                  <span className="flex items-center text-[#8E5633] font-bold">
                    <Clock className="w-3 h-3 mr-1 animate-spin" /> Running
                  </span>
                ) : isCompleted ? (
                  <span className="flex items-center text-[#15803D] font-semibold">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                  </span>
                ) : (
                  <span className="text-[#A8A29E]">Standby</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
