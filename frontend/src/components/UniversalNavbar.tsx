"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortalStore } from "@/store/usePortalStore";
import {
  Sun,
  Moon,
  Globe,
  ChevronDown,
  Search,
  Menu,
  X,
  ArrowUpRight,
  Layers
} from "lucide-react";
import EsssLogo from "@/components/EsssLogo";

export interface NavLinkItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface UniversalNavbarProps {
  currentApp?: "science" | "hewa" | "felek" | "membership";
  accentColor?: string;
  navLinks?: NavLinkItem[];
  brandLogo?: React.ReactNode;
  onOpenSearch?: () => void;
}

export const UniversalNavbar: React.FC<UniversalNavbarProps> = ({
  currentApp = "science",
  accentColor = "#FFEA4B",
  navLinks,
  brandLogo,
  onOpenSearch
}) => {
  const pathname = usePathname();
  const { theme, setTheme, language, setLanguage } = usePortalStore();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);

  // References for Outside Click Detection
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default links if none passed
  const defaultNavLinks: NavLinkItem[] = [
    { label: language === "am" ? "መነሻ" : "Home", href: "/" },
    { label: language === "am" ? "መተግበሪያዎች" : "Apps", href: "/apps" },
    { label: language === "am" ? "ላብራቶሪዎች" : "Labs", href: "/labs" },
    { label: language === "am" ? "ስለ እኛ" : "About", href: "/about" },
    { label: language === "am" ? "ብሎጎች" : "Blogs", href: "/blogs" }
  ];

  const activeLinks = navLinks || defaultNavLinks;

  // Auto-close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
        setIsNetworkDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLangDropdownOpen(false);
        setIsNetworkDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleLangDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNetworkDropdownOpen(false);
    setIsLangDropdownOpen((prev) => !prev);
  };

  const toggleNetworkDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLangDropdownOpen(false);
    setIsNetworkDropdownOpen((prev) => !prev);
  };

  const handleSelectLanguage = (lang: "en" | "am") => {
    setLanguage(lang);
    localStorage.setItem("esss_science_lang", lang);
    setIsLangDropdownOpen(false);
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 w-full bg-zinc-950/90 backdrop-blur-xl border-b border-[#3E3E3E]/60 light:bg-white/95 light:border-zinc-200 font-sans"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between relative">
        
        {/* Far Left: ESSS Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            {brandLogo || <EsssLogo height={42} />}
          </Link>

          {/* ESSS Ecosystem / Network Dropdown Button */}
          <div className="relative hidden lg:block">
            <button
              onClick={toggleNetworkDropdown}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#3E3E3E] light:border-zinc-200 bg-zinc-900/80 light:bg-zinc-100/80 text-xs font-mono font-bold text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 hover:border-[#FFEA4B] light:hover:border-[#3C3318] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Layers size={13} style={{ color: accentColor }} />
              <span>Explore More</span>
              <ChevronDown
                size={12}
                className={`text-zinc-400 light:text-zinc-500 transition-transform duration-200 ${isNetworkDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Network Dropdown Menu */}
            {isNetworkDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-zinc-950/98 light:bg-white/98 border border-[#3E3E3E] light:border-zinc-200 shadow-2xl p-2 z-50 space-y-1 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Hewa+ */}
                <a
                  href="https://hewa.ethiosss.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsNetworkDropdownOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors ${
                    currentApp === "hewa"
                      ? "bg-[#FFEA4B] text-black font-bold"
                      : "text-zinc-200 light:text-zinc-700 hover:bg-zinc-900 light:hover:bg-zinc-100 hover:text-[#FFEA4B] light:hover:text-[#3C3318]"
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center gap-1">
                      <span>Hewa+</span>
                      {currentApp === "hewa" && <span className="text-[9px] px-1.5 py-0.5 rounded bg-black text-[#FFEA4B] font-mono">ACTIVE</span>}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-normal mt-0.5">Updates space news and Blog</div>
                  </div>
                  <ArrowUpRight size={15} className="opacity-70 flex-shrink-0" />
                </a>

                {/* Felek */}
                <a
                  href="https://felek.ethiosss.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsNetworkDropdownOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors ${
                    currentApp === "felek"
                      ? "bg-[#FFEA4B] text-black font-bold"
                      : "text-zinc-200 light:text-zinc-700 hover:bg-zinc-900 light:hover:bg-zinc-100 hover:text-[#FFEA4B] light:hover:text-[#3C3318]"
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center gap-1">
                      <span>Felek</span>
                      {currentApp === "felek" && <span className="text-[9px] px-1.5 py-0.5 rounded bg-black text-[#FFEA4B] font-mono">ACTIVE</span>}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-normal mt-0.5">The Space Science E-Learning Platform</div>
                  </div>
                  <ArrowUpRight size={15} className="opacity-70 flex-shrink-0" />
                </a>

                {/* Science Portal & Labs */}
                <a
                  href="https://science.ethiosss.org"
                  onClick={() => setIsNetworkDropdownOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors ${
                    currentApp === "science"
                      ? "bg-[#FFEA4B] text-black font-bold shadow-md"
                      : "text-zinc-200 light:text-zinc-700 hover:bg-zinc-900 light:hover:bg-zinc-100 hover:text-[#FFEA4B] light:hover:text-[#3C3318]"
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>Science Portal & Labs</span>
                      {currentApp === "science" && (
                        <span className="text-[9px] uppercase tracking-wider font-mono font-bold px-1.5 py-0.5 rounded bg-black text-[#FFEA4B]">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className={currentApp === "science" ? "text-[11px] text-zinc-800 font-medium mt-0.5" : "text-[11px] text-zinc-400 font-normal mt-0.5"}>
                      Simulators & Physics Labs
                    </div>
                  </div>
                  <ArrowUpRight size={15} className="opacity-70 flex-shrink-0" />
                </a>

                {/* ESSS Membership */}
                <a
                  href="https://membership.ethiosss.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsNetworkDropdownOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors ${
                    currentApp === "membership"
                      ? "bg-[#FFEA4B] text-black font-bold"
                      : "text-zinc-200 light:text-zinc-700 hover:bg-zinc-900 light:hover:bg-zinc-100 hover:text-[#FFEA4B] light:hover:text-[#3C3318]"
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center gap-1">
                      <span>ESSS Membership</span>
                      {currentApp === "membership" && <span className="text-[9px] px-1.5 py-0.5 rounded bg-black text-[#FFEA4B] font-mono">ACTIVE</span>}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-normal mt-0.5">Become a member today</div>
                  </div>
                  <ArrowUpRight size={15} className="opacity-70 flex-shrink-0" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Navigation Links (Locked to True Center) */}
        <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-widest absolute left-1/2 -translate-x-1/2">
          {activeLinks.map((link) => {
            const isActive = link.active !== undefined
              ? link.active
              : (link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-all duration-150 font-bold border-b-2 pb-1 ${
                  isActive
                    ? "text-white light:text-zinc-900 border-[#FFEA4B] light:border-[#3C3318]"
                    : "text-zinc-400 light:text-zinc-500 hover:text-white light:hover:text-zinc-900 border-transparent"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Tools: Search, Language, Theme */}
        <div className="flex items-center gap-3.5">
          {/* Spotlight Search Trigger */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              style={{ padding: "9px 20px", borderRadius: "9999px" }}
              className="flex items-center gap-2.5 border border-[#3E3E3E] light:border-zinc-200 bg-zinc-900/90 light:bg-zinc-100/90 text-xs text-zinc-200 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 hover:border-[#FFEA4B] light:hover:border-[#3C3318] transition-all cursor-pointer shadow-md font-sans active:scale-95"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-500 flex-shrink-0" />
              <span className="hidden sm:inline font-semibold">Search...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-zinc-800 light:bg-zinc-200 text-[9px] font-mono text-zinc-400 light:text-zinc-600 border border-zinc-700 light:border-zinc-300">⌘K</kbd>
            </button>
          )}

          {/* Language Dropdown */}
          <div className="relative">
            <button
              onClick={toggleLangDropdown}
              style={{ padding: "9px 18px", borderRadius: "9999px" }}
              className="flex items-center gap-2 border border-[#3E3E3E] light:border-zinc-200 bg-zinc-900/90 light:bg-zinc-100/90 text-xs font-semibold text-zinc-200 light:text-zinc-700 hover:border-zinc-500 light:hover:border-zinc-400 transition-all cursor-pointer shadow-md font-sans active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-500 flex-shrink-0" />
              <span>{mounted ? (language === "en" ? "EN" : "AM") : "EN"}</span>
              <ChevronDown
                className={`w-3 h-3 text-zinc-400 light:text-zinc-500 flex-shrink-0 transition-transform duration-200 ${isLangDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-zinc-950/98 light:bg-white/98 border border-[#3E3E3E] light:border-zinc-200 shadow-2xl p-1.5 z-50 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => handleSelectLanguage("en")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                    language === "en" ? "bg-[#FFEA4B] text-black font-bold" : "text-zinc-300 light:text-zinc-700 hover:bg-zinc-900 light:hover:bg-zinc-100 hover:text-white light:hover:text-zinc-900"
                  }`}
                >
                  <span>English</span>
                  <span className="text-[10px] font-mono opacity-80">EN</span>
                </button>
                <button
                  onClick={() => handleSelectLanguage("am")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                    language === "am" ? "bg-[#FFEA4B] text-black font-bold" : "text-zinc-300 light:text-zinc-700 hover:bg-zinc-900 light:hover:bg-zinc-100 hover:text-white light:hover:text-zinc-900"
                  }`}
                >
                  <span>አማርኛ</span>
                  <span className="text-[10px] font-mono opacity-80">AM</span>
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle Pill */}
          <button
            onClick={() => {
              const root = document.documentElement;
              const currentIsDark = root.classList.contains("dark");
              setTheme(currentIsDark ? "light" : "dark");
            }}
            style={{ padding: "9px 18px", borderRadius: "9999px" }}
            className="flex items-center gap-2 border border-[#3E3E3E] light:border-zinc-200 bg-zinc-900/90 light:bg-zinc-100/90 text-xs font-semibold text-zinc-200 light:text-zinc-700 hover:border-zinc-500 light:hover:border-zinc-400 transition-all cursor-pointer shadow-md font-sans active:scale-95"
            title="Toggle Theme"
          >
            <Sun className="w-4 h-4 text-[#FFEA4B] flex-shrink-0 hidden dark:block" />
            <Moon className="w-4 h-4 text-zinc-400 light:text-zinc-500 flex-shrink-0 block dark:hidden" />
          </button>

          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 light:text-zinc-500 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#3E3E3E] light:border-zinc-200 bg-zinc-950/98 light:bg-white/98 backdrop-blur-2xl p-6 flex flex-col gap-4 font-mono text-sm">
          {activeLinks.map((link) => {
            const isActive = link.active !== undefined
              ? link.active
              : (link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={isActive ? "text-[#FFEA4B] light:text-[#3C3318] font-bold" : "text-zinc-400 light:text-zinc-500 hover:text-white light:hover:text-zinc-900"}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default UniversalNavbar;
