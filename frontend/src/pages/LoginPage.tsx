import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { AurenLogo } from '../components/common/AurenLogo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@ops.ai');
  const [password, setPassword] = useState('AdminPass123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setRoleDemo = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#EFECE6] relative overflow-hidden text-[#1C1917]">
      {/* Subtle Warm Copper Ambient Highlights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C5855A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#DEB29B]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md auren-card p-8 border border-[#E2DAD0] shadow-xl space-y-6">
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <AurenLogo size={64} variant="icon" />
          <h2 className="text-2xl font-bold font-display tracking-[0.25em] text-[#1C1917] uppercase">
            AUREN
          </h2>
          <p className="text-xs text-[#78716C] tracking-wide uppercase font-medium">Autonomous AI Business Operations</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] text-xs font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#EFECE6] border border-[#DDD5CA] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#C5855A] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#EFECE6] border border-[#DDD5CA] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#C5855A] font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-[#181716] text-[#FAF8F5] font-bold text-xs shadow-md hover:bg-[#2A2724] transition-all cursor-pointer border border-[#35312C]"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Control Matrix'}</span>
            <ArrowRight className="w-4 h-4 text-[#E2AB8A]" />
          </button>
        </form>

        {/* 1-Click Role Switcher */}
        <div className="pt-4 border-t border-[#E2DAD0]/80 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#78716C] block text-center">
            Demo 1-Click Role Access
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRoleDemo('admin@ops.ai', 'AdminPass123!')}
              className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E2DAD0] hover:border-[#C5855A] text-left text-[11px] transition-all shadow-sm"
            >
              <strong className="text-[#8E5633] block">Administrator</strong>
              <span className="text-[#78716C] text-[10px]">Full Control & Guardrails</span>
            </button>

            <button
              type="button"
              onClick={() => setRoleDemo('operator@ops.ai', 'OperatorPass123!')}
              className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E2DAD0] hover:border-[#C5855A] text-left text-[11px] transition-all shadow-sm"
            >
              <strong className="text-[#15803D] block">Operator</strong>
              <span className="text-[#78716C] text-[10px]">Trigger & Execute</span>
            </button>

            <button
              type="button"
              onClick={() => setRoleDemo('approver@ops.ai', 'ApproverPass123!')}
              className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E2DAD0] hover:border-[#C5855A] text-left text-[11px] transition-all shadow-sm"
            >
              <strong className="text-[#B45309] block">Approver</strong>
              <span className="text-[#78716C] text-[10px]">Human-in-the-Loop</span>
            </button>

            <button
              type="button"
              onClick={() => setRoleDemo('auditor@ops.ai', 'AuditorPass123!')}
              className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E2DAD0] hover:border-[#C5855A] text-left text-[11px] transition-all shadow-sm"
            >
              <strong className="text-[#475569] block">Auditor</strong>
              <span className="text-[#78716C] text-[10px]">Read-Only Audit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
