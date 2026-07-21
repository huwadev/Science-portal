"use client";

import React, { useEffect, useState } from "react";
import { 
  FileClock, RefreshCw, ShieldAlert, Search, ChevronLeft, ChevronRight, Eye, X
} from "lucide-react";

interface AuditLogData {
  id: string;
  _id?: string;
  event: string;
  email: string;
  ip_address: string;
  user_agent: string;
  details: any;
  created_at: string;
}

interface PaginatedLogs {
  data: AuditLogData[];
  current_page: number;
  last_page: number;
  total: number;
}

export default function AdminLogsPage() {
  const [logsData, setLogsData] = useState<PaginatedLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [eventFilter, setEventFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [page, setPage] = useState(1);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogData | null>(null);

  const fetchLogs = async (currentPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("admin_api_token");
      let url = `/api/v1/admin/logs?page=${currentPage}`;
      if (eventFilter) url += `&event=${encodeURIComponent(eventFilter)}`;
      if (emailFilter) url += `&email=${encodeURIComponent(emailFilter)}`;

      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load security audit logs.");
      }
      const data = await res.json();
      setLogsData(data);
      setPage(currentPage);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load audit trail logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [eventFilter, emailFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (logsData?.last_page || 1)) {
      fetchLogs(newPage);
    }
  };

  if (loading && !logsData) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Retrieving Cryptographic Audit Logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-card-border/20 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Security Audit Logs</h1>
          <p className="text-xs text-gray-400">Monitor login events, permission updates, configuration edits, and authorization failures.</p>
        </div>
        <button
          onClick={() => fetchLogs(page)}
          className="p-2.5 rounded-xl border border-card-border/50 bg-card/25 text-gray-400 hover:text-white hover:bg-card-border transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex gap-2">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Filter by event name (e.g. auth.login_failed)"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-black/40 border border-card-border/30 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Filter by operator email"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-black/40 border border-card-border/30 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass border border-card-border/40 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-card-border/30 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-card/20">
                <th className="p-6">Timestamp</th>
                <th className="p-6">Event</th>
                <th className="p-6">Operator</th>
                <th className="p-6">Client IP</th>
                <th className="p-6 text-center">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02] font-mono text-[11px]">
              {logsData?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500 text-xs font-sans">
                    No security events match specified filters.
                  </td>
                </tr>
              ) : (
                logsData?.data.map((log) => (
                  <tr key={log.id || log._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-6 text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-6">
                      <span className={`px-2 py-0.5 rounded border ${
                        log.event.startsWith("auth.login_failed") || log.event.startsWith("auth.unauthorized")
                          ? "bg-red-500/10 border-red-500/30 text-red-400"
                          : log.event.startsWith("auth.2fa_success") || log.event.startsWith("auth.user_login_success")
                          ? "bg-green-500/10 border-green-500/30 text-green-400"
                          : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                      }`}>
                        {log.event}
                      </span>
                    </td>
                    <td className="p-6 text-gray-300 font-sans">{log.email}</td>
                    <td className="p-6 text-gray-400">{log.ip_address}</td>
                    <td className="p-6">
                      <div className="flex justify-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg border border-card-border bg-card/25 text-gray-400 hover:text-white hover:bg-card-border transition-colors cursor-pointer"
                          title="View telemetry JSON"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {logsData && logsData.last_page > 1 && (
          <div className="p-4 border-t border-card-border/20 flex justify-between items-center text-xs text-gray-500 font-sans">
            <span>
              Showing Page <b>{logsData.current_page}</b> of <b>{logsData.last_page}</b> (Total logs: {logsData.total})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-xl border border-card-border bg-card/20 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === logsData.last_page}
                className="p-2 rounded-xl border border-card-border bg-card/20 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md">
          <div className="glass rounded-[2rem] border border-card-border/75 max-w-lg w-full p-8 space-y-4 relative">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Audit Event Metadata</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">
                Log ID: {selectedLog.id || selectedLog._id}
              </p>
            </div>

            <div className="space-y-3 font-mono text-[10px] bg-black/40 border border-card-border/30 rounded-2xl p-4 overflow-x-auto max-h-[300px] text-gray-300">
              <div>
                <span className="text-primary font-bold">Event:</span> {selectedLog.event}
              </div>
              <div>
                <span className="text-primary font-bold">Operator:</span> {selectedLog.email}
              </div>
              <div>
                <span className="text-primary font-bold">IP:</span> {selectedLog.ip_address}
              </div>
              <div>
                <span className="text-primary font-bold">Client User Agent:</span> {selectedLog.user_agent}
              </div>
              <div>
                <span className="text-primary font-bold block mb-1">Context Payload:</span>
                <pre className="text-[9px] text-gray-400 max-h-[150px] overflow-y-auto whitespace-pre-wrap select-all font-mono leading-normal bg-black/60 p-2.5 rounded-xl border border-card-border/10">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full py-3 rounded-xl border border-card-border text-white font-bold text-xs uppercase hover:bg-card-border transition-colors cursor-pointer"
            >
              Close Metadata View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
