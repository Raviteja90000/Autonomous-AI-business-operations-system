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
  X,
} from 'lucide-react';
import { AurenLogo } from './AurenLogo';

interface SidebarProps {
  pendingApprovalsCount?: number;
  activeCyclesCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pendingApprovalsCount = 0,
  activeCyclesCount = 0,
  mobileOpen = false,
  onCloseMobile,
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
    <>
      {/* Mobile Backdrop Blur Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar / Off-canvas Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#E2DAD0] bg-[#FAF8F5] transition-all duration-300
          lg:static lg:z-20 lg:translate-x-0
          ${mobileOpen ? 'translate-x-0 shadow-2xl w-72' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-18' : 'lg:w-64'}
        `}
      >
        {/* Mobile Header with Logo & Close Button */}
        <div className="flex lg:hidden items-center justify-between px-4 py-4 border-b border-[#E2DAD0]">
          <AurenLogo size={32} variant="full" theme="luxury" />
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl border border-[#E2DAD0] text-[#78716C] hover:text-[#1C1917] hover:bg-[#EFECE6] transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex flex-col flex-1 py-4 lg:py-5 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#78716C]">
            {(!collapsed || mobileOpen) && 'Control Matrix'}
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
              }}
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
                    {(!collapsed || mobileOpen) && (
                      <span className="truncate tracking-tight">{item.label}</span>
                    )}
                  </div>
                  {(!collapsed || mobileOpen) && item.badge !== undefined && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Desktop Collapse Toggle */}
        <div className="hidden lg:block p-3 border-t border-[#E2DAD0]">
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
    </>
  );
};
