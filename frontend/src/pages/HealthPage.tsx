import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, ShieldAlert, Cpu, RefreshCw, Server, Zap } from 'lucide-react';
import { api } from '../services/api';
import { HealthResponse } from '../types';

export const HealthPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [settingsData, setSettingsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadHealth = async () => {
    try {
      const [h, s] = await Promise.all([
        api.getHealth(),
        api.getSettings()
      ]);
      setHealth(h);
      setSettingsData(s);
    } catch (e) {
      console.error('Failed to load health', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleDomainSwitch = async (domain: string, currentState: boolean) => {
    setToggling(domain);
    try {
      await api.toggleKillSwitch('DOMAIN', !currentState, domain);
      await loadHealth();
    } catch (e: any) {
      alert(`Error toggling domain kill switch: ${e.message}`);
    } finally {
      setToggling(null);
    }
  };

  if (loading || !health) {
    return <div className="text-center py-12 text-[#78716C]">Loading system telemetry...</div>;
  }

  return (
    <div className="space-y-6 text-[#1C1917]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-[#1C1917]">System Health & Observability</h1>
          <p className="text-xs text-[#78716C] mt-1">
            Real-time infrastructure health matrix, component latencies, and granular safety controls.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3.5 py-1.5 rounded-full bg-[#FAF8F5] border border-[#E2DAD0] text-[#78716C] font-mono shadow-sm">
            Uptime: <strong className="text-[#8E5633]">{(health.uptime_seconds / 3600).toFixed(1)}h</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D] font-bold shadow-sm">
            STATUS: {health.status}
          </div>
        </div>
      </div>

      {/* Component Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {health.components.map((comp) => (
          <div
            key={comp.name}
            className="auren-card p-6 shadow-sm space-y-3 hover:border-[#C5855A]/50 transition-all"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E2DAD0]/80">
              <span className="text-xs font-bold font-display text-[#1C1917] truncate max-w-[200px]">{comp.name}</span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  comp.status === 'HEALTHY'
                    ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                    : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]'
                }`}
              >
                {comp.status}
              </span>
            </div>

            <p className="text-xs text-[#78716C] font-medium">{comp.message}</p>

            <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-[#78716C] border-t border-[#E2DAD0]/70">
              <span>Latency: <strong className="text-[#8E5633]">{comp.latency_ms}ms</strong></span>
              <span className="text-[#15803D] font-semibold">Operational</span>
            </div>
          </div>
        ))}
      </div>

      {/* Granular Domain Kill Switches */}
      <div className="auren-card p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold font-display text-[#1C1917] flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-[#B91C1C]" />
          <span>Per-Domain Autonomous Kill Switches</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {['sales', 'finance', 'support', 'marketing', 'operations'].map((dom) => {
            const isActive = settingsData?.kill_switch_state?.domains?.[dom] || false;
            return (
              <div key={dom} className="p-4 rounded-2xl bg-[#EFECE6] border border-[#DDD5CA] space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="capitalize font-bold text-xs text-[#1C1917]">{dom}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isActive ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-[#DCFCE7] text-[#15803D]'
                    }`}
                  >
                    {isActive ? 'HALTED' : 'ACTIVE'}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleDomainSwitch(dom, isActive)}
                  disabled={toggling === dom}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isActive
                      ? 'bg-[#15803D] hover:bg-[#166534] text-white shadow-sm'
                      : 'bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]'
                  }`}
                >
                  {isActive ? 'Release Switch' : 'Halt Domain'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
