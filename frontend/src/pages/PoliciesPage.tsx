import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, FileCode, History, Lock, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { PolicyVersion } from '../types';

export const PoliciesPage: React.FC = () => {
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [activePolicy, setActivePolicy] = useState<PolicyVersion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [vers, active] = await Promise.all([
          api.getPolicyVersions(),
          api.getActivePolicy()
        ]);
        setVersions(vers);
        setActivePolicy(active);
      } catch (e) {
        console.error('Failed to load policies', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 text-[#1C1917]">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-[#1C1917]">Governance Policies & Guardrails</h1>
        <p className="text-xs text-[#78716C] mt-1">
          Immutable versioned constraints, financial spend caps, blast radius limits, and domain permissions.
        </p>
      </div>

      {activePolicy && (
        <div className="auren-card p-7 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2DAD0]/80">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-2xl bg-[#F5E9DF] border border-[#DFB59D] text-[#8E5633]">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h2 className="text-base font-bold font-display text-[#1C1917]">{activePolicy.name}</h2>
                  <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-bold text-[#15803D] border border-[#86EFAC]">
                    ACTIVE {activePolicy.version_number}
                  </span>
                </div>
                <p className="text-xs text-[#78716C] mt-0.5">{activePolicy.description}</p>
              </div>
            </div>

            <div className="text-right text-xs font-mono text-[#78716C]">
              Approved by: <strong className="text-[#1C1917]">{activePolicy.approved_by || 'Executive Committee'}</strong>
            </div>
          </div>

          {/* Key Limits Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#EFECE6] border border-[#DDD5CA] text-xs shadow-sm">
              <span className="text-[10px] text-[#78716C] uppercase font-bold tracking-widest block">Max Autonomous Spend</span>
              <strong className="text-sm font-bold font-display text-[#15803D] mt-1 block">
                ${activePolicy.rules_json?.global_limits?.max_autonomous_spend_per_action_usd || '500.00'}
              </strong>
            </div>
            <div className="p-4 rounded-2xl bg-[#EFECE6] border border-[#DDD5CA] text-xs shadow-sm">
              <span className="text-[10px] text-[#78716C] uppercase font-bold tracking-widest block">Max Blast Radius</span>
              <strong className="text-sm font-bold font-display text-[#8E5633] mt-1 block">
                {activePolicy.rules_json?.global_limits?.max_blast_radius_entities || 10} Entities
              </strong>
            </div>
            <div className="p-4 rounded-2xl bg-[#EFECE6] border border-[#DDD5CA] text-xs shadow-sm">
              <span className="text-[10px] text-[#78716C] uppercase font-bold tracking-widest block">Min Confidence</span>
              <strong className="text-sm font-bold font-display text-[#1C1917] mt-1 block">
                {((activePolicy.rules_json?.global_limits?.min_confidence_threshold || 0.85) * 100).toFixed(0)}%
              </strong>
            </div>
            <div className="p-4 rounded-2xl bg-[#EFECE6] border border-[#DDD5CA] text-xs shadow-sm">
              <span className="text-[10px] text-[#78716C] uppercase font-bold tracking-widest block">Irreversible Actions</span>
              <strong className="text-sm font-bold font-display text-[#B45309] mt-1 block">Approval Required</strong>
            </div>
          </div>

          {/* YAML Rules Code Block */}
          <div>
            <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-widest block mb-2">
              Active Policy Specification (YAML)
            </span>
            <pre className="p-4 rounded-2xl bg-[#181716] border border-[#35312C] text-xs font-mono text-[#E2AB8A] overflow-x-auto leading-relaxed max-h-72">
              {activePolicy.rules_yaml}
            </pre>
          </div>
        </div>
      )}

      {/* Version History Table */}
      <div className="auren-card p-6 shadow-sm">
        <h3 className="text-sm font-bold font-display text-[#1C1917] pb-3.5 border-b border-[#E2DAD0]/80 flex items-center space-x-2">
          <History className="w-4 h-4 text-[#8E5633]" />
          <span>Policy Versioning & Audit History</span>
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2DAD0] text-[#78716C] uppercase text-[10px] font-bold tracking-widest">
                <th className="pb-3">Version</th>
                <th className="pb-3">Name</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Author</th>
                <th className="pb-3">Effective Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DAD0]/60">
              {versions.map((v) => (
                <tr key={v.id} className="hover:bg-[#EFECE6]/50 transition-colors">
                  <td className="py-3.5 font-mono font-bold text-[#8E5633]">{v.version_number}</td>
                  <td className="py-3.5 font-semibold text-[#1C1917]">{v.name}</td>
                  <td className="py-3.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        v.is_active
                          ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                          : 'bg-[#EFECE6] text-[#78716C] border-[#DDD5CA]'
                      }`}
                    >
                      {v.is_active ? 'ACTIVE' : 'HISTORICAL'}
                    </span>
                  </td>
                  <td className="py-3.5 text-[#78716C]">{v.author}</td>
                  <td className="py-3.5 text-[#78716C]">{new Date(v.effective_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
