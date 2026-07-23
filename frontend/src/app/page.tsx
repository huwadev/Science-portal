"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import { usePortalStore } from "@/store/usePortalStore";
import {
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Menu,
  X,
  ExternalLink,
  Rocket,
  Globe,
  Sparkles,
  ArrowRight,
  FlaskConical,
  BookOpen,
  Layers,
  Orbit
} from "lucide-react";
import SiteCard from "@/components/SiteCard";
import SentientMeshCanvas from "@/components/SentientMeshCanvas";
import UniversalNavbar from "@/components/UniversalNavbar";
import UniversalFooter from "@/components/UniversalFooter";

interface CarouselApp {
  id: string;
  title: string;
  titleAm: string;
  badge: string;
  oneSentenceDesc: string;
  oneSentenceDescAm: string;
  image: string;
  link: string;
  meshShape?: string;
  svgUrl?: string;
  icon: React.ElementType;
}

const TOP_CAROUSEL_APPS: CarouselApp[] = [
  {
    id: "walk-in-solar-system",
    title: "Walk in the Solar System",
    titleAm: "በሶላር ሲስተም ውስጥ ጉዞ",
    badge: "3D Navigation",
    oneSentenceDesc: "An immersive 3D simulation of planets, moons, and their orbits—bringing Hewa+ app functionalities directly to your browser for interactive space learning.",
    oneSentenceDescAm: "በይነተገናኝ የስፔስ ትምህርት የHewa+ መተግበሪያን ተግባራት ወደ ማሰሻዎ በቀጥታ የሚያመጣ የፕላኔቶች እና የጨረቃዎች 3D ሲሙሌሽን።",
    image: "/images/1D4A3091.MOV 8_7_2025 3_14_19 PM.png",
    link: "/modules/walk-in-solar-system",
    meshShape: "svg",
    svgUrl: "/svgs/solar-system-orbit.svg",
    icon: Orbit
  },
  {
    id: "lunar-explorer",
    title: "3D Lunar Explorer",
    titleAm: "3D የጨረቃ ዳሰሳ",
    badge: "Topography",
    oneSentenceDesc: "Zoom into historic landing sites, inspect topography, and examine high-resolution Lunar Reconnaissance Orbiter telemetry in full 3D.",
    oneSentenceDescAm: "የጨረቃን ወለል ታሪካዊ ቦታዎች፣ ተራሮች እና የናሳ መረጃዎችን በ3D ዝርዝር ይመልከቱ።",
    image: "/images/1D4A3209.png",
    link: "/modules/lunar-explorer",
    meshShape: "sphere",
    icon: Moon
  },
  {
    id: "eclipses-transits",
    title: "Solar & Lunar Eclipse Predictor",
    titleAm: "የፀሐይ እና የጨረቃ ግርዶሽ ትንበያ",
    badge: "Ephemerides",
    oneSentenceDesc: "Calculate exact shadow paths, penumbral coverage, and local obscurations so you never miss another solar or lunar eclipse.",
    oneSentenceDescAm: "የፀሐይ እና የጨረቃ ግርዶሽ የአካባቢውን መቶኛ እና ጥላ መንገድ በትክክል በማስላት ግርዶሾችን መቼም እንዳያመልጥዎት።",
    image: "/images/1D4A3251.png",
    link: "/modules/eclipses-transits",
    meshShape: "hyperboloid",
    icon: Sun
  }
];

export default function Home() {
  const router = useRouter();
  const { theme, setTheme, language, setLanguage } = usePortalStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Top Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Sync initial theme class on document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }, [theme]);

  // Register PWA Service Worker (Only in Production)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        const registerSW = () => {
          navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => console.log("Service Worker registered successfully with scope:", reg.scope))
            .catch((err) => console.error("Service Worker registration failed:", err));
        };

        if (document.readyState === "complete") {
          registerSW();
        } else {
          window.addEventListener("load", registerSW);
          return () => window.removeEventListener("load", registerSW);
        }
      } else {
        // In Development mode, unregister active service workers to prevent Turbopack HMR ChunkLoadError & reload loops
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
    }
  }, []);

  // Sync language change inside app.js back to Zustand store
  useEffect(() => {
    const syncLanguage = () => {
      const currentLang = localStorage.getItem("esss_science_lang") || "en";
      setLanguage(currentLang as "en" | "am");
    };

    syncLanguage();

    const langBtn = document.getElementById("lang-btn");
    langBtn?.addEventListener("click", syncLanguage);
    return () => {
      langBtn?.removeEventListener("click", syncLanguage);
    };
  }, [setLanguage]);

  // Intercept all module launch links for Next.js client routing
  useEffect(() => {
    const handleInterceptClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link) {
        const href = link.getAttribute("href");
        if (href && (href.includes("modules/") || href.includes("index.html"))) {
          e.preventDefault();
          const match = href.match(/modules\/([^/]+)/);
          if (match) {
            router.push(`/modules/${match[1]}`);
          }
        }
      }
    };

    document.addEventListener("click", handleInterceptClick);
    return () => {
      document.removeEventListener("click", handleInterceptClick);
    };
  }, [router]);

  // Run original legacy scripts if available
  useEffect(() => {
    let active = true;

    const runInit = () => {
      if (!active) return;
      const renderFn = (window as any).renderModuleDashboard;
      const initFn = (window as any).initApp;

      if (typeof renderFn === "function" && typeof initFn === "function") {
        renderFn();
        initFn();
      } else {
        setTimeout(runInit, 50);
      }
    };

    runInit();

    return () => {
      active = false;
    };
  }, []);

  // Carousel Auto-play & Progress Timer
  useEffect(() => {
    if (isCarouselPaused) return;

    setProgress(0);
    const interval = 50;
    const totalDuration = 6000;
    const step = (interval / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCarouselIndex((curr) => (curr + 1) % TOP_CAROUSEL_APPS.length);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isCarouselPaused, carouselIndex]);

  const handleNextCarousel = useCallback(() => {
    setCarouselIndex((prev) => (prev + 1) % TOP_CAROUSEL_APPS.length);
  }, []);

  const handlePrevCarousel = useCallback(() => {
    setCarouselIndex((prev) => (prev - 1 + TOP_CAROUSEL_APPS.length) % TOP_CAROUSEL_APPS.length);
  }, []);

  const handleSelectLanguage = (lang: "en" | "am") => {
    setLanguage(lang);
    localStorage.setItem("esss_science_lang", lang);
    setIsLangDropdownOpen(false);
    // Dispatch event for legacy app.js
    const event = new Event("storage");
    window.dispatchEvent(event);
  };

  return (
    <>
      {/* Hidden DOM elements to satisfy legacy app.js script queries */}
      <div className="hidden" aria-hidden="true">
        <button id="lang-btn"></button>
        <span id="lang-en"></span>
        <span id="lang-am"></span>
      </div>

      {/* UNIVERSAL ESSS ECOSYSTEM NAVBAR */}
      <UniversalNavbar onOpenSearch={() => setIsSearchOpen(true)} />

      {/* PERFECTLY CENTERED SPOTLIGHT SEARCH MODAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden p-8 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-6">
              <div className="flex items-center gap-4 w-full">
                <Search className="w-6 h-6 text-zinc-400 flex-shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search space applications, science labs, or articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-zinc-100 text-lg placeholder-zinc-500 outline-none font-sans"
                />
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                QUICK NAVIGATION
              </span>
              <div className="grid grid-cols-2 gap-4 font-sans text-sm">
                <Link href="/apps" onClick={() => setIsSearchOpen(false)} className="p-4 px-6 rounded-full bg-zinc-900/80 border border-white/10 hover:border-white/30 hover:bg-zinc-800/80 transition-all flex items-center justify-between text-zinc-200 hover:text-white shadow-md font-semibold">
                  <span>Space Apps Suite</span>
                  <ArrowRight size={16} />
                </Link>
                <Link href="/labs" onClick={() => setIsSearchOpen(false)} className="p-4 px-6 rounded-full bg-zinc-900/80 border border-white/10 hover:border-white/30 hover:bg-zinc-800/80 transition-all flex items-center justify-between text-zinc-200 hover:text-white shadow-md font-semibold">
                  <span>Science Labs</span>
                  <ArrowRight size={16} />
                </Link>
                <Link href="/blogs" onClick={() => setIsSearchOpen(false)} className="p-4 px-6 rounded-full bg-zinc-900/80 border border-white/10 hover:border-white/30 hover:bg-zinc-800/80 transition-all flex items-center justify-between text-zinc-200 hover:text-white shadow-md font-semibold">
                  <span>Publications</span>
                  <ArrowRight size={16} />
                </Link>
                <Link href="/about" onClick={() => setIsSearchOpen(false)} className="p-4 px-6 rounded-full bg-zinc-900/80 border border-white/10 hover:border-white/30 hover:bg-zinc-800/80 transition-all flex items-center justify-between text-zinc-200 hover:text-white shadow-md font-semibold">
                  <span>About ESSS</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 1. SPACE APPS HERO CAROUSEL */}
      <section
        className="relative w-full overflow-hidden bg-black text-white group/carousel"
        onMouseEnter={() => setIsCarouselPaused(true)}
        onMouseLeave={() => setIsCarouselPaused(false)}
      >
        <div className="relative min-h-[580px] sm:min-h-[620px] w-full flex items-center">
          <AnimatePresence mode="wait">
            {TOP_CAROUSEL_APPS.map((app, index) => {
              if (index !== carouselIndex) return null;
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 w-full h-full flex items-center"
                >
                  {/* Full-Bleed Sentient Mesh Background (No photo, no secondary container) */}
                  <div className="absolute inset-0 w-full h-full pointer-events-none">
                    <SentientMeshCanvas activeObject={app.meshShape} svgUrl={app.svgUrl} autoRotate={false} />
                  </div>

                  {/* Dark Gradient Overlay for text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none z-10" />

                  {/* Content Layer with Inset Side Margins (Clears Nav Arrows) */}
                  <div
                    style={{ paddingLeft: "6rem", paddingRight: "6rem", paddingTop: "5rem", paddingBottom: "5rem" }}
                    className="relative max-w-7xl mx-auto z-20 w-full flex flex-col justify-end"
                  >
                    <div className="max-w-2xl space-y-6">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900/90 border border-white/15 text-zinc-200 text-xs font-mono font-bold uppercase tracking-widest rounded-xl backdrop-blur-md">
                        <Rocket size={14} /> {app.badge}
                      </div>

                      <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight drop-shadow-2xl">
                        {language === "am" ? app.titleAm : app.title}
                      </h1>

                      <p className="text-base sm:text-xl text-zinc-300 leading-relaxed font-normal max-w-xl">
                        {language === "am" ? app.oneSentenceDescAm : app.oneSentenceDesc}
                      </p>

                      <div className="pt-4 flex items-center gap-4">
                        <Link
                          href={app.link}
                          className="group/btn relative inline-flex items-center justify-between gap-4 px-8 py-3.5 rounded-full bg-zinc-950/90 light:bg-zinc-100 border border-white/25 light:border-zinc-300 hover:!bg-[#FFEA4B] light:hover:!bg-[#FFEA4B] hover:!border-[#FFEA4B] light:hover:!border-[#FFEA4B] transition-all duration-200 shadow-2xl cursor-pointer"
                        >
                          <span className="text-xs font-mono font-bold tracking-widest uppercase text-white light:text-zinc-900 group-hover/btn:!text-black transition-colors duration-200">
                            LAUNCH APPLICATION
                          </span>
                          <div className="flex items-center justify-center w-6 h-6">
                            <svg
                              className="w-5 h-5 text-white group-hover/btn:hidden transition-all duration-300"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="7" y1="17" x2="17" y2="7" />
                              <polyline points="7 7 17 7 17 17" />
                            </svg>
                            <svg
                              className="w-5 h-5 text-black hidden group-hover/btn:block transition-all duration-300"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="4" y1="12" x2="20" y2="12" />
                              <polyline points="13 5 20 12 13 19" />
                            </svg>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Nav Controls */}
          <button
            onClick={handlePrevCarousel}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-full bg-zinc-900/70 hover:bg-zinc-900 border border-white/15 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg"
            aria-label="Previous Slide"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNextCarousel}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-full bg-zinc-900/70 hover:bg-zinc-900 border border-white/15 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg"
            aria-label="Next Slide"
          >
            <ChevronRight size={24} />
          </button>

          {/* Ultra-Thin Gradient Progress Bar Line */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10 z-30">
            <div
              className="h-full bg-gradient-to-r from-transparent via-[#FFEA4B] to-[#FFF7B8] transition-all ease-linear shadow-[0_0_10px_#FFEA4B]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* ICON THUMBNAIL INDICATORS */}
          <div className="absolute bottom-8 right-12 z-30 hidden lg:flex items-center gap-3">
            {TOP_CAROUSEL_APPS.map((app, idx) => {
              const IconComponent = app.icon as React.ComponentType<{ className?: string }>;
              const isActive = idx === carouselIndex;
              return (
                <button
                  key={app.id}
                  onClick={() => setCarouselIndex(idx)}
                  style={{ width: "48px", height: "48px", borderRadius: "50%" }}
                  className={`relative flex items-center justify-center transition-all cursor-pointer backdrop-blur-md ${
                    isActive
                      ? "bg-[#FFEA4B] text-black border-2 border-[#FFEA4B] scale-110 shadow-lg shadow-[#FFEA4B]/40 font-bold"
                      : "bg-zinc-900/80 border border-white/20 text-zinc-400 hover:text-white hover:border-white/40 hover:bg-zinc-800"
                  }`}
                  title={app.title}
                >
                  <IconComponent className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. STELLAR YELLOW MISSION BANNER (SPACIOUS & ELEGANT) */}
      <section className="my-20 sm:my-28 max-w-7xl mx-auto px-4 sm:px-8">
        <div className="bg-[#FFEA4B] rounded-[2.5rem] p-10 sm:p-20 text-black shadow-2xl relative overflow-hidden">
          {/* Centered Non-Interactable Black Low-Poly-Fabric Sentient Mesh Background */}
          <div className="absolute inset-0 w-full h-full pointer-events-none opacity-25 mix-blend-multiply z-0">
            <SentientMeshCanvas
              activeObject="low-poly-fabric"
              themeColor="#000000"
              darkMode={false}
              bgColor="bg-transparent"
              autoRotate={false}
            />
          </div>

          {/* Subtle sci-fi grid overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] pointer-events-none" />

          <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
            <h2 className="text-4xl sm:text-6xl font-black text-black tracking-tight leading-[1.1]">
              Democratizing Space Science <br />
              <span className="font-normal opacity-80">For Everyone, Everywhere</span>
            </h2>

            <p className="text-base sm:text-xl text-zinc-900 leading-relaxed font-medium max-w-2xl mx-auto">
              Welcome to the ESSS Science Portal — a free interactive learning environment built by the Ethiopian Space Science Society to make space science intuitive and accessible for students, educators, and space enthusiasts.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-5">
              <Link href="/apps" className="px-8 py-4 rounded-full bg-black text-white hover:bg-zinc-800 font-bold text-xs tracking-widest uppercase transition-all shadow-xl cursor-pointer flex items-center gap-3 hover:scale-105">
                <span>Launch Space Apps</span>
                <ArrowRight size={16} />
              </Link>
              <Link href="/labs" className="px-8 py-4 rounded-full border-2 border-black hover:bg-black/10 text-black font-bold text-xs tracking-widest uppercase transition-all cursor-pointer hover:scale-105">
                Explore Science Labs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURE STORY 1: IMAGE LEFT, TEXT RIGHT (Student & Classroom Learning) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-20 sm:py-28 border-t border-zinc-800/40 light:border-zinc-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-center">
          {/* Image Container with Local Asset, B&W to Color/Yellow Glow Hover */}
          <div className="lg:col-span-6 group relative rounded-[2rem] overflow-hidden border border-zinc-800 light:border-zinc-200 shadow-2xl cursor-pointer">
            <img
              src="/images/1D4A3209.png"
              alt="Students Learning Space Science"
              className="w-full h-[400px] sm:h-[480px] object-cover filter grayscale contrast-125 brightness-95 group-hover:grayscale-0 group-hover:contrast-110 transition-all duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[#FFEA4B]/0 group-hover:bg-[#FFEA4B]/25 transition-all duration-700 pointer-events-none mix-blend-overlay" />
            <div className="absolute top-6 left-6 z-10">
              <span className="px-4 py-1.5 rounded-full bg-black/85 text-[#FFEA4B] text-xs font-mono font-bold uppercase tracking-widest backdrop-blur-md">
                Student Learning
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-[#FFEA4B] light:text-[#3C3318] uppercase tracking-widest">Hands-On Space Education</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white light:text-zinc-900 tracking-tight leading-tight">
                Bringing Space Science <br />
                <span className="text-zinc-400 light:text-zinc-500 font-normal">To Ethiopian Classrooms</span>
              </h2>
            </div>
            <p className="text-base sm:text-lg text-zinc-300 light:text-zinc-700 leading-relaxed">
              Our interactive 3D simulators empower students, teachers, and space school clubs across Ethiopia to explore orbital physics, lunar topography, and astronomical principles hands-on directly in their web browsers.
            </p>
            <div className="pt-2">
              <Link
                href="/modules/lunar-explorer"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white light:bg-zinc-900 text-black light:text-white font-mono font-bold text-xs uppercase tracking-widest hover:bg-[#FFEA4B] light:hover:bg-[#FFEA4B] light:hover:text-black transition-all cursor-pointer shadow-xl hover:scale-105"
              >
                <span>Explore Lunar Simulator</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED SPACE APPS GRID SHOWCASE (PART 1) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-14">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-zinc-400 light:text-zinc-500 uppercase tracking-widest">Interactive Simulators</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white light:text-zinc-900 tracking-tight">
              Featured <span className="text-zinc-400 light:text-zinc-500 font-normal">Space Applications</span>
            </h2>
          </div>
          <Link
            href="/apps"
            className="group flex items-center gap-2 text-xs font-mono font-bold text-white light:text-[#3C3318] hover:text-[#FFEA4B] light:hover:text-[#FFEA4B] transition-colors"
          >
            <span>VIEW ALL APPLICATIONS</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          <SiteCard
            title="Walk in the Solar System"
            description="Navigate our cosmic neighborhood with accurate 3D orbital physics and scaled planetary bodies."
            image=""
            useSentientMesh={true}
            meshShape="svg"
            svgUrl="/svgs/solar-system-orbit.svg"
            href="/modules/walk-in-solar-system"
            badge="3D Navigation"
            category="Navigators"
            aspectRatio="h-[340px]"
          />
          <SiteCard
            title="3D Lunar Explorer"
            description="Inspect high-resolution lunar topography, crater formations, and Lunar Reconnaissance Orbiter telemetry."
            image=""
            useSentientMesh={true}
            meshShape="svg"
            svgUrl="/svgs/lunar-topography.svg"
            href="/modules/lunar-explorer"
            badge="Topography"
            category="Exploration"
            aspectRatio="h-[340px]"
          />
          <SiteCard
            title="Solar & Lunar Eclipse Predictor"
            description="Calculate totality pathways, penumbral coverage, and local obscuration statistics."
            image=""
            useSentientMesh={true}
            meshShape="svg"
            svgUrl="/svgs/eclipse-geometry.svg"
            href="/modules/eclipses-transits"
            badge="Ephemerides"
            category="Calculators"
            aspectRatio="h-[340px]"
          />
        </div>
      </section>

      {/* 5. FEATURE STORY 2: FULL WIDTH, TEXT LEFT, BLACK & WHITE IMAGE RIGHT WITH LEFT BLENDING GRADIENT */}
      <section className="w-full relative overflow-hidden py-20 sm:py-28 border-t border-zinc-800/40 light:border-zinc-200 bg-black light:bg-white">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Left Text Content */}
          <div className="lg:col-span-6 px-6 sm:px-12 lg:pl-16 xl:pl-24 lg:pr-8 py-8 space-y-8 order-2 lg:order-1 z-20">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-[#FFEA4B] light:text-[#3C3318] uppercase tracking-widest">Astronomy Clubs & Community</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white light:text-zinc-900 tracking-tight leading-tight">
                Empowering Space Enthusiasts <br />
                <span className="text-zinc-400 light:text-zinc-500 font-normal">& Young Researchers</span>
              </h2>
            </div>
            <p className="text-base sm:text-lg text-zinc-300 light:text-zinc-700 leading-relaxed max-w-xl">
              From calculating local solar eclipse totality pathways over East Africa to tracking low Earth orbit satellites in real time, the ESSS Science Portal equips space enthusiasts and university students with high-precision research tools.
            </p>
            <div className="pt-2">
              <Link
                href="/modules/eclipses-transits"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white light:bg-zinc-900 text-black light:text-white font-mono font-bold text-xs uppercase tracking-widest hover:bg-[#FFEA4B] light:hover:bg-[#FFEA4B] light:hover:text-black transition-all cursor-pointer shadow-xl hover:scale-105"
              >
                <span>Launch Eclipse Predictor</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Right Image Container (Full Width, Strictly Black & White with Left-Blending Gradient) */}
          <div className="lg:col-span-6 relative w-full h-[400px] sm:h-[500px] lg:h-[580px] overflow-hidden order-1 lg:order-2">
            <img
              src="/images/1D4A3251.png"
              alt="Space Enthusiasts Collaborating"
              className="w-full h-full object-cover filter grayscale contrast-125 brightness-90"
            />
            {/* Left-to-Right Blending Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent light:from-white light:via-white/60 light:to-transparent pointer-events-none z-10" />
          </div>
        </div>
      </section>

      {/* 6. FEATURED SCIENCE LAB MODULES SHOWCASE (BETWEEN 2ND AND 3RD PICTURE) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-16 sm:py-24 border-t border-zinc-800/40 light:border-zinc-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-14">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-zinc-400 light:text-zinc-500 uppercase tracking-widest">Modular Lab Suites</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white light:text-zinc-900 tracking-tight">
              Science Lab <span className="text-zinc-400 light:text-zinc-500 font-normal">Modules</span>
            </h2>
          </div>
          <Link
            href="/labs"
            className="group flex items-center gap-2 text-xs font-mono font-bold text-white light:text-[#3C3318] hover:text-[#FFEA4B] light:hover:text-[#FFEA4B] transition-colors"
          >
            <span>EXPLORE ALL LABS</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-10">
          {/* Card 1 testing the Sentient Mesh default cover! */}
          <SiteCard
            title="Exoplanet Transit Light Curve Lab"
            description="Simulate planetary transits across distant host stars to plot transit light dimming curves and derive orbital radii."
            image=""
            useSentientMesh={true}
            meshShape="svg"
            svgUrl="/svgs/exoplanet-transit.svg"
            href="/modules/exoplanet-lab"
            badge="MOD 01"
            category="Astrophysics"
            aspectRatio="h-[340px]"
          />
          <SiteCard
            title="Gravitational Slingshot Sandbox"
            description="Launch a deep space probe past moving gas giants to execute gravity assist maneuvers and alter heliocentric velocity vectors."
            image=""
            useSentientMesh={true}
            meshShape="svg"
            svgUrl="/svgs/gravity-slingshot.svg"
            href="/modules/slingshot-sandbox"
            badge="MOD 02"
            category="Astrophysics"
            aspectRatio="h-[340px]"
          />
          <SiteCard
            title="Radio Aperture Synthesis Visualizer"
            description="Arrange radio telescope antenna baselines to observe how array geometry dictates UV plane sampling and synthesized beam resolution."
            image=""
            useSentientMesh={true}
            meshShape="svg"
            svgUrl="/svgs/radio-interferometer.svg"
            href="/modules/aperture-synthesis"
            badge="MOD 05"
            category="Radio Science"
            aspectRatio="h-[340px]"
          />
          <SiteCard
            title="LEO Satellite Pass & Doppler Calculator"
            description="Predict satellite footprint visibility, calculate ground station passes, and model real-time radio frequency Doppler shifts."
            image=""
            useSentientMesh={true}
            meshShape="svg"
            svgUrl="/svgs/satellite-tracker.svg"
            href="/modules/satellite-doppler"
            badge="MOD 04"
            category="Aerospace Engineering"
            aspectRatio="h-[340px]"
          />
        </div>
      </section>

      {/* 7. FEATURE STORY 3: IMAGE LEFT, TEXT RIGHT (Making Science Hands-On & Interactive) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-20 sm:py-28 border-t border-zinc-800/40 light:border-zinc-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-center">
          {/* Image Container with Local Asset, B&W to Color/Yellow Glow Hover */}
          <div className="lg:col-span-6 group relative rounded-[2rem] overflow-hidden border border-zinc-800 light:border-zinc-200 shadow-2xl cursor-pointer">
            <img
              src="/images/1D4A3091.MOV 8_7_2025 3_14_19 PM.png"
              alt="Making Science Hands-On & Interactive"
              className="w-full h-[400px] sm:h-[480px] object-cover filter grayscale contrast-125 brightness-95 group-hover:grayscale-0 group-hover:contrast-110 transition-all duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[#FFEA4B]/0 group-hover:bg-[#FFEA4B]/25 transition-all duration-700 pointer-events-none mix-blend-overlay" />
            <div className="absolute top-6 left-6 z-10">
              <span className="px-4 py-1.5 rounded-full bg-black/85 text-[#FFEA4B] text-xs font-mono font-bold uppercase tracking-widest backdrop-blur-md">
                Hands-On Learning
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-[#FFEA4B] light:text-[#3C3318] uppercase tracking-widest">Bridging the Gap</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white light:text-zinc-900 tracking-tight leading-tight">
                Making Science Hands-On <br />
                <span className="text-zinc-400 light:text-zinc-500 font-normal">& Truly Interactive</span>
              </h2>
            </div>
            <p className="text-base sm:text-lg text-zinc-300 light:text-zinc-700 leading-relaxed">
              By bringing complex astrophysical simulations, 3D orbital mechanics, and real satellite telemetry into an intuitive web platform—built with functionalities adapted from the official Hewa+ app—the ESSS Science Portal bridges the gap between theoretical textbook formulas and practical, visual discovery.
            </p>
            <div className="pt-2">
              <Link
                href="/apps"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white light:bg-zinc-900 text-black light:text-white font-mono font-bold text-xs uppercase tracking-widest hover:bg-[#FFEA4B] light:hover:bg-[#FFEA4B] light:hover:text-black transition-all cursor-pointer shadow-xl hover:scale-105"
              >
                <span>Explore Interactive Apps</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* UNIVERSAL ESSS ECOSYSTEM FOOTER */}
      <UniversalFooter />

      {/* Load original legacy script files */}
      <Script src="/modules-data.js" strategy="lazyOnload" />
      <Script src="/app.js" strategy="lazyOnload" />
    </>
  );
}
