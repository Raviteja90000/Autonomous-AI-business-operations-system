import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle2, AlertCircle, RefreshCw, Zap, Shield, Play, Mail, Send } from 'lucide-react';
import { api } from '../services/api';
import { IntegrationItem } from '../types';

export const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, any>>({});
  const [emailResult, setEmailResult] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const loadIntegrations = async () => {
    try {
      const data = await api.getIntegrations();
      setIntegrations(data);
    } catch (e) {
      console.error('Failed to load integrations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const res = await api.testIntegration(id);
      setTestResult((prev) => ({ ...prev, [id]: res }));
    } catch (e: any) {
      setTestResult((prev) => ({ ...prev, [id]: { success: false, message: e.message } }));
    } finally {
      setTestingId(null);
    }
  };

  const handleSendTestEmail = async (id: string) => {
    setSendingEmailId(id);
    try {
      const res = await api.sendIntegrationTestEmail(id, 'ravitejatalapaneni@gmail.com');
      setEmailResult((prev) => ({ ...prev, [id]: res }));
    } catch (e: any) {
      setEmailResult((prev) => ({ ...prev, [id]: { status: 'FAILED', message: e.message } }));
    } finally {
      setSendingEmailId(null);
    }
  };

  return (
    <div className="space-y-6 text-[#1C1917]">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-[#1C1917]">Connected Systems & Integrations</h1>
        <p className="text-xs text-[#78716C] mt-1">
          Plugin-based connectors for CRM, Billing, Support, Email, and Marketing with isolation safeguards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((integ) => {
          const res = testResult[integ.id];
          const isTesting = testingId === integ.id;
          const isEmail = integ.connector_type === 'email';
          const emailRes = emailResult[integ.id];
          const isSendingEmail = sendingEmailId === integ.id;

          return (
            <div
              key={integ.id}
              className="auren-card p-6 shadow-sm space-y-4 hover:border-[#C5855A]/50 transition-all"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-[#E2DAD0]/80">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-[#F5E9DF] border border-[#DFB59D] text-[#8E5633]">
                    {isEmail ? <Mail className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-[#1C1917]">{integ.name}</h3>
                    <span className="text-[10px] font-mono text-[#8E5633] uppercase font-bold">
                      Domain: {integ.domain}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                    integ.status === 'CONNECTED'
                      ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                      : 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                  }`}
                >
                  {integ.status}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#78716C]">
                  <span>Connector Type:</span>
                  <span className="font-mono text-[#1C1917] capitalize font-medium">{integ.connector_type}</span>
                </div>
                <div className="flex justify-between text-[#78716C]">
                  <span>Execution Mode:</span>
                  <span className="font-mono text-[#8E5633] font-bold">{integ.is_mock ? 'Enterprise Gateway' : 'Production API'}</span>
                </div>
                {isEmail && (
                  <div className="flex justify-between text-[#78716C] bg-[#FBF8F5] p-2 rounded-lg border border-[#E8DFD5]">
                    <span>Target Test Inbox:</span>
                    <span className="font-mono text-[#8E5633] font-semibold text-[11px]">ravitejatalapaneni@gmail.com</span>
                  </div>
                )}
                <div className="flex justify-between text-[#78716C]">
                  <span>Error Rate:</span>
                  <span className="font-mono text-[#1C1917] font-medium">{integ.error_rate_percentage}%</span>
                </div>
              </div>

              {res && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono border ${
                    res.success
                      ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]'
                      : 'bg-[#FEF2F2] border-[#FCA5A5] text-[#B91C1C]'
                  }`}
                >
                  <p className="font-bold">{res.message}</p>
                  {res.latency_ms && <p className="text-[10px] text-[#78716C]">Roundtrip: {res.latency_ms}ms</p>}
                </div>
              )}

              {emailRes && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono border ${
                    emailRes.status === 'SUCCESS'
                      ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]'
                      : 'bg-[#FEF2F2] border-[#FCA5A5] text-[#B91C1C]'
                  }`}
                >
                  {emailRes.status === 'SUCCESS' ? (
                    <div className="space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                        Live Email Dispatched!
                      </p>
                      <p className="text-[11px] text-[#1C1917]">Delivered to: <strong>{emailRes.recipient}</strong></p>
                      {emailRes.message_id && (
                        <p className="text-[10px] text-[#78716C]">Message ID: {emailRes.message_id}</p>
                      )}
                      <p className="text-[10px] text-[#15803D] font-sans font-medium mt-1">Check your Gmail inbox now!</p>
                    </div>
                  ) : (
                    <p className="font-bold text-[#B91C1C]">Dispatch failed: {emailRes.message || 'Unknown error'}</p>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-[#E2DAD0]/70 space-y-2">
                <button
                  onClick={() => handleTestConnection(integ.id)}
                  disabled={isTesting}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-[#EFECE6] border border-[#DDD5CA] text-[#1C1917] hover:border-[#C5855A] hover:bg-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <Zap className={`w-3.5 h-3.5 text-[#8E5633] ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing Connectivity...' : 'Test Connection'}</span>
                </button>

                {isEmail && (
                  <button
                    onClick={() => handleSendTestEmail(integ.id)}
                    disabled={isSendingEmail}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-[#8E5633] border border-[#764525] text-white hover:bg-[#784628] text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 text-white ${isSendingEmail ? 'animate-spin' : ''}`} />
                    <span>{isSendingEmail ? 'Sending to Inbox...' : 'Send Live Test Email to Inbox'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
