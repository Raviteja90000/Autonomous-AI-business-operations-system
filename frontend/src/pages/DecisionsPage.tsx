import React, { useState, useEffect } from 'react';
import { BrainCircuit, SearchCode, ShieldCheck, DollarSign, Users, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { api } from '../services/api';
import { DecisionRecord } from '../types';

export const DecisionsPage: React.FC = () => {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<DecisionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getDecisions();
        setDecisions(data);
        if (data.length > 0) {
          setSelectedDecision(data[0]);
        }
      } catch (e) {
        console.error('Failed to load decisions', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 text-[#1C1917]">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-[#1C1917]">Decision Center & AI Logic</h1>
        <p className="text-xs text-[#78716C] mt-1">
          Inspect autonomous reasoning, evidence citations, adversarial critic reviews, and risk bounds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Decisions List */}
        <div className="auren-card p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold font-display text-[#1C1917] pb-3.5 border-b border-[#E2DAD0]/80">
            Recorded AI Decisions ({decisions.length})
          </h3>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {decisions.map((dec) => (
              <div
                key={dec.id}
                onClick={() => setSelectedDecision(dec)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                  selectedDecision?.id === dec.id
                    ? 'bg-[#F5E9DF] border-[#C5855A] shadow-md'
                    : 'bg-[#FAF8F5] border-[#E2DAD0] hover:border-[#C5855A]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#8E5633] text-xs font-bold">{dec.id.substring(0, 8)}...</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      dec.risk_level === 'LOW'
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : dec.risk_level === 'MEDIUM'
                        ? 'bg-[#FEF3C7] text-[#B45309]'
                        : 'bg-[#FEF2F2] text-[#B91C1C]'
                    }`}
                  >
                    {dec.risk_level} RISK
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#1C1917] mt-2 line-clamp-2">{dec.goal}</h4>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#78716C] pt-2 border-t border-[#E2DAD0]/70">
                  <span className="capitalize">{dec.domain}</span>
                  <span className="font-bold text-[#1C1917]">Conf: {(dec.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Decision Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDecision ? (
            <div className="auren-card p-7 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2DAD0]/80">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-[#8E5633]">
                    Decision Record • {selectedDecision.domain}
                  </span>
                  <h2 className="text-lg font-bold font-display text-[#1C1917] mt-0.5">{selectedDecision.goal}</h2>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="px-3.5 py-1.5 rounded-full bg-[#EFECE6] border border-[#DDD5CA] text-xs text-[#78716C]">
                    Confidence: <strong className="text-[#8E5633]">{(selectedDecision.confidence * 100).toFixed(0)}%</strong>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-full bg-[#EFECE6] border border-[#DDD5CA] text-xs text-[#78716C]">
                    Cost: <strong className="text-[#15803D]">${selectedDecision.estimated_cost_usd}</strong>
                  </div>
                </div>
              </div>

              {/* Rationale Summary */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-2 flex items-center">
                  <BrainCircuit className="w-3.5 h-3.5 mr-1.5 text-[#8E5633]" /> Planner Reasoning Summary
                </h4>
                <div className="p-4 rounded-2xl bg-[#EFECE6]/60 border border-[#DDD5CA] text-xs text-[#1C1917] leading-relaxed font-medium">
                  {selectedDecision.rationale_summary}
                </div>
              </div>

              {/* Evidence Citing */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-2 flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1.5 text-[#8E5633]" /> Evidence Citing & Provenance
                </h4>
                <div className="space-y-2">
                  {selectedDecision.evidence && selectedDecision.evidence.length > 0 ? (
                    selectedDecision.evidence.map((ev) => (
                      <div key={ev.id} className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2DAD0] text-xs shadow-sm">
                        <div className="flex items-center justify-between text-[10px] text-[#78716C] mb-1">
                          <span className="font-mono text-[#8E5633] font-bold">{ev.source_type} ({ev.reference_id})</span>
                          <span>Weight: {(ev.confidence_contribution * 100).toFixed(0)}%</span>
                        </div>
                        <p className="text-[#1C1917] font-medium">{ev.snippet}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#78716C]">No external evidence attachments recorded.</p>
                  )}
                </div>
              </div>

              {/* Proposed Actions */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-2 flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-[#15803D]" /> Bounded Action Plan ({selectedDecision.actions?.length || 0})
                </h4>
                <div className="space-y-2.5">
                  {selectedDecision.actions?.map((act) => (
                    <div key={act.id} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DAD0] text-xs shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1C1917] text-xs font-display">{act.action_type}</span>
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#EFECE6] text-[#78716C] border border-[#DDD5CA]">
                          Target: {act.target_system}
                        </span>
                      </div>
                      <pre className="mt-2.5 p-3 rounded-xl bg-[#181716] text-[11px] font-mono text-[#FAF8F5] overflow-x-auto border border-[#35312C]">
                        {JSON.stringify(act.payload, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="auren-card p-14 text-center text-[#78716C]">
              Select a decision record on the left to inspect logic.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
