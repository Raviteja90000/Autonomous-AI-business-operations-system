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
}

export const Header: React.FC<HeaderProps> = ({ globalKillSwitchActive = false, onRefresh }) => {
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
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E2DAD0] bg-[#FAF8F5]/90 px-6 backdrop-blur-md">
        {/* Left: Organization & System State */}
        <div className="flex items-center space-x-6">
          <div
            onClick={triggerSplash}
            title="Click to replay Auren intro animation"
            className="flex items-center space-x-3.5 cursor-pointer group"
          >
            {/* Official Auren Logo & Brand */}
            <AurenLogo size={38} variant="full" theme="luxury" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[#C5855A] font-mono flex items-center gap-1 bg-[#F5E9DF] px-1.5 py-0.5 rounded-md border border-[#DFB59D]/60">
              <Sparkles className="w-2.5 h-2.5" /> Replay
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-[#E2DAD0]">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-[#16A34A] animate-pulse' : 'bg-[#DC2626]'}`} />
            <span className="text-[11px] font-medium tracking-wide text-[#78716C]">
              {isConnected ? 'Connected · Real-Time' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Right: Board Report + Simulator + Autonomy Tier + Kill Switch + User Profile */}
        <div className="flex items-center space-x-3">
          {/* Executive Board Report Button */}
          <button
            onClick={() => navigate('/executive')}
            className="hidden md:flex items-center space-x-1.5 rounded-xl border border-[#DFB59D] bg-[#F5E9DF] hover:bg-[#EAE0D5] px-3 py-1.5 text-xs font-bold text-[#8E5633] transition-all cursor-pointer shadow-sm hover:scale-102"
          >
            <TrendingUp className="h-3.5 w-3.5 text-[#8E5633]" />
            <span className="tracking-wider uppercase text-[11px]">Board Report</span>
          </button>

          {/* God Mode Simulator Trigger Button */}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-[#181716] via-[#26221F] to-[#181716] hover:border-[#C5855A] border border-[#C5855A]/50 px-3 py-1.5 text-xs font-bold text-[#E2AB8A] shadow-md shadow-[#C5855A]/15 transition-all cursor-pointer hover:scale-102"
          >
            <Zap className="h-3.5 w-3.5 text-[#E2AB8A] animate-pulse" />
            <span className="hidden sm:inline tracking-wider uppercase text-[11px]">God Mode Simulator</span>
          </button>


          {/* Autonomy Tier Selector */}
          <div className="flex items-center space-x-2">
            <span className="hidden xl:inline text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
              Autonomy:
            </span>
            <select
              value={autonomyTier}
              onChange={(e) => setAutonomyTier(Number(e.target.value))}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold focus:outline-none transition-all cursor-pointer shadow-sm ${
                tierLabels[autonomyTier]?.style || 'bg-[#FAF8F5] text-[#1C1917] border-[#DDD5CA]'
              }`}
            >
              <option value={0}>Tier 0: Observe Only</option>
              <option value={1}>Tier 1: Human Approval Required</option>
              <option value={2}>Tier 2: Bounded Autonomous (Default)</option>
              <option value={3}>Tier 3: Scoped High Autonomy</option>
            </select>
          </div>

          {/* Kill Switch Trigger Button */}
          <button
            onClick={() => setIsKillModalOpen(true)}
            className={`flex items-center space-x-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all shadow-sm cursor-pointer ${
              globalKillSwitchActive
                ? 'bg-[#DC2626] border-[#B91C1C] text-white shadow-rose-900/30 animate-pulse'
                : 'bg-[#FAF8F5] border-[#DDD5CA] text-[#78716C] hover:bg-white hover:text-[#DC2626] hover:border-[#FCA5A5]'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-[#DC2626]" />
            <span className="hidden sm:inline tracking-wide">
              {globalKillSwitchActive ? 'KILL SWITCH ACTIVE' : 'Kill Switch'}
            </span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2.5 rounded-xl border border-[#E2DAD0] bg-[#FAF8F5] px-2.5 py-1.5 text-xs hover:border-[#C5855A] hover:bg-white transition-all shadow-sm cursor-pointer"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#181716] text-[#E2AB8A] font-bold text-[11px]">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <p className="font-semibold text-[#1C1917] leading-tight">{user?.full_name || 'Operator'}</p>
                <p className="text-[10px] text-[#8E5633] font-mono font-medium">{user?.roles?.[0] || 'ADMIN'}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-[#78716C]" />
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
        }}
      />
    </>
  );
};
