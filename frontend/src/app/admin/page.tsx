"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, Rocket, Key, Play, Terminal, ShieldAlert,
  ArrowUpRight, BarChart2, CheckCircle, RefreshCw
} from "lucide-react";

interface StatsData {
  metrics: {
    total_users: number;
    active_users: number;
    total_modules: number;
    active_modules: number;
    total_launches: number;
    security_incidents: number;
  };
  module_launches: Array<{
    slug: string;
    title: string;
    launch_count: number;
  }>;
  recent_launches: Array<{
    id: string;
    event: string;
    email: string;
    ip_address: string;
    details: any;
    created_at: string;
  }>;
  analytics: {
    traffic: Array<{
      date: string;
      pageviews: number;
      uniques: number;
    }>;
  };
}

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("admin_api_token");
      const res = await fetch("/api/v1/admin/stats", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load administration dashboard stats.");
      }

      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Acquiring Dashboard Statistics...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 border border-red-500/30 rounded-2xl bg-red-500/10 text-red-400 text-sm max-w-lg mx-auto text-center space-y-4">
        <ShieldAlert className="w-8 h-8 mx-auto" />
        <div>{error || "Failed to load dashboard metrics."}</div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs uppercase font-bold hover:bg-red-600 transition-colors"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const { metrics, module_launches, recent_launches, analytics } = stats;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex justify-between items-center border-b border-card-border/20 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Overview Dashboard</h1>
          <p className="text-xs text-gray-400">Real-time system health and module metrics telemetry.</p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2.5 rounded-xl border border-card-border/50 bg-card/25 text-gray-400 hover:text-white hover:bg-card-border transition-all cursor-pointer"
          title="Refresh Stats"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass border border-card-border/50 rounded-2xl p-6 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Total Members</span>
            <span className="text-2xl font-black text-white">{metrics.total_users}</span>
            <span className="text-[9px] text-green-400 font-bold block">Active: {metrics.active_users}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass border border-card-border/50 rounded-2xl p-6 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Total Launches</span>
            <span className="text-2xl font-black text-white">{metrics.total_launches}</span>
            <span className="text-[9px] text-primary font-bold block">Simulation Passes</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Play className="w-6 h-6 fill-current" />
          </div>
        </div>

        <div className="glass border border-card-border/50 rounded-2xl p-6 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Active Modules</span>
            <span className="text-2xl font-black text-white">{metrics.active_modules}</span>
            <span className="text-[9px] text-gray-400 font-bold block">Total Staged: {metrics.total_modules}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Rocket className="w-6 h-6" />
          </div>
        </div>

        <div className="glass border border-card-border/50 rounded-2xl p-6 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Security Logs</span>
            <span className="text-2xl font-black text-red-400">{metrics.security_incidents}</span>
            <span className="text-[9px] text-red-500/60 font-bold block">Audit Flags</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Key className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Graphs / Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module Telemetry Launch Stats */}
        <div className="glass border border-card-border/40 rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-card-border/20 pb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              <span>Module Telemetry</span>
            </h3>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total hits</span>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {module_launches.map((mod) => (
              <div key={mod.slug} className="flex justify-between items-center py-2.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.01] px-2 rounded-xl transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs text-white font-bold block">{mod.title}</span>
                  <span className="text-[9px] font-mono text-gray-500 uppercase">{mod.slug}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-primary block">{mod.launch_count}</span>
                  <span className="text-[8px] text-gray-500 uppercase block font-bold">Launches</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Session Launches */}
        <div className="glass border border-card-border/40 rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-card-border/20 pb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <span>Real-time Link Launches</span>
            </h3>
            <span className="inline-flex px-2 py-0.5 rounded-full border border-green-500/20 bg-green-500/10 text-[8px] font-extrabold uppercase text-green-400">
              Live Feed
            </span>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {recent_launches.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-500">No recent activity logs available.</div>
            ) : (
              recent_launches.map((log) => (
                <div key={log.id} className="flex gap-4 items-start py-3 border-b border-white/[0.03] last:border-0 px-2 rounded-xl">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 mt-1 flex-shrink-0 animate-pulse"></div>
                  <div className="space-y-1 flex-grow">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-white font-bold block">
                        {log.details?.module ? log.details.module.toUpperCase() : "SIMULATION LAUNCH"}
                      </span>
                      <span className="text-[9px] font-mono text-gray-500">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      User <span className="text-white font-medium">{log.email}</span> launched sandbox module.
                    </p>
                    <div className="flex gap-4 text-[9px] font-mono text-gray-500">
                      <span>IP: {log.ip_address}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
