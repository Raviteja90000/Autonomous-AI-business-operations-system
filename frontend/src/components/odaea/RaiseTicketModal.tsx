import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Mail,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  ExternalLink,
  LifeBuoy
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface RaiseTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cycleId: string) => void;
}

const AMOUNT_PRESETS = [
  { label: '$25 (Demo Refund)', value: 25.0, note: 'Allowed under Tier 2' },
  { label: '$50 (Moderate)', value: 50.0, note: 'Allowed under Tier 2' },
  { label: '$150 (Major)', value: 150.0, note: 'Medium Risk' },
  { label: '$600 (Over Limit)', value: 600.0, note: 'Triggers Policy Guardrail Block (Cap: $500)' },
];

export const RaiseTicketModal: React.FC<RaiseTicketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { autonomyTier } = useAuth();
  const [subject, setSubject] = useState('Customer requesting $25.00 refund for double billing');
  const [amount, setAmount] = useState<number>(25.0);
  const [customerEmail, setCustomerEmail] = useState('ravitejatalapaneni@gmail.com');
  const [chargeId, setChargeId] = useState('ch_demo_order_8819');
  const [priority, setPriority] = useState('HIGH');
  const [selectedTier, setSelectedTier] = useState<number>(autonomyTier || 2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handlePresetSelect = (val: number) => {
    setAmount(val);
    setSubject(`Customer requesting $${val.toFixed(2)} refund for order ${chargeId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const cycle = await api.triggerCycle('finance', 'MANUAL', selectedTier, {
        subject,
        amount_usd: Number(amount),
        customer_email: customerEmail,
        charge_id: chargeId,
        description: `Customer submitted support ticket: ${subject}. Requested refund: $${amount}. Target account: ${customerEmail}`
      });

      setResult({
        cycleId: cycle.id,
        status: cycle.status,
        domain: cycle.domain,
        amount,
        customerEmail,
        chargeId
      });

      onSuccess(cycle.id);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger autonomous refund cycle');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181716]/65 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-[#E2DAD0] bg-[#FAF8F5] p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-[#78716C] hover:text-[#1C1917] transition-colors p-1.5 rounded-full hover:bg-[#EFECE6]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3.5 mb-6">
          <div className="p-3 rounded-2xl bg-[#F5E9DF] border border-[#DFB59D] text-[#8E5633] shadow-sm">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold font-display tracking-tight text-[#1C1917]">
                Raise Support Ticket & Live Refund Demo
              </h3>
              <span className="flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                <Sparkles className="w-3 h-3 mr-1" /> Live Demo
              </span>
            </div>
            <p className="text-xs text-[#78716C] mt-0.5">
              Simulate customer ticket intake, execute Stripe refund, and dispatch confirmation to Gmail.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] text-xs font-medium flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success View */}
        {result ? (
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] p-5 space-y-3">
              <div className="flex items-center space-x-2 text-[#15803D]">
                <CheckCircle2 className="w-5 h-5" />
                <h4 className="font-bold text-sm">Autonomous Cycle Launched Successfully!</h4>
              </div>
              <p className="text-xs text-[#166534] leading-relaxed">
                The ODAEA closed-loop pipeline has ingested this ticket. The Observer has detected the anomaly,
                the Planner formulated the settlement, and the Actuator dispatched commands to connected systems.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-white border border-[#BBF7D0]">
                  <span className="text-[#15803D] block text-[10px] uppercase font-bold">Stripe Action</span>
                  <span className="text-sm font-bold text-[#1C1917]">Refund ${result.amount.toFixed(2)}</span>
                  <span className="text-[10px] text-[#78716C] block truncate">Target: {result.chargeId}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#BBF7D0]">
                  <span className="text-[#15803D] block text-[10px] uppercase font-bold">Gmail Notification</span>
                  <span className="text-sm font-bold text-[#1C1917]">Dispatched via Resend</span>
                  <span className="text-[10px] text-[#78716C] block truncate">To: {result.customerEmail}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-2xl bg-[#1C1917] hover:bg-[#292524] text-white text-xs font-bold shadow-sm transition-all"
              >
                View in Command Center & Actions
              </button>
            </div>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick Presets */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-2">
                Quick Select Refund Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AMOUNT_PRESETS.map((p) => {
                  const isSelected = amount === p.value;
                  const isOverLimit = p.value > 500;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handlePresetSelect(p.value)}
                      className={`p-2.5 rounded-xl text-left border transition-all text-xs font-semibold ${
                        isSelected
                          ? 'border-[#8E5633] bg-[#F5E9DF] text-[#8E5633] shadow-sm'
                          : isOverLimit
                          ? 'border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C] hover:border-[#F87171]'
                          : 'border-[#E2DAD0] bg-white text-[#1C1917] hover:border-[#C5855A]/50'
                      }`}
                    >
                      <div className="font-bold">{p.label}</div>
                      <div className="text-[9px] text-[#78716C] mt-0.5 line-clamp-1">{p.note}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Amount & Charge ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-1.5">
                  Refund Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#78716C]">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-[#EFECE6] border border-[#DDD5CA] rounded-xl pl-8 pr-3.5 py-2.5 text-[#1C1917] text-xs font-bold focus:outline-none focus:border-[#C5855A]"
                  />
                </div>
                {amount > 500 && (
                  <p className="text-[10px] text-[#D97706] font-medium mt-1">
                    ⚠️ Exceeds $500 policy cap! Guardrail engine will escalate to Approvals Queue.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-1.5">
                  Order / Charge ID
                </label>
                <input
                  type="text"
                  required
                  value={chargeId}
                  onChange={(e) => setChargeId(e.target.value)}
                  className="w-full bg-[#EFECE6] border border-[#DDD5CA] rounded-xl px-3.5 py-2.5 text-[#1C1917] text-xs font-mono focus:outline-none focus:border-[#C5855A]"
                />
              </div>
            </div>

            {/* Customer Email & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-1.5">
                  Customer Email (Delivered to Gmail)
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-[#EFECE6] border border-[#DDD5CA] rounded-xl px-3.5 py-2.5 text-[#1C1917] text-xs font-medium focus:outline-none focus:border-[#C5855A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-1.5">
                  Ticket Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-[#EFECE6] border border-[#DDD5CA] rounded-xl px-3.5 py-2.5 text-[#1C1917] text-xs font-semibold focus:outline-none focus:border-[#C5855A]"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH (Urgent Refund)</option>
                  <option value="CRITICAL">CRITICAL (Executive Escalation)</option>
                </select>
              </div>
            </div>

            {/* Ticket Subject */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-1.5">
                Ticket Issue Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#EFECE6] border border-[#DDD5CA] rounded-xl px-3.5 py-2.5 text-[#1C1917] text-xs font-medium focus:outline-none focus:border-[#C5855A]"
              />
            </div>

            {/* Autonomy Tier Selection */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-1.5">
                Autonomy Boundary Tier
              </label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(Number(e.target.value))}
                className="w-full bg-[#EFECE6] border border-[#DDD5CA] rounded-xl px-3.5 py-2.5 text-[#1C1917] text-xs font-semibold focus:outline-none focus:border-[#C5855A]"
              >
                <option value={2}>Tier 2: Bounded Autonomous (Auto-executes if under $500)</option>
                <option value={1}>Tier 1: Human-in-the-Loop (Requires approval in Approvals Queue)</option>
                <option value={3}>Tier 3: Scoped High Autonomy</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-3 flex items-center justify-between border-t border-[#E2DAD0]/80">
              <span className="text-[11px] text-[#78716C] flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#15803D]" /> Guardrail Verified (Policy: $500 Cap)
              </span>

              <div className="flex space-x-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-2xl bg-white border border-[#DDD5CA] text-xs font-bold text-[#78716C] hover:text-[#1C1917] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-[#8E5633] hover:bg-[#724528] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Ingesting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current text-amber-200" />
                      <span>Submit Ticket & Run ODAEA Cycle</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
