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
}

const SPACE_APPS: SpaceApp[] = [
  {
    id: "walk-in-solar-system",
    title: "Walk in the Solar System",
    titleAm: "በሶላር ሲስተም ውስጥ ጉዞ",
    category: "Navigators",
    badge: "3D Interactive Map",
    desc: "Experience our neighborhood in space with an interactive 3D map. Explore accurate orbital mechanics, scaled celestial bodies, and physics-based planetary simulation.",
    image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=600&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?q=80&w=600&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=600&auto=format&fit=crop",
    link: "/modules/eclipses-transits",
    features: ["Precision 2D/3D dynamic maps", "Custom local simulation & stats", "Syzygy shadow geometry solver"]
  },
  {
    id: "satellite-doppler",
    title: "Satellite Doppler Tracker",
    titleAm: "የሳተላይት ዶፕለር መከታተያ",
    category: "Telemetry",
    badge: "Orbital Telemetry",
    desc: "Track satellites in low Earth orbit, model Doppler radio frequency shifts during ground passes, and calculate pass times.",
    image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=600&auto=format&fit=crop",
    link: "/modules/satellite-doppler",
    features: ["Real-time Doppler shift curve", "AOS/LOS pass predictions", "Frequency offset graph"]
  },
  {
    id: "exoplanet-lab",
    title: "Exoplanet Transit & Radial Velocity Lab",
    titleAm: "የኤክሶፕላኔት ዳሰሳ ላብ",
    category: "Astrophysics",
    badge: "Astrophysics Lab",
    desc: "Simulate distant planetary transits across host stars and derive radial velocity wobbles and light curves for alien worlds.",
    image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop",
    link: "/modules/exoplanet-lab",
    features: ["Light curve generator", "Radial velocity graph", "Keplerian orbit parameter solver"]
  },
  {
    id: "orbital-mechanics",
    title: "Orbital Mechanics Lab",
    titleAm: "የኦርቢታል ሜካኒክስ ላብ",
    category: "Astrodynamics",
    badge: "Astrodynamics",
    desc: "Compute Hohmann transfer orbits, orbital eccentricity variations, delta-v burn maneuvers, and Keplerian orbital parameters.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
    link: "/modules/orbital-mechanics",
    features: ["Hohmann transfer calculator", "Delta-v requirement plot", "Keplerian orbit solver"]
  },
  {
    id: "rocket-ballistics",
    title: "Rocket Ballistics Simulator",
    titleAm: "የሮኬት ባሊስቲክስ ሲሙሌተር",
    category: "Engineering",
    badge: "Aerospace Sim",
    desc: "Simulate multi-stage rocket launches, atmospheric drag forces, thrust-to-weight ratios, and suborbital/orbital insertions.",
    image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?q=80&w=600&auto=format&fit=crop",
    link: "/modules/rocket-ballistics",
    features: ["Multi-stage rocket burn timeline", "Atmospheric drag density model", "Apogee & velocity profile"]
  },
  {
    id: "slingshot-sandbox",
    title: "Gravity Assist Slingshot Sandbox",
    titleAm: "የስበት ድጋፍ ግራቪቲ አሲስት ላብ",
    category: "Astrodynamics",
    badge: "Orbital Gravity",
    desc: "Execute gravity assist slingshot maneuvers around planets to boost probe velocity without expending fuel.",
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=600&auto=format&fit=crop",
    link: "/modules/slingshot-sandbox",
    features: ["Vector trajectory bending", "Velocity gain telemetry", "N-body gravitational solver"]
  },
  {
    id: "cosmic-ladder",
    title: "Cosmic Distance Ladder",
    titleAm: "የኮስሚክ ርቀት መሰላል",
    category: "Cosmology",
    badge: "Cosmology",
    desc: "Explore astronomical distance measurement methods from trigonometric parallax to Cepheid variables and Hubble redshift.",
    image: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=600&auto=format&fit=crop",
    link: "/modules/cosmic-ladder",
    features: ["Stellar parallax measurement", "Cepheid period-luminosity relation", "Hubble expansion redshift"]
  },
  {
    id: "aperture-synthesis",
    title: "Aperture Synthesis & Interferometry",
    titleAm: "የአፐርቸር ሲንቴሲስ ኢንተርፌሮሜትሪ",
    category: "Radio Science",
    badge: "Radio Astronomy",
    desc: "Simulate radio telescope baseline arrays, UV plane sampling coverage, and Fourier synthesis image reconstruction.",
    image: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=600&auto=format&fit=crop",
    link: "/modules/aperture-synthesis",
    features: ["UV plane baseline coverage", "Fourier transform synthesis", "Clean algorithm beam view"]
  }
];

export default function AppsPage() {
  const router = useRouter();
  const { theme, setTheme, language } = usePortalStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "Exploration", "Calculators", "Telemetry", "Astrophysics", "Astrodynamics", "Engineering", "Cosmology", "Radio Science"];

  const filteredApps = SPACE_APPS.filter((app) => {
    const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
    const matchesSearch =
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.desc.toLowerCase().includes(searchQuery.toLowerCase());
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
              <Rocket className="w-5 h-5 text-zinc-200" />
              <h1 className="text-sm font-extrabold tracking-wider uppercase font-outfit text-white">Space Applications Suite</h1>
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
            <Rocket size={14} /> Interactive Suite
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Space <span className="text-zinc-400">Applications</span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Explore 10 physics-based space simulators, orbital transfer calculators, satellite Doppler trackers, and exoplanet photometries.
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
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-9 pr-4 py-2 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="border border-zinc-800 bg-zinc-950/80 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-zinc-600 transition-all group shadow-xl"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={app.image}
                    alt={app.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  <span className="absolute top-3 left-3 px-3 py-1 bg-zinc-900/90 border border-zinc-700 text-zinc-200 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md backdrop-blur-md">
                    {app.badge}
                  </span>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="text-lg font-bold text-white group-hover:text-zinc-300 transition-colors">
                    {language === "am" ? app.titleAm : app.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-3">
                    {app.desc}
                  </p>

                  <div className="pt-2 space-y-1.5">
                    {app.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <ChevronRight className="w-3 h-3 text-zinc-300 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link
                  href={app.link}
                  className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>LAUNCH APPLICATION</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
