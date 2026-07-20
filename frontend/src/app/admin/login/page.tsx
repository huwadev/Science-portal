"use client";

import React, { useState } from "react";
import SentientMeshWrapper from "@/components/sentient/SentientMeshWrapper";
import { Compass, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "998473765583-ram81h9jtdk5cg2vt1lbv60msffdl5in.apps.googleusercontent.com";
    if (!clientId) {
      setError("Google Client ID not configured.");
      return;
    }
    const redirectUri = window.location.origin + "/admin/token";
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=email profile`;
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-background">
      {/* Sentient Mesh Backdrop */}
      <SentientMeshWrapper activeObject="klein-bottle" themeColor="#00d2ff" intensity={0.25} />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00d2ff04_1px,transparent_1px),linear-gradient(to_bottom,#00d2ff04_1px,transparent_1px)] bg-[size:4rem_4rem] -z-20"></div>

      <div className="glass rounded-[2.5rem] border border-card-border max-w-md w-full p-8 sm:p-10 text-center space-y-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>

        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-center text-primary animate-pulse shadow-lg shadow-primary/10">
            <Compass className="w-9 h-9" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">ESSS Administrative Access</h1>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Pre-registered administrators can authenticate via Google and verify secondary TOTP factors.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleGoogleLogin}
            className="w-full py-4 rounded-2xl bg-primary text-background font-bold text-xs uppercase hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg shadow-primary/20"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Sign in with Google Admin</span>
          </button>
        </div>

        <div className="text-[10px] text-gray-500 leading-relaxed max-w-xs mx-auto">
          Security policy: Admin logins are restricted to pre-registered `@ethiosss.org` emails. Multi-factor verification (TOTP) is enforced on all administrative requests.
        </div>
      </div>
    </div>
  );
}
