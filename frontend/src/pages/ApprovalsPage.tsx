import React, { useState, useEffect } from 'react';
import { CheckSquare, ShieldCheck, XCircle, AlertTriangle, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { ApprovalRequest } from '../types';

export const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadApprovals = async () => {
    try {
      const data = await api.getApprovals();
      setApprovals(data);
    } catch (e) {
      console.error('Failed to load approvals', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleDecision = async (id: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES') => {
    setProcessingId(id);
    try {
      await api.decideApproval(id, action, actionNotes[id] || 'Operator decision confirmed via UI');
      await loadApprovals();
    } catch (e: any) {
      alert(`Error processing approval: ${e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 text-[#1C1917]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-[#1C1917]">Human-in-the-Loop Approvals</h1>
          <p className="text-xs text-[#78716C] mt-1">
            Review, validate, or reject autonomous action proposals escalated by deterministic guardrails.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] text-xs font-bold font-mono">
            {approvals.length} PENDING IN QUEUE
          </span>
        </div>
      </div>

      {approvals.length === 0 ? (
        <div className="auren-card p-16 text-center shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-[#16A34A] mx-auto mb-3" />
          <h3 className="text-base font-bold font-display text-[#1C1917]">Approval Queue is Empty</h3>
          <p className="text-xs text-[#78716C] mt-1 max-w-md mx-auto">
            All autonomous proposals within normal bounds have been processed. Escalated actions will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {approvals.map((req) => (
            <div
              key={req.id}
              className="auren-card p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#E2DAD0]/80">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309]">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#8E5633] uppercase tracking-wider font-semibold">
                      Approval Request • {req.domain}
                    </span>
                    <h3 className="text-base font-bold text-[#1C1917] mt-0.5 font-display">{req.summary}</h3>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                      req.risk_level === 'CRITICAL'
                        ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]'
                        : req.risk_level === 'HIGH'
                        ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                        : 'bg-[#F5E9DF] text-[#8E5633] border-[#DFB59D]'
                    }`}
                  >
                    {req.risk_level} RISK
                  </span>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#EFECE6] border border-[#DDD5CA] text-[#1C1917]">
                    Cost: <strong className="text-[#15803D]">${req.cost_usd}</strong>
                  </span>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#EFECE6] border border-[#DDD5CA] text-[#1C1917]">
                    Blast: <strong className="text-[#1C1917]">{req.blast_radius_count} entities</strong>
                  </span>
                </div>
              </div>

              {/* Notes Input & Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Add audit rationale note (optional)..."
                    value={actionNotes[req.id] || ''}
                    onChange={(e) => setActionNotes({ ...actionNotes, [req.id]: e.target.value })}
                    className="w-full bg-[#EFECE6] border border-[#DDD5CA] rounded-xl px-3.5 py-2 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#C5855A]"
                  />
                </div>

                <div className="flex items-center space-x-2.5 shrink-0">
                  <button
                    onClick={() => handleDecision(req.id, 'REJECT')}
                    disabled={processingId === req.id}
                    className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2] transition-all cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleDecision(req.id, 'REQUEST_CHANGES')}
                    disabled={processingId === req.id}
                    className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-[#FDE68A] bg-[#FEF3C7] text-[#B45309] hover:bg-[#FDE68A] transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Request Changes</span>
                  </button>

                  <button
                    onClick={() => handleDecision(req.id, 'APPROVE')}
                    disabled={processingId === req.id}
                    className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-[#181716] hover:bg-[#2A2724] text-[#FAF8F5] shadow-md transition-all cursor-pointer border border-[#35312C]"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#E2AB8A]" />
                    <span>{processingId === req.id ? 'Resuming...' : 'Approve & Execute'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
