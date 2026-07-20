"use client";

import React, { useEffect, useState } from "react";
import { 
  FolderKanban, RefreshCw, ShieldAlert, Lock, Unlock, Edit3, X, Check
} from "lucide-react";

interface ModuleData {
  id?: string;
  _id?: string;
  slug: string;
  title: string;
  category: string;
  complexity: string;
  concept: string;
  tech: string;
  status: string;
  is_restricted: boolean;
  launch_count: number;
}

export default function AdminModulesPage() {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit Dialog States
  const [editingModule, setEditingModule] = useState<ModuleData | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editComplexity, setEditComplexity] = useState("");
  const [editConcept, setEditConcept] = useState("");
  const [editTech, setEditTech] = useState("");
  const [editIsRestricted, setEditIsRestricted] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchModules = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("admin_api_token");
      const res = await fetch("/api/admin/modules", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load modules from api.");
      }
      const data = await res.json();
      setModules(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load modules list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleEditClick = (mod: ModuleData) => {
    setEditingModule(mod);
    setEditTitle(mod.title);
    setEditCategory(mod.category);
    setEditComplexity(mod.complexity);
    setEditConcept(mod.concept);
    setEditTech(mod.tech);
    setEditIsRestricted(mod.is_restricted);
  };

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule) return;

    setUpdating(true);
    try {
      const id = editingModule.id || editingModule._id;
      const token = localStorage.getItem("admin_api_token");

      const res = await fetch(`/api/admin/modules/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({
          title: editTitle,
          category: editCategory,
          complexity: editComplexity,
          concept: editConcept,
          tech: editTech,
          is_restricted: editIsRestricted
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update module.");
      }

      setEditingModule(null);
      fetchModules();
    } catch (err: any) {
      alert(err.message || "Failed to save updates.");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleRestriction = async (mod: ModuleData) => {
    try {
      const id = mod.id || mod._id;
      const token = localStorage.getItem("admin_api_token");

      const res = await fetch(`/api/admin/modules/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({
          is_restricted: !mod.is_restricted
        })
      });

      if (!res.ok) {
        throw new Error("Failed to toggle restrictions.");
      }

      fetchModules();
    } catch (err: any) {
      alert(err.message || "Failed to update restriction state.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Synchronizing Scientific Modules...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-card-border/20 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Modules Management</h1>
          <p className="text-xs text-gray-400">Configure simulator restrictions, details, metadata, and stage parameters.</p>
        </div>
        <button
          onClick={fetchModules}
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

      {/* Modules Table */}
      <div className="glass border border-card-border/40 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-card-border/30 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-card/20">
                <th className="p-6">Title & Category</th>
                <th className="p-6">Technical Stack</th>
                <th className="p-6">Complexity</th>
                <th className="p-6 text-center">Security Restriction</th>
                <th className="p-6 text-center">Launches</th>
                <th className="p-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {modules.map((mod) => (
                <tr key={mod.slug} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-6 space-y-1">
                    <span className="font-bold text-white text-sm block">{mod.title}</span>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                      {mod.category} • {mod.slug}
                    </span>
                  </td>
                  <td className="p-6 text-xs text-gray-400 font-mono">{mod.tech}</td>
                  <td className="p-6">
                    <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border border-card-border uppercase tracking-wide bg-card/40 text-white">
                      {mod.complexity}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleToggleRestriction(mod)}
                        className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                          mod.is_restricted
                            ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20"
                            : "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                        }`}
                        title={mod.is_restricted ? "Restricted access (Requires Login)" : "Public access"}
                      >
                        {mod.is_restricted ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                  <td className="p-6 text-center font-black text-xs text-white">{mod.launch_count}</td>
                  <td className="p-6">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleEditClick(mod)}
                        className="p-2 rounded-xl border border-card-border bg-card/25 text-gray-400 hover:text-white hover:bg-card-border transition-all cursor-pointer"
                        title="Edit Module Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Drawer Dialog Backdrop */}
      {editingModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md">
          <div className="glass rounded-[2rem] border border-card-border/75 max-w-lg w-full p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingModule(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Edit Scientific Module</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">
                {editingModule.slug}
              </p>
            </div>

            <form onSubmit={handleUpdateModule} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Module Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/40 border border-card-border/30 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/40 border border-card-border/30 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Complexity</label>
                  <select
                    value={editComplexity}
                    onChange={(e) => setEditComplexity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/40 border border-card-border/30 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Ultra">Ultra</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Technical Stack</label>
                <input
                  type="text"
                  value={editTech}
                  onChange={(e) => setEditTech(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/40 border border-card-border/30 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Concept Summary</label>
                <textarea
                  value={editConcept}
                  onChange={(e) => setEditConcept(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-black/40 border border-card-border/30 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="editIsRestricted"
                  checked={editIsRestricted}
                  onChange={(e) => setEditIsRestricted(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="editIsRestricted" className="text-xs font-semibold text-gray-300 select-none cursor-pointer">
                  Restrict access to registered portal members only
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingModule(null)}
                  className="flex-1 py-3 rounded-xl border border-card-border text-white font-bold text-xs uppercase hover:bg-card-border transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-grow py-3 rounded-xl bg-primary text-background font-bold text-xs uppercase hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
