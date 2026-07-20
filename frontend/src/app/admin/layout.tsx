"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { RefreshCw } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isLoginPage =
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login") ||
    pathname === "/admin/token" ||
    pathname.startsWith("/admin/token");

  useEffect(() => {
    if (isLoginPage) {
      setCheckingAuth(false);
      return;
    }

    const token = localStorage.getItem("admin_api_token");
    if (!token) {
      setIsAuthenticated(false);
      router.push("/admin/login");
    } else {
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <RefreshCw size={24} className="animate-spin text-primary" />
        <span className="text-[10px] font-bold text-gray-500 font-mono tracking-widest uppercase">
          Verifying Authorization...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#04060f] text-gray-300 font-sans flex flex-row relative">
      {/* Background Vertical Grid Lines */}
      <div className="absolute inset-y-0 left-0 right-0 -z-10 grid grid-cols-12 max-w-7xl mx-auto px-8 opacity-5 pointer-events-none">
        {[...Array(13)].map((_, i) => (
          <div key={i} className="border-l border-white h-full"></div>
        ))}
      </div>

      <Sidebar />

      <main className="flex-grow p-6 md:p-10 overflow-x-hidden relative">
        {children}
      </main>
    </div>
  );
}
