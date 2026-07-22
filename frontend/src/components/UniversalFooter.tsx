"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePortalStore } from "@/store/usePortalStore";
import {
  Globe,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ArrowUpRight,
  ShieldCheck,
  FileText
} from "lucide-react";
import EsssLogo from "@/components/EsssLogo";

export const UniversalFooter: React.FC = () => {
  const { theme, language, setLanguage } = usePortalStore();
  const [mounted, setMounted] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (footerRef.current && !footerRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLanguage = (lang: "en" | "am") => {
    setLanguage(lang);
    localStorage.setItem("esss_science_lang", lang);
    setIsLangDropdownOpen(false);
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <footer
      ref={footerRef}
      className="w-full bg-zinc-950 text-zinc-400 border-t border-zinc-800/80 transition-colors duration-200 light:bg-slate-50 light:text-zinc-600 light:border-zinc-200 font-sans"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-14 pb-12">
        
        {/* Top Header Row: ESSS Logo, Description & Social Icons */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-12 border-b border-zinc-800/60 light:border-zinc-200">
          <div className="space-y-3 max-w-xl">
            <EsssLogo height={44} />
            <p className="text-xs sm:text-sm text-zinc-400 light:text-zinc-600 leading-relaxed font-normal pt-1">
              {language === "am"
                ? "የኢትዮጵያ ስፔስ ሳይንስ ማህበር በ2004 እ.ኤ.አ በ47 መስራች አባላት የተመሰረተ ለትርፍ ያልቆመ ማህበር ነው። በአሁኑ ወቅት ከ20,000 በላይ አባላት፣ 32 ቅርንጫፎች፣ 58 ተቋማዊ አባላት እና ከ100 በላይ የስፔስ ክለቦች አሉት።"
                : "Ethiopian Space Science Society was established in 2004, with 47 founding members. It is a non-profit organization consisting of members from Astronomy, Astrophysics, Space Science, and Technology. Today, the society has over 20,000 individual members, 32 branch associations, 58 institutional members, and 100+ Space School Clubs."}
            </p>
          </div>

          {/* Official ESSS Social Media Links Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-mono text-zinc-500 light:text-zinc-400 uppercase tracking-widest mr-2 hidden sm:inline">
              {language === "am" ? "ማህበራዊ:" : "Connect:"}
            </span>

            {/* Telegram */}
            <a
              href="https://t.me/officialesss"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:border-zinc-600 light:hover:border-zinc-300 transition-all cursor-pointer shadow-sm hover:scale-105"
              title="Telegram (@officialesss)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>

            {/* X / Twitter */}
            <a
              href="https://twitter.com/officialesss"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:border-zinc-600 light:hover:border-zinc-300 transition-all cursor-pointer shadow-sm hover:scale-105"
              title="Twitter / X (@officialesss)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com/officialesss"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:border-zinc-600 light:hover:border-zinc-300 transition-all cursor-pointer shadow-sm hover:scale-105"
              title="Facebook (@officialesss)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://www.youtube.com/c/EthiopianSpaceScienceSociety"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:border-zinc-600 light:hover:border-zinc-300 transition-all cursor-pointer shadow-sm hover:scale-105"
              title="YouTube"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/officialesss/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:border-zinc-600 light:hover:border-zinc-300 transition-all cursor-pointer shadow-sm hover:scale-105"
              title="Instagram (@officialesss)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/officialesss"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:border-zinc-600 light:hover:border-zinc-300 transition-all cursor-pointer shadow-sm hover:scale-105"
              title="LinkedIn (@officialesss)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>

            {/* BlueSky */}
            <a
              href="https://bsky.app/profile/officialesss.bsky.social"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:border-zinc-600 light:hover:border-zinc-300 transition-all cursor-pointer shadow-sm hover:scale-105"
              title="Bluesky (@officialesss.bsky.social)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566 1.05 1.57 1.05 1.106 1.514c-.464.464-.265 1.127.464 1.106 2.825 2.046 5.228 5.719 6.797 9.46 1.57-3.74 3.972-7.414 6.797-9.46 1.255-.91 2.904-1.32 3.633-1.34.729-.02.928.642.464 1.106-.464.464-1.46 1.46-4.094 3.699-2.752 1.942-5.711 5.881-6.798 7.995z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* 4-Column Navigation Architecture with Clear Visual Hierarchy */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 pt-12 mb-12">
          
          {/* Column 1: Explore More */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-extrabold uppercase tracking-widest text-[#FBE04C] light:text-[#403517] font-outfit">
              {language === "am" ? "የበለጠ ይመርምሩ" : "Explore More"}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a
                  href="https://hewa.ethiosss.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white light:hover:text-zinc-900 transition-colors flex items-center justify-between text-zinc-300 light:text-zinc-700 group py-0.5"
                >
                  <span className="font-semibold group-hover:text-white light:group-hover:text-zinc-900">Hewa+ (News & Mag)</span>
                  <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://felek.ethiosss.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white light:hover:text-zinc-900 transition-colors flex items-center justify-between text-zinc-300 light:text-zinc-700 group py-0.5"
                >
                  <span className="font-semibold group-hover:text-white light:group-hover:text-zinc-900">Felek (Space E-Learning)</span>
                  <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://science.ethiosss.org"
                  className="hover:text-white light:hover:text-zinc-900 transition-colors flex items-center justify-between font-bold text-zinc-100 light:text-zinc-900 group py-0.5"
                >
                  <span className="text-[#FBE04C] light:text-[#403517] font-extrabold">Science Portal & Labs</span>
                  <ArrowUpRight size={14} className="text-[#FBE04C] light:text-[#403517]" />
                </a>
              </li>
              <li>
                <a
                  href="https://membership.ethiosss.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white light:hover:text-zinc-900 transition-colors flex items-center justify-between text-zinc-300 light:text-zinc-700 group py-0.5"
                >
                  <span className="font-semibold group-hover:text-white light:group-hover:text-zinc-900">ESSS Membership</span>
                  <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://ethiosss.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white light:hover:text-zinc-900 transition-colors flex items-center justify-between text-zinc-400 light:text-zinc-500 group py-0.5"
                >
                  <span>Official ESSS Main Site</span>
                  <ArrowUpRight size={14} className="opacity-50 group-hover:opacity-100" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Space Applications */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-extrabold uppercase tracking-widest text-zinc-200 light:text-zinc-900 font-outfit">
              {language === "am" ? "የስፔስ መተግበሪያዎች" : "Space Applications"}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-400 light:text-zinc-600 font-normal">
              <li>
                <Link href="/modules/walk-in-solar-system" className="hover:text-white light:hover:text-zinc-900 transition-colors block py-0.5">
                  Walk in the Solar System
                </Link>
              </li>
              <li>
                <Link href="/modules/lunar-explorer" className="hover:text-white light:hover:text-zinc-900 transition-colors block py-0.5">
                  3D Lunar Surface Explorer
                </Link>
              </li>
              <li>
                <Link href="/modules/eclipses-transits" className="hover:text-white light:hover:text-zinc-900 transition-colors block py-0.5">
                  Eclipse & Transit Predictor
                </Link>
              </li>
              <li>
                <Link href="/modules/satellite-doppler" className="hover:text-white light:hover:text-zinc-900 transition-colors block py-0.5">
                  Satellite Doppler Tracker
                </Link>
              </li>
              <li>
                <Link href="/modules/exoplanet-lab" className="hover:text-white light:hover:text-zinc-900 transition-colors block py-0.5">
                  Exoplanet Transit Laboratory
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Science Laboratories */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-extrabold uppercase tracking-widest text-zinc-200 light:text-zinc-900 font-outfit">
              {language === "am" ? "የሳይንስ ላብራቶሪዎች" : "Science Laboratories"}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-400 light:text-zinc-600 font-normal">
              <li>
                <Link href="/modules/orbital-mechanics" className="hover:text-white light:hover:text-zinc-900 transition-colors block py-0.5">
                  Orbital Mechanics Sandbox
                </Link>
              </li>
              <li>
                <Link href="/modules/rocket-ballistics" className="hover:text-white light:hover:text-zinc-900 transition-colors block py-0.5">
                  Rocket Ballistics Engine
                </Link>
              </li>
              <li>
                <Link href="/modules/aperture-synthesis" className="hover:text-white light:hover:text-zinc-900 transition-colors block py-0.5">
                  Radio Aperture Synthesis
                </Link>
              </li>
              <li>
                <Link href="/modules/cosmic-ladder" className="hover:text-white light:hover:text-zinc-900 transition-colors block py-0.5">
                  Cosmic Distance Ladder
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white light:hover:text-zinc-900 transition-colors block py-0.5">
                  Entoto Observatory Research
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Us & Observatory */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-extrabold uppercase tracking-widest text-zinc-200 light:text-zinc-900 font-outfit">
              {language === "am" ? "እኛን ለማግኘት" : "Contact & Location"}
            </h4>
            <div className="space-y-3 text-xs sm:text-sm text-zinc-400 light:text-zinc-600">
              <div className="flex items-start gap-3">
                <Phone size={15} className="text-zinc-400 light:text-zinc-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5 font-mono text-xs font-medium text-zinc-300 light:text-zinc-700">
                  <div>+251 11 867 7699</div>
                  <div>+251 11 126 1200</div>
                  <div>+251 980 720 026</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail size={15} className="text-zinc-400 light:text-zinc-500 flex-shrink-0" />
                <a href="mailto:info@ethiosss.org" className="hover:text-white light:hover:text-zinc-900 transition-colors font-mono text-xs font-medium text-zinc-300 light:text-zinc-700">
                  info@ethiosss.org
                </a>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={15} className="text-zinc-400 light:text-zinc-500 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed text-xs text-zinc-400 light:text-zinc-500">P.O Box: 8214 •AAU, CTBE, 407, Addis Ababa, Ethiopia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Divider */}
        <div className="w-full h-px bg-zinc-800/60 light:bg-zinc-200 my-8" />

        {/* Bottom Bar: Copyright + Legal + Language Selector */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500 light:text-zinc-500">
          {/* Copyright */}
          <div className="flex items-center gap-2 font-mono">
            <span>© {new Date().getFullYear()} Ethiopian Space Science Society (ESSS). All rights reserved.</span>
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-6 font-mono">
            <a href="https://ethiosss.org/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 light:hover:text-zinc-800 transition-colors flex items-center gap-1.5">
              <ShieldCheck size={14} /> Privacy Policy
            </a>
            <a href="https://ethiosss.org/terms" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 light:hover:text-zinc-800 transition-colors flex items-center gap-1.5">
              <FileText size={14} /> Terms of Use
            </a>
          </div>

          {/* Right Tools: Language Selector & Help */}
          <div className="flex items-center gap-4">
            <a
              href="https://ethiosss.org/help"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-zinc-300 light:hover:text-zinc-800 transition-colors cursor-pointer text-xs"
            >
              <HelpCircle size={14} />
              <span>Help</span>
            </a>

            {/* Language Selector Pill */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 light:border-zinc-300 bg-zinc-900 light:bg-white text-xs font-medium text-zinc-300 light:text-zinc-700 hover:border-zinc-600 light:hover:border-zinc-400 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Globe size={13} className="text-zinc-400 light:text-zinc-500" />
                <span>{language === "en" ? "English" : "አማርኛ"}</span>
                <ChevronDown size={12} className="text-zinc-400 light:text-zinc-500" />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-32 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 shadow-2xl p-1.5 z-50">
                  <button
                    onClick={() => handleSelectLanguage("en")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                      language === "en" ? "bg-[#FBE04C] text-black font-bold" : "text-zinc-300 light:text-zinc-600 hover:bg-zinc-900 light:hover:bg-zinc-100 hover:text-white light:hover:text-zinc-900"
                    }`}
                  >
                    <span>English</span>
                    <span className="text-[10px] font-mono">EN</span>
                  </button>
                  <button
                    onClick={() => handleSelectLanguage("am")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                      language === "am" ? "bg-[#FBE04C] text-black font-bold" : "text-zinc-300 light:text-zinc-600 hover:bg-zinc-900 light:hover:bg-zinc-100 hover:text-white light:hover:text-zinc-900"
                    }`}
                  >
                    <span>አማርኛ</span>
                    <span className="text-[10px] font-mono">AM</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default UniversalFooter;
