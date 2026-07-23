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
import SentientMeshCanvas from "@/components/SentientMeshCanvas";
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
  useSentientMesh?: boolean;
  meshShape?: string;
  svgUrl?: string;
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
    image: "",
    useSentientMesh: true,
    meshShape: "svg",
    svgUrl: "/svgs/eclipse-geometry.svg",
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
    image: "",
    useSentientMesh: true,
    meshShape: "svg",
    svgUrl: "/svgs/solar-system-orbit.svg",
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
    image: "",
    useSentientMesh: true,
    meshShape: "svg",
    svgUrl: "/svgs/exoplanet-transit.svg",
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
    image: "",
    useSentientMesh: true,
    meshShape: "svg",
    svgUrl: "/svgs/gravity-slingshot.svg",
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
    image: "",
    useSentientMesh: true,
    meshShape: "svg",
    svgUrl: "/svgs/rocket-trajectory.svg",
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
    image: "",
    useSentientMesh: true,
    meshShape: "svg",
    svgUrl: "/svgs/satellite-tracker.svg",
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
    image: "",
    useSentientMesh: true,
    meshShape: "svg",
    svgUrl: "/svgs/radio-interferometer.svg",
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
    image: "",
    useSentientMesh: true,
    meshShape: "svg",
    svgUrl: "/svgs/atmospheric-drag.svg",
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
    <div className="min-h-screen bg-black light:bg-white text-zinc-100 light:text-zinc-900 font-sans">
      <UniversalNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* STELLAR YELLOW MISSION BANNER FOR SCIENCE LABS (CENTERED & MINIMALIST) */}
        <section className="mb-12">
          <div className="bg-[#FFEA4B] rounded-[2.5rem] p-10 sm:p-16 text-black shadow-2xl relative overflow-hidden text-center">
            {/* Centered Non-Interactable Black Low-Poly-Fabric Sentient Mesh Background */}
            <div className="absolute inset-0 w-full h-full pointer-events-none opacity-25 mix-blend-multiply z-0">
              <SentientMeshCanvas
                activeObject="low-poly-fabric"
                themeColor="#000000"
                darkMode={false}
                bgColor="bg-transparent"
                autoRotate={false}
                interactive={false}
                complexity="low"
              />
            </div>

            <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.06] pointer-events-none" />
            <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
              <span className="inline-block text-xs font-mono font-bold uppercase tracking-widest text-black/80 bg-black/10 px-4 py-1.5 rounded-full">
                Modular Science Labs
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Hands-On Astrophysical & Engineering Simulators
              </h2>
              <p className="text-base sm:text-lg text-zinc-900 leading-relaxed font-medium">
                Our Modular Science Labs allow students and researchers to perform hands-on virtual experiments—from deriving exoplanet transit light curves and executing gravitational slingshot assists to modeling rocket drag ballistics and radio telescope aperture synthesis.
              </p>
            </div>
          </div>
        </section>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#FFEA4B] text-black shadow-lg shadow-[#FFEA4B]/20"
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
              useSentientMesh={mod.useSentientMesh}
              meshShape={mod.meshShape}
              svgUrl={mod.svgUrl}
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
