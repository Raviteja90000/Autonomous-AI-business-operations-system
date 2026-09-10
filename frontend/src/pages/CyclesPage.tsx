import React, { useState, useEffect } from 'react';
import { RotateCw, Zap, Play, CheckCircle2, Clock, AlertTriangle, ArrowRight, Shield } from 'lucide-react';
import { api } from '../services/api';
import { ODAEACycle } from '../types';
import { TriggerCycleModal } from '../components/odaea/TriggerCycleModal';
import { OdaeaCycleVisualizer } from '../components/odaea/OdaeaCycleVisualizer';

export const CyclesPage: React.FC = () => {
  const [cycles, setCycles] = useState<ODAEACycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<ODAEACycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);

  const loadCycles = async () => {
    try {
      const data = await api.getCycles(domainFilter === 'all' ? undefined : domainFilter);
      setCycles(data);
      if (data.length > 0 && !selectedCycle) {
        setSelectedCycle(data[0]);
      }
    } catch (e) {
      console.error('Failed to load cycles', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCycles();
  }, [domainFilter]);

  return (
    <div className="space-y-6 text-[#1C1917]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-[#1C1917]">ODAEA Autonomous Cycles</h1>
          <p className="text-xs text-[#78716C] mt-1">
            Observe → Decide → Critique → Guardrail → Act → Evaluate → Adapt State Machine Tracing
          </p>
        </div>

        <button
          onClick={() => setIsTriggerModalOpen(true)}
          className="flex items-center space-x-2 rounded-2xl bg-[#181716] hover:bg-[#2A2724] px-5 py-2.5 text-xs font-bold text-[#FAF8F5] shadow-md transition-all cursor-pointer border border-[#35312C]"
        >
          <Play className="w-4 h-4 text-[#E2AB8A] fill-current" />
          <span>New ODAEA Cycle</span>
        </button>
      </div>

      {/* Selected Cycle Visualizer */}
      {selectedCycle && <OdaeaCycleVisualizer activeCycle={selectedCycle} />}

      {/* Filters & Cycle Table */}
      <div className="auren-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2DAD0]/80">
          <div className="flex items-center space-x-2.5">
            <RotateCw className="w-4 h-4 text-[#8E5633]" />
            <h3 className="text-sm font-bold font-display text-[#1C1917]">Cycle Execution History</h3>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#78716C]">Filter Domain:</span>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="bg-[#EFECE6] border border-[#DDD5CA] rounded-xl px-3 py-1.5 text-xs text-[#1C1917] font-semibold focus:outline-none focus:border-[#C5855A]"
            >
              <option value="all">All Domains</option>
              <option value="sales">Sales</option>
              <option value="finance">Finance</option>
              <option value="support">Support</option>
              <option value="marketing">Marketing</option>
              <option value="operations">Operations</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2DAD0] text-[#78716C] uppercase text-[10px] font-bold tracking-widest">
                <th className="pb-3">Cycle ID</th>
                <th className="pb-3">Domain</th>
                <th className="pb-3">Trigger</th>
                <th className="pb-3">Current Stage</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DAD0]/60">
              {cycles.map((cyc) => (
                <tr
                  key={cyc.id}
                  onClick={() => setSelectedCycle(cyc)}
                  className={`cursor-pointer transition-colors ${
                    selectedCycle?.id === cyc.id ? 'bg-[#F5E9DF]/60 border-l-2 border-[#C5855A]' : 'hover:bg-[#EFECE6]/50'
                  }`}
                >
                  <td className="py-3.5 font-mono text-[#8E5633] font-bold">{cyc.id.substring(0, 8)}...</td>
                  <td className="py-3.5 capitalize text-[#1C1917] font-semibold">{cyc.domain}</td>
                  <td className="py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EFECE6] text-[#78716C] font-mono text-[10px] border border-[#DDD5CA]">
                      {cyc.trigger_type}
                    </span>
                  </td>
                  <td className="py-3.5 font-bold text-[#1C1917]">{cyc.current_stage}</td>
                  <td className="py-3.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        cyc.status === 'COMPLETED'
                          ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                          : cyc.status === 'AWAITING_APPROVAL'
                          ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A] animate-pulse'
                          : cyc.status === 'FAILED'
                          ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]'
                          : 'bg-[#F5E9DF] text-[#8E5633] border-[#DFB59D] animate-pulse'
                      }`}
                    >
                      {cyc.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-[#78716C]">{new Date(cyc.started_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TriggerCycleModal
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
        onSuccess={() => loadCycles()}
      />
    </div>
  );
};
