"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePortalStore } from "@/store/usePortalStore";
import { translations } from "@/lib/translations";
import { 
  Sun, Moon, ShieldCheck, Lock, Play, Menu, X, ChevronDown, LogOut
} from "lucide-react";

interface ModuleData {
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
  iconSvg: string;
}

export default function Home() {
  const router = useRouter();
  const { language, setLanguage, theme, setTheme, user, logout } = usePortalStore();
  const t = translations[language];

  // DOM Canvas References
  const spaceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroMeshRef = useRef<HTMLCanvasElement | null>(null);
  const moonCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string>("module-cosmic-ladder");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredPlanet, setHoveredPlanet] = useState<string>("default");

  // Dynamic Telemetry states
  const [telemetry, setTelemetry] = useState({
    signal: "ACTIVE",
    altitude: 628,
  });

  // Space weather telemetry (Kp index)
  const [kpIndex, setKpIndex] = useState<number>(2.0);
  const [spaceWeatherColor, setSpaceWeatherColor] = useState<string>("18, 93, 255");

  // Stargazer mode easter egg
  const [stargazerActive, setStargazerActive] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Fetch modules from Backend
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch("/api/modules");
        if (res.ok) {
          const data: ModuleData[] = await res.json();
          // Filter out duplicates and ensure standard data structure
          setModules(data);
          
          // Get unique categories list
          const uniqueCats = Array.from(new Set(data.map(m => m.category)));
          setCategories(uniqueCats);
          
          // Expand first category by default
          if (uniqueCats.length > 0) {
            setExpandedCategories({ [uniqueCats[0]]: true });
          }
          
          // Set first available module as active
          const firstBuild = data.find(m => m.status === 'build');
          if (firstBuild) {
            setActiveModuleId(firstBuild.id);
          }
        }
      } catch (err) {
        console.error("Failed to load modules from API", err);
      }
    };
    fetchModules();
  }, []);

  // 1. Starfield background effect
  useEffect(() => {
    const canvas = spaceCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: any[] = [];
    const numStars = 100;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Star {
      x: number;
      y: number;
      size: number;
      baseAlpha: number;
      alpha: number;
      twinkleSpeed: number;
      twinkleFactor: number;
      vx: number;
      vy: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 1.5 + 0.4;
        this.baseAlpha = Math.random() * 0.6 + 0.2;
        this.alpha = this.baseAlpha;
        this.twinkleSpeed = Math.random() * 0.02 + 0.004;
        this.twinkleFactor = Math.random() * Math.PI;
        this.vx = (Math.random() - 0.5) * 0.05;
        this.vy = (Math.random() - 0.5) * 0.05;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = canvas!.width;
        if (this.x > canvas!.width) this.x = 0;
        if (this.y < 0) this.y = canvas!.height;
        if (this.y > canvas!.height) this.y = 0;

        this.twinkleFactor += this.twinkleSpeed;
        this.alpha = this.baseAlpha + Math.sin(this.twinkleFactor) * 0.2;
        if (this.alpha < 0) this.alpha = 0;
        if (this.alpha > 1) this.alpha = 1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(222, 235, 255, ${this.alpha})`;
        ctx.fill();
      }
    }

    const initStars = () => {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push(new Star());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => {
        star.update();
        star.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    initStars();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // 2. Space weather Kp index fetch and system updates
  useEffect(() => {
    const fetchSpaceWeather = async () => {
      try {
        const response = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
        if (response.ok) {
          const data = await response.json();
          const latest = data[data.length - 1];
          const kp = parseFloat(latest[1]) || 2.0;
          setKpIndex(kp);
          
          if (kp >= 5) {
            setSpaceWeatherColor("255, 69, 0"); // Red storm
          } else if (kp >= 3) {
            setSpaceWeatherColor("0, 255, 128"); // Auroral green
          } else {
            setSpaceWeatherColor("18, 93, 255"); // Cosmic blue
          }
        }
      } catch (err) {
        console.warn("Failed to fetch space weather, playing mock variation.");
        const mockKp = 2.0 + Math.sin(Date.now() / 3600000) * 1.5 + Math.random() * 0.8;
        const finalMock = Math.max(0, mockKp);
        setKpIndex(finalMock);
        if (finalMock >= 5) {
          setSpaceWeatherColor("255, 69, 0");
        } else if (finalMock >= 3) {
          setSpaceWeatherColor("0, 255, 128");
        } else {
          setSpaceWeatherColor("18, 93, 255");
        }
      }
    };

    fetchSpaceWeather();
    const weatherInterval = setInterval(fetchSpaceWeather, 300000);
    return () => clearInterval(weatherInterval);
  }, []);

  // 3. Space-Time Relativity Mesh Animation
  useEffect(() => {
    const canvas = heroMeshRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 380;
    let height = 380;
    let rotationTime = 0;
    let gravityOrbTime = 0;

    // Interactive offsets
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let userRotOffset = 0;
    let userTiltOffset = 0;
    let hoverGravX: number | null = null;
    let hoverGravY: number | null = null;

    const resizeMeshCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width || 380;
      height = rect.height || 380;
      canvas.width = width;
      canvas.height = height;
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      canvas.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isDragging) {
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        userRotOffset -= deltaX * 0.01;
        userTiltOffset -= deltaY * 0.01;
        userTiltOffset = Math.max(-0.6, Math.min(0.6, userTiltOffset));
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }

      hoverGravX = ((mouseX - width / 2) / (width / 2)) * 14;
      hoverGravY = ((mouseY - height / 2) / (height / 2)) * 14;
    };

    const handleMouseUp = () => {
      isDragging = false;
      canvas.style.cursor = "grab";
    };

    const handleMouseLeave = () => {
      hoverGravX = null;
      hoverGravY = null;
      isDragging = false;
      canvas.style.cursor = "grab";
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.style.cursor = "grab";

    resizeMeshCanvas();
    window.addEventListener("resize", resizeMeshCanvas);

    const gridCols = 18;
    const gridRows = 18;

    const drawMesh = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const orbitRadius = 3.6;
      const companionX = Math.cos(gravityOrbTime) * orbitRadius;
      const companionY = Math.sin(gravityOrbTime) * orbitRadius;

      const tilt = Math.PI / 3.2 + userTiltOffset;
      const rot = rotationTime + userRotOffset;

      const D = 18;
      const scale = width * 0.72;
      const centerX = width / 2;
      const centerY = height / 2 - 5;

      const projectedGrid: any[][] = [];

      for (let r = 0; r <= gridRows; r++) {
        projectedGrid[r] = [];
        for (let c = 0; c <= gridCols; c++) {
          const x = (c / gridCols - 0.5) * 14;
          const y = (r / gridRows - 0.5) * 14;

          const distToSunSq = x * x + y * y;
          const zSun = -4.0 / (1 + 0.18 * distToSunSq);

          const distToCompSq = (x - companionX) * (x - companionX) + (y - companionY) * (y - companionY);
          const zComp = -1.6 / (1 + 0.45 * distToCompSq);

          const distToCenter = Math.sqrt(distToSunSq);
          const turbulence = kpIndex * 0.05;
          const waveSpeed = 3.0 + kpIndex * 0.5;
          const waves = ((0.12 + turbulence) * Math.sin(distToCenter * 2.2 - gravityOrbTime * waveSpeed)) / (1 + 0.1 * distToCenter * distToCenter);

          let zHover = 0;
          if (hoverGravX !== null && hoverGravY !== null) {
            const unRotX = hoverGravX * Math.cos(-rot) - hoverGravY * Math.sin(-rot);
            const unRotY = hoverGravX * Math.sin(-rot) + hoverGravY * Math.cos(-rot);
            const distToHoverSq = (x - unRotX) * (x - unRotX) + (y - unRotY) * (y - unRotY);
            zHover = -2.0 / (1 + 0.6 * distToHoverSq);
          }

          const z = zSun + zComp + waves + zHover;

          const xRotZ = x * Math.cos(rot) - y * Math.sin(rot);
          const yRotZ = x * Math.sin(rot) + y * Math.cos(rot);

          const xProj = xRotZ;
          const yProj = yRotZ * Math.cos(tilt) - z * Math.sin(tilt);
          const zProj = yRotZ * Math.sin(tilt) + z * Math.cos(tilt);

          const screenX = centerX + (xProj * scale) / (D - zProj);
          const screenY = centerY + (yProj * scale) / (D - zProj);

          projectedGrid[r][c] = {
            x: screenX,
            y: screenY,
            depth: zProj,
            z: z
          };
        }
      }

      // Draw Lines
      ctx.lineWidth = 1.0;
      const drawLine = (p1: any, p2: any) => {
        if (isNaN(p1.x) || isNaN(p1.y) || isNaN(p2.x) || isNaN(p2.y)) return;
        const avgZ = (p1.z + p2.z) / 2;

        let strokeColor;
        if (avgZ < -1.8) {
          const intensity = Math.min(1.0, (avgZ + 1.8) / -3.8);
          strokeColor = `rgba(${spaceWeatherColor}, ${0.3 + intensity * 0.5})`;
          ctx.lineWidth = 1.2 + (kpIndex > 4 ? Math.random() * 0.5 : 0);
        } else {
          strokeColor = theme === "light" ? "rgba(18, 93, 255, 0.08)" : "rgba(222, 235, 255, 0.12)";
          ctx.lineWidth = 0.8;
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = strokeColor;
        ctx.stroke();
      };

      for (let r = 0; r <= gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          drawLine(projectedGrid[r][c], projectedGrid[r][c + 1]);
        }
      }

      for (let c = 0; c <= gridCols; c++) {
        for (let r = 0; r < gridRows; r++) {
          drawLine(projectedGrid[r][c], projectedGrid[r + 1][c]);
        }
      }

      // Sun projection
      const sunCenterZ = -4.0;
      const sunProjY = 0 * Math.cos(tilt) - sunCenterZ * Math.sin(tilt);
      const sunProjZ = 0 * Math.sin(tilt) + sunCenterZ * Math.cos(tilt);
      const sunScreenX = centerX + (0 * scale) / (D - sunProjZ);
      const sunScreenY = centerY + (sunProjY * scale) / (D - sunProjZ);

      ctx.beginPath();
      ctx.arc(sunScreenX, sunScreenY, 5, 0, Math.PI * 2);
      ctx.fillStyle = theme === "light" ? "var(--color-neutral-secondary)" : "#FFFFFF";
      ctx.fill();

      // Companion projection
      const compZ = -1.6;
      const compRotX = companionX * Math.cos(rot) - companionY * Math.sin(rot);
      const compRotY = companionX * Math.sin(rot) + companionY * Math.cos(rot);
      const compProjY = compRotY * Math.cos(tilt) - compZ * Math.sin(tilt);
      const compProjZ = compRotY * Math.sin(tilt) + compZ * Math.cos(tilt);
      const compScreenX = centerX + (compRotX * scale) / (D - compProjZ);
      const compScreenY = centerY + (compProjY * scale) / (D - compProjZ);

      ctx.beginPath();
      ctx.arc(compScreenX, compScreenY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "var(--color-cosmic-secondary)";
      ctx.fill();
    };

    const animateMesh = () => {
      rotationTime += 0.0015;
      gravityOrbTime += 0.015;
      drawMesh();
      animationFrameId = requestAnimationFrame(animateMesh);
    };

    animateMesh();

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", resizeMeshCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [kpIndex, spaceWeatherColor, theme]);

  // 4. Live Moon phase renderer widget in header
  useEffect(() => {
    const canvas = moonCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawMoonPhase = () => {
      const d = new Date();
      const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
      const msSinceNew = d.getTime() - knownNewMoon.getTime();
      const synodicMonthMs = 29.53058868 * 24 * 60 * 60 * 1000;
      const phases = msSinceNew / synodicMonthMs;
      const fraction = phases - Math.floor(phases);

      ctx.clearRect(0, 0, 20, 20);

      // Base dark moon
      ctx.fillStyle = theme === "light" ? "#DEEBFF" : "#010614";
      ctx.beginPath();
      ctx.arc(10, 10, 10, 0, Math.PI * 2);
      ctx.fill();

      // Lit semicircle
      const isWaxing = fraction <= 0.5;
      ctx.fillStyle = theme === "light" ? "#125DFF" : "#DEEBFF";
      ctx.beginPath();
      ctx.arc(10, 10, 10, -Math.PI / 2, Math.PI / 2, !isWaxing);
      ctx.fill();

      // Terminator ellipse
      const ill = isWaxing ? fraction * 2 : 2 - fraction * 2;
      const eWidth = Math.abs(Math.cos(ill * Math.PI)) * 10;
      ctx.fillStyle = ill < 0.5 
        ? (theme === "light" ? "#DEEBFF" : "#010614") 
        : (theme === "light" ? "#125DFF" : "#DEEBFF");

      ctx.beginPath();
      ctx.ellipse(10, 10, eWidth, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    drawMoonPhase();
    const moonInterval = setInterval(drawMoonPhase, 3600000);
    return () => clearInterval(moonInterval);
  }, [theme]);

  // 5. Fluctuate system telemetry altitude/status
  useEffect(() => {
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

  // 6. Konami Code Easter Egg (esss)
  useEffect(() => {
    const target = ["e", "s", "s", "s"];
    let idx = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === target[idx]) {
        idx++;
        if (idx === target.length) {
          setStargazerActive(prev => {
            const next = !prev;
            if (next) {
              document.body.classList.add("stargazer-mode");
            } else {
              document.body.classList.remove("stargazer-mode");
            }
            return next;
          });
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4000);
          idx = 0;
        }
      } else {
        idx = 0;
        if (key === target[0]) idx = 1;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Category collapsible accordions toggler
  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  // Solar system orbits telemetry lookup
  const getSolarSystemTelemetry = () => {
    const data: Record<string, { speed: string; nodes: string }> = {
      default: { speed: "1.0x (REAL)", nodes: "8/9 ACTIVE" },
      mercury: { speed: "DIST: 0.39 AU", nodes: "VEL: 47.4 KM/S" },
      venus: { speed: "DIST: 0.72 AU", nodes: "VEL: 35.0 KM/S" },
      earth: { speed: "DIST: 1.00 AU", nodes: "VEL: 29.8 KM/S" },
      mars: { speed: "DIST: 1.52 AU", nodes: "VEL: 24.1 KM/S" },
      jupiter: { speed: "DIST: 5.20 AU", nodes: "VEL: 13.1 KM/S" }
    };
    return data[hoveredPlanet] || data.default;
  };

  // Launch a simulator bypassed during dev
  const handleLaunchModule = (mod: ModuleData) => {
    router.push(`/modules/${mod.id.replace("module-", "")}`);
  };

  // Render modular showcase preview details
  const activeModule = modules.find(m => m.id === activeModuleId);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col transition-colors duration-200">
      {/* Dynamic Starfield Canvas Background */}
      <canvas ref={spaceCanvasRef} className="fixed inset-0 pointer-events-none -z-30 transition-opacity duration-500" />
      
      {/* Starry glow background overlays */}
      <div className="stars-container" aria-hidden="true">
        <div className="glow-orb" id="glow-orb-1"></div>
        <div className="glow-orb" id="glow-orb-2"></div>
      </div>

      {/* Easter Egg toast banner */}
      {showToast && (
        <div className="stargazer-toast">
          {stargazerActive ? "✨ Stargazer Mode Activated ✨" : "Stargazer Mode Deactivated"}
        </div>
      )}

      {/* Header */}
      <header className="main-header border-b border-card-border backdrop-blur-md bg-background/55 sticky top-0 z-40 transition-all duration-200">
        <div className="container header-wrapper h-20 flex justify-between items-center px-6">
          <Link href="/" className="logo-link">
            <img 
              src={theme === "dark" ? "/esss-logo-white.png" : "/esss-logo.png"} 
              alt="ESSS Logo" 
              className="esss-logo h-12 w-auto object-contain transition-all" 
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="main-nav hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest">
            <a href="#apps" className="hover:text-primary transition-colors text-foreground/80">{t.nav_apps}</a>
            <a href="#labs" className="hover:text-primary transition-colors text-foreground/80">{t.nav_labs}</a>
            <a href="#about" className="hover:text-primary transition-colors text-foreground/80">{t.nav_about}</a>
          </nav>

          <div className="header-controls hidden md:flex items-center gap-3">
            {/* Live Moon Widget */}
            <Link href="/modules/lunar-explorer" className="moon-widget-wrapper" title="Open 3D Lunar Explorer">
              <canvas ref={moonCanvasRef} className="moon-phase" width="20" height="20"></canvas>
            </Link>

            {/* Language Switch */}
            <div className="lang-switch-wrapper">
              <button
                onClick={() => setLanguage(language === "en" ? "am" : "en")}
                className="lang-toggle-btn px-3 py-1.5 rounded-lg border border-card-border bg-card/25 text-[10px] font-bold text-foreground flex items-center gap-1 cursor-pointer transition-all"
              >
                <span className={language === "en" ? "text-primary" : "text-foreground/45"}>EN</span>
                <span className="text-card-border">|</span>
                <span className={language === "am" ? "text-primary" : "text-foreground/45"}>አማ</span>
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg border border-card-border bg-card/25 hover:bg-card/50 text-foreground transition-all cursor-pointer"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4.5 h-4.5 text-yellow-500" /> : <Moon className="w-4.5 h-4.5 text-primary" />}
            </button>

            {/* Logout button if authenticated */}
            {user && (
              <button
                onClick={logout}
                className="px-3.5 py-1.5 rounded-lg border border-red-500/20 bg-card hover:bg-red-500/10 text-[10px] font-bold uppercase text-red-500 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.logout_btn}</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-card-border bg-background/95 backdrop-blur-lg px-6 pt-4 pb-6 space-y-4">
            <nav className="flex flex-col gap-3 font-semibold uppercase text-xs tracking-wider">
              <a href="#apps" onClick={() => setMobileMenuOpen(false)} className="text-foreground hover:text-primary">{t.nav_apps}</a>
              <a href="#labs" onClick={() => setMobileMenuOpen(false)} className="text-foreground hover:text-primary">{t.nav_labs}</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-foreground hover:text-primary">{t.nav_about}</a>
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

              {user && (
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="px-4 py-2 rounded-lg bg-card border border-red-500/20 text-[10px] font-bold text-red-500 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.logout_btn}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="hero-section py-16 md:py-24 z-10 w-full">
        <div className="container hero-wrapper grid grid-cols-1 md:grid-cols-2 items-center gap-12 px-6">
          <div className="hero-content text-left space-y-6">
            <span className="hero-badge inline-flex px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-bold uppercase tracking-wider text-primary">
              {t.hero_badge}
            </span>
            <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-foreground">
              <span className="text-gradient block">{t.hero_title}</span>
            </h1>
            <p className="hero-subtitle text-sm text-foreground/70 max-w-xl leading-relaxed">
              {t.hero_subtitle}
            </p>
            <div className="hero-actions flex flex-wrap gap-3 pt-2">
              <a href="#apps" className="btn btn-primary px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-xs uppercase hover:bg-primary-hover active:scale-95 transition-all">
                {t.hero_cta}
              </a>
              <a href="#labs" className="btn btn-secondary px-5 py-2.5 rounded-lg bg-card border border-card-border text-foreground font-bold text-xs uppercase hover:bg-card-border active:scale-95 transition-all">
                {t.hero_secondary}
              </a>
            </div>
          </div>

          {/* Interactive Relativity Space-Time Canvas Fabric */}
          <div className="hero-visual w-full max-w-md aspect-square mx-auto relative border border-card-border/50 rounded-2xl bg-card/25 overflow-hidden group">
            <div className="dashboard-wireframe w-full h-full relative">
              <canvas ref={heroMeshRef} id="hero-mesh-canvas" className="absolute inset-0 w-full h-full" />
              
              <div className="telemetry-node top-left absolute top-4 left-4 flex flex-col font-mono text-[9px] text-primary uppercase">
                <span className="telemetry-label text-foreground/45">SYS.LAT</span>
                <span className="telemetry-val text-foreground font-bold font-mono">9.0300° N</span>
              </div>
              <div className="telemetry-node top-right absolute top-4 right-4 text-right flex flex-col font-mono text-[9px] text-primary uppercase">
                <span className="telemetry-label text-foreground/45">SYS.LON</span>
                <span className="telemetry-val text-foreground font-bold font-mono">38.7400° E</span>
              </div>
              <div className="telemetry-node bottom-left absolute bottom-4 left-4 flex flex-col font-mono text-[9px] text-primary uppercase">
                <span className="telemetry-label text-foreground/45">ALT.ORBIT</span>
                <span className="telemetry-val text-foreground font-bold font-mono">{telemetry.altitude} KM</span>
              </div>
              <div className="telemetry-node bottom-right absolute bottom-4 right-4 text-right flex flex-col font-mono text-[9px] uppercase cursor-help" title="Live Space Weather (Kp Index)">
                <span className="telemetry-label text-foreground/40 font-bold">SPACE WX</span>
                <span 
                  className="telemetry-val font-extrabold font-mono"
                  style={{ 
                    color: `rgb(${spaceWeatherColor})`, 
                    textShadow: `0 0 10px rgba(${spaceWeatherColor}, 0.7)` 
                  }}
                >
                  Kp {kpIndex.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Apps Area */}
      <main className="main-content z-10 w-full border-t border-card-border/20" id="apps">
        <div className="container px-6 py-12">
          
          {/* Featured Project 1: 3D Interactive Lunar Explorer */}
          <section className="featured-section mb-16" id="featured-lunar">
            <div className="section-header text-center mb-8">
              <span className="section-tag text-[10px] font-bold uppercase tracking-widest text-primary">{t.lunar_tag}</span>
              <h2 className="section-title text-2xl font-extrabold text-foreground tracking-tight">{t.lunar_title_main}</h2>
            </div>

            <div className="featured-card glass-panel grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-2xl overflow-hidden border border-card-border/30 bg-card/25 p-8">
              <div className="featured-info space-y-5">
                <span className="status-badge live text-[8px] font-bold tracking-widest text-primary uppercase border border-primary/20 px-2 py-0.5 rounded-full bg-primary/5">{t.status_active_lunar}</span>
                <h3 className="featured-project-title text-xl font-bold text-foreground">{t.lunar_title}</h3>
                <p className="featured-project-desc text-xs text-foreground/70 leading-relaxed">{t.lunar_desc}</p>
                
                <div className="project-features space-y-2">
                  <h4 className="features-heading text-[10px] font-bold uppercase tracking-wider text-primary">{t.lunar_features_title}</h4>
                  <ul className="features-list text-xs space-y-2">
                    <li className="flex items-center gap-2">
                      <svg className="feature-icon w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span>{t.lunar_feat_1}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="feature-icon w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span>{t.lunar_feat_2}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="feature-icon w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span>{t.lunar_feat_3}</span>
                    </li>
                  </ul>
                </div>

                <div className="featured-actions pt-2">
                  <Link href="/modules/lunar-explorer" className="btn btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-xs uppercase hover:bg-primary-hover active:scale-95 transition-all">
                    <span>{t.lunar_button}</span>
                    <svg className="btn-arrow w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Lunar Orbit Schematic Visualizer */}
              <div className="featured-visual-container rounded-xl overflow-hidden border border-card-border/30 relative">
                <div className="lunar-schematic relative w-[300px] h-[300px] mx-auto flex items-center justify-center">
                  <div className="schematic-moon-large" />
                  
                  {/* Craters */}
                  <div className="moon-crater crater-1 absolute" />
                  <div className="moon-crater crater-2 absolute" />
                  <div className="moon-crater crater-3 absolute" />
                  <div className="moon-crater crater-4 absolute" />
                  <div className="moon-crater crater-5 absolute" />

                  {/* Satellite orbit path */}
                  <div className="orbit-lro">
                    <div className="satellite-marker">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.5 4.5l-2-2L9.2 8.8l-1.3-.7-1.4 1.4 2.8 2.8-5.3 5.3 1.4 1.4 5.3-5.3 2.8 2.8 1.4-1.4-.7-1.3 6.3-6.3-2-2-1.3.7-3.8-3.8.7-1.3zM15 8.3L10.7 4 12 2.7l4.3 4.3L15 8.3zm-6.7 6.7L4 10.7 2.7 12l4.3 4.3 1.3-1.3z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="visual-panel-telemetry flex justify-between absolute bottom-4 left-4 right-4 bg-black/80 border border-card-border/30 rounded px-4 py-2 font-mono text-[9px]">
                  <div className="telemetry-bar flex gap-2">
                    <span className="lbl text-foreground/45">DSN UPLINK</span>
                    <span className="val text-primary font-bold">NOMINAL 🟢</span>
                  </div>
                  <div className="telemetry-bar flex gap-2">
                    <span className="lbl text-foreground/45">SATELLITE ORBIT</span>
                    <span className="val text-primary font-bold">LRO POLAR</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Project 2: Solar & Lunar Eclipse Predictor */}
          <section className="featured-section mb-16" id="featured-eclipse">
            <div className="section-header text-center mb-8">
              <span className="section-tag text-[10px] font-bold uppercase tracking-widest text-primary">{t.eclipse_tag}</span>
              <h2 className="section-title text-2xl font-extrabold text-foreground tracking-tight">{t.eclipse_title_main}</h2>
            </div>

            <div className="featured-card glass-panel grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-2xl overflow-hidden border border-card-border/30 bg-card/25 p-8">
              <div className="featured-info space-y-5">
                <span className="status-badge live text-[8px] font-bold tracking-widest text-primary uppercase border border-primary/20 px-2 py-0.5 rounded-full bg-primary/5">{t.status_active_eclipse}</span>
                <h3 className="featured-project-title text-xl font-bold text-foreground">{t.eclipse_title}</h3>
                <p className="featured-project-desc text-xs text-foreground/70 leading-relaxed">{t.eclipse_desc}</p>
                
                <div className="project-features space-y-2">
                  <h4 className="features-heading text-[10px] font-bold uppercase tracking-wider text-primary">{t.eclipse_features_title}</h4>
                  <ul className="features-list text-xs space-y-2">
                    <li className="flex items-center gap-2">
                      <svg className="feature-icon w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span>{t.eclipse_feat_1}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="feature-icon w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span>{t.eclipse_feat_2}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="feature-icon w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span>{t.eclipse_feat_3}</span>
                    </li>
                  </ul>
                </div>

                <div className="featured-actions pt-2">
                  <Link href="/modules/eclipses-transits" className="btn btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-xs uppercase hover:bg-primary-hover active:scale-95 transition-all">
                    <span>{t.eclipse_button}</span>
                    <svg className="btn-arrow w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Eclipse Optical Raytracing Schematic */}
              <div className="featured-visual-container rounded-xl overflow-hidden border border-card-border/30 relative">
                <div className="eclipse-schematic relative w-[300px] h-[300px] mx-auto flex items-center justify-center">
                  <div className="schematic-sun-body" />
                  <div className="schematic-moon-body" />
                  <div className="schematic-earth-body">
                    <div className="earth-glow" />
                  </div>
                  
                  <svg className="eclipse-geometry-svg" viewBox="0 0 380 380">
                    <line x1="65" y1="155" x2="190" y2="180" stroke="rgba(18, 93, 255, 0.25)" strokeWidth="1" strokeDasharray="3, 3" />
                    <line x1="65" y1="225" x2="190" y2="200" stroke="rgba(18, 93, 255, 0.25)" strokeWidth="1" strokeDasharray="3, 3" />
                    <line x1="65" y1="155" x2="190" y2="200" stroke="rgba(255, 204, 0, 0.12)" strokeWidth="0.8" strokeDasharray="2, 2" />
                    <line x1="65" y1="225" x2="190" y2="180" stroke="rgba(255, 204, 0, 0.12)" strokeWidth="0.8" strokeDasharray="2, 2" />
                    <polygon points="190,180 310,186 310,194 190,200" fill="rgba(2, 6, 20, 0.75)" />
                    <polygon points="190,180 310,150 310,230 190,200" fill="rgba(255, 167, 38, 0.08)" />
                    <line x1="190" y1="180" x2="310" y2="186" stroke="rgba(255, 59, 48, 0.25)" strokeWidth="1" />
                    <line x1="190" y1="200" x2="310" y2="194" stroke="rgba(255, 59, 48, 0.25)" strokeWidth="1" />
                    <line x1="190" y1="180" x2="310" y2="150" stroke="rgba(255, 204, 0, 0.15)" strokeWidth="1" strokeDasharray="4, 4" />
                    <line x1="190" y1="200" x2="310" y2="230" stroke="rgba(255, 204, 0, 0.15)" strokeWidth="1" strokeDasharray="4, 4" />
                  </svg>
                </div>

                <div className="visual-panel-telemetry flex justify-between absolute bottom-4 left-4 right-4 bg-black/80 border border-card-border/30 rounded px-4 py-2 font-mono text-[9px]">
                  <div className="telemetry-bar flex gap-2">
                    <span className="lbl text-foreground/45">ALIGNMENT</span>
                    <span className="val text-primary font-bold">SYZYGY 🟢</span>
                  </div>
                  <div className="telemetry-bar flex gap-2">
                    <span className="lbl text-foreground/45">SHADOW AXIS</span>
                    <span className="val text-primary font-bold">UMBRA / PENUMBRA</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Project 3: Walk in the Solar System */}
          <section className="featured-section mb-16" id="featured-project">
            <div className="section-header text-center mb-8">
              <span className="section-tag text-[10px] font-bold uppercase tracking-widest text-primary">{t.featured_tag}</span>
              <h2 className="section-title text-2xl font-extrabold text-foreground tracking-tight">{t.featured_title_main}</h2>
            </div>

            <div className="featured-card glass-panel grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-2xl overflow-hidden border border-card-border/30 bg-card/25 p-8">
              <div className="featured-info space-y-5">
                <span className="status-badge live text-[8px] font-bold tracking-widest text-primary uppercase border border-primary/20 px-2 py-0.5 rounded-full bg-primary/5">{t.status_active}</span>
                <h3 className="featured-project-title text-xl font-bold text-foreground">{t.featured_title}</h3>
                <p className="featured-project-desc text-xs text-foreground/70 leading-relaxed">{t.featured_desc}</p>
                
                <div className="project-features space-y-2">
                  <h4 className="features-heading text-[10px] font-bold uppercase tracking-wider text-primary">{t.features_title}</h4>
                  <ul className="features-list text-xs space-y-2">
                    <li className="flex items-center gap-2">
                      <svg className="feature-icon w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span>{t.feat_1}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="feature-icon w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span>{t.feat_2}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="feature-icon w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span>{t.feat_3}</span>
                    </li>
                  </ul>
                </div>

                <div className="featured-actions pt-2">
                  <Link href="/modules/walk-in-solar-system" className="btn btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-xs uppercase hover:bg-primary-hover active:scale-95 transition-all">
                    <span>{t.featured_button}</span>
                    <svg className="btn-arrow w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Solar System Schematic Interactive Planet Markers */}
              <div className="featured-visual-container rounded-xl overflow-hidden border border-card-border/30 relative">
                <div className="solar-system-schematic relative w-[300px] h-[300px] mx-auto flex items-center justify-center">
                  <div className="schematic-sun">
                    <div className="sun-glow" />
                  </div>
                  
                  {/* Concentric orbits & Planet markers */}
                  <div className="schematic-orbit orbit-mercury">
                    <div 
                      className="schematic-planet planet-mercury" 
                      onMouseEnter={() => setHoveredPlanet("mercury")}
                      onMouseLeave={() => setHoveredPlanet("default")}
                    />
                  </div>
                  <div className="schematic-orbit orbit-venus">
                    <div 
                      className="schematic-planet planet-venus" 
                      onMouseEnter={() => setHoveredPlanet("venus")}
                      onMouseLeave={() => setHoveredPlanet("default")}
                    />
                  </div>
                  <div className="schematic-orbit orbit-earth">
                    <div 
                      className="schematic-planet planet-earth" 
                      onMouseEnter={() => setHoveredPlanet("earth")}
                      onMouseLeave={() => setHoveredPlanet("default")}
                    >
                      <div className="schematic-moon" />
                    </div>
                  </div>
                  <div className="schematic-orbit orbit-mars">
                    <div 
                      className="schematic-planet planet-mars" 
                      onMouseEnter={() => setHoveredPlanet("mars")}
                      onMouseLeave={() => setHoveredPlanet("default")}
                    />
                  </div>
                  <div className="schematic-orbit orbit-jupiter">
                    <div 
                      className="schematic-planet planet-jupiter" 
                      onMouseEnter={() => setHoveredPlanet("jupiter")}
                      onMouseLeave={() => setHoveredPlanet("default")}
                    />
                  </div>

                  <div className="orbit-lines-overlay" />
                </div>
                
                {/* Dynamically Hovered Orbits Telemetry Box */}
                <div className="visual-panel-telemetry flex justify-between absolute bottom-4 left-4 right-4 bg-black/80 border border-card-border/30 rounded px-4 py-2 font-mono text-[9px]">
                  <div className="telemetry-bar flex gap-2">
                    <span className="lbl text-foreground/45">
                      {hoveredPlanet === "default" ? "SIM TIME SPEED" : `${hoveredPlanet.toUpperCase()} ORBIT`}
                    </span>
                    <span className="val text-primary font-bold font-mono">
                      {getSolarSystemTelemetry().speed}
                    </span>
                  </div>
                  <div className="telemetry-bar flex gap-2">
                    <span className="lbl text-foreground/45">
                      {hoveredPlanet === "default" ? "CELESTIAL NODES" : `${hoveredPlanet.toUpperCase()} METRIC`}
                    </span>
                    <span className="val text-primary font-bold font-mono">
                      {getSolarSystemTelemetry().nodes}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Science Lab Modules Section */}
          <section className="grid-section py-12 border-t border-card-border/20" id="labs">
            <div className="section-header text-center mb-12 space-y-3">
              <span className="section-tag text-[10px] font-bold uppercase tracking-widest text-primary">{t.future_tag}</span>
              <h2 className="section-title text-3xl font-extrabold text-foreground tracking-tight">{t.future_title}</h2>
              <p className="section-subtitle text-xs text-foreground/60 max-w-md mx-auto">{t.future_subtitle}</p>
            </div>

            {/* Premium Modular Tab Accordions Dashboard Dashboard */}
            <div className="module-dashboard glass-panel flex flex-col md:flex-row h-[520px] rounded-xl overflow-hidden border border-card-border/30 relative bg-card/25 w-full">
              
              {/* Left Column: Expandable Category Tab Accordions */}
              <div className="module-tabs flex-shrink-0 w-full md:w-[320px] bg-black/25 overflow-y-auto border-r border-card-border/30 flex flex-col">
                {categories.map((category) => {
                  const categoryModules = modules.filter(m => m.category === category && m.status !== 'pending');
                  if (categoryModules.length === 0) return null;

                  const isExpanded = !!expandedCategories[category];
                  const catKey = 'cat_' + category.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');

                  return (
                    <div key={category} className={`category-group border-b border-card-border/20 ${isExpanded ? 'expanded' : ''}`}>
                      <button 
                        onClick={() => toggleCategory(category)}
                        className="category-header w-full flex justify-between items-center px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-primary border-none bg-black/10 hover:bg-primary/5 cursor-pointer text-left transition-colors"
                      >
                        <span data-i18n={catKey}>{(t as any)[catKey] || category}</span>
                        <ChevronDown className={`w-4 h-4 text-foreground/45 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="category-content flex flex-col">
                          {categoryModules.map((mod) => {
                            const isActive = activeModuleId === mod.id;
                            return (
                              <button
                                key={mod.id}
                                onClick={() => setActiveModuleId(mod.id)}
                                className={`module-tab flex items-center gap-4 px-6 py-4 text-left border-none bg-transparent hover:bg-primary/5 cursor-pointer transition-colors border-b border-card-border/10 relative ${
                                  isActive ? 'active bg-primary/10 text-white font-bold' : 'text-foreground/75'
                                }`}
                              >
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow shadow-primary" />}
                                <div 
                                  className="tab-icon w-8 h-8 flex items-center justify-center text-primary/45 transition-transform"
                                  dangerouslySetInnerHTML={{ __html: mod.iconSvg }}
                                />
                                <div className="tab-label flex flex-col">
                                  <span className="tab-num font-mono text-[8px] text-foreground/35 mb-0.5">{mod.num}</span>
                                  <span className="tab-title text-xs font-semibold">{mod.title}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* In Development category section */}
                {modules.filter(m => m.status === 'pending').length > 0 && (
                  <div className={`category-group border-b border-card-border/20 ${!!expandedCategories["pending"] ? 'expanded' : ''}`}>
                    <button 
                      onClick={() => toggleCategory("pending")}
                      className="category-header w-full flex justify-between items-center px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-primary border-none bg-black/10 hover:bg-primary/5 cursor-pointer text-left transition-colors"
                    >
                      <span>{t.in_development}</span>
                      <ChevronDown className={`w-4 h-4 text-foreground/45 transition-transform duration-200 ${!!expandedCategories["pending"] ? 'rotate-180' : ''}`} />
                    </button>

                    {!!expandedCategories["pending"] && (
                      <div className="category-content flex flex-col">
                        {modules.filter(m => m.status === 'pending').map((mod) => {
                          const isActive = activeModuleId === mod.id;
                          return (
                            <button
                              key={mod.id}
                              onClick={() => setActiveModuleId(mod.id)}
                              className={`module-tab flex items-center gap-4 px-6 py-4 text-left border-none bg-transparent hover:bg-primary/5 cursor-pointer transition-colors border-b border-card-border/10 relative ${
                                isActive ? 'active bg-primary/10 text-white font-bold' : 'text-foreground/75'
                              }`}
                            >
                              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow shadow-primary" />}
                              <div 
                                className="tab-icon w-8 h-8 flex items-center justify-center text-primary/45"
                                dangerouslySetInnerHTML={{ __html: mod.iconSvg }}
                              />
                              <div className="tab-label flex flex-col">
                                  <span className="tab-num font-mono text-[8px] text-foreground/35 mb-0.5">{mod.num}</span>
                                  <span className="tab-title text-xs font-semibold">{mod.title}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Active Module Showcase Preview details pane */}
              <div className="module-showcase flex-grow p-8 bg-gradient-radial from-primary/5 via-transparent to-transparent flex items-center justify-center">
                {activeModule ? (
                  <div className="module-pane active flex flex-col md:flex-row items-center gap-8 w-full max-w-2xl opacity-100 transition-all duration-300">
                    <div className="pane-visual flex-shrink-0 w-36 h-36 border border-card-border/30 rounded-xl bg-card/15 flex items-center justify-center text-primary/20 relative animate-pulse">
                      <div 
                        className="visual-placeholder w-16 h-16"
                        dangerouslySetInnerHTML={{ __html: activeModule.iconSvg }}
                      />
                    </div>
                    
                    <div className="pane-content flex-grow space-y-4">
                      <div className="pane-meta flex gap-2">
                        <span className="meta-tag px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase bg-primary/10 border border-primary/20 text-primary">
                          {activeModule.complexity} Complexity
                        </span>
                        <span className="meta-tag px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase bg-card border border-card-border text-foreground/45">
                          {activeModule.audience}
                        </span>
                      </div>
                      
                      <div className="category-lbl font-mono text-[9px] text-primary uppercase tracking-widest">{activeModule.category}</div>
                      <h3 className="text-xl font-bold text-foreground leading-tight">{activeModule.title}</h3>
                      <p className="text-xs text-foreground/65 leading-relaxed min-h-[48px]">{activeModule.concept}</p>
                      
                      <div className="pane-tech p-3 bg-black/30 border-l-2 border-primary rounded text-[9px] font-mono text-primary/70">
                        <span>{t.powered_by}</span> {activeModule.tech}
                      </div>

                      {activeModule.status === 'pending' ? (
                        <button
                          className="btn-launch px-4 py-2 rounded-lg bg-card border border-card-border text-foreground/30 font-bold text-[10px] uppercase cursor-not-allowed"
                          disabled
                        >
                          {t.mod_btn_pending}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLaunchModule(activeModule)}
                          className="btn-launch px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-[10px] uppercase hover:bg-primary-hover active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{t.mod_btn_launch}</span>
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-foreground/35 font-mono">SELECT A LAB SIMULATOR TO PREVIEW</div>
                )}
              </div>

            </div>
          </section>

          {/* About Section */}
          <section className="about-section py-12" id="about">
            <div className="about-card glass-panel grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 p-10 rounded-2xl border border-card-border/40 bg-card/25 items-center">
              <div className="about-content space-y-4">
                <span className="about-tag text-[10px] font-mono font-bold uppercase tracking-widest text-primary">{t.about_tag}</span>
                <h2 className="about-title text-3xl font-extrabold text-foreground">{t.about_title}</h2>
                <p className="about-desc text-xs text-foreground/75 leading-relaxed">
                  {t.about_desc}
                </p>
              </div>

              <div className="about-stats-grid grid grid-cols-1 gap-4">
                <div className="stat-card border border-card-border/30 rounded-xl bg-card/15 p-5 text-center relative group">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/45" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/45" />
                  <span className="stat-num text-3xl font-black text-primary block mb-1">2004</span>
                  <span className="stat-lbl text-[9px] text-foreground/45 uppercase tracking-widest">{t.stat_est}</span>
                </div>
                
                <div className="stat-card border border-card-border/30 rounded-xl bg-card/15 p-5 text-center relative group">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/45" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/45" />
                  <span className="stat-num text-3xl font-black text-primary block mb-1">15,000+</span>
                  <span className="stat-lbl text-[9px] text-foreground/45 uppercase tracking-widest">{t.stat_members}</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="main-footer border-t border-card-border bg-[#010614] py-8 mt-auto z-10">
        <div className="container footer-wrapper grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-8 px-6 mb-8">
          <div className="footer-brand space-y-4">
            <div className="footer-logo">
              <img src="/esss-logo-white.png" alt="ESSS Logo" className="esss-logo-footer h-14 w-auto object-contain" />
            </div>
            <p className="footer-tagline text-xs text-foreground/60 max-w-xs leading-relaxed">
              {t.footer_tagline}
            </p>
          </div>
          
          <div className="footer-links-group space-y-4">
            <h4 className="footer-group-title text-xs font-bold uppercase tracking-widest text-foreground">{t.footer_links_title}</h4>
            <ul className="footer-links text-xs space-y-2 text-foreground/60">
              <li><a href="#" className="hover:text-primary transition-colors">{t.nav_home}</a></li>
              <li><a href="#apps" className="hover:text-primary transition-colors">{t.nav_apps}</a></li>
              <li><a href="#labs" className="hover:text-primary transition-colors">{t.nav_labs}</a></li>
              <li><a href="#about" className="hover:text-primary transition-colors">{t.nav_about}</a></li>
              <li>
                <a href="https://ethiosss.org.et" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  {t.footer_main_site}
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-social-group space-y-4">
            <h4 className="footer-group-title text-xs font-bold uppercase tracking-widest text-foreground">Connect</h4>
            <div className="flex gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary text-foreground/45 transition-colors">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary text-foreground/45 transition-colors">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="hover:text-primary text-foreground/45 transition-colors">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="container px-6 border-t border-card-border/10 pt-4 flex justify-between items-center text-[10px] font-semibold text-foreground/45 uppercase tracking-widest">
          <span>&copy; 2026 {t.footer_copyright}</span>
        </div>
      </footer>
    </div>
  );
}
