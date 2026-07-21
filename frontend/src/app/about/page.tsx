"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePortalStore } from "@/store/usePortalStore";
import {
  Sun,
  Moon,
  ArrowLeft,
  Globe,
  Award,
  Users,
  Building,
  Target,
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function AboutPage() {
  const { theme, setTheme } = usePortalStore();

  return (
    <div className="min-h-screen bg-black text-zinc-100 transition-colors duration-200">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              <span>RETURN TO PORTAL</span>
            </Link>
            <span className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-zinc-200" />
              <h1 className="text-sm font-extrabold tracking-wider uppercase font-outfit text-white">About ESSS</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-zinc-300"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun style={{ width: "18px", height: "18px", color: "#ffcc00" }} /> : <Moon style={{ width: "18px", height: "18px", color: "#ffffff" }} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-20">
        {/* Page Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs font-mono font-bold uppercase tracking-widest">
            <Sparkles size={14} /> Ethiopian Space Science Society
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Inspiring Africa's <span className="text-zinc-400">Space Future</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Founded to foster space science, astronomical research, satellite engineering, and STEM education across Ethiopia and the African continent.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-zinc-800 bg-zinc-950/80 p-8 rounded-2xl text-center space-y-3 shadow-xl">
            <Building className="w-8 h-8 text-zinc-300 mx-auto" />
            <div className="text-4xl font-black text-white">2004</div>
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Established</div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950/80 p-8 rounded-2xl text-center space-y-3 shadow-xl">
            <Users className="w-8 h-8 text-zinc-300 mx-auto" />
            <div className="text-4xl font-black text-white">10,000+</div>
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Active Members</div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950/80 p-8 rounded-2xl text-center space-y-3 shadow-xl">
            <Target className="w-8 h-8 text-zinc-300 mx-auto" />
            <div className="text-4xl font-black text-white">38+</div>
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Regional Branches</div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950/80 p-8 rounded-2xl text-center space-y-3 shadow-xl">
            <Award className="w-8 h-8 text-zinc-300 mx-auto" />
            <div className="text-4xl font-black text-white">Entoto</div>
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Observatory Partner</div>
          </div>
        </div>

        {/* Entoto Observatory Highlight */}
        <div className="border border-zinc-800 bg-zinc-950/80 p-8 sm:p-12 rounded-3xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center shadow-2xl">
          <div className="space-y-6">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">// ASTROPHYSICAL OBSERVATORY</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Entoto Observatory & Research Center
            </h2>
            <p className="text-base text-zinc-400 leading-relaxed">
              Situated at an elevation of 3,200 meters above sea level on Mount Entoto, the observatory operates twin 1-meter optical telescopes for deep-sky photometry, exoplanet transit monitoring, and binary star observations.
            </p>

            {/* Clean Monochrome Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/labs"
                className="px-6 py-3 bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <span>EXPLORE LABS</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/apps"
                className="px-6 py-3 bg-zinc-900 border border-zinc-700 text-zinc-200 hover:text-white hover:border-zinc-500 text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>SPACE APPS</span>
              </Link>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl h-88">
            <img
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop"
              alt="Entoto Observatory"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-6">
              <span className="text-xs font-mono font-bold text-zinc-300 tracking-widest">
                MOUNT ENTOTO OBSERVATORY • ADDIS ABABA
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
