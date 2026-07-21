"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { usePortalStore } from "@/store/usePortalStore";
import {
  Sun,
  Moon,
  Search,
  ArrowLeft,
  FlaskConical,
  Sparkles,
  ArrowRight,
  Cpu,
  Orbit,
  Radio,
  Globe,
  Layers,
  ChevronRight
} from "lucide-react";

interface ScienceModule {
  id: string;
  num: string;
  title: string;
  category: string;
  complexity: string;
  audience: string;
  concept: string;
  tech: string;
  status: string;
  href: string;
  icon: React.ReactNode;
}

const LAB_MODULES: ScienceModule[] = [
  {
    id: "module-11",
    num: "11",
    title: "Eclipse & Transit Physics Lab",
    category: "Planetary Science",
    complexity: "High",
    audience: "Students & Enthusiasts",
    concept: "Explore optical geometry, umbra/penumbra shadow structures, and celestial alignment physics that create solar and lunar eclipses.",
    tech: "WebGL • Physics Engine • Light Simulation",
    status: "build",
    href: "/modules/eclipses-transits",
    icon: <Globe className="w-6 h-6 text-zinc-300" />
  },
  {
    id: "module-10",
    num: "10",
    title: "The Cosmic Distance Ladder",
    category: "Cosmology & Relativity",
    complexity: "Medium",
    audience: "Students & Enthusiasts",
    concept: "An interactive journey through astrophysics to measure the scale of the observable universe from parallax to Hubble expansion.",
    tech: "Three.js • Chart.js • MathJax",
    status: "build",
    href: "/modules/cosmic-ladder",
    icon: <Sparkles className="w-6 h-6 text-zinc-300" />
  },
  {
    id: "module-01",
    num: "01",
    title: "Exoplanet Transit Light Curve Lab",
    category: "Astrophysics",
    complexity: "Medium",
    audience: "Students & Teachers",
    concept: "Simulate planetary transits across distant host stars to plot transit light dimming curves and derive orbital radii.",
    tech: "NASA Astronify • Chart.js",
    status: "build",
    href: "/modules/exoplanet-lab",
    icon: <Orbit className="w-6 h-6 text-zinc-300" />
  },
  {
    id: "module-02",
    num: "02",
    title: "Gravitational Slingshot Sandbox",
    category: "Astrophysics",
    complexity: "High",
    audience: "Enthusiasts & Researchers",
    concept: "Launch a deep space probe past moving gas giants to execute gravity assist maneuvers and alter heliocentric velocity vectors.",
    tech: "Matter.js • HTML5 Canvas",
    status: "build",
    href: "/modules/slingshot-sandbox",
    icon: <Layers className="w-6 h-6 text-zinc-300" />
  },
  {
    id: "module-03",
    num: "03",
    title: "Amateur Rocket Ballistics Engine",
    category: "Aerospace Engineering",
    complexity: "High",
    audience: "Enthusiasts & Rocketry Labs",
    concept: "Design sounding rockets, compute Barrowman center-of-pressure stability, and simulate flight profiles with 2D atmospheric wind drift.",
    tech: "Barrowman Equations • Chart.js",
    status: "build",
    href: "/modules/rocket-ballistics",
    icon: <Cpu className="w-6 h-6 text-zinc-300" />
  },
  {
    id: "module-04",
    num: "04",
    title: "LEO Satellite Pass & Doppler Calculator",
    category: "Aerospace Engineering",
    complexity: "Medium",
    audience: "Students & Radio Amateurs",
    concept: "Predict satellite footprint visibility, calculate ground station passes, and model real-time radio frequency Doppler shifts.",
    tech: "SatNOGS • satellite.js • Leaflet.js",
    status: "build",
    href: "/modules/satellite-doppler",
    icon: <Radio className="w-6 h-6 text-zinc-300" />
  },
  {
    id: "module-05",
    num: "05",
    title: "Radio Aperture Synthesis Visualizer",
    category: "Radio Science",
    complexity: "Ultra",
    audience: "Enthusiasts & Radio Astronomers",
    concept: "Arrange radio telescope antenna baselines to observe how array geometry dictates UV plane sampling and synthesized beam resolution.",
    tech: "NASA Open MCT • Canvas",
    status: "build",
    href: "/modules/aperture-synthesis",
    icon: <Radio className="w-6 h-6 text-zinc-300" />
  },
  {
    id: "module-06",
    num: "06",
    title: "Multi-Phase Orbital Mechanics Simulator",
    category: "Aerospace Engineering",
    complexity: "High",
    audience: "Students & Flight Engineers",
    concept: "Physics sandbox for gravity turns, coplanar Hohmann transfers, delta-v expenditure, and orbital rendezvous docking maneuvers.",
    tech: "2D Physics • Vector Math",
    status: "build",
    href: "/modules/orbital-mechanics",
    icon: <Orbit className="w-6 h-6 text-zinc-300" />
  }
];

export default function LabsPage() {
  const router = useRouter();
  const { theme, setTheme } = usePortalStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "Planetary Science", "Astrophysics", "Aerospace Engineering", "Radio Science", "Cosmology & Relativity"];

  const filteredModules = LAB_MODULES.filter((mod) => {
    const matchesCategory = selectedCategory === "All" || mod.category === selectedCategory;
    const matchesSearch =
      mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.concept.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
              <FlaskConical className="w-5 h-5 text-zinc-200" />
              <h1 className="text-sm font-extrabold tracking-wider uppercase font-outfit text-white">Science Laboratories</h1>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 text-xs font-mono font-bold uppercase tracking-widest">
            <FlaskConical size={14} /> Modular Scientific Suite
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Interactive <span className="text-zinc-400">Science Laboratories</span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Access dedicated interactive physics engines, orbital mechanics tools, exoplanet light curve solvers, and radio astronomy simulators.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-white text-black shadow-lg"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Filter lab modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-9 pr-4 py-2 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          </div>
        </div>

        {/* Lab Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((mod) => (
            <div
              key={mod.id}
              className="border border-zinc-800 bg-zinc-950/80 p-6 rounded-2xl flex flex-col justify-between hover:border-zinc-600 transition-all group shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    {mod.icon}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
                      MOD {mod.num}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                    {mod.category}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1 group-hover:text-zinc-300 transition-colors">
                    {mod.title}
                  </h3>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {mod.concept}
                </p>

                <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
                  <span className="text-zinc-300 font-bold">TECH:</span> {mod.tech}
                </div>
              </div>

              <div className="pt-6">
                <Link
                  href={mod.href}
                  className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>LAUNCH LABORATORY</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
