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
}

const TOP_CAROUSEL_APPS: CarouselApp[] = [
  {
    id: "walk-in-solar-system",
    title: "Walk in the Solar System",
    titleAm: "በሶላር ሲስተም ውስጥ ጉዞ",
    badge: "3D Navigation",
    oneSentenceDesc: "Navigate our cosmic neighborhood with accurate 3D orbital physics and scaled planetary bodies.",
    oneSentenceDescAm: "በትክክለኛ 3D ኦርቢታል ፊዚክስ በሶላር ሲስተም ውስጥ ይጓዙ።",
    image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1400&auto=format&fit=crop",
    link: "/modules/walk-in-solar-system"
  },
  {
    id: "lunar-explorer",
    title: "3D Lunar Explorer",
    titleAm: "3D የጨረቃ ዳሰሳ",
    badge: "Topography",
    oneSentenceDesc: "Inspect high-resolution lunar topography, crater formations, and Lunar Reconnaissance Orbiter telemetry.",
    oneSentenceDescAm: "የጨረቃ ወለል እና ኤል.አር.ኦ ሳተላይት ኦርቢትን በ3D ይመልከቱ።",
    image: "https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?q=80&w=1400&auto=format&fit=crop",
    link: "/modules/lunar-explorer"
  },
  {
    id: "eclipses-transits",
    title: "Solar & Lunar Eclipse Predictor",
    titleAm: "የፀሐይ እና የጨረቃ ግርዶሽ ትንበያ",
    badge: "Ephemerides",
    oneSentenceDesc: "Calculate totality pathways, penumbral coverage, and local obscuration statistics for past and future eclipses.",
    oneSentenceDescAm: "የፀሐይ እና የጨረቃ ግርዶሽ መንገዶችን እና ጊዜያትን በትክክል ይተንብዩ።",
    image: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=1400&auto=format&fit=crop",
    link: "/modules/eclipses-transits"
  },
  {
    id: "satellite-doppler",
    title: "Satellite Doppler Tracker",
    titleAm: "የሳተላይት ዶፕለር መከታተያ",
    badge: "Telemetry",
    oneSentenceDesc: "Track low Earth orbit satellites in real-time and compute ground station radio frequency Doppler shifts.",
    oneSentenceDescAm: "የሳተላይቶች የኦርቢት ጉዞ እና የሬዲዮ ዶፕለር ሽፍት በቅጽበት ይከታተሉ።",
    image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=1400&auto=format&fit=crop",
    link: "/modules/satellite-doppler"
  },
  {
    id: "exoplanet-lab",
    title: "Exoplanet Transit Light Curve Lab",
    titleAm: "የኤክሶፕላኔት ዳሰሳ ላብ",
    badge: "Astrophysics",
    oneSentenceDesc: "Simulate distant planetary transits across host stars to derive light dimming curves and radial velocity wobbles.",
    oneSentenceDescAm: "ከሶላር ሲስተም ውጪ ያሉ ፕላኔቶችን የብርሃን ቅናሽ ግራፍ ይስሉ እና ይመረምሩ።",
    image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1400&auto=format&fit=crop",
    link: "/modules/exoplanet-lab"
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
        className="relative w-full overflow-hidden bg-black text-white group"
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
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear group-hover:scale-103"
                    style={{ backgroundImage: `url(${app.image})` }}
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

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
                          className="group relative inline-flex items-center justify-between gap-4 px-8 py-3.5 rounded-full bg-zinc-950/90 border border-white/25 hover:bg-[#FBE04C] hover:border-[#FBE04C] transition-all duration-300 shadow-2xl cursor-pointer"
                        >
                          <span className="text-xs font-mono font-bold tracking-widest uppercase text-white group-hover:text-black transition-colors duration-300">
                            LAUNCH APPLICATION
                          </span>
                          <div className="flex items-center justify-center w-6 h-6">
                            <svg
                              className="w-5 h-5 text-white group-hover:hidden transition-all duration-300"
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
                              className="w-5 h-5 text-black hidden group-hover:block transition-all duration-300"
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

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900 z-30">
            <div
              className="h-full bg-white transition-all ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* CIRCLE THUMBNAIL PREVIEWS */}
          <div className="absolute bottom-8 right-12 z-30 hidden lg:flex items-center gap-3">
            {TOP_CAROUSEL_APPS.map((app, idx) => (
              <button
                key={app.id}
                onClick={() => setCarouselIndex(idx)}
                style={{ width: "64px", height: "64px", borderRadius: "50%" }}
                className={`relative overflow-hidden border-2 transition-all cursor-pointer shadow-xl ${
                  idx === carouselIndex ? "border-white scale-110 shadow-white/30" : "border-white/20 opacity-50 hover:opacity-100"
                }`}
                title={app.title}
              >
                <img src={app.image} alt={app.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. HERO SECTION WITH RESTORED 3D GRAVITY WELL RELATIVITY LATTICE & ANIMATED RADAR SIMULATION */}
      <section className="hero-section">
        <div className="container hero-wrapper">
          <div className="hero-content">
            <span className="hero-badge" data-i18n="hero_badge" id="hero-badge-txt">ESSS Science & Innovation</span>
            <h1 className="hero-title"><span className="text-gradient" data-i18n="hero_title" id="hero-title-txt">Ethiopian Space Science Society</span></h1>
            <p className="hero-subtitle" data-i18n="hero_subtitle" id="hero-subtitle-txt">Exploration, Innovation, and Inspiration for Africa's Space Future.</p>
            <div className="hero-actions">
              <a href="#featured-lunar" className="btn btn-primary" data-i18n="hero_cta" id="hero-cta-btn">Explore the Universe</a>
              <Link href="/apps" className="btn btn-secondary" data-i18n="hero_secondary" id="hero-secondary-btn">View Space Apps</Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="dashboard-wireframe">
              {/* ANIMATED RADAR SIMULATION LAYERS */}
              <div className="grid-overlay"></div>
              <div className="radar-sweep"></div>
              <div className="orbit-visualizer-container">
                <div className="dashboard-circle ring-outer"></div>
                <div className="dashboard-circle ring-mid"></div>
                <div className="dashboard-circle ring-inner"></div>
                <div className="pulsing-core"></div>
                <div className="orbiting-marker"></div>
              </div>

              <div className="telemetry-node top-left">
                <span className="telemetry-label">SYS.LAT</span>
                <span className="telemetry-val">9.0300° N</span>
              </div>
              <div className="telemetry-node top-right">
                <span className="telemetry-label">SYS.LON</span>
                <span className="telemetry-val">38.7400° E</span>
              </div>
              <div className="telemetry-node bottom-left">
                <span className="telemetry-label">ALT.ORBIT</span>
                <span className="telemetry-val" id="alt-val">628 KM</span>
              </div>
              <div className="telemetry-node bottom-right">
                <span className="telemetry-label">SPACE WX</span>
                <span className="telemetry-val" id="sw-val">Kp 2.0</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED SPACE APPS GRID SHOWCASE */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">// EXPLORE APPLICATIONS</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              Featured <span className="text-zinc-400">Space Applications</span>
            </h2>
          </div>
          <Link
            href="/apps"
            className="group flex items-center gap-2 text-xs font-mono font-bold text-white hover:text-[#FBE04C] transition-colors"
          >
            <span>VIEW ALL APPLICATIONS</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <SiteCard
            title="Walk in the Solar System"
            description="Navigate our cosmic neighborhood with accurate 3D orbital physics and scaled planetary bodies."
            image="https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=800&auto=format&fit=crop"
            href="/modules/walk-in-solar-system"
            badge="3D Navigation"
            category="Navigators"
            aspectRatio="h-[340px] sm:h-[380px]"
          />
          <SiteCard
            title="3D Lunar Explorer"
            description="Inspect high-resolution lunar topography, crater formations, and Lunar Reconnaissance Orbiter telemetry."
            image="https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?q=80&w=800&auto=format&fit=crop"
            href="/modules/lunar-explorer"
            badge="Topography"
            category="Exploration"
            aspectRatio="h-[340px] sm:h-[380px]"
          />
          <SiteCard
            title="Solar & Lunar Eclipse Predictor"
            description="Calculate totality pathways, penumbral coverage, and local obscuration statistics."
            image="https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=800&auto=format&fit=crop"
            href="/modules/eclipses-transits"
            badge="Ephemerides"
            category="Calculators"
            aspectRatio="h-[340px] sm:h-[380px]"
          />
        </div>
      </section>

      {/* 4. FEATURED PROJECTS SECTIONS (100% FULLY STYLED SCHEMATICS) */}
      <main className="main-content" id="apps">
        <div className="container">
          {/* FEATURED SECTION 1: 3D LUNAR EXPLORER */}
          <section className="featured-section" id="featured-lunar" style={{ marginBottom: "60px" }}>
            <div className="section-header text-center">
              <span className="section-tag" data-i18n="lunar_tag" id="lunar-tag-txt">Featured Space App</span>
              <h2 className="section-title"><span className="text-gradient" data-i18n="lunar_title_main" id="lunar-title-main-txt">3D Interactive Lunar Explorer</span></h2>
            </div>

            <div className="featured-card glass-panel">
              <div className="featured-info">
                <span className="status-badge live" data-i18n="status_active_lunar" id="status-active-lunar-txt">Space App</span>
                <h3 className="featured-project-title" data-i18n="lunar_title" id="lunar-title-txt">3D Interactive Lunar Explorer</h3>
                <p className="featured-project-desc" data-i18n="lunar_desc" id="lunar-desc-txt">
                  Inspect high-resolution lunar topography, crater formations, real-time moon phase calculations, and LRO satellite orbital tracking in an interactive 3D environment.
                </p>
                
                <div className="project-features">
                  <h4 className="features-heading" data-i18n="lunar_features_title" id="lunar-features-title-txt">Key Features:</h4>
                  <ul className="features-list">
                    <li>
                      <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span data-i18n="lunar_feat_1" id="lunar-feat-1-txt">3D Lunar Surface & Crater Topography</span>
                    </li>
                    <li>
                      <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span data-i18n="lunar_feat_2" id="lunar-feat-2-txt">LRO Satellite Polar Orbit Simulation</span>
                    </li>
                    <li>
                      <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span data-i18n="lunar_feat_3" id="lunar-feat-3-txt">Real-time Phase Telemetry & Illumination</span>
                    </li>
                  </ul>
                </div>

                <div className="featured-actions">
                  <a href="/modules/lunar-explorer" className="btn btn-primary btn-large btn-icon" id="lunar-launch-btn">
                    <span data-i18n="lunar_button" id="lunar-button-txt">Launch Lunar Explorer</span>
                    <svg className="btn-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </a>
                </div>
              </div>

              <div className="featured-visual-container">
                <div className="lunar-schematic">
                  <div className="schematic-moon-large">
                    <div className="moon-crater crater-1"></div>
                    <div className="moon-crater crater-2"></div>
                    <div className="moon-crater crater-3"></div>
                    <div className="moon-crater crater-4"></div>
                    <div className="moon-crater crater-5"></div>
                  </div>
                  <div className="orbit-lro">
                    <div className="satellite-marker">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.5 4.5l-2-2L9.2 8.8l-1.3-.7-1.4 1.4 2.8 2.8-5.3 5.3 1.4 1.4 5.3-5.3 2.8 2.8 1.4-1.4-.7-1.3 6.3-6.3-2-2-1.3.7-3.8-3.8.7-1.3zM15 8.3L10.7 4 12 2.7l4.3 4.3L15 8.3zm-6.7 6.7L4 10.7 2.7 12l4.3 4.3 1.3-1.3z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="visual-panel-telemetry">
                  <div className="telemetry-bar">
                    <span className="lbl">DSN UPLINK</span>
                    <span className="val">NOMINAL 🟢</span>
                  </div>
                  <div className="telemetry-bar">
                    <span className="lbl">SATELLITE ORBIT</span>
                    <span className="val">LRO POLAR</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURED SECTION 2: SOLAR & LUNAR ECLIPSE PREDICTOR */}
          <section className="featured-section" id="featured-eclipse" style={{ marginBottom: "60px" }}>
            <div className="section-header text-center">
              <span className="section-tag" data-i18n="eclipse_tag" id="eclipse-tag-txt">Featured Space App</span>
              <h2 className="section-title"><span className="text-gradient" data-i18n="eclipse_title_main" id="eclipse-title-main-txt">Solar & Lunar Eclipse Predictor</span></h2>
            </div>

            <div className="featured-card glass-panel">
              <div className="featured-info">
                <span className="status-badge live" data-i18n="status_active_eclipse" id="status-active-eclipse-txt">Space App</span>
                <h3 className="featured-project-title" data-i18n="eclipse_title" id="eclipse-title-txt">Solar & Lunar Eclipse Predictor</h3>
                <p className="featured-project-desc" data-i18n="eclipse_desc" id="eclipse-desc-txt">
                  Explore past and future solar and lunar eclipses. Inspect totality paths, penumbral coverage, and local obscuration details using our high-precision simulation engine.
                </p>
                
                <div className="project-features">
                  <h4 className="features-heading" data-i18n="eclipse_features_title" id="eclipse-features-title-txt">Key Features:</h4>
                  <ul className="features-list">
                    <li>
                      <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span data-i18n="eclipse_feat_1" id="eclipse-feat-1-txt">Precision 2D/3D dynamic map views</span>
                    </li>
                    <li>
                      <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span data-i18n="eclipse_feat_2" id="eclipse-feat-2-txt">Custom local simulation & stats</span>
                    </li>
                    <li>
                      <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span data-i18n="eclipse_feat_3" id="eclipse-feat-3-txt">Syzygy geometry & umbra calculation</span>
                    </li>
                  </ul>
                </div>

                <div className="featured-actions">
                  <a href="/modules/eclipses-transits" className="btn btn-primary btn-large btn-icon" id="eclipse-launch-btn">
                    <span data-i18n="eclipse_button" id="eclipse-button-txt">Launch Eclipse Predictor</span>
                    <svg className="btn-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </a>
                </div>
              </div>

              <div className="featured-visual-container">
                <div className="eclipse-schematic">
                  <div className="schematic-sun-body">
                    <div className="sun-glow"></div>
                  </div>
                  <div className="schematic-moon-body"></div>
                  <div className="schematic-earth-body">
                    <div className="earth-glow"></div>
                  </div>
                  <svg className="eclipse-geometry-svg" viewBox="0 0 380 380">
                    <line x1="65" y1="155" x2="190" y2="180" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" strokeDasharray="3, 3" />
                    <line x1="65" y1="225" x2="190" y2="200" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" strokeDasharray="3, 3" />
                    <line x1="65" y1="155" x2="190" y2="200" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.8" strokeDasharray="2, 2" />
                    <line x1="65" y1="225" x2="190" y2="180" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.8" strokeDasharray="2, 2" />
                    <polygon points="190,180 310,186 310,194 190,200" fill="rgba(0, 0, 0, 0.85)" />
                    <polygon points="190,180 310,150 310,230 190,200" fill="rgba(255, 255, 255, 0.05)" />
                  </svg>
                </div>
                
                <div className="visual-panel-telemetry">
                  <div className="telemetry-bar">
                    <span className="lbl">ALIGNMENT</span>
                    <span className="val">SYZYGY 🟢</span>
                  </div>
                  <div className="telemetry-bar">
                    <span className="lbl">SHADOW AXIS</span>
                    <span className="val">UMBRA / PENUMBRA</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURED SECTION 3: WALK IN THE SOLAR SYSTEM */}
          <section className="featured-section" id="featured-project">
            <div className="section-header text-center">
              <span className="section-tag" data-i18n="featured_tag" id="featured-tag-txt">Featured Space App</span>
              <h2 className="section-title"><span className="text-gradient" data-i18n="featured_title_main" id="featured-title-main-txt">Walk in the Solar System</span></h2>
            </div>

            <div className="featured-card glass-panel">
              <div className="featured-info">
                <span className="status-badge live" data-i18n="status_active" id="status-active-txt">Space App</span>
                <h3 className="featured-project-title" data-i18n="featured_title" id="featured-title-txt">Walk in the Solar System</h3>
                <p className="featured-project-desc" data-i18n="featured_desc" id="featured-desc-txt">
                  Experience our neighborhood in space with this interactive 3D map. Explore accurate orbital mechanics, scaled celestial bodies, and physics-based simulation.
                </p>
                
                <div className="project-features">
                  <h4 className="features-heading" data-i18n="features_title" id="features-title-txt">Key Features:</h4>
                  <ul className="features-list">
                    <li>
                      <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span data-i18n="feat_1" id="feat-1-txt">Interactive 3D celestial navigation</span>
                    </li>
                    <li>
                      <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span data-i18n="feat_2" id="feat-2-txt">Accurate orbital mechanics & scaling</span>
                    </li>
                    <li>
                      <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span data-i18n="feat_3" id="feat-3-txt">Bilingual guidance & rich educational details</span>
                    </li>
                  </ul>
                </div>

                <div className="featured-actions">
                  <a href="/modules/walk-in-solar-system" className="btn btn-primary btn-large btn-icon" id="launch-btn">
                    <span data-i18n="featured_button" id="featured-button-txt">Launch Interactive Map</span>
                    <svg className="btn-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </a>
                </div>
              </div>

              <div className="featured-visual-container">
                <div className="solar-system-schematic">
                  <div className="schematic-sun">
                    <div className="sun-glow"></div>
                  </div>
                  
                  <div className="schematic-orbit orbit-mercury">
                    <div className="schematic-planet planet-mercury" data-tooltip="Mercury"></div>
                  </div>
                  
                  <div className="schematic-orbit orbit-venus">
                    <div className="schematic-planet planet-venus" data-tooltip="Venus"></div>
                  </div>
                  
                  <div className="schematic-orbit orbit-earth">
                    <div className="schematic-planet planet-earth" data-tooltip="Earth">
                      <div className="schematic-moon"></div>
                    </div>
                  </div>
                  
                  <div className="schematic-orbit orbit-mars">
                    <div className="schematic-planet planet-mars" data-tooltip="Mars"></div>
                  </div>

                  <div className="schematic-orbit orbit-jupiter">
                    <div className="schematic-planet planet-jupiter" data-tooltip="Jupiter"></div>
                  </div>

                  <div className="orbit-lines-overlay"></div>
                </div>
                
                <div className="visual-panel-telemetry">
                  <div className="telemetry-bar">
                    <span className="lbl">SIM TIME SPEED</span>
                    <span className="val">1.0x (REAL)</span>
                  </div>
                  <div className="telemetry-bar">
                    <span className="lbl">CELESTIAL NODES</span>
                    <span className="val">8/9 ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* UNIVERSAL ESSS ECOSYSTEM FOOTER */}
      <UniversalFooter />

      {/* Load original legacy script files */}
      <Script src="/modules-data.js" strategy="lazyOnload" />
      <Script src="/app.js" strategy="lazyOnload" />
    </>
  );
}
