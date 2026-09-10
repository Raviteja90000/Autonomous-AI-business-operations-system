import React, { useState } from 'react';
import { X, Play, Zap } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface TriggerCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cycleId: string) => void;
}

export const TriggerCycleModal: React.FC<TriggerCycleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { autonomyTier } = useAuth();
  const [domain, setDomain] = useState('sales');
  const [triggerType, setTriggerType] = useState('MANUAL');
  const [selectedTier, setSelectedTier] = useState(autonomyTier);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrigger = async () => {
    setLoading(true);
    setError(null);
    try {
      const cycle = await api.triggerCycle(domain, triggerType, selectedTier);
      onSuccess(cycle.id);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to trigger ODAEA cycle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181716]/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl border border-[#E2DAD0] bg-[#FAF8F5] p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#78716C] hover:text-[#1C1917] transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3.5 mb-5">
          <div className="p-2.5 rounded-2xl bg-[#F5E9DF] border border-[#DFB59D] text-[#8E5633]">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display tracking-tight text-[#1C1917]">Trigger Autonomous Cycle</h3>
            <p className="text-xs text-[#78716C]">Initiate Closed-Loop Operational Workflow</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] text-xs font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-1.5">Target Business Domain</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-[#EFECE6] border border-[#DDD5CA] rounded-xl px-3.5 py-2.5 text-[#1C1917] text-xs font-semibold focus:outline-none focus:border-[#C5855A]"
            >
              <option value="sales">Sales & Revenue Operations</option>
              <option value="finance">Finance & Billing Collections</option>
              <option value="support">Customer Support & SLA Triage</option>
              <option value="marketing">Marketing & Campaign Bid Optimization</option>
              <option value="operations">Infrastructure & System Operations</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-1.5">Execution Autonomy Tier</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(Number(e.target.value))}
              className="w-full bg-[#EFECE6] border border-[#DDD5CA] rounded-xl px-3.5 py-2.5 text-[#1C1917] text-xs font-semibold focus:outline-none focus:border-[#C5855A]"
            >
              <option value={0}>Tier 0: Observe Only (No actions)</option>
              <option value={1}>Tier 1: Human-in-the-Loop (Approval required)</option>
              <option value={2}>Tier 2: Bounded Autonomous (Low risk auto)</option>
              <option value={3}>Tier 3: Scoped High Autonomy</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-1.5">Trigger Cause</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full bg-[#EFECE6] border border-[#DDD5CA] rounded-xl px-3.5 py-2.5 text-[#1C1917] text-xs font-semibold focus:outline-none focus:border-[#C5855A]"
            >
              <option value="MANUAL">Manual Operator Trigger</option>
              <option value="ANOMALY_EVENT">Simulated Anomaly Incident</option>
              <option value="SCHEDULED">Scheduled Periodic Assessment</option>
              <option value="WEBHOOK">External Webhook Signal</option>
            </select>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#78716C] hover:text-[#1C1917] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleTrigger}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#181716] hover:bg-[#2A2724] text-[#FAF8F5] shadow-md transition-all border border-[#35312C]"
          >
            <Zap className="w-3.5 h-3.5 text-[#E2AB8A]" />
            <span>{loading ? 'Initiating Pipeline...' : 'Start ODAEA Cycle'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
