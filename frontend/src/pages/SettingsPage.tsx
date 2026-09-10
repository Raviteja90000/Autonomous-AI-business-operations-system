import React, { useState, useEffect } from 'react';
import { Sliders, Shield, Cpu, Lock, UserCheck, Key } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { autonomyTier, setAutonomyTier, user } = useAuth();
  const [settingsData, setSettingsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const s = await api.getSettings();
        setSettingsData(s);
      } catch (e) {
        console.error('Failed to load settings', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 text-[#1C1917]">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-[#1C1917]">System Settings & Governance</h1>
        <p className="text-xs text-[#78716C] mt-1">
          Configure default autonomy tiers, spend caps, LLM models, and identity permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Autonomy & Guardrails Configuration */}
        <div className="auren-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold font-display text-[#1C1917] flex items-center space-x-2 pb-3.5 border-b border-[#E2DAD0]/80">
            <Shield className="w-4 h-4 text-[#8E5633]" />
            <span>Autonomy Controls & Guardrails</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[#78716C] font-semibold mb-1.5">Active Autonomy Tier</label>
              <select
                value={autonomyTier}
                onChange={(e) => setAutonomyTier(Number(e.target.value))}
                className="w-full bg-[#EFECE6] border border-[#DDD5CA] rounded-xl p-2.5 text-[#1C1917] focus:outline-none focus:border-[#C5855A] font-semibold"
              >
                <option value={0}>Tier 0: Observe Only</option>
                <option value={1}>Tier 1: Human-in-the-Loop (Full approval required)</option>
                <option value={2}>Tier 2: Bounded Autonomous (Low risk auto)</option>
                <option value={3}>Tier 3: Scoped High Autonomy</option>
              </select>
            </div>

            <div className="flex justify-between py-2.5 border-b border-[#E2DAD0]/70">
              <span className="text-[#78716C]">Max Spend Per Action:</span>
              <strong className="text-[#15803D] font-mono font-bold">${settingsData?.max_autonomous_spend_usd || '500.00'}</strong>
            </div>

            <div className="flex justify-between py-2.5 border-b border-[#E2DAD0]/70">
              <span className="text-[#78716C]">Max Blast Radius:</span>
              <strong className="text-[#1C1917] font-mono">{settingsData?.max_blast_radius_entities || 10} Entities</strong>
            </div>

            <div className="flex justify-between py-2.5 border-b border-[#E2DAD0]/70">
              <span className="text-[#78716C]">Min Confidence Threshold:</span>
              <strong className="text-[#8E5633] font-mono font-bold">{((settingsData?.min_confidence_threshold || 0.85) * 100).toFixed(0)}%</strong>
            </div>
          </div>
        </div>

        {/* AI Model Routing Configuration */}
        <div className="auren-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold font-display text-[#1C1917] flex items-center space-x-2 pb-3.5 border-b border-[#E2DAD0]/80">
            <Cpu className="w-4 h-4 text-[#8E5633]" />
            <span>AI Model Provider Gateway</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2.5 border-b border-[#E2DAD0]/70">
              <span className="text-[#78716C]">Active Provider:</span>
              <span className="font-mono text-[#8E5633] font-bold uppercase">{settingsData?.model_provider || 'MOCK'}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-[#E2DAD0]/70">
              <span className="text-[#78716C]">Observer Model:</span>
              <span className="font-mono text-[#1C1917]">mock-fast-v1 (Lightweight)</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-[#E2DAD0]/70">
              <span className="text-[#78716C]">Planner & Critic Models:</span>
              <span className="font-mono text-[#1C1917]">mock-reasoning-v1 (Strong Reasoning)</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-[#E2DAD0]/70">
              <span className="text-[#78716C]">Evaluator & Adapter:</span>
              <span className="font-mono text-[#1C1917]">mock-eval-v1</span>
            </div>
          </div>
        </div>

        {/* User Identity & RBAC Info */}
        <div className="auren-card p-6 shadow-sm space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold font-display text-[#1C1917] flex items-center space-x-2 pb-3.5 border-b border-[#E2DAD0]/80">
            <UserCheck className="w-4 h-4 text-[#15803D]" />
            <span>Current Authenticated Identity & Permissions</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[#78716C] text-[10px] uppercase font-bold tracking-widest block">Name</span>
              <strong className="text-[#1C1917] text-sm font-display">{user?.full_name}</strong>
            </div>
            <div>
              <span className="text-[#78716C] text-[10px] uppercase font-bold tracking-widest block">Email</span>
              <strong className="text-[#1C1917] text-sm font-mono">{user?.email}</strong>
            </div>
            <div>
              <span className="text-[#78716C] text-[10px] uppercase font-bold tracking-widest block">Assigned Roles</span>
              <div className="flex gap-1.5 mt-1.5">
                {user?.roles.map((r) => (
                  <span key={r} className="px-2.5 py-0.5 rounded-full bg-[#F5E9DF] text-[#8E5633] font-mono text-[10px] font-bold border border-[#DFB59D]">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
