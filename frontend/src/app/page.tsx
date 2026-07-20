"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePortalStore } from "@/store/usePortalStore";
import { translations } from "@/lib/translations";
import SentientMeshWrapper from "@/components/sentient/SentientMeshWrapper";
import { 
  Globe, Radio, Compass, Rocket, Satellite, Activity, 
  Moon, Sun, LogIn, LogOut, ShieldCheck, Lock, Play, Menu, X, ChevronRight
} from "lucide-react";

interface ModuleData {
  id?: string;
  _id?: string;
  slug: string;
  title: string;
  category: string;
  complexity: string;
  concept: string;
  tech: string;
  status: string;
  is_restricted: boolean;
  launch_count: number;
}

export default function Home() {
  const router = useRouter();
  const { language, setLanguage, theme, setTheme, user, logout } = usePortalStore();
  const t = translations[language];

  const [modules, setModules] = useState<ModuleData[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("Planetary Science");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Telemetry fluctuation mock
  const [telemetry, setTelemetry] = useState({
    signal: "ACTIVE",
    altitude: 628,
  });

  useEffect(() => {
    // Sync document class for hydration safety
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }

    // Fetch modules list from backend
    const fetchModules = async () => {
      try {
        const res = await fetch("/api/modules");
        if (res.ok) {
          const data = await res.json();
          setModules(data);
        }
      } catch (err) {
        console.error("Failed to load modules from API", err);
      }
    };
    fetchModules();

    // Telemetry mock interval
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const rand = Math.random();
        let sig = "ACTIVE";
        if (rand < 0.05) sig = "LOCKING";
        else if (rand < 0.1) sig = "STANDBY";
        
        return {
          signal: sig,
          altitude: 628 + (Math.floor(Math.random() * 3) - 1),
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [theme]);

  const categories = Array.from(new Set(modules.map(m => m.category)));

  const handleLaunchModule = (mod: ModuleData) => {
    // Bypassing auth check for development/testing
    router.push(`/modules/${mod.slug}`);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Planetary Science": return <Globe className="w-4 h-4" />;
      case "Astrophysics": return <Compass className="w-4 h-4" />;
      case "Cosmology & Relativity": return <Activity className="w-4 h-4" />;
      case "Aerospace Engineering": return <Rocket className="w-4 h-4" />;
      case "Radio Science": return <Radio className="w-4 h-4" />;
      case "Space Weather & Physics": return <Satellite className="w-4 h-4" />;
      default: return <Compass className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Mesh Background - Hidden in light mode for clean minimalist aesthetic */}
      {theme === "dark" && (
        <SentientMeshWrapper activeObject="low-poly-fabric" themeColor="#125DFF" intensity={0.12} />
      )}

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-primary-hover)04_1px,transparent_1px),linear-gradient(to_bottom,var(--color-primary-hover)04_1px,transparent_1px)] bg-[size:4rem_4rem] -z-20"></div>

      {/* Header */}
      <header className="border-b border-card-border backdrop-blur-md bg-background/55 sticky top-0 z-40 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img src={theme === "dark" ? "/esss-logo-white.png" : "/esss-logo.png"} alt="ESSS Logo" className="h-8 w-auto object-contain transition-all" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest">
            <a href="#apps" className="hover:text-primary transition-colors text-foreground/80">{t.nav_apps}</a>
            <a href="#labs" className="hover:text-primary transition-colors text-foreground/80">{t.nav_labs}</a>
            <a href="#about" className="hover:text-primary transition-colors text-foreground/80">{t.nav_about}</a>
            {user?.role && ["admin", "superadmin"].includes(user.role) && (
              <Link href="/admin" className="text-primary hover:underline flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                {t.nav_admin}
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {/* Language Switch */}
            <button
              onClick={() => setLanguage(language === "en" ? "am" : "en")}
              className="px-3 py-1 rounded-lg border border-card-border bg-card/25 hover:bg-card/50 text-[10px] font-bold text-foreground tracking-wider flex items-center gap-1 transition-all cursor-pointer"
            >
              <span className={language === "en" ? "text-primary" : "text-foreground/45"}>EN</span>
              <span className="text-card-border">|</span>
              <span className={language === "am" ? "text-primary" : "text-foreground/45"}>አማ</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-lg border border-card-border bg-card/25 hover:bg-card/50 text-foreground transition-all cursor-pointer"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>

            {/* Auth Button */}
            {user ? (
              <button
                onClick={logout}
                className="px-3.5 py-1.5 rounded-lg border border-red-500/20 bg-card hover:bg-red-500/10 text-[10px] font-bold uppercase text-red-500 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.logout_btn}</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg bg-primary text-white font-bold text-[10px] uppercase hover:bg-primary-hover active:scale-95 transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.login_btn}</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-card-border bg-background/95 backdrop-blur-lg px-6 pt-4 pb-6 space-y-4">
            <nav className="flex flex-col gap-3 font-semibold uppercase text-xs tracking-wider">
              <a href="#apps" onClick={() => setMobileMenuOpen(false)} className="text-foreground hover:text-primary">{t.nav_apps}</a>
              <a href="#labs" onClick={() => setMobileMenuOpen(false)} className="text-foreground hover:text-primary">{t.nav_labs}</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-foreground hover:text-primary">{t.nav_about}</a>
              {user?.role && ["admin", "superadmin"].includes(user.role) && (
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="text-primary flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  {t.nav_admin}
                </Link>
              )}
            </nav>
            <div className="pt-4 border-t border-card-border flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage(language === "en" ? "am" : "en")}
                  className="px-3 py-1 rounded-lg border border-card-border bg-card/25 text-[10px] font-bold text-foreground flex items-center gap-1"
                >
                  <span className={language === "en" ? "text-primary" : "text-foreground/40"}>EN</span>
                  <span className="text-card-border">|</span>
                  <span className={language === "am" ? "text-primary" : "text-foreground/40"}>አማ</span>
                </button>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-1.5 rounded-lg border border-card-border bg-card/25 text-foreground"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-primary" />}
                </button>
              </div>

              {user ? (
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="px-4 py-2 rounded-lg bg-card border border-red-500/20 text-[10px] font-bold text-red-500 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.logout_btn}</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 rounded-lg bg-primary text-white font-bold text-[10px] uppercase hover:bg-primary-hover flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t.login_btn}</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 flex-grow flex flex-col md:flex-row items-center gap-12 z-10 w-full">
        <div className="flex-1 space-y-6 text-left">
          <span className="inline-flex px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-bold uppercase tracking-wider text-primary">
            {t.hero_badge}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-foreground">
            <span className="text-gradient block">{t.hero_title}</span>
          </h1>
          <p className="text-sm text-foreground/70 max-w-xl leading-relaxed">
            {t.hero_subtitle}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="#apps" className="px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-xs uppercase hover:bg-primary-hover active:scale-95 transition-all">
              {t.hero_cta}
            </a>
            <a href="#labs" className="px-5 py-2.5 rounded-lg bg-card border border-card-border text-foreground font-bold text-xs uppercase hover:bg-card-border active:scale-95 transition-all">
              {t.hero_secondary}
            </a>
          </div>
        </div>

        {/* Telemetry Visualizer */}
        <div className="flex-grow-0 w-full max-w-sm aspect-square glass rounded-2xl p-6 relative overflow-hidden group border border-card-border/50">
          {/* Aesthetic Telemetry Grid */}
          <div className="w-full h-full border border-card-border/20 rounded-xl relative flex flex-col justify-between p-5">
            <div className="flex justify-between items-start text-[9px] font-black text-primary uppercase tracking-wider">
              <div>
                <div>SYS.LAT</div>
                <div className="text-foreground mt-0.5 text-xs font-mono">9.0300° N</div>
              </div>
              <div className="text-right">
                <div>SYS.LON</div>
                <div className="text-foreground mt-0.5 text-xs font-mono">38.7400° E</div>
              </div>
            </div>

            {/* Glowing Orb Animation */}
            <div className="flex justify-center items-center relative flex-grow my-4">
              <div className="w-28 h-28 rounded-full border border-primary/10 animate-pulse relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-primary/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/50 animate-ping"></div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end text-[9px] font-black text-primary uppercase tracking-wider">
              <div>
                <div>ALT.ORBIT</div>
                <div className="text-foreground mt-0.5 text-xs font-mono">{telemetry.altitude} KM</div>
              </div>
              <div className="text-right">
                <div>SPACE WX</div>
                <div className={`mt-0.5 text-xs font-mono transition-colors ${telemetry.signal === 'ACTIVE' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {telemetry.signal}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Dashboard */}
      <section id="apps" className="max-w-7xl mx-auto px-6 py-20 z-10 w-full border-t border-card-border/20">
        <div className="text-center mb-12 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{t.future_tag}</span>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">{t.future_title}</h2>
          <p className="text-xs text-foreground/60 max-w-md mx-auto">{t.future_subtitle}</p>
        </div>

        {/* Category Navigation */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10 pb-4 border-b border-card-border/10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-md"
                    : "bg-card border border-card-border text-foreground/50 hover:text-foreground"
                }`}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            ))}
          </div>
        )}

        {/* Modules List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="labs">
          {modules
            .filter(m => m.category === activeCategory)
            .map((mod) => {
              const complexityClass = mod.complexity.toLowerCase();
              return (
                <div
                  key={mod.slug}
                  className="glass rounded-2xl p-5 border border-card-border/40 flex flex-col justify-between hover:border-primary/30 transition-all duration-200 relative group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">
                        {mod.category}
                      </span>
                      <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        complexityClass === "ultra" ? "bg-purple-500/10 border-purple-500/20 text-purple-500" :
                        complexityClass === "high" ? "bg-red-500/10 border-red-500/20 text-red-500" :
                        complexityClass === "medium" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
                        "bg-green-500/10 border-green-500/20 text-green-500"
                      }`}>
                        {mod.complexity}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      <span>{mod.title}</span>
                      {mod.is_restricted && (
                        <span title="Restricted Access">
                          <Lock className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        </span>
                      )}
                    </h3>

                    <p className="text-xs text-foreground/60 leading-relaxed min-h-[48px]">
                      {mod.concept}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-card-border/20 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-foreground/40 font-mono">
                      {mod.tech}
                    </span>

                    <button
                      onClick={() => handleLaunchModule(mod)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all cursor-pointer flex items-center gap-1 ${
                        mod.status === 'pending'
                          ? "bg-card border border-card-border text-foreground/30 cursor-not-allowed"
                          : "bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white"
                      }`}
                      disabled={mod.status === 'pending'}
                    >
                      {mod.status === 'pending' ? (
                        <span>{t.mod_btn_pending}</span>
                      ) : (
                        <>
                          <span>{t.mod_btn_launch}</span>
                          <Play className="w-2.5 h-2.5 fill-current" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-20 z-10 w-full border-t border-card-border/20">
        <div className="glass rounded-2xl border border-card-border/50 p-8 md:p-10 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{t.about_tag}</span>
            <h2 className="text-2xl font-extrabold text-foreground">{t.about_title}</h2>
            <p className="text-xs text-foreground/75 leading-relaxed">
              {t.about_desc}
            </p>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            <div className="p-5 border border-card-border/30 rounded-xl bg-card/10 text-center">
              <span className="text-xl font-black text-foreground">2004</span>
              <span className="text-[9px] text-foreground/45 uppercase tracking-widest block mt-0.5">{t.stat_est}</span>
            </div>
            <div className="p-5 border border-card-border/30 rounded-xl bg-card/10 text-center">
              <span className="text-xl font-black text-foreground">15,000+</span>
              <span className="text-[9px] text-foreground/45 uppercase tracking-widest block mt-0.5">{t.stat_members}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border bg-background/30 backdrop-blur-md py-6 mt-auto z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] font-semibold text-foreground/45 uppercase tracking-widest">
          <span>{t.footer_copyright}</span>
          <div className="flex gap-6">
            <a href="https://ethiosss.org" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">{t.footer_main_site}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
