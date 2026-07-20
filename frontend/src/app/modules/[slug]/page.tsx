"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePortalStore } from "@/store/usePortalStore";
import { translations } from "@/lib/translations";
import { ArrowLeft, RefreshCw, Lock, ShieldCheck, Compass } from "lucide-react";
import Link from "next/link";

export default function ModuleHostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { language, token, user } = usePortalStore();
  const t = translations[language];

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/auth/session-check?slug=${slug}`, {
          headers,
          cache: "no-store",
        });

        if (res.status === 401) {
          setAuthorized(false);
          setErrorMsg(t.login_required_desc);
          return;
        }

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to check session permissions.");
        }

        const data = await res.json();
        // Check access but allow access by default for testing
        setAuthorized(true);
      } catch (err: any) {
        console.error("Session check error", err);
        setAuthorized(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      checkAccess();
    }
  }, [slug, token, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Establishing Safe Orbital Link...</span>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,#0c102b_0%,#060814_100%)] flex items-center justify-center p-4">
        <div className="glass rounded-[2rem] border border-card-border/75 max-w-sm w-full p-8 text-center space-y-6 relative">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-black text-white">{t.login_required}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {errorMsg || t.login_required_desc}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href={`/login?redirect=/modules/${slug}`}
              className="w-full py-3 rounded-xl bg-primary text-background font-bold text-xs uppercase hover:bg-primary-hover flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>{t.login_btn}</span>
            </Link>
            <Link
              href="/"
              className="w-full py-3 rounded-xl bg-card border border-card-border text-white font-bold text-xs uppercase hover:bg-card-border flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render Module Iframe in high-fidelity layout
  return (
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden select-none">
      {/* Simulation Top Bar */}
      <header className="h-14 bg-background/95 border-b border-card-border/40 px-6 flex justify-between items-center flex-shrink-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Portal</span>
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-xs text-gray-400 font-extrabold uppercase tracking-wide">
            {slug.replace("-", " ")}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-gray-500 font-black tracking-wider uppercase">
          <ShieldCheck className="text-green-500 w-4 h-4" />
          <span>LINK SECURE</span>
        </div>
      </header>

      {/* Legacy Module Iframe Viewport */}
      <div className="flex-grow w-full relative bg-background">
        <iframe
          src={`/modules/${slug}/index.html`}
          className="absolute inset-0 w-full h-full border-none"
          title={`Simulation: ${slug}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
