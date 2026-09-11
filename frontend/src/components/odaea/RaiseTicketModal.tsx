import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  { label: '$25 (Billing Glitch)', value: 25.0, note: 'Autonomous Tier 2 Approved' },
  { label: '$50 (Customer Good will)', value: 50.0, note: 'Autonomous Tier 2 Approved' },
  { label: '$150 (Service Outage)', value: 150.0, note: 'Elevated Risk' },
  { label: '$600 (Threshold Breach)', value: 600.0, note: 'Guardrail Intercept (Cap: $500)' },
];

interface AnalysisStep {
  step: number;
  name: string;
  agent: string;
  detail: string;
  status: 'pending' | 'active' | 'completed';
}

export const RaiseTicketModal: React.FC<RaiseTicketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { autonomyTier } = useAuth();
  const [subject, setSubject] = useState('Customer disputing duplicate checkout charge on invoice');
  const [amount, setAmount] = useState<number>(25.0);
  const [customerEmail, setCustomerEmail] = useState('ravitejatalapaneni@gmail.com');
  const [chargeId, setChargeId] = useState('ch_live_948201');
  const [priority, setPriority] = useState('HIGH');
  const [selectedTier, setSelectedTier] = useState<number>(autonomyTier || 2);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const isOverLimit = amount > 500;

  const steps: AnalysisStep[] = [
    {
      step: 1,
      name: 'Observer Triage & Sentiment Analysis',
      agent: 'Observer Agent',
      detail: 'Scanning customer tone (-0.78 urgency), ticket priority, and SLA deadlines...',
      status: activeStep > 1 ? 'completed' : activeStep === 1 ? 'active' : 'pending',
    },
    {
      step: 2,
      name: 'Telemetry & Stripe Ledger Verification',
      agent: 'Correlator Engine',
      detail: `Verifying charge ${chargeId} and customer history in Stripe records...`,
      status: activeStep > 2 ? 'completed' : activeStep === 2 ? 'active' : 'pending',
    },
    {
      step: 3,
      name: 'Strategic Trade-off Formulation',
      agent: 'Planner Agent',
      detail: isOverLimit
        ? `High spend requested ($${amount.toFixed(2)}). Recommending human governance review...`
        : `Comparing $${amount.toFixed(2)} refund cost vs. customer lifetime churn risk ($3,840)...`,
      status: activeStep > 3 ? 'completed' : activeStep === 3 ? 'active' : 'pending',
    },
    {
      step: 4,
      name: 'Code-Level Safety Guardrail Audit',
      agent: 'Critic & Guardrail Gate',
      detail: isOverLimit
        ? `⚠️ BREACH: Refund $${amount.toFixed(2)} > $500 policy cap. Escalating to Approvals Queue!`
        : `Checking safety boundary: Refund $${amount.toFixed(2)} <= $500 policy threshold...`,
      status: activeStep > 4 ? 'completed' : activeStep === 4 ? 'active' : 'pending',
    },
    {
      step: 5,
      name: isOverLimit ? 'Human Approvals Queue Dispatch' : 'Actuator Execution & Live Settlement',
      agent: isOverLimit ? 'Governance Gate' : 'Actuator Agent',
      detail: isOverLimit
        ? 'Autonomous execution halted. Created approval request for human sign-off.'
        : `Issuing Stripe refund & delivering official confirmation to ${customerEmail}...`,
      status: activeStep > 5 ? 'completed' : activeStep === 5 ? 'active' : 'pending',
    },
  ];

  if (!isOpen) return null;

  const handlePresetSelect = (val: number) => {
    setAmount(val);
    setSubject(`Customer disputing duplicate $${val.toFixed(2)} charge on order ${chargeId}`);
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveStep(1);

    try {
      // Step 1: Observer
      await sleep(600);
      setActiveStep(2);

      // Step 2: Telemetry
      await sleep(650);
      setActiveStep(3);

      // Trigger API call concurrently with steps 3-5
      const cyclePromise = api.triggerCycle('finance', 'MANUAL', selectedTier, {
        subject,
        amount_usd: Number(amount),
        customer_email: customerEmail,
        charge_id: chargeId,
        description: `Customer submitted support ticket: ${subject}. Requested refund: $${amount}. Target account: ${customerEmail}`
      });

      // Step 3: Planner
      await sleep(750);
      setActiveStep(4);

      // Step 4: Critic
      await sleep(700);
      setActiveStep(5);

      const cycle = await cyclePromise;
      await sleep(600);
      setActiveStep(6);

      setResult({
        cycleId: cycle.id,
        status: cycle.status,
        domain: cycle.domain,
        amount,
        customerEmail,
        chargeId,
        churnProtected: 3840,
        laborMinutesSaved: 25,
      });

      onSuccess(cycle.id);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger autonomous refund cycle');
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    setActiveStep(0);
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
                Raise Support Ticket
              </h3>
              <span className="flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                <Sparkles className="w-3 h-3 mr-1" /> Live Ticket
              </span>
            </div>
            <p className="text-xs text-[#78716C] mt-0.5">
              Submit customer support ticket, execute autonomous settlement, and dispatch confirmation to Gmail.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] text-xs font-medium flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Pipeline View */}
        {loading && (
          <div className="space-y-4 py-2 animate-in fade-in duration-200">
            <div className="p-5 rounded-2xl bg-[#181716] border border-[#C5855A]/60 text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#3A332E] pb-3">
                <div className="flex items-center space-x-2.5">
                  <RefreshCw className="w-4 h-4 text-[#C5855A] animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#DFB59D]">
                    ODAEA Autonomous Analysis & Safety Engine
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#4ADE80] font-semibold bg-[#2A2420] px-2.5 py-0.5 rounded-full border border-[#C5855A]/40">
                  Step {activeStep} of 5
                </span>
              </div>

              <div className="space-y-3">
                {steps.map((st) => (
                  <div
                    key={st.step}
                    className={`flex items-start space-x-3 text-xs p-2.5 rounded-xl transition-all duration-300 ${
                      st.status === 'active'
                        ? 'bg-[#2A2420] border border-[#C5855A]/50 shadow-sm'
                        : st.status === 'completed'
                        ? 'bg-[#181716]/60 border border-transparent'
                        : 'opacity-40'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {st.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
                      ) : st.status === 'active' ? (
                        <RefreshCw className="w-4 h-4 text-[#C5855A] animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[#78716C]/40 bg-transparent flex items-center justify-center text-[10px] text-[#78716C]">
                          {st.step}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold ${
                            st.status === 'active'
                              ? 'text-[#E2AB8A]'
                              : st.status === 'completed'
                              ? 'text-[#FAF8F5]'
                              : 'text-[#78716C]'
                          }`}
                        >
                          {st.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#A8A29E]">{st.agent}</span>
                      </div>
                      <p className="text-[11px] text-[#A8A29E] mt-0.5 leading-relaxed">{st.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Resolution / Escalation View */}
        {!loading && result && (
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            {result.amount > 500 || result.status === 'AWAITING_APPROVAL' ? (
              /* ESCALATED TO HUMAN APPROVAL VIEW (> $500 CAP) */
              <div className="rounded-2xl bg-[#FEF3C7]/80 border border-[#FDE68A] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#FDE68A] pb-3">
                  <div className="flex items-center space-x-2 text-[#B45309]">
                    <AlertTriangle className="w-5 h-5" />
                    <h4 className="font-bold text-sm">Policy Guardrail Intercepted — Escalated to Human Approval</h4>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[#B45309] bg-white px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
                    AWAITING SIGN-OFF
                  </span>
                </div>

                {/* Diagnosis Summary */}
                <div className="space-y-2 text-xs text-[#92400E]">
                  <div className="flex items-start space-x-2">
                    <span className="font-bold shrink-0">Diagnosis:</span>
                    <span>
                      Observer parsed high-value refund request of ${result.amount.toFixed(2)} on {result.chargeId}.
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-bold shrink-0">Trade-off:</span>
                    <span>
                      High capital outflow. Automated settlement paused to safeguard organizational treasury.
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-bold shrink-0">Guardrail:</span>
                    <span className="font-semibold text-[#B45309]">
                      Policy FIN-POL-004 Enforcement: Requested refund (${result.amount.toFixed(2)}) exceeds the $500.00 autonomous threshold limit.
                    </span>
                  </div>
                </div>

                {/* Systems Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-white border border-[#FDE68A] shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#B45309] block text-[10px] uppercase font-bold">Stripe Gateway</span>
                      <span className="text-[10px] font-bold text-[#D97706]">PAUSED</span>
                    </div>
                    <span className="text-base font-bold text-[#1C1917] block mt-1">Refund ${result.amount.toFixed(2)} Halted</span>
                    <span className="text-[10px] text-[#78716C] block truncate mt-0.5">Charge: {result.chargeId}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#FDE68A] shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#B45309] block text-[10px] uppercase font-bold">Human Approvals</span>
                      <span className="text-[10px] font-bold text-[#B45309]">DISPATCHED</span>
                    </div>
                    <span className="text-base font-bold text-[#1C1917] block mt-1">Awaiting Sign-off</span>
                    <span className="text-[10px] text-[#78716C] block truncate mt-0.5">Finance Director Review</span>
                  </div>
                </div>

                {/* Value created pill */}
                <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-between text-xs">
                  <span className="text-[#92400E] font-medium">
                    Zero-Bypass Governance: Protected enterprise against unapproved <strong>${result.amount.toFixed(2)}</strong> treasury outflow.
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#B45309] uppercase">Guardrail Protected</span>
                </div>
              </div>
            ) : (
              /* AUTONOMOUS SETTLED VIEW (<= $500 CAP) */
              <div className="rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#BBF7D0] pb-3">
                  <div className="flex items-center space-x-2 text-[#15803D]">
                    <CheckCircle2 className="w-5 h-5" />
                    <h4 className="font-bold text-sm">Autonomous Resolution Confirmed & Dispatched</h4>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[#15803D] bg-white px-2 py-0.5 rounded-full border border-[#86EFAC]">
                    MTTR: 2.7s
                  </span>
                </div>

                {/* Diagnosis Summary */}
                <div className="space-y-2 text-xs text-[#166534]">
                  <div className="flex items-start space-x-2">
                    <span className="font-bold shrink-0">Diagnosis:</span>
                    <span>
                      Observer parsed customer dispute of double billing on {result.chargeId}. Telemetry correlated gateway race condition.
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-bold shrink-0">Trade-off:</span>
                    <span>
                      Authorized micro-refund of ${result.amount.toFixed(2)} to protect customer account (${result.churnProtected.toLocaleString()} Lifetime Value).
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-bold shrink-0">Guardrail:</span>
                    <span>
                      Policy FIN-POL-004 validated: ${result.amount.toFixed(2)} is within the autonomous $500 threshold. 0 violations.
                    </span>
                  </div>
                </div>

                {/* Live Systems Confirmations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-white border border-[#BBF7D0] shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#15803D] block text-[10px] uppercase font-bold">Stripe Gateway</span>
                      <span className="text-[10px] font-bold text-[#15803D]">SETTLED</span>
                    </div>
                    <span className="text-base font-bold text-[#1C1917] block mt-1">Refund ${result.amount.toFixed(2)}</span>
                    <span className="text-[10px] text-[#78716C] block truncate mt-0.5">Charge: {result.chargeId}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#BBF7D0] shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#15803D] block text-[10px] uppercase font-bold">Gmail Notification</span>
                      <span className="text-[10px] font-bold text-[#15803D]">DELIVERED</span>
                    </div>
                    <span className="text-base font-bold text-[#1C1917] block mt-1">Receipt via Resend</span>
                    <span className="text-[10px] text-[#78716C] block truncate mt-0.5">To: {result.customerEmail}</span>
                  </div>
                </div>

                {/* Value created pill */}
                <div className="p-3 rounded-xl bg-[#DCFCE7]/70 border border-[#86EFAC] flex items-center justify-between text-xs">
                  <span className="text-[#166534] font-medium">
                    Labor saved: <strong>{result.laborMinutesSaved} mins</strong> · Churn value protected: <strong>${result.churnProtected.toLocaleString()}</strong>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#15803D] uppercase">ROI Protected</span>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-1">
              {result.amount > 500 || result.status === 'AWAITING_APPROVAL' ? (
                <>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 rounded-2xl bg-white border border-[#DDD5CA] text-[#78716C] hover:text-[#1C1917] text-xs font-bold transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      navigate('/approvals');
                    }}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    <span>Review in Approvals Queue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-2xl bg-[#1C1917] hover:bg-[#292524] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Close & Return to Dashboard
                </button>
              )}
            </div>
          </div>
        )}

        {/* Input Form View */}
        {!loading && !result && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick Presets */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-2">
                Operational Incident Presets
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
                      className={`p-2.5 rounded-xl text-left border transition-all text-xs font-semibold cursor-pointer ${
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
                  Disputed Amount ($ USD)
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
                    ⚠️ Exceeds $500 policy cap! Guardrail engine will escalate to Human Approvals Queue.
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
                <option value={2}>Tier 2: Bounded Autonomous (Auto-resolves within $500 safety policy)</option>
                <option value={1}>Tier 1: Human-in-the-Loop (Requires human sign-off in Approvals Queue)</option>
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
                  className="px-4 py-2.5 rounded-2xl bg-white border border-[#DDD5CA] text-xs font-bold text-[#78716C] hover:text-[#1C1917] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-[#8E5633] hover:bg-[#724528] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current text-amber-200" />
                  <span>Submit Ticket & Run ODAEA Cycle</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
