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
import UniversalNavbar from "@/components/UniversalNavbar";
import UniversalFooter from "@/components/UniversalFooter";

export default function AboutPage() {
  const { theme, setTheme } = usePortalStore();

  return (
    <div className="min-h-screen bg-black light:bg-white text-zinc-100 light:text-zinc-900 font-sans">
      <UniversalNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-20">
        {/* Page Hero */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-800 light:border-zinc-200 bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 text-xs font-mono font-bold uppercase tracking-widest">
            <Sparkles size={14} /> ESSS Science Portal
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white light:text-zinc-900 leading-tight">
            Democratizing Space <span className="text-zinc-400 light:text-zinc-500">Science Learning</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 light:text-zinc-600 leading-relaxed max-w-3xl mx-auto">
            The ESSS Science Portal is a free interactive platform designed to visualize space science, astrophysics, and orbital technology. Our mission is to make advanced celestial physics accessible to students, educators, and space enthusiasts throughout Ethiopia and Africa.
          </p>
          <p className="text-sm text-zinc-500 light:text-zinc-400 max-w-2xl mx-auto pt-4 border-t border-zinc-800/40 light:border-zinc-200">
            Through high-performance 3D visualizers—including our interactive Moon explorer, solar & lunar eclipse calculators, and a full solar system simulator adapted from the Hewa+ app functionalities—we turn theoretical calculations into immersive visual learning experiences. All resources on this portal are 100% free to access.
          </p>
        </div>

        {/* Official ESSS Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-zinc-800 light:border-zinc-200 bg-zinc-950/80 light:bg-zinc-50 p-8 rounded-2xl text-center space-y-3 shadow-xl">
            <Users className="w-8 h-8 text-[#FFEA4B] light:text-[#3C3318] mx-auto" />
            <div className="text-4xl font-black text-white light:text-zinc-900">20,000+</div>
            <div className="text-xs font-mono text-zinc-400 light:text-zinc-600 uppercase tracking-wider">Individual Members</div>
          </div>
          <div className="border border-zinc-800 light:border-zinc-200 bg-zinc-950/80 light:bg-zinc-50 p-8 rounded-2xl text-center space-y-3 shadow-xl">
            <Target className="w-8 h-8 text-[#FFEA4B] light:text-[#3C3318] mx-auto" />
            <div className="text-4xl font-black text-white light:text-zinc-900">32</div>
            <div className="text-xs font-mono text-zinc-400 light:text-zinc-600 uppercase tracking-wider">Branch Associations</div>
          </div>
          <div className="border border-zinc-800 light:border-zinc-200 bg-zinc-950/80 light:bg-zinc-50 p-8 rounded-2xl text-center space-y-3 shadow-xl">
            <Building className="w-8 h-8 text-[#FFEA4B] light:text-[#3C3318] mx-auto" />
            <div className="text-4xl font-black text-white light:text-zinc-900">58+</div>
            <div className="text-xs font-mono text-zinc-400 light:text-zinc-600 uppercase tracking-wider">Institutional Members</div>
          </div>
          <div className="border border-zinc-800 light:border-zinc-200 bg-zinc-950/80 light:bg-zinc-50 p-8 rounded-2xl text-center space-y-3 shadow-xl">
            <Award className="w-8 h-8 text-[#FFEA4B] light:text-[#3C3318] mx-auto" />
            <div className="text-4xl font-black text-white light:text-zinc-900">100+</div>
            <div className="text-xs font-mono text-zinc-400 light:text-zinc-600 uppercase tracking-wider">Space School Clubs</div>
          </div>
        </div>

        {/* Entoto Observatory Highlight */}
        <div className="border border-zinc-800 light:border-zinc-200 bg-zinc-950/80 light:bg-zinc-50 p-8 sm:p-12 rounded-3xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center shadow-2xl">
          <div className="space-y-6">
            <span className="text-xs font-mono font-bold text-zinc-400 light:text-zinc-500 uppercase tracking-widest">// ASTROPHYSICAL OBSERVATORY</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white light:text-zinc-900">
              Entoto Observatory & Research Center
            </h2>
            <p className="text-base text-zinc-400 light:text-zinc-600 leading-relaxed">
              Situated at an elevation of 3,200 meters above sea level on Mount Entoto, the observatory operates twin 1-meter optical telescopes for deep-sky photometry, exoplanet transit monitoring, and binary star observations.
            </p>

            {/* Clean Monochrome Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/labs"
                className="px-6 py-3 bg-white light:bg-zinc-900 text-black light:text-white hover:bg-zinc-200 light:hover:bg-zinc-800 text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <span>EXPLORE LABS</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/apps"
                className="px-6 py-3 bg-zinc-900 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 hover:text-white light:hover:text-black hover:border-zinc-500 text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>SPACE APPS</span>
              </Link>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 light:border-zinc-200 shadow-2xl h-88">
            <img
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop"
              alt="Entoto Observatory"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-6">
              <span className="text-xs font-mono font-bold text-zinc-300 tracking-widest">
                AAU, CTBE, 407 • ADDIS ABABA
              </span>
            </div>
          </div>
        </div>
      </main>
      <UniversalFooter />
    </div>
  );
}
