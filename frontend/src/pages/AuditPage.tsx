import React, { useState, useEffect } from 'react';
import { ScrollText, Filter, Download, ShieldCheck, Search, Eye } from 'lucide-react';
import { api } from '../services/api';
import { AuditEvent } from '../types';

export const AuditPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [domainFilter, setDomainFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAudit = async () => {
    try {
      const data = await api.getAuditEvents({
        domain: domainFilter || undefined,
        actor_type: actorFilter || undefined,
        result: resultFilter || undefined,
      });
      setEvents(data);
    } catch (e) {
      console.error('Failed to load audit events', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, [domainFilter, actorFilter, resultFilter]);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit_trail_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 text-[#1C1917]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-[#1C1917]">Immutable Audit Trail</h1>
          <p className="text-xs text-[#78716C] mt-1">
            Enterprise-grade trace logs for every autonomous reasoning step, action execution, and human decision.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          className="flex items-center space-x-2 rounded-2xl bg-[#181716] hover:bg-[#2A2724] border border-[#35312C] px-5 py-2.5 text-xs font-bold text-[#FAF8F5] shadow-md transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#E2AB8A]" />
          <span>Export Audit Log (JSON)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="auren-card p-4.5 flex flex-wrap gap-3 items-center shadow-sm">
        <span className="text-xs font-bold text-[#78716C] flex items-center mr-2">
          <Filter className="w-3.5 h-3.5 mr-1 text-[#8E5633]" /> Filters:
        </span>

        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="bg-[#EFECE6] border border-[#DDD5CA] rounded-xl px-3.5 py-2 text-xs text-[#1C1917] font-semibold focus:outline-none focus:border-[#C5855A]"
        >
          <option value="">All Domains</option>
          <option value="sales">Sales</option>
          <option value="finance">Finance</option>
          <option value="support">Support</option>
          <option value="marketing">Marketing</option>
          <option value="operations">Operations</option>
        </select>

        <select
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          className="bg-[#EFECE6] border border-[#DDD5CA] rounded-xl px-3.5 py-2 text-xs text-[#1C1917] font-semibold focus:outline-none focus:border-[#C5855A]"
        >
          <option value="">All Actors</option>
          <option value="USER">Human User</option>
          <option value="AGENT">AI Agent</option>
          <option value="SYSTEM">System Core</option>
        </select>

        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="bg-[#EFECE6] border border-[#DDD5CA] rounded-xl px-3.5 py-2 text-xs text-[#1C1917] font-semibold focus:outline-none focus:border-[#C5855A]"
        >
          <option value="">All Results</option>
          <option value="SUCCESS">Success</option>
          <option value="BLOCKED">Blocked</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Audit Table */}
      <div className="auren-card p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2DAD0] text-[#78716C] uppercase text-[10px] font-bold tracking-widest">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Actor</th>
                <th className="pb-3">Action</th>
                <th className="pb-3">Domain</th>
                <th className="pb-3">Result</th>
                <th className="pb-3">Trace ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DAD0]/60">
              {events.map((evt) => (
                <tr
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="cursor-pointer hover:bg-[#EFECE6]/50 transition-colors"
                >
                  <td className="py-3.5 font-mono text-[#78716C]">
                    {new Date(evt.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5">
                    <span className="font-bold text-[#1C1917]">{evt.actor_email}</span>
                    <span className="block text-[10px] font-mono text-[#78716C]">{evt.actor_type}</span>
                  </td>
                  <td className="py-3.5 font-mono font-bold text-[#8E5633]">{evt.action}</td>
                  <td className="py-3.5 capitalize text-[#1C1917]">{evt.domain}</td>
                  <td className="py-3.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        evt.result === 'SUCCESS'
                          ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                          : evt.result === 'BLOCKED'
                          ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                          : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]'
                      }`}
                    >
                      {evt.result}
                    </span>
                  </td>
                  <td className="py-3.5 font-mono text-[11px] text-[#78716C] truncate max-w-[120px]">
                    {evt.trace_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details Drawer Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181716]/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#E2DAD0] bg-[#FAF8F5] p-7 shadow-2xl space-y-4">
            <h3 className="text-base font-bold font-display text-[#1C1917]">Audit Event Details</h3>
            <div className="text-xs space-y-2 text-[#1C1917]">
              <p><strong>Action:</strong> <span className="font-mono text-[#8E5633] font-bold">{selectedEvent.action}</span></p>
              <p><strong>Actor:</strong> {selectedEvent.actor_email} ({selectedEvent.actor_type})</p>
              <p><strong>Trace ID:</strong> <span className="font-mono text-[#78716C]">{selectedEvent.trace_id}</span></p>
              <p><strong>Result:</strong> {selectedEvent.result}</p>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-1.5">Payload / Details:</label>
              <pre className="p-3.5 rounded-2xl bg-[#181716] text-[11px] font-mono text-[#FAF8F5] overflow-x-auto max-h-52 border border-[#35312C]">
                {JSON.stringify(selectedEvent.details, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#181716] text-[#FAF8F5] hover:bg-[#2A2724] transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
