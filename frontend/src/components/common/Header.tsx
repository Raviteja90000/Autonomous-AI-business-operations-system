import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Radio,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Sparkles,
  Play,
  Zap,
  TrendingUp,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useSplash } from '../../context/SplashContext';
import { KillSwitchModal } from './KillSwitchModal';
import { ScenarioSimulatorModal } from './ScenarioSimulatorModal';
import { AurenLogo } from './AurenLogo';

interface HeaderProps {
  globalKillSwitchActive?: boolean;
  onRefresh?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  globalKillSwitchActive = false,
  onRefresh,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const { user, autonomyTier, setAutonomyTier, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const { triggerSplash } = useSplash();
  const [isKillModalOpen, setIsKillModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const tierLabels: Record<number, { name: string; style: string }> = {
    0: { name: 'Tier 0: Observe Only', style: 'text-[#78716C] bg-[#E8E3DA] border-[#DDD5CA]' },
    1: { name: 'Tier 1: Human Approval', style: 'text-[#B45309] bg-[#FEF3C7] border-[#FDE68A]' },
    2: { name: 'Tier 2: Bounded Autonomous', style: 'text-[#8E5633] bg-[#F5E9DF] border-[#DFB59D]' },
    3: { name: 'Tier 3: High Autonomy', style: 'text-[#181716] bg-[#EAE4DC] border-[#C5855A]' },
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full max-w-full items-center justify-between border-b border-[#E2DAD0] bg-[#FAF8F5]/90 px-3 sm:px-6 backdrop-blur-md shrink-0">
        {/* Left: Hamburger (Mobile) + Organization & System State */}
        <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0">
          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl border border-[#E2DAD0] bg-[#FAF8F5] text-[#1C1917] hover:bg-[#EFECE6] transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5 text-[#1C1917]" />
          </button>

          <div
            onClick={triggerSplash}
            title="Click to replay Auren intro animation"
            className="flex items-center space-x-2 sm:space-x-3.5 cursor-pointer group shrink-0"
          >
            {/* Official Auren Logo & Brand */}
            <AurenLogo size={34} variant="full" theme="luxury" />
            <span className="hidden 2xl:flex opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[#C5855A] font-mono items-center gap-1 bg-[#F5E9DF] px-1.5 py-0.5 rounded-md border border-[#DFB59D]/60">
              <Sparkles className="w-2.5 h-2.5" /> Replay
            </span>
          </div>

          <div className="hidden xl:flex items-center space-x-2 pl-3 border-l border-[#E2DAD0] shrink-0">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-[#16A34A] animate-pulse' : 'bg-[#DC2626]'}`} />
            <span className="text-[11px] font-medium tracking-wide text-[#78716C]">
              {isConnected ? 'Connected · Real-Time' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Right: Board Report + Simulator + Autonomy Tier + Kill Switch + User Profile */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* Executive Board Report Button */}
          <button
            onClick={() => navigate('/executive')}
            className="hidden 2xl:flex items-center space-x-1.5 rounded-xl border border-[#DFB59D] bg-[#F5E9DF] hover:bg-[#EAE0D5] px-3 py-1.5 text-xs font-bold text-[#8E5633] transition-all cursor-pointer shadow-sm hover:scale-102 shrink-0"
          >
            <TrendingUp className="h-3.5 w-3.5 text-[#8E5633]" />
            <span className="tracking-wider uppercase text-[11px]">Board Report</span>
          </button>

          {/* God Mode Simulator Trigger Button */}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            title="God Mode Simulator"
            className="flex items-center space-x-1 sm:space-x-2 rounded-xl bg-gradient-to-r from-[#181716] via-[#26221F] to-[#181716] hover:border-[#C5855A] border border-[#C5855A]/50 px-2 sm:px-3 py-1.5 text-xs font-bold text-[#E2AB8A] shadow-md shadow-[#C5855A]/15 transition-all cursor-pointer hover:scale-102 shrink-0"
          >
            <Zap className="h-3.5 w-3.5 text-[#E2AB8A] animate-pulse shrink-0" />
            <span className="hidden xl:inline tracking-wider uppercase text-[11px]">God Mode Simulator</span>
            <span className="hidden sm:inline xl:hidden tracking-wider uppercase text-[11px]">Simulator</span>
          </button>

          {/* Autonomy Tier Selector */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="hidden 2xl:inline text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
              Autonomy:
            </span>
            <select
              value={autonomyTier}
              onChange={(e) => setAutonomyTier(Number(e.target.value))}
              aria-label="Autonomy Tier"
              className={`rounded-xl border px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold focus:outline-none transition-all cursor-pointer shadow-sm max-w-[110px] sm:max-w-[140px] md:max-w-none ${
                tierLabels[autonomyTier]?.style || 'bg-[#FAF8F5] text-[#1C1917] border-[#DDD5CA]'
              }`}
            >
              <option value={0}>T0: Observe</option>
              <option value={1}>T1: Approvals</option>
              <option value={2}>T2: Autonomous</option>
              <option value={3}>T3: High Autonomy</option>
            </select>
          </div>

          {/* Kill Switch Trigger Button */}
          <button
            onClick={() => setIsKillModalOpen(true)}
            title={globalKillSwitchActive ? 'KILL SWITCH ACTIVE' : 'Emergency Kill Switch'}
            className={`flex items-center space-x-1 sm:space-x-2 rounded-xl border px-2 sm:px-3 py-1.5 text-xs font-semibold transition-all shadow-sm cursor-pointer shrink-0 ${
              globalKillSwitchActive
                ? 'bg-[#DC2626] border-[#B91C1C] text-white shadow-rose-900/30 animate-pulse'
                : 'bg-[#FAF8F5] border-[#DDD5CA] text-[#78716C] hover:bg-white hover:text-[#DC2626] hover:border-[#FCA5A5]'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-[#DC2626] shrink-0" />
            <span className="hidden lg:inline tracking-wide">
              {globalKillSwitchActive ? 'KILL SWITCH ACTIVE' : 'Kill Switch'}
            </span>
          </button>

          {/* User Menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-1.5 sm:space-x-2 rounded-xl border border-[#E2DAD0] bg-[#FAF8F5] p-1.5 sm:px-2.5 sm:py-1.5 text-xs hover:border-[#C5855A] hover:bg-white transition-all shadow-sm cursor-pointer"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#181716] text-[#E2AB8A] font-bold text-[11px] shrink-0">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden 2xl:block">
                <p className="font-semibold text-[#1C1917] leading-tight">{user?.full_name || 'Operator'}</p>
                <p className="text-[10px] text-[#8E5633] font-mono font-medium">{user?.roles?.[0] || 'ADMIN'}</p>
              </div>
              <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#78716C]" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-[#E2DAD0] bg-[#FAF8F5] py-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3.5 py-2 border-b border-[#E2DAD0]/80">
                  <p className="text-xs font-bold text-[#1C1917]">{user?.full_name}</p>
                  <p className="text-[10px] text-[#78716C] truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsSimulatorOpen(true);
                  }}
                  className="w-full flex items-center space-x-2 px-3.5 py-2 text-xs text-[#8E5633] hover:bg-[#F5E9DF]/50 transition-colors cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5 text-[#C5855A]" />
                  <span>Launch Scenario Simulator</span>
                </button>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    triggerSplash();
                  }}
                  className="w-full flex items-center space-x-2 px-3.5 py-2 text-xs text-[#8E5633] hover:bg-[#F5E9DF]/50 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Replay Intro Animation</span>
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-2 px-3.5 py-2 text-xs text-[#DC2626] hover:bg-[#FEF2F2] transition-colors rounded-b-xl cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <KillSwitchModal
        isOpen={isKillModalOpen}
        onClose={() => setIsKillModalOpen(false)}
        currentGlobalState={globalKillSwitchActive}
        onUpdated={() => {
          if (onRefresh) onRefresh();
        }}
      />

      <ScenarioSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onScenarioCompleted={() => {
          if (onRefresh) onRefresh();
          window.dispatchEvent(new CustomEvent('auren:data-refresh'));
        }}
      />
    </>
  );
};
