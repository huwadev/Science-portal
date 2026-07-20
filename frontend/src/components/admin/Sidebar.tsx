"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Globe, Radio, Compass, Rocket, Satellite, Activity, ShieldCheck,
  LayoutDashboard, FolderKanban, Users, FileClock, LogOut, ArrowLeft, Menu
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      name: "Overview",
      path: "/admin",
      icon: <LayoutDashboard className="w-4 h-4" />,
      permission: "dashboard"
    },
    {
      name: "Modules",
      path: "/admin/modules",
      icon: <FolderKanban className="w-4 h-4" />,
      permission: "modules"
    },
    {
      name: "User Accounts",
      path: "/admin/users",
      icon: <Users className="w-4 h-4" />,
      permission: "users"
    },
    {
      name: "Security Logs",
      path: "/admin/logs",
      icon: <FileClock className="w-4 h-4" />,
      permission: "logs"
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem("admin_api_token");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("admin_permissions");
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  const userRole = typeof window !== "undefined" ? localStorage.getItem("admin_role") : "";
  const userEmail = typeof window !== "undefined" ? localStorage.getItem("admin_email") : "";
  const userPermissionsRaw = typeof window !== "undefined" ? localStorage.getItem("admin_permissions") : "[]";
  
  let userPermissions: string[] = [];
  try {
    userPermissions = JSON.parse(userPermissionsRaw || "[]");
  } catch {
    userPermissions = [];
  }

  // Filter menu items by permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (userRole === "superadmin") return true;
    return userPermissions.includes(item.permission);
  });

  return (
    <aside className="w-64 bg-card/60 backdrop-blur-xl border-r border-card-border/40 flex flex-col justify-between flex-shrink-0 z-30 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-card-border/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
          <Compass className="w-6 h-6 animate-spin-slow" />
        </div>
        <div>
          <span className="font-black text-white text-sm tracking-widest uppercase block">ESSS ADMIN</span>
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{userRole}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow py-6 px-4 space-y-1.5 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                isActive
                  ? "bg-primary text-background shadow-md shadow-primary/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Profile & Leave Controls */}
      <div className="p-4 border-t border-card-border/30 space-y-3">
        <div className="px-3 py-2.5 rounded-xl bg-black/40 border border-card-border/10">
          <span className="text-[10px] text-gray-500 font-bold uppercase block tracking-wider">Logged in as</span>
          <span className="text-xs text-white font-semibold truncate block mt-0.5" title={userEmail || ""}>
            {userEmail}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-card-border text-[10px] font-bold uppercase hover:bg-card-border text-white tracking-wider transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leave Admin</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-red-500/10 text-[10px] font-bold uppercase hover:bg-red-500/10 hover:border-red-500/30 text-red-400 tracking-wider transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
