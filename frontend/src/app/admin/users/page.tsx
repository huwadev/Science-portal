"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, RefreshCw, ShieldAlert, ToggleLeft, ToggleRight, Edit3, X, Check, Trash
} from "lucide-react";

interface UserData {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  google_id: string;
  avatar: string | null;
  role: string;
  is_active: boolean;
  permissions?: string[];
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editIsActive, setEditIsActive] = useState(false);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  const availablePermissions = [
    { key: "dashboard", name: "Overview Dashboard" },
    { key: "modules", name: "Modules Configuration" },
    { key: "users", name: "User Accounts Management" },
    { key: "logs", name: "Security Audit Logs" }
  ];

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("admin_api_token");
      const res = await fetch("/api/v1/admin/users", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load user list from api.");
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load portal accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user: UserData) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditIsActive(user.is_active);
    setEditPermissions(user.permissions || []);
  };

  const handleTogglePermission = (permKey: string) => {
    setEditPermissions(prev => 
      prev.includes(permKey) ? prev.filter(p => p !== permKey) : [...prev, permKey]
    );
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUpdating(true);
    try {
      const id = editingUser.id || editingUser._id;
      const token = localStorage.getItem("admin_api_token");

      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({
          role: editRole,
          is_active: editIsActive,
          permissions: editPermissions
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update user.");
      }

      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update account.");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleActive = async (user: UserData) => {
    try {
      const id = user.id || user._id;
      const token = localStorage.getItem("admin_api_token");

      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({
          is_active: !user.is_active
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to toggle user status.");
      }

      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to change user status.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Synchronizing Portal Users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-card-border/20 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">User Accounts</h1>
          <p className="text-xs text-gray-400">Configure roles, permissions, administrative privileges, and lock statuses.</p>
        </div>
        <button
          onClick={fetchUsers}
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

      {/* Users Table */}
      <div className="glass border border-card-border/40 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-card-border/30 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-card/20">
                <th className="p-6">User Profile</th>
                <th className="p-6">Google Sign-in ID</th>
                <th className="p-6">Role</th>
                <th className="p-6 text-center">Status</th>
                <th className="p-6 text-center">Permissions</th>
                <th className="p-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {users.map((userObj) => (
                <tr key={userObj.email} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-6 flex items-center gap-4">
                    <img
                      src={userObj.avatar || "/esss-badge.png"}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full bg-black/40 border border-card-border/20 object-cover"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-white text-sm block">{userObj.name}</span>
                      <span className="text-[10px] text-gray-500 font-medium block truncate max-w-[200px]" title={userObj.email}>
                        {userObj.email}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-xs text-gray-500 font-mono select-all">
                    {userObj.google_id || "N/A"}
                  </td>
                  <td className="p-6">
                    <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wide bg-card/40 ${
                      userObj.role === 'superadmin' ? 'border-red-500/30 text-red-400' :
                      userObj.role === 'admin' ? 'border-primary/30 text-primary' :
                      userObj.role === 'member' ? 'border-green-500/30 text-green-400' :
                      'border-gray-500/30 text-gray-400'
                    }`}>
                      {userObj.role}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleToggleActive(userObj)}
                        className={`p-1 rounded-full cursor-pointer transition-colors ${
                          userObj.role === 'superadmin' ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        disabled={userObj.role === 'superadmin'}
                        title={userObj.is_active ? "Active account (Click to disable)" : "Disabled account (Click to activate)"}
                      >
                        {userObj.is_active ? (
                          <ToggleRight className="w-8 h-8 text-green-400" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="p-6 text-center text-xs text-gray-400 font-mono">
                    {userObj.role === 'superadmin' ? (
                      <span className="text-[10px] text-red-400 uppercase font-bold tracking-wider">ALL BYPASS</span>
                    ) : (
                      userObj.permissions?.join(", ") || "None"
                    )}
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleEditClick(userObj)}
                        className={`p-2 rounded-xl border border-card-border bg-card/25 text-gray-400 hover:text-white hover:bg-card-border transition-all cursor-pointer ${
                          userObj.role === 'superadmin' ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        disabled={userObj.role === "superadmin"}
                        title="Modify user privileges"
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

      {/* Edit Privileges Dialog Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md">
          <div className="glass rounded-[2rem] border border-card-border/75 max-w-md w-full p-8 space-y-6 relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Edit Member Profile</h3>
              <p className="text-[10px] text-gray-500 font-semibold block truncate" title={editingUser.email}>
                {editingUser.email}
              </p>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Portal Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/40 border border-card-border/30 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors"
                  required
                >
                  <option value="basic">basic (Standard Google Login)</option>
                  <option value="member">member (Access Restricted Labs)</option>
                  <option value="admin">admin (Administrative Dashboard)</option>
                </select>
              </div>

              {editRole === "admin" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Administrative Permissions</label>
                  <div className="space-y-1.5 border border-card-border/20 rounded-2xl p-4 bg-black/20">
                    {availablePermissions.map(p => (
                      <div key={p.key} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`perm_${p.key}`}
                          checked={editPermissions.includes(p.key)}
                          onChange={() => handleTogglePermission(p.key)}
                          className="w-4 h-4 accent-primary"
                        />
                        <label htmlFor={`perm_${p.key}`} className="text-xs text-gray-300 select-none cursor-pointer">
                          {p.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="editIsActive" className="text-xs font-semibold text-gray-300 select-none cursor-pointer">
                  Activate account state (allows session auth)
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
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
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
