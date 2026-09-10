import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  ShieldAlert,
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { DashboardOverview, ODAEACycle } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { OdaeaCycleVisualizer } from '../components/odaea/OdaeaCycleVisualizer';
import { TriggerCycleModal } from '../components/odaea/TriggerCycleModal';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { autonomyTier } = useAuth();
  const { subscribe } = useWebSocket();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [activeCycle, setActiveCycle] = useState<ODAEACycle | undefined>(undefined);


  const loadData = async () => {
    try {
      const overview = await api.getDashboardOverview(autonomyTier);
      setData(overview);
      if (overview.recent_cycles && overview.recent_cycles.length > 0) {
        setActiveCycle(overview.recent_cycles[0]);
      }
    } catch (e) {
      console.error('Failed to load dashboard overview', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time events to auto-refresh data
    const unsubscribeAll = subscribe('*', () => {
      loadData();
    });

    return () => {
      unsubscribeAll();
    };
  }, [autonomyTier]);

  if (loading || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <RotateCw className="w-8 h-8 text-[#C5855A] animate-spin" />
          <p className="text-xs text-[#78716C] font-mono">Streaming operations telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Title + Trigger Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold font-display tracking-tight text-[#1C1917]">
              Operations Command Center
            </h1>
            <span className="flex items-center space-x-1 rounded-full bg-[#F5E9DF] px-3 py-0.5 text-[11px] font-semibold text-[#8E5633] border border-[#DFB59D]/60 tracking-wider uppercase">
              <Sparkles className="w-3 h-3 mr-1 text-[#C5855A]" /> Autonomous AI Core
            </span>
          </div>
          <p className="text-xs text-[#78716C] mt-1">
            Real-time closed-loop ODAEA business operations monitoring, bounded decisions, and audit verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTriggerModalOpen(true)}
            className="flex items-center space-x-2 rounded-2xl bg-[#FAF8F5] px-4 py-2.5 text-xs font-bold text-[#1C1917] shadow-sm hover:bg-white transition-all cursor-pointer border border-[#DDD5CA]"
          >
            <span>Trigger Cycle</span>
          </button>
        </div>
      </div>



      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard metric={data.kpis.business_health} icon={TrendingUp} />
        <KpiCard metric={data.kpis.active_cycles} icon={RotateCw} />
        <KpiCard metric={data.kpis.autonomous_actions} icon={Zap} />
        <KpiCard metric={data.kpis.pending_approvals} icon={Clock} />
        <KpiCard metric={data.kpis.success_rate} icon={CheckCircle2} />
        <KpiCard metric={data.kpis.guardrail_blocks} icon={ShieldAlert} />
      </div>

      {/* Prominent ODAEA Cycle Tracker */}
      <OdaeaCycleVisualizer activeCycle={activeCycle} />

      {/* Mid Section: Anomalies + Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Anomalies Panel */}
        <div className="auren-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#E2DAD0]/80">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
              <h3 className="text-sm font-bold font-display text-[#1C1917]">Detected Operational Anomalies</h3>
            </div>
            <span className="text-xs font-mono text-[#78716C] bg-[#EFECE6] px-2.5 py-0.5 rounded-full border border-[#DDD5CA]">
              {data.active_anomalies.length} Active
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {data.active_anomalies.length === 0 ? (
              <p className="text-xs text-[#78716C] py-6 text-center font-medium">No active anomalies detected in current cycle.</p>
            ) : (
              data.active_anomalies.map((anom) => (
                <div
                  key={anom.id}
                  className="rounded-2xl bg-[#FAF8F5] border border-[#E2DAD0] p-4 hover:border-[#C5855A]/50 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        anom.severity === 'CRITICAL'
                          ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]'
                          : anom.severity === 'HIGH'
                          ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                          : 'bg-[#F5E9DF] text-[#8E5633] border-[#DFB59D]'
                      }`}
                    >
                      {anom.severity}
                    </span>
                    <span className="text-[10px] font-mono text-[#78716C]">Domain: {anom.domain}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#1C1917] mt-2.5">{anom.description}</p>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#78716C] pt-2 border-t border-[#E2DAD0]/70">
                    <span>Target: <strong className="text-[#1C1917]">{anom.entity_id}</strong></span>
                    <span className="text-[#8E5633] font-medium">Rec: {anom.recommended_action}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Approvals Panel */}
        <div className="auren-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#E2DAD0]/80">
            <div className="flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-[#8E5633]" />
              <h3 className="text-sm font-bold font-display text-[#1C1917]">Pending Human-in-the-Loop Approvals</h3>
            </div>
            <Link to="/approvals" className="text-xs font-semibold text-[#8E5633] hover:underline flex items-center">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {data.pending_approvals.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto mb-2" />
                <p className="text-xs text-[#78716C]">Approval queue is clear. Autonomous operations running smoothly.</p>
              </div>
            ) : (
              data.pending_approvals.map((appr) => (
                <div
                  key={appr.id}
                  className="rounded-2xl bg-[#FAF8F5] border border-[#E2DAD0] p-4 hover:border-[#C5855A]/50 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1917]">{appr.summary}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                      {appr.risk_level} RISK
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#78716C] pt-2 border-t border-[#E2DAD0]/70">
                    <span>Cost: <strong className="text-[#1C1917]">${appr.cost_usd}</strong></span>
                    <span>Blast: <strong className="text-[#1C1917]">{appr.blast_radius_count} entities</strong></span>
                    <Link
                      to="/approvals"
                      className="px-3 py-1 rounded-xl bg-[#181716] hover:bg-[#2A2724] text-[#FAF8F5] font-bold text-xs shadow-sm transition-all"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Domain Health Matrix + Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Domain Health */}
        <div className="lg:col-span-2 auren-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#E2DAD0]/80">
            <h3 className="text-sm font-bold font-display text-[#1C1917]">Domain Health & Autonomy Performance</h3>
            <span className="text-xs text-[#78716C]">5 Operational Domains</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2DAD0] text-[#78716C] uppercase text-[10px] font-bold tracking-widest">
                  <th className="pb-3">Domain</th>
                  <th className="pb-3">Health Score</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Anomalies</th>
                  <th className="pb-3">Approvals</th>
                  <th className="pb-3">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DAD0]/60">
                {data.domain_health.map((dom) => (
                  <tr key={dom.domain} className="hover:bg-[#EFECE6]/50 transition-colors">
                    <td className="py-3.5 font-bold text-[#1C1917] capitalize">{dom.domain}</td>
                    <td className="py-3.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-[#1C1917]">{dom.health_score}</span>
                        <div className="w-16 h-2 rounded-full bg-[#EFECE6] overflow-hidden border border-[#DDD5CA]">
                          <div
                            className={`h-full rounded-full ${
                              dom.health_score >= 90 ? 'bg-[#16A34A]' : 'bg-[#D97706]'
                            }`}
                            style={{ width: `${dom.health_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          dom.status === 'HEALTHY'
                            ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                            : 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                        }`}
                      >
                        {dom.status}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-[#1C1917]">{dom.active_anomalies}</td>
                    <td className="py-3.5 font-mono text-[#1C1917]">{dom.pending_approvals}</td>
                    <td className="py-3.5 font-mono font-bold text-[#8E5633]">{dom.success_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="auren-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#E2DAD0]/80">
            <h3 className="text-sm font-bold font-display text-[#1C1917]">Live Activity Stream</h3>
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-ping" />
              <span className="text-[10px] font-mono text-[#78716C]">Streaming</span>
            </div>
          </div>

          <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
            {data.live_activity.map((act) => (
              <div key={act.id} className="text-xs p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2DAD0] shadow-sm">
                <div className="flex items-center justify-between text-[10px] text-[#78716C]">
                  <span className="font-mono text-[#8E5633] font-bold">{act.action}</span>
                  <span>{new Date(act.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-[11px] text-[#1C1917] mt-1.5 truncate">
                  Actor: <span className="text-[#78716C]">{act.actor_email}</span> • Domain: <span className="text-[#78716C] capitalize">{act.domain}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TriggerCycleModal
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
        onSuccess={(cid) => {
          loadData();
        }}
      />
    </div>
  );
};

