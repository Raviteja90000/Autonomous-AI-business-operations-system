import React, { useState, useEffect } from 'react';
import { Zap, RotateCcw, CheckCircle2, XCircle, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { ActionExecution } from '../types';

export const ActionsPage: React.FC = () => {
  const [actions, setActions] = useState<ActionExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<ActionExecution | null>(null);
  const [rollbackReason, setRollbackReason] = useState('');
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  const loadActions = async () => {
    try {
      const data = await api.getActions();
      setActions(data);
      if (data.length > 0 && !selectedAction) {
        setSelectedAction(data[0]);
      }
    } catch (e) {
      console.error('Failed to load actions', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, []);

  const handleRollback = async () => {
    if (!selectedAction) return;
    setRollingBack(true);
    try {
      await api.rollbackAction(selectedAction.id, rollbackReason || 'Manual operator rollback');
      await loadActions();
      setIsRollbackModalOpen(false);
      setRollbackReason('');
    } catch (e: any) {
      alert(`Rollback failed: ${e.message}`);
    } finally {
      setRollingBack(false);
    }
  };

  return (
    <div className="space-y-6 text-[#1C1917]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-[#1C1917]">Autonomous Action Executions</h1>
          <p className="text-xs text-[#78716C] mt-1">
            Track actuator dispatches, side effects, idempotency verification, and one-click compensations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono px-3.5 py-1 rounded-full bg-[#FAF8F5] border border-[#E2DAD0] text-[#78716C]">
            Total Actions: <strong className="text-[#8E5633]">{actions.length}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table of Actions */}
        <div className="lg:col-span-2 auren-card p-6 shadow-sm">
          <h3 className="text-sm font-bold font-display text-[#1C1917] pb-3.5 border-b border-[#E2DAD0]/80">Execution Log</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2DAD0] text-[#78716C] uppercase text-[10px] font-bold tracking-widest">
                  <th className="pb-3">Action Type</th>
                  <th className="pb-3">System</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Idempotency Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DAD0]/60">
                {actions.map((act) => (
                  <tr
                    key={act.id}
                    onClick={() => setSelectedAction(act)}
                    className={`cursor-pointer transition-colors ${
                      selectedAction?.id === act.id ? 'bg-[#F5E9DF]/60 border-l-2 border-[#C5855A]' : 'hover:bg-[#EFECE6]/50'
                    }`}
                  >
                    <td className="py-3.5 font-bold text-[#1C1917]">{act.action_type}</td>
                    <td className="py-3.5 font-mono capitalize text-[#78716C]">{act.target_system}</td>
                    <td className="py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                          act.status === 'COMPLETED'
                            ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                            : act.status === 'ROLLED_BACK'
                            ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                            : act.status === 'FAILED'
                            ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]'
                            : 'bg-[#F5E9DF] text-[#8E5633] border-[#DFB59D] animate-pulse'
                        }`}
                      >
                        {act.status}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-[11px] text-[#78716C] truncate max-w-[140px]">
                      {act.idempotency_key}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Action Details & Rollback */}
        <div className="auren-card p-6 shadow-sm space-y-4">
          {selectedAction ? (
            <>
              <div className="flex items-center justify-between pb-3.5 border-b border-[#E2DAD0]/80">
                <h3 className="text-sm font-bold font-display text-[#1C1917]">Action Detail</h3>
                <span className="font-mono text-[11px] text-[#8E5633] font-bold">{selectedAction.id.substring(0, 8)}...</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#78716C] uppercase">Action Type</span>
                <p className="text-sm font-bold text-[#1C1917] font-display">{selectedAction.action_type}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#78716C] uppercase">Target System</span>
                <p className="text-xs font-semibold text-[#1C1917] capitalize">{selectedAction.target_system}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#78716C] uppercase">Payload Parameters</span>
                <pre className="mt-1.5 p-3 rounded-xl bg-[#181716] text-[11px] font-mono text-[#FAF8F5] overflow-x-auto max-h-36 border border-[#35312C]">
                  {JSON.stringify(selectedAction.payload_summary, null, 2)}
                </pre>
              </div>

              {selectedAction.side_effects && selectedAction.side_effects.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono text-[#78716C] uppercase">Recorded Side Effects</span>
                  <div className="mt-1.5 space-y-1.5">
                    {selectedAction.side_effects.map((se) => (
                      <div key={se.id} className="p-2.5 rounded-xl bg-[#EFECE6] border border-[#DDD5CA] text-[11px]">
                        <p className="text-[#1C1917] font-bold">{se.entity_type} ({se.entity_id})</p>
                        <p className="text-[#78716C] text-[10px]">State Transition Verified</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3.5 border-t border-[#E2DAD0]/80">
                <button
                  onClick={() => setIsRollbackModalOpen(true)}
                  disabled={selectedAction.status === 'ROLLED_BACK'}
                  className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    selectedAction.status === 'ROLLED_BACK'
                      ? 'bg-[#EFECE6] text-[#A8A29E] border border-[#DDD5CA] cursor-not-allowed'
                      : 'bg-[#B45309] hover:bg-[#92400E] text-white cursor-pointer'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{selectedAction.status === 'ROLLED_BACK' ? 'Action Already Rolled Back' : 'Initiate Rollback'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-xs text-[#78716C]">
              Select an action execution from the table.
            </div>
          )}
        </div>
      </div>

      {/* Rollback Confirmation Modal */}
      {isRollbackModalOpen && selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181716]/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl border border-[#E2DAD0] bg-[#FAF8F5] p-7 shadow-2xl">
            <h3 className="text-base font-bold font-display text-[#1C1917] flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-[#B45309]" />
              <span>Confirm Action Rollback</span>
            </h3>
            <p className="text-xs text-[#78716C] mt-1">
              Rollback will attempt to revert all side-effects recorded for '{selectedAction.action_type}'.
            </p>

            <div className="mt-4">
              <label className="block text-xs text-[#1C1917] font-semibold mb-1">Reason for Rollback:</label>
              <textarea
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                rows={3}
                placeholder="Operational compensation rationale..."
                className="w-full bg-[#EFECE6] border border-[#DDD5CA] rounded-xl p-3 text-xs text-[#1C1917] focus:outline-none focus:border-[#C5855A]"
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsRollbackModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#78716C] hover:text-[#1C1917]"
              >
                Cancel
              </button>
              <button
                onClick={handleRollback}
                disabled={rollingBack}
                className="px-5 py-2.5 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-xs shadow-md"
              >
                {rollingBack ? 'Executing Rollback...' : 'Execute Rollback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
