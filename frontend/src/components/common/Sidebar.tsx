import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  RotateCw,
  BrainCircuit,
  CheckSquare,
  Zap,
  BarChart3,
  Bot,
  Database,
  Shield,
  Layers,
  ScrollText,
  Activity,
  Sliders,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  pendingApprovalsCount?: number;
  activeCyclesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pendingApprovalsCount = 0,
  activeCyclesCount = 0,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { to: '/', label: 'Command Center', icon: LayoutDashboard, exact: true },
    { to: '/executive', label: 'Executive Impact', icon: TrendingUp },
    { to: '/cycles', label: 'ODAEA Cycles', icon: RotateCw, badge: activeCyclesCount > 0 ? activeCyclesCount : undefined, badgeColor: 'bg-[#F5E9DF] text-[#8E5633] border border-[#DFB59D]' },
    { to: '/decisions', label: 'Decisions & Logic', icon: BrainCircuit },
    { to: '/approvals', label: 'Approvals Queue', icon: CheckSquare, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined, badgeColor: 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] animate-pulse' },
    { to: '/actions', label: 'Autonomous Actions', icon: Zap },
    { to: '/evaluations', label: 'Evaluations & Adapt', icon: BarChart3 },
    { to: '/agents', label: 'Agents & Models', icon: Bot },
    { to: '/memory', label: 'Memory & Knowledge', icon: Database },
    { to: '/policies', label: 'Policies & Guardrails', icon: Shield },
    { to: '/integrations', label: 'Integrations', icon: Layers },
    { to: '/audit', label: 'Audit Trail', icon: ScrollText },
    { to: '/health', label: 'System Health', icon: Activity },
    { to: '/settings', label: 'Settings & Config', icon: Sliders },
  ];


  return (
    <aside
      className={`relative flex flex-col border-r border-[#E2DAD0] bg-[#FAF8F5] transition-all duration-300 z-20 shadow-sm ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      <div className="flex flex-col flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#78716C]">
          {!collapsed && 'Control Matrix'}
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#181716] text-[#FAF8F5] shadow-md'
                  : 'text-[#78716C] hover:bg-[#EFECE6] hover:text-[#1C1917]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center space-x-3 truncate">
                  <item.icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#E2AB8A]' : 'text-[#78716C] group-hover:text-[#1C1917]'
                    }`}
                  />
                  {!collapsed && <span className="truncate tracking-tight">{item.label}</span>}
                </div>
                {!collapsed && item.badge !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-[#E2DAD0]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-xl border border-[#E2DAD0] bg-[#FAF8F5] p-2 text-[#78716C] hover:bg-[#EFECE6] hover:text-[#1C1917] hover:border-[#C5855A]/50 transition-all shadow-sm"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="flex items-center space-x-2 text-xs font-semibold">
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
