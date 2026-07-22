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
import SiteCard from "@/components/SiteCard";
import UniversalNavbar from "@/components/UniversalNavbar";
import UniversalFooter from "@/components/UniversalFooter";

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
  image: string;
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
    image: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=600&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=600&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=600&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?q=80&w=600&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=600&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=600&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
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
    <div className="min-h-screen bg-black light:bg-white text-zinc-100 light:text-zinc-900 transition-colors duration-200 font-sans">
      <UniversalNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-700 light:border-zinc-200 bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 text-xs font-mono font-bold uppercase tracking-widest">
            <FlaskConical size={14} /> Modular Scientific Suite
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white light:text-zinc-900">
            Interactive <span className="text-zinc-400 light:text-zinc-500">Science Laboratories</span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 light:text-zinc-600">
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
                    ? "bg-[#FBE04C] text-black shadow-lg shadow-[#FBE04C]/20"
                    : "bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:border-zinc-700 light:hover:border-zinc-300"
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
              className="w-full rounded-xl border border-zinc-800 light:border-zinc-300 bg-zinc-900 light:bg-zinc-100 pl-9 pr-4 py-2 text-xs font-medium text-white light:text-zinc-900 placeholder-zinc-500 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-600 light:focus:border-zinc-400 transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 light:text-zinc-400 w-4 h-4" />
          </div>
        </div>

        {/* Lab Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredModules.map((mod) => (
            <SiteCard
              key={mod.id}
              title={mod.title}
              description={mod.concept}
              image={mod.image}
              href={mod.href}
              badge={`MOD ${mod.num}`}
              category={mod.category}
              aspectRatio="h-[320px] sm:h-[360px]"
            />
          ))}
        </div>
      </main>
      <UniversalFooter />
    </div>
  );
}
