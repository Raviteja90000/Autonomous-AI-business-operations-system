import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Check, 
  RotateCcw,
  Sliders
} from 'lucide-react';
import { api } from '../services/api';
import { EvaluationReport, PolicyUpdate } from '../types';

export const EvaluationsPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<EvaluationReport[]>([]);
  const [policyUpdates, setPolicyUpdates] = useState<PolicyUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PROPOSED' | 'ACCEPTED' | 'DISMISSED'>('ALL');
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [evs, updates] = await Promise.all([
        api.getEvaluations(),
        api.getPolicyUpdates(true)
      ]);
      setEvaluations(evs);
      setPolicyUpdates(updates);
    } catch (e) {
      console.error('Failed to load evaluations', e);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Deduplicate proposals client-side as well, keeping consensus count
  const deduplicatedUpdates = useMemo(() => {
    const countsMap = new Map<string, number>();
    const uniqueMap = new Map<string, PolicyUpdate>();

    policyUpdates.forEach((upd) => {
      const changesStr = JSON.stringify(upd.proposed_changes || {});
      const dedupKey = `${(upd.rationale || '').trim()}::${changesStr}`;
      
      const count = upd.occurrence_count || 1;
      countsMap.set(dedupKey, (countsMap.get(dedupKey) || 0) + (upd.occurrence_count ? 1 : 1));

      if (!uniqueMap.has(dedupKey)) {
        uniqueMap.set(dedupKey, { ...upd });
      } else {
        // If one is already ACCEPTED or DISMISSED, preserve the active decision status
        const existing = uniqueMap.get(dedupKey)!;
        if (existing.status === 'PROPOSED' && upd.status !== 'PROPOSED') {
          uniqueMap.set(dedupKey, { ...upd });
        }
      }
    });

    return Array.from(uniqueMap.values()).map((upd) => {
      const changesStr = JSON.stringify(upd.proposed_changes || {});
      const dedupKey = `${(upd.rationale || '').trim()}::${changesStr}`;
      const totalOccurrences = upd.occurrence_count && upd.occurrence_count > 1 
        ? upd.occurrence_count 
        : (countsMap.get(dedupKey) || 1);
      return {
        ...upd,
        occurrence_count: totalOccurrences
      };
    });
  }, [policyUpdates]);

  // Filtered proposals by status tab
  const filteredUpdates = useMemo(() => {
    if (statusFilter === 'ALL') return deduplicatedUpdates;
    if (statusFilter === 'DISMISSED') {
      return deduplicatedUpdates.filter((u) => u.status === 'DISMISSED' || u.status === 'REJECTED');
    }
    return deduplicatedUpdates.filter((u) => u.status === statusFilter);
  }, [deduplicatedUpdates, statusFilter]);

  // Total signal occurrences across all unique recommendations
  const totalSignalCount = useMemo(() => {
    return deduplicatedUpdates.reduce((sum, u) => sum + (u.occurrence_count || 1), 0);
  }, [deduplicatedUpdates]);

  const countsByStatus = useMemo(() => {
    const pending = deduplicatedUpdates.filter((u) => u.status === 'PROPOSED').length;
    const accepted = deduplicatedUpdates.filter((u) => u.status === 'ACCEPTED').length;
    const dismissed = deduplicatedUpdates.filter((u) => u.status === 'DISMISSED' || u.status === 'REJECTED').length;
    return { all: deduplicatedUpdates.length, pending, accepted, dismissed };
  }, [deduplicatedUpdates]);

  const handleDecide = async (updateId: string, action: 'ACCEPT' | 'DISMISS') => {
    setActionLoading((prev) => ({ ...prev, [updateId]: true }));
    try {
      const updated = await api.decidePolicyUpdate(updateId, action);
      
      // Update local state for all matching duplicates
      setPolicyUpdates((prev) => {
        const target = prev.find((u) => u.id === updateId);
        const targetChangesStr = JSON.stringify(target?.proposed_changes || {});
        const targetRationale = (target?.rationale || '').trim();

        return prev.map((item) => {
          const itemChangesStr = JSON.stringify(item.proposed_changes || {});
          const itemRationale = (item.rationale || '').trim();
          if (item.id === updateId || (itemRationale === targetRationale && itemChangesStr === targetChangesStr)) {
            return { ...item, status: updated.status };
          }
          return item;
        });
      });

      if (action === 'ACCEPT') {
        setFeedbackToast({
          message: 'Policy Accepted! The recommended parameters were applied to your active governance policy.',
          type: 'success'
        });
      } else {
        setFeedbackToast({
          message: 'Recommendation dismissed from active governance consideration.',
          type: 'info'
        });
      }

      setTimeout(() => setFeedbackToast(null), 5000);
    } catch (e: any) {
      console.error('Failed to decide policy update', e);
      setFeedbackToast({
        message: e.message || 'Failed to update policy recommendation.',
        type: 'info'
      });
      setTimeout(() => setFeedbackToast(null), 5000);
    } finally {
      setActionLoading((prev) => ({ ...prev, [updateId]: false }));
    }
  };

  return (
    <div className="space-y-6 text-[#1C1917]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-[#1C1917]">Evaluations & Adaptation Engine</h1>
          <p className="text-xs text-[#78716C] mt-1">
            Empirical before-and-after metric verification, goal validation, and continuous policy tuning.
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="self-start sm:self-auto inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white border border-[#E2DAD0] text-xs font-semibold text-[#8E5633] hover:bg-[#FAF8F5] transition-all shadow-sm disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Refresh Engine'}</span>
        </button>
      </div>

      {/* Interactive Action Toast Notification */}
      {feedbackToast && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
          feedbackToast.type === 'success'
            ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]'
            : 'bg-[#EFECE6] border-[#DDD5CA] text-[#1C1917]'
        }`}>
          <div className="flex items-center space-x-2.5">
            {feedbackToast.type === 'success' ? (
              <ShieldCheck className="w-5 h-5 text-[#15803D] shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-[#8E5633] shrink-0" />
            )}
            <span className="text-xs font-medium">{feedbackToast.message}</span>
          </div>
          {feedbackToast.type === 'success' && (
            <Link
              to="/policies"
              className="text-xs font-bold underline ml-4 shrink-0 hover:text-[#166534] flex items-center gap-1"
            >
              View Active Policies <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* Evaluations List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold font-display text-[#1C1917] flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-[#8E5633]" />
          <span>Completed Outcome Evaluations ({evaluations.length})</span>
        </h3>

        {evaluations.length === 0 ? (
          <div className="auren-card p-12 text-center text-[#78716C] shadow-sm">
            No evaluation reports recorded yet. Trigger an ODAEA cycle to generate empirical before/after metrics.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {evaluations.map((ev) => (
              <div
                key={ev.id}
                className="auren-card p-6 shadow-sm space-y-4 hover:border-[#C5855A]/50 transition-all"
              >
                <div className="flex items-center justify-between pb-3.5 border-b border-[#E2DAD0]/80">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#8E5633] font-bold">Domain: {ev.domain}</span>
                    <h4 className="text-sm font-bold font-display text-[#1C1917] mt-0.5">Evaluation #{ev.id.substring(0, 8)}</h4>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                      ev.actual_outcome === 'POSITIVE'
                        ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                        : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]'
                    }`}
                  >
                    {ev.actual_outcome} OUTCOME
                  </span>
                </div>

                {/* Metric Delta Visualizer */}
                <div className="rounded-2xl bg-[#EFECE6]/60 p-4 border border-[#DDD5CA] space-y-2">
                  <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-widest">
                    Observed Metric Deltas
                  </span>
                  <div className="grid grid-cols-2 gap-3 mt-1 text-xs">
                    {Object.entries(ev.metric_deltas || {}).map(([key, delta]: [string, any]) => (
                      <div key={key} className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E2DAD0] shadow-sm">
                        <span className="text-[10px] text-[#78716C] block truncate capitalize font-medium">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="font-mono text-[#78716C] text-xs">
                            {delta.before} → <strong className="text-[#1C1917]">{delta.after}</strong>
                          </span>
                          <span className="font-mono font-bold text-[#15803D] text-xs">{delta.delta}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-[#1C1917]">
                  <strong className="text-[#78716C] font-bold block text-[10px] uppercase tracking-widest mb-1">
                    Adaptation Notes:
                  </strong>
                  <p className="bg-[#EFECE6]/60 p-3 rounded-xl border border-[#DDD5CA] text-[11px] text-[#1C1917]">
                    {ev.adaptation_notes || 'Action verified within target SLA thresholds.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adapter Policy Updates (Deduplicated & Interactive) */}
      <div className="auren-card p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2DAD0]/80">
          <div>
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-[#8E5633]" />
              <h3 className="text-sm font-bold font-display text-[#1C1917]">
                Adapter Proposed Governance Updates
              </h3>
              <span className="rounded-full bg-[#F5E9DF] text-[#8E5633] px-2.5 py-0.5 text-xs font-bold font-mono border border-[#DFB59D]">
                {deduplicatedUpdates.length} Unique
              </span>
            </div>
            <p className="text-[11px] text-[#78716C] mt-0.5">
              Consolidated from {totalSignalCount} continuous cycle adaptation signals. Identical recommendations are deduplicated.
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1.5 bg-[#EFECE6] p-1 rounded-xl border border-[#DDD5CA] text-[11px] font-semibold self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white text-[#1C1917] shadow-sm font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              All ({countsByStatus.all})
            </button>
            <button
              onClick={() => setStatusFilter('PROPOSED')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'PROPOSED'
                  ? 'bg-white text-[#92400E] shadow-sm font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Pending ({countsByStatus.pending})
            </button>
            <button
              onClick={() => setStatusFilter('ACCEPTED')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'ACCEPTED'
                  ? 'bg-white text-[#15803D] shadow-sm font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Applied ({countsByStatus.accepted})
            </button>
            <button
              onClick={() => setStatusFilter('DISMISSED')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'DISMISSED'
                  ? 'bg-white text-[#B91C1C] shadow-sm font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Dismissed ({countsByStatus.dismissed})
            </button>
          </div>
        </div>

        {filteredUpdates.length === 0 ? (
          <div className="p-8 text-center text-[#78716C] text-xs bg-[#FAF8F5] rounded-2xl border border-[#E2DAD0]">
            No governance proposals found for the selected filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUpdates.map((upd) => {
              const isPending = upd.status === 'PROPOSED';
              const isAccepted = upd.status === 'ACCEPTED';
              const isDismissed = upd.status === 'DISMISSED' || upd.status === 'REJECTED';
              const isLoading = actionLoading[upd.id] || false;
              const changes = upd.proposed_changes || {};

              return (
                <div
                  key={upd.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3.5 shadow-sm ${
                    isAccepted
                      ? 'bg-[#F4FAF6] border-[#A7F3D0]'
                      : isDismissed
                      ? 'bg-[#FAF8F5] border-[#E2DAD0] opacity-80'
                      : 'bg-[#FAF8F5] border-[#E2DAD0] hover:border-[#DFB59D]'
                  }`}
                >
                  {/* Proposal Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[#8E5633] font-bold text-xs">
                        Proposed by Adapter Agent
                      </span>
                      {changes.domain && (
                        <span className="px-2 py-0.5 rounded-full bg-[#EFECE6] text-[#78716C] font-mono text-[10px] uppercase font-bold border border-[#DDD5CA]">
                          Domain: {changes.domain}
                        </span>
                      )}
                      {(upd.occurrence_count || 1) > 1 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F5E9DF] text-[#8E5633] font-mono text-[10px] font-bold border border-[#DFB59D] flex items-center gap-1">
                          <Layers className="w-3 h-3 text-[#8E5633]" />
                          Consensus: {upd.occurrence_count} cycles
                        </span>
                      )}
                    </div>

                    {/* Status Pill */}
                    <div>
                      {isPending && (
                        <span className="px-3 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] font-mono text-[10px] font-bold border border-[#FCD34D]">
                          PENDING REVIEW
                        </span>
                      )}
                      {isAccepted && (
                        <span className="px-3 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] font-mono text-[10px] font-bold border border-[#86EFAC] flex items-center gap-1">
                          <Check className="w-3 h-3 text-[#15803D]" />
                          ACTIVE & APPLIED
                        </span>
                      )}
                      {isDismissed && (
                        <span className="px-3 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] font-mono text-[10px] font-bold border border-[#FCA5A5]">
                          DISMISSED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rationale */}
                  <p className="text-[#1C1917] font-semibold text-xs leading-relaxed">
                    {upd.rationale}
                  </p>

                  {/* Proposed Policy Delta Breakdown */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      {changes.action && (
                        <span className="p-1.5 px-2.5 rounded-xl bg-[#EFECE6] border border-[#DDD5CA] font-mono text-[#1C1917]">
                          Action: <strong className="text-[#8E5633]">{changes.action}</strong>
                        </span>
                      )}
                      {changes.confidence_prior_delta && (
                        <span className="p-1.5 px-2.5 rounded-xl bg-[#EFECE6] border border-[#DDD5CA] font-mono text-[#1C1917]">
                          Prior Delta: <strong className="text-[#15803D]">{changes.confidence_prior_delta}</strong>
                        </span>
                      )}
                      {changes.recommended_tier && (
                        <span className="p-1.5 px-2.5 rounded-xl bg-[#EFECE6] border border-[#DDD5CA] font-mono text-[#1C1917]">
                          Target Tier: <strong className="text-[#8E5633]">Tier {changes.recommended_tier}</strong>
                        </span>
                      )}
                    </div>

                    <pre className="p-3 rounded-xl bg-[#181716] font-mono text-[11px] text-[#FAF8F5] overflow-x-auto border border-[#35312C]">
                      {JSON.stringify(upd.proposed_changes, null, 2)}
                    </pre>
                  </div>

                  {/* Action Bar (Approve / Reject / Applied status) */}
                  <div className="pt-2 border-t border-[#E2DAD0]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-[11px] text-[#78716C]">
                      {isAccepted ? (
                        <span className="text-[#15803D] font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Applied to active governance policies. Guardrails and ODAEA cycles now respect this tuning.
                        </span>
                      ) : isDismissed ? (
                        <span className="text-[#78716C]">
                          Recommendation was dismissed. You can reinstate and apply it at any time.
                        </span>
                      ) : (
                        <span>
                          Applying this change immediately updates active policy constraints and logs an immutable audit event.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2.5 self-end sm:self-auto">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleDecide(upd.id, 'DISMISS')}
                            disabled={isLoading}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#FEF2F2] text-[#78716C] hover:text-[#B91C1C] border border-[#E2DAD0] hover:border-[#FCA5A5] transition-all flex items-center space-x-1.5 disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Dismiss</span>
                          </button>

                          <button
                            onClick={() => handleDecide(upd.id, 'ACCEPT')}
                            disabled={isLoading}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#15803D] hover:bg-[#166534] text-white shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center space-x-1.5 disabled:opacity-50"
                          >
                            {isLoading ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Accept Policy</span>
                          </button>
                        </>
                      )}

                      {isAccepted && (
                        <Link
                          to="/policies"
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#FAF8F5] text-[#8E5633] border border-[#DFB59D] transition-all flex items-center space-x-1.5 shadow-sm"
                        >
                          <Sliders className="w-3.5 h-3.5 text-[#8E5633]" />
                          <span>View Governance Policies</span>
                          <ArrowRight className="w-3 h-3 text-[#8E5633]" />
                        </Link>
                      )}

                      {isDismissed && (
                        <button
                          onClick={() => handleDecide(upd.id, 'ACCEPT')}
                          disabled={isLoading}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#F4FAF6] text-[#15803D] border border-[#86EFAC] transition-all flex items-center space-x-1.5 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          <span>Reconsider & Accept</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

