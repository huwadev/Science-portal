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
  Rocket,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import SiteCard from "@/components/SiteCard";
import SentientMeshCanvas from "@/components/SentientMeshCanvas";
import UniversalNavbar from "@/components/UniversalNavbar";
import UniversalFooter from "@/components/UniversalFooter";

interface SpaceApp {
  id: string;
  title: string;
  titleAm: string;
  badge: string;
  desc: string;
  image: string;
  link: string;
  category: string;
  features: string[];
  useSentientMesh?: boolean;
  meshShape?: string;
  svgUrl?: string;
}

const SPACE_APPS: SpaceApp[] = [
  {
    id: "walk-in-solar-system",
    title: "Walk in the Solar System",
    titleAm: "በሶላር ሲስተም ውስጥ ጉዞ",
    category: "Navigators",
    badge: "3D Interactive Map",
    desc: "Experience our neighborhood in space with an interactive 3D map. Explore accurate orbital mechanics, scaled celestial bodies, and physics-based planetary simulation.",
    image: "",
    useSentientMesh: true,
    meshShape: "svg",
    svgUrl: "/svgs/solar-system-orbit.svg",
    link: "/modules/walk-in-solar-system",
    features: ["Interactive 3D celestial navigation", "Accurate orbital scaling & trajectories", "Bilingual guidance & rich details"]
  },
  {
    id: "lunar-explorer",
    title: "3D Lunar Explorer",
    titleAm: "3D የጨረቃ ዳሰሳ",
    category: "Exploration",
    badge: "Topography & Orbits",
    desc: "Inspect high-resolution lunar topography, polar crater formations, real-time moon phase calculations, and LRO satellite orbital tracks.",
    image: "",
    useSentientMesh: true,
    meshShape: "svg",
    svgUrl: "/svgs/lunar-topography.svg",
    link: "/modules/lunar-explorer",
    features: ["3D lunar surface rendering", "LRO satellite polar orbit track", "DSN telemetry uplink simulation"]
  },
  {
    id: "eclipses-transits",
    title: "Solar & Lunar Eclipse Predictor",
    titleAm: "የፀሐይ እና የጨረቃ ግርዶሽ ትንበያ",
    category: "Calculators",
    badge: "Astronomical Calculations",
    desc: "Explore past and future solar and lunar eclipses. Inspect totality paths, penumbral coverage, and local obscuration details using our high-precision simulation engine.",
    image: "",
    useSentientMesh: true,
    meshShape: "svg",
    svgUrl: "/svgs/eclipse-geometry.svg",
    link: "/modules/eclipses-transits",
    features: ["Precision 2D/3D dynamic maps", "Custom local simulation & stats", "Syzygy shadow geometry solver"]
  }
];

export default function AppsPage() {
  const router = useRouter();
  const { theme, setTheme, language } = usePortalStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "Navigators", "Exploration", "Calculators"];

  const filteredApps = SPACE_APPS.filter((app) => {
    const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
    const matchesSearch =
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-black light:bg-white text-zinc-100 light:text-zinc-900 font-sans">
      <UniversalNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* STELLAR YELLOW MISSION BANNER FOR SPACE APPS (CENTERED & MINIMALIST) */}
        <section className="mb-12">
          <div className="bg-[#FFEA4B] rounded-[2.5rem] p-10 sm:p-14 text-black shadow-2xl relative overflow-hidden text-center">
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
            <div className="relative z-10 space-y-3 max-w-2xl mx-auto">
              <span className="inline-block text-xs font-mono font-bold uppercase tracking-widest text-black/80 bg-black/10 px-4 py-1.5 rounded-full">
                Space Applications & Future Modules
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Interactive Space Visualizers
              </h2>
              <p className="text-sm sm:text-base text-zinc-900 leading-relaxed font-medium">
                Explore 3D space visualizers—Walk in the Solar System, 3D Lunar Explorer, and Solar & Lunar Eclipse Predictor—with new interactive applications continuously in development.
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
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 light:border-zinc-300 bg-zinc-900 light:bg-zinc-100 pl-9 pr-4 py-2 text-xs font-medium text-white light:text-zinc-900 placeholder-zinc-500 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-600 light:focus:border-zinc-400 transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 light:text-zinc-400 w-4 h-4" />
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredApps.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SiteCard
                title={language === "am" ? app.titleAm : app.title}
                description={app.desc}
                image={app.image}
                useSentientMesh={app.useSentientMesh}
                meshShape={app.meshShape}
                svgUrl={app.svgUrl}
                href={app.link}
                badge={app.badge}
                category={app.category}
                aspectRatio="h-[320px] sm:h-[360px]"
              />
            </motion.div>
          ))}
        </div>
      </main>
      <UniversalFooter />
    </div>
  );
}
