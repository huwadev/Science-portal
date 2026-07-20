"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePortalStore } from "@/store/usePortalStore";
import { translations } from "@/lib/translations";
import SentientMeshWrapper from "@/components/sentient/SentientMeshWrapper";
import { 
  Globe, Radio, Compass, Rocket, Satellite, Activity, 
  Moon, LogIn, LogOut, ShieldCheck, Lock, Play, Menu, X, ChevronRight
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
  const { language, setLanguage, user, logout } = usePortalStore();
  const t = translations[language];

  const [modules, setModules] = useState<ModuleData[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("Planetary Science");
  const [selectedModuleForLock, setSelectedModuleForLock] = useState<ModuleData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Telemetry fluctuation mock
  const [telemetry, setTelemetry] = useState({
    signal: "ACTIVE",
    altitude: 628,
  });

  useEffect(() => {
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
  }, []);

  const categories = Array.from(new Set(modules.map(m => m.category)));

  const handleLaunchModule = (mod: ModuleData) => {
    if (mod.is_restricted && !user) {
      setSelectedModuleForLock(mod);
    } else {
      router.push(`/modules/${mod.slug}`);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Planetary Science": return <Globe className="w-5 h-5" />;
      case "Astrophysics": return <Compass className="w-5 h-5" />;
      case "Cosmology & Relativity": return <Activity className="w-5 h-5" />;
      case "Aerospace Engineering": return <Rocket className="w-5 h-5" />;
      case "Radio Science": return <Radio className="w-5 h-5" />;
      case "Space Weather & Physics": return <Satellite className="w-5 h-5" />;
      default: return <Compass className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Mesh Background */}
      <SentientMeshWrapper activeObject="low-poly-fabric" themeColor="#00d2ff" intensity={0.15} />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00d2ff08_1px,transparent_1px),linear-gradient(to_bottom,#00d2ff08_1px,transparent_1px)] bg-[size:4rem_4rem] -z-20"></div>

      {/* Header */}
      <header className="border-b border-card-border backdrop-blur-md bg-background/40 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img src="/esss-logo.png" alt="ESSS Logo" className="h-10 sm:h-12 w-auto object-contain" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide uppercase">
            <a href="#apps" className="hover:text-primary transition-colors text-white">{t.nav_apps}</a>
            <a href="#labs" className="hover:text-primary transition-colors text-white">{t.nav_labs}</a>
            <a href="#about" className="hover:text-primary transition-colors text-white">{t.nav_about}</a>
            {user?.role && ["admin", "superadmin"].includes(user.role) && (
              <Link href="/admin" className="text-primary hover:underline flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                {t.nav_admin}
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {/* Language Switch */}
            <button
              onClick={() => setLanguage(language === "en" ? "am" : "en")}
              className="px-3.5 py-1.5 rounded-full border border-card-border bg-card/25 hover:bg-card/50 text-xs font-bold text-white tracking-wider flex items-center gap-1 transition-all"
            >
              <span className={language === "en" ? "text-primary" : "text-gray-400"}>EN</span>
              <span className="text-gray-500">|</span>
              <span className={language === "am" ? "text-primary" : "text-gray-400"}>አማ</span>
            </button>

            {/* Auth Button */}
            {user ? (
              <button
                onClick={logout}
                className="px-4 py-2 rounded-xl bg-card border border-card-border text-xs font-bold uppercase hover:bg-red-500/10 hover:border-red-500/30 text-white flex items-center gap-2 cursor-pointer transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.logout_btn}</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-primary text-background font-bold text-xs uppercase hover:bg-primary-hover active:scale-95 transition-all flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{t.login_btn}</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:text-primary transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-card-border bg-background/95 backdrop-blur-lg px-4 pt-4 pb-6 space-y-4">
            <nav className="flex flex-col gap-3 font-semibold uppercase text-sm">
              <a href="#apps" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-primary">{t.nav_apps}</a>
              <a href="#labs" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-primary">{t.nav_labs}</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-primary">{t.nav_about}</a>
              {user?.role && ["admin", "superadmin"].includes(user.role) && (
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="text-primary flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  {t.nav_admin}
                </Link>
              )}
            </nav>
            <div className="pt-4 border-t border-card-border flex items-center justify-between">
              <button
                onClick={() => setLanguage(language === "en" ? "am" : "en")}
                className="px-3.5 py-1.5 rounded-full border border-card-border bg-card/25 text-xs font-bold text-white flex items-center gap-1"
              >
                <span className={language === "en" ? "text-primary" : "text-gray-400"}>EN</span>
                <span className="text-gray-500">|</span>
                <span className={language === "am" ? "text-primary" : "text-gray-400"}>አማ</span>
              </button>

              {user ? (
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="px-4 py-2 rounded-xl bg-card border border-card-border text-xs font-bold hover:bg-red-500/10 text-white flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.logout_btn}</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 rounded-xl bg-primary text-background font-bold text-xs uppercase hover:bg-primary-hover flex items-center gap-2"
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex-grow flex flex-col md:flex-row items-center gap-12 z-10">
        <div className="flex-1 space-y-6 text-left">
          <span className="inline-flex px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-xs font-bold uppercase tracking-wider text-primary">
            {t.hero_badge}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
            <span className="text-gradient block">{t.hero_title}</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl">
            {t.hero_subtitle}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a href="#apps" className="px-6 py-3 rounded-xl bg-primary text-background font-bold text-sm hover:bg-primary-hover active:scale-95 transition-all">
              {t.hero_cta}
            </a>
            <a href="#labs" className="px-6 py-3 rounded-xl bg-card border border-card-border text-white font-bold text-sm hover:bg-card-border active:scale-95 transition-all">
              {t.hero_secondary}
            </a>
          </div>
        </div>

        {/* Telemetry Visualizer */}
        <div className="flex-1 w-full max-w-md md:max-w-none aspect-square glass rounded-3xl p-8 relative overflow-hidden group border border-card-border/50">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent -z-10 group-hover:opacity-100 transition-opacity"></div>
          
          {/* Aesthetic Telemetry Grid */}
          <div className="w-full h-full border border-card-border/20 rounded-2xl relative flex flex-col justify-between p-6">
            <div className="flex justify-between items-start text-[10px] font-black text-primary uppercase tracking-wider">
              <div>
                <div>SYS.LAT</div>
                <div className="text-white mt-1 text-xs">9.0300° N</div>
              </div>
              <div className="text-right">
                <div>SYS.LON</div>
                <div className="text-white mt-1 text-xs">38.7400° E</div>
              </div>
            </div>

            {/* Glowing Orb Animation */}
            <div className="flex justify-center items-center relative flex-grow my-8">
              <div className="w-36 h-36 rounded-full border border-primary/20 animate-pulse relative flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border border-primary/40 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary animate-ping"></div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end text-[10px] font-black text-primary uppercase tracking-wider">
              <div>
                <div>ALT.ORBIT</div>
                <div className="text-white mt-1 text-xs">{telemetry.altitude} KM</div>
              </div>
              <div className="text-right">
                <div>SPACE WX</div>
                <div className={`mt-1 text-xs transition-colors ${telemetry.signal === 'ACTIVE' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {telemetry.signal}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Dashboard */}
      <section id="apps" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10 w-full">
        <div className="text-center mb-12 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">{t.future_tag}</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{t.future_title}</h2>
          <p className="text-sm text-gray-400 max-w-lg mx-auto">{t.future_subtitle}</p>
        </div>

        {/* Category Navigation */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10 pb-4 border-b border-card-border/30">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  activeCategory === cat
                    ? "bg-primary text-background shadow-md shadow-primary/20"
                    : "bg-card border border-card-border text-gray-400 hover:text-white"
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
                  className="glass rounded-3xl p-6 border border-card-border/50 flex flex-col justify-between hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 relative group"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {mod.category}
                      </span>
                      <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        complexityClass === "ultra" ? "bg-purple-500/10 border-purple-500/30 text-purple-400" :
                        complexityClass === "high" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                        complexityClass === "medium" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" :
                        "bg-green-500/10 border-green-500/30 text-green-400"
                      }`}>
                        {mod.complexity}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                      <span>{mod.title}</span>
                      {mod.is_restricted && (
                        <span title="Restricted Access">
                          <Lock className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        </span>
                      )}
                    </h3>

                    <p className="text-xs text-gray-400 leading-relaxed min-h-[48px]">
                      {mod.concept}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-card-border/20 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500">
                      {mod.tech}
                    </span>

                    <button
                      onClick={() => handleLaunchModule(mod)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                        mod.status === 'pending'
                          ? "bg-card border border-card-border text-gray-500 cursor-not-allowed"
                          : "bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-background"
                      }`}
                      disabled={mod.status === 'pending'}
                    >
                      {mod.status === 'pending' ? (
                        <span>{t.mod_btn_pending}</span>
                      ) : (
                        <>
                          <span>{t.mod_btn_launch}</span>
                          <Play className="w-3 h-3 fill-current" />
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
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10 w-full">
        <div className="glass rounded-[2rem] border border-card-border/50 p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">{t.about_tag}</span>
            <h2 className="text-3xl font-extrabold text-white">{t.about_title}</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t.about_desc}
            </p>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            <div className="p-6 border border-card-border/30 rounded-2xl bg-card/20 text-center">
              <span className="text-2xl font-black text-white">2004</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block mt-1">{t.stat_est}</span>
            </div>
            <div className="p-6 border border-card-border/30 rounded-2xl bg-card/20 text-center">
              <span className="text-2xl font-black text-white">15,000+</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block mt-1">{t.stat_members}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Lock Overlay Modal */}
      {selectedModuleForLock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
          <div className="glass rounded-[2rem] border border-card-border/75 max-w-sm w-full p-8 text-center space-y-6 relative">
            <button
              onClick={() => setSelectedModuleForLock(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mx-auto w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">{t.login_required}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {t.login_required_desc}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href={`/login?redirect=/modules/${selectedModuleForLock.slug}`}
                className="w-full py-3 rounded-xl bg-primary text-background font-bold text-xs uppercase hover:bg-primary-hover flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>{t.login_btn}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-card-border bg-background/50 backdrop-blur-md py-8 mt-auto z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-gray-500">
          <span>{t.footer_copyright}</span>
          <div className="flex gap-6">
            <a href="https://ethiosss.org" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">{t.footer_main_site}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
