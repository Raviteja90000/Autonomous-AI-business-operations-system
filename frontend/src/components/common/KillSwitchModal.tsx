import React, { useState } from 'react';
import { AlertOctagon, X, ShieldAlert, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

interface KillSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGlobalState: boolean;
  onUpdated: () => void;
}

export const KillSwitchModal: React.FC<KillSwitchModalProps> = ({
  isOpen,
  onClose,
  currentGlobalState,
  onUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedScope, setSelectedScope] = useState<'GLOBAL' | 'DOMAIN' | 'AGENT' | 'INTEGRATION'>('GLOBAL');
  const [target, setTarget] = useState('sales');
  const [confirmText, setConfirmText] = useState('');
  const [activeToggle, setActiveToggle] = useState(!currentGlobalState);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggle = async () => {
    if (selectedScope === 'GLOBAL' && confirmText !== 'EMERGENCY') {
      setError("Please type 'EMERGENCY' to confirm global kill-switch action.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.toggleKillSwitch(selectedScope, activeToggle, selectedScope === 'GLOBAL' ? undefined : target);
      onUpdated();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to toggle kill switch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181716]/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#35312C] bg-[#181716] text-[#FAF8F5] p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#A8A29E] hover:text-[#FAF8F5] transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3.5 mb-5">
          <div className="p-2.5 rounded-2xl bg-[#DC2626]/10 border border-[#DC2626]/30">
            <AlertOctagon className="w-6 h-6 text-[#EF4444] animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display tracking-tight text-[#FAF8F5]">Governance Kill Switch</h3>
            <p className="text-xs text-[#DEB29B]">Deterministic Safety Override Plane</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#DC2626]/20 border border-[#DC2626]/40 text-[#FCA5A5] text-xs font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#A8A29E] mb-1.5">Select Scope</label>
            <div className="grid grid-cols-4 gap-2">
              {(['GLOBAL', 'DOMAIN', 'AGENT', 'INTEGRATION'] as const).map((sc) => (
                <button
                  key={sc}
                  onClick={() => setSelectedScope(sc)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all ${
                    selectedScope === sc
                      ? 'bg-[#C5855A] border-[#E2AB8A] text-[#181716] shadow-sm'
                      : 'bg-[#2A2724] border-[#3D3833] text-[#A8A29E] hover:border-[#C5855A]/50 hover:text-[#FAF8F5]'
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>
          </div>

          {selectedScope !== 'GLOBAL' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#A8A29E] mb-1.5">Target Entity</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-[#2A2724] border border-[#3D3833] rounded-xl px-3.5 py-2.5 text-[#FAF8F5] text-xs focus:outline-none focus:border-[#C5855A]"
              >
                {selectedScope === 'DOMAIN' && (
                  <>
                    <option value="sales">Sales Domain</option>
                    <option value="finance">Finance Domain</option>
                    <option value="support">Support Domain</option>
                    <option value="marketing">Marketing Domain</option>
                    <option value="operations">Operations Domain</option>
                  </>
                )}
                {selectedScope === 'AGENT' && (
                  <>
                    <option value="actuator">Actuator Agent (Halts all executions)</option>
                    <option value="planner">Planner Agent</option>
                    <option value="critic">Critic Agent</option>
                    <option value="observer">Observer Agent</option>
                  </>
                )}
                {selectedScope === 'INTEGRATION' && (
                  <>
                    <option value="crm">HubSpot CRM</option>
                    <option value="finance">Stripe Billing</option>
                    <option value="support">Zendesk Support</option>
                    <option value="email">SendGrid Mail</option>
                    <option value="marketing">Ads Engine</option>
                  </>
                )}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#A8A29E] mb-1.5">Action State</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveToggle(true)}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                  activeToggle
                    ? 'bg-[#DC2626] border-[#EF4444] text-white shadow-md'
                    : 'bg-[#2A2724] border-[#3D3833] text-[#A8A29E]'
                }`}
              >
                ENGAGE (HALT OPERATIONS)
              </button>
              <button
                type="button"
                onClick={() => setActiveToggle(false)}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                  !activeToggle
                    ? 'bg-[#16A34A] border-[#22C55E] text-white shadow-md'
                    : 'bg-[#2A2724] border-[#3D3833] text-[#A8A29E]'
                }`}
              >
                RELEASE (ALLOW OPERATION)
              </button>
            </div>
          </div>

          {selectedScope === 'GLOBAL' && (
            <div className="pt-2">
              <label className="block text-xs text-[#E2AB8A] mb-1.5">
                Type <span className="font-bold text-[#FAF8F5] bg-[#DC2626]/40 px-1.5 py-0.5 rounded border border-[#DC2626]/60">EMERGENCY</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="EMERGENCY"
                className="w-full bg-[#2A2724] border border-[#3D3833] rounded-xl px-3.5 py-2.5 text-[#FAF8F5] text-xs focus:outline-none focus:border-[#C5855A] font-mono tracking-wider"
              />
            </div>
          )}
        </div>

        <div className="mt-7 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#A8A29E] hover:text-[#FAF8F5] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md ${
              activeToggle
                ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
                : 'bg-[#16A34A] hover:bg-[#15803D] text-white'
            }`}
          >
            {loading ? 'Processing...' : activeToggle ? 'Activate Kill Switch' : 'Deactivate Kill Switch'}
          </button>
        </div>
      </div>
    </div>
  );
};
