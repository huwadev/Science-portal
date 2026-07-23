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
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("INITIALIZING ESSS SIMULATION SUITE...");
  const [authorized, setAuthorized] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setAuthorized(true);
    setLoading(true);
    setProgress(0);

    const steps = [
      { p: 25, msg: "INITIALIZING ESSS SIMULATION SUITE..." },
      { p: 50, msg: "LOADING CELESTIAL MECHANICS & MESH TELEMETRY..." },
      { p: 78, msg: "SYNCHRONIZING 3D GRAPHICS ENGINE..." },
      { p: 100, msg: "ORBITAL SIMULATION LINK SECURE." }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        setStatusMessage(steps[currentStep].msg);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => setLoading(false), 300);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [slug]);

  const formattedTitle = slug
    ? slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Module";

  return (
    <div className="h-screen w-screen flex flex-col bg-white dark:bg-black text-zinc-900 dark:text-white overflow-hidden select-none">
      {/* Simulation Top Bar */}
      <header className="h-14 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/80 px-6 flex justify-between items-center flex-shrink-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>PORTAL</span>
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            {formattedTitle}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">
            <ShieldCheck className="text-emerald-500 w-4 h-4" />
            <span>ESSS LINK ACTIVE</span>
          </div>
          <Link
            href="/labs"
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono font-bold uppercase hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            All Modules
          </Link>
        </div>
      </header>

      {/* Viewport Container with High-Tech ESSS Preloader Overlay */}
      <div className="flex-grow w-full relative bg-white dark:bg-zinc-950">
        {loading && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-black flex flex-col items-center justify-center p-6 space-y-8 animate-fade-in">
            {/* Background Ambient Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.03)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />
            
            {/* Flat ESSS Logo with Neutral Ambient Pulsing Halo */}
            <div className="relative group">
              <div className="absolute -inset-4 rounded-full bg-zinc-400/10 dark:bg-white/10 blur-2xl animate-pulse" />
              <img
                src="/esss logo flat.svg"
                alt="ESSS Logo Flat"
                className="h-16 sm:h-20 w-auto object-contain relative z-10 filter brightness-0 dark:brightness-0 dark:invert transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Launching Module Title */}
            <div className="text-center space-y-2 relative z-10 max-w-md">
              <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 tracking-widest uppercase">
                Launching Module
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                {formattedTitle}
              </h2>
            </div>

            {/* Progress Bar & Telemetry Indicator (Neutral Theme) */}
            <div className="w-full max-w-xs space-y-3 relative z-10">
              <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-300/60 dark:border-zinc-700/60">
                <div
                  className="h-full bg-zinc-900 dark:bg-white transition-all duration-500 ease-out rounded-full shadow-[0_0_12px_rgba(0,0,0,0.2)] dark:shadow-[0_0_12px_rgba(255,255,255,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                <span className="truncate pr-2">{statusMessage}</span>
                <span className="text-zinc-900 dark:text-white font-mono">{progress}%</span>
              </div>
            </div>
          </div>
        )}

        <iframe
          src={`/modules/${slug}/index.html`}
          className="absolute inset-0 w-full h-full border-none"
          title={`Simulation: ${slug}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            setProgress(100);
            setStatusMessage("ORBITAL SIMULATION LINK SECURE.");
            setTimeout(() => setLoading(false), 200);
          }}
        />
      </div>
    </div>
  );
}
