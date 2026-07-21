"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { usePortalStore } from "@/store/usePortalStore";
import { Sun, Moon } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { theme, setTheme, setLanguage } = usePortalStore();

  // Sync initial theme and light class on document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
  }, [theme]);

  // Frame-busting check: If this page (the home page) is loaded inside an iframe, redirect the top window to home.
  useEffect(() => {
    if (window.self !== window.top && window.top) {
      window.top.location.href = "/";
    }
  }, []);

  // Sync language change inside app.js back to Zustand store
  useEffect(() => {
    const syncLanguage = () => {
      const currentLang = localStorage.getItem("esss_science_lang") || "en";
      setLanguage(currentLang as "en" | "am");
    };

    // Check language status initially
    syncLanguage();

    const langBtn = document.getElementById("lang-btn");
    langBtn?.addEventListener("click", syncLanguage);
    return () => {
      langBtn?.removeEventListener("click", syncLanguage);
    };
  }, [setLanguage]);

  // Intercept all module launch clicks and route them via Next.js router pushing
  useEffect(() => {
    const handleInterceptClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link) {
        const href = link.getAttribute("href");
        if (href && (href.includes("modules/") || href.includes("index.html"))) {
          e.preventDefault();
          // Extract module folder slug
          // e.g. "modules/lunar-explorer/index.html" -> "lunar-explorer"
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

  // Execute original app.js and modules-data.js scripts safely after DOM elements are fully mounted
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

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener("click", function(e) {
          var target = e.target;
          var link = target.closest("a");
          if (link) {
            var href = link.getAttribute("href");
            if (href && (href.indexOf("modules/") !== -1 || href.indexOf("index.html") !== -1)) {
              e.preventDefault();
              var match = href.match(/modules\\/([^/]+)/);
              if (match) {
                window.location.href = '/modules/' + match[1];
              }
            }
          }
        });
      `}} />
      {/* 1. Starry background decoration */}
      <canvas id="space-canvas"></canvas>
      <div className="stars-container" aria-hidden="true">
        <div className="glow-orb" id="glow-orb-1"></div>
        <div className="glow-orb" id="glow-orb-2"></div>
      </div>

      {/* 2. Header & Navigation */}
      <header className="main-header">
        <div className="container header-wrapper">
          <a href="#" className="logo-link" id="logo-main" aria-label="ESSS Home">
            <img src={theme === "dark" ? "/esss-logo-white.png" : "/esss-logo.png"} alt="ESSS Logo" className="esss-logo" />
          </a>

          <nav className="main-nav" aria-label="Main Navigation">
            <ul className="nav-list">
              <li><a href="#" className="nav-link active" data-i18n="nav_home" id="nav-home">Home</a></li>
              <li><a href="#apps" className="nav-link" data-i18n="nav_apps" id="nav-apps">Space Apps</a></li>
              <li><a href="#labs" className="nav-link" data-i18n="nav_labs" id="nav-labs">Science Labs</a></li>
              <li><a href="#about" className="nav-link" data-i18n="nav_about" id="nav-about">About</a></li>
            </ul>
          </nav>

          <div className="header-controls">
            {/* Live moon phase widget */}
            <a href="modules/lunar-explorer/index.html" className="moon-widget-wrapper" title="Open 3D Lunar Explorer">
              <canvas className="moon-phase" id="live-moon" width="20" height="20"></canvas>
            </a>

            {/* Language Toggle switcher */}
            <div className="lang-switch-wrapper">
              <button id="lang-btn" className="lang-toggle-btn" aria-label="Switch Language / ቋንቋ ይቀይሩ">
                <span className="lang-indicator active-lang" id="lang-en">EN</span>
                <span className="lang-divider">|</span>
                <span className="lang-indicator" id="lang-am">አማ</span>
              </button>
            </div>

            {/* Theme Toggle switcher (Minimalist layout) */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-cosmic-secondary)"
              }}
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun style={{ width: "16px", height: "16px", color: "#ffcc00" }} /> : <Moon style={{ width: "16px", height: "16px", color: "#125DFF" }} />}
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="hero-section">
        <div className="container hero-wrapper">
          <div className="hero-content">
            <span className="hero-badge" data-i18n="hero_badge" id="hero-badge-txt">ESSS Science & Innovation</span>
            <h1 className="hero-title"><span className="text-gradient" data-i18n="hero_title" id="hero-title-txt">Ethiopian Space Science Society</span></h1>
            <p className="hero-subtitle" data-i18n="hero_subtitle" id="hero-subtitle-txt">Exploration, Innovation, and Inspiration for Africa's Space Future.</p>
            <div className="hero-actions">
              <a href="#featured-lunar" className="btn btn-primary" data-i18n="hero_cta" id="hero-cta-btn">Explore the Universe</a>
              <a href="#apps" className="btn btn-secondary" data-i18n="hero_secondary" id="hero-secondary-btn">View Space Apps</a>
            </div>
          </div>
          {/* Aesthetic Dashboard Grid/Orbit wireframe (NASA/ESA style) */}
          <div className="hero-visual">
            <div className="dashboard-wireframe">
              <canvas id="hero-mesh-canvas"></canvas>
              <div className="telemetry-node top-left">
                <span className="telemetry-label">SYS.LAT</span>
                <span className="telemetry-val font-mono">9.0300° N</span>
              </div>
              <div className="telemetry-node top-right">
                <span className="telemetry-label">SYS.LON</span>
                <span className="telemetry-val font-mono">38.7400° E</span>
              </div>
              <div className="telemetry-node bottom-left">
                <span className="telemetry-label">ALT.ORBIT</span>
                <span className="telemetry-val font-mono">628 KM</span>
              </div>
              <div className="telemetry-node bottom-right" id="sw-node" title="Live Space Weather (Kp Index)">
                <span className="telemetry-label" style={{ color: "var(--color-neutral-secondary)" }}>SPACE WX</span>
                <span className="telemetry-val font-mono" id="sw-val">FETCHING...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Main Content Area */}
      <main className="main-content" id="apps">
        <div className="container">
          
          {/* Featured Project: 3D Lunar Explorer */}
          <section className="featured-section" id="featured-lunar" style={{ marginBottom: "60px" }}>
            <div className="section-header text-center">
              <span className="section-tag" data-i18n="lunar_tag" id="lunar-tag-txt">Space Application</span>
              <h2 className="section-title"><span className="text-gradient" data-i18n="lunar_title_main" id="lunar-title-main-txt">3D Interactive Lunar Explorer</span></h2>
            </div>

            <div className="featured-card glass-panel">
              <div className="featured-info">
                <span className="status-badge live" data-i18n="status_active_lunar" id="status-active-lunar-txt">Space App</span>
                <h3 className="featured-project-title" data-i18n="lunar_title" id="lunar-title-txt">Lunar Explorer & Topography</h3>
                <p className="featured-project-desc" data-i18n="lunar_desc" id="lunar-desc-txt">
                  Explore the Moon in full 3D. Inspect historic landing sites, craters, and maria using high-resolution NASA topology data mapped to a realistic spherical globe.
                </p>
                
                <div className="project-features">
                  <h4 className="features-heading" data-i18n="lunar_features_title" id="lunar-features-title-txt">Key Features:</h4>
                  <ul className="features-list">
                    <li>
                      <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span data-i18n="lunar_feat_1" id="lunar-feat-1-txt">High-resolution 3D terrain</span>
                    </li>
                    <li>
                      <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span data-i18n="lunar_feat_2" id="lunar-feat-2-txt">50+ annotated historic locations</span>
                    </li>
                    <li>
                      <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      <span data-i18n="lunar_feat_3" id="lunar-feat-3-txt">Offline-ready bilingual encyclopedia</span>
                    </li>
                  </ul>
                </div>

                <div className="featured-actions">
                  <a href="modules/lunar-explorer/index.html" className="btn btn-primary btn-large btn-icon" id="lunar-launch-btn">
                    <span data-i18n="lunar_button" id="lunar-button-txt">Launch Lunar Explorer</span>
                    <svg className="btn-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Custom Lunar Animation Visual */}
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

          {/* Featured Project: Solar & Lunar Eclipse Predictor */}
          <section className="featured-section" id="featured-eclipse" style={{ marginBottom: "60px" }}>
            <div className="section-header text-center">
              <span className="section-tag" data-i18n="eclipse_tag" id="eclipse-tag-txt">Space Application</span>
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
                      <span data-i18n="eclipse_feat_3" id="eclipse-feat-3-txt">Kotlin integration & offline support</span>
                    </li>
                  </ul>
                </div>

                <div className="featured-actions">
                  <a href="modules/eclipses-transits/index.html" className="btn btn-primary btn-large btn-icon" id="eclipse-launch-btn">
                    <span data-i18n="eclipse_button" id="eclipse-button-txt">Launch Eclipse Predictor</span>
                    <svg className="btn-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Custom Eclipse Schematic Visual */}
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

          {/* Featured Project: Walk in the Solar System */}
          <section className="featured-section" id="featured-project">
            <div className="section-header text-center">
              <span className="section-tag" data-i18n="featured_tag" id="featured-tag-txt">Space Application</span>
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
                  <a href="modules/walk-in-solar-system/index.html" className="btn btn-primary btn-large btn-icon" id="launch-btn">
                    <span data-i18n="featured_button" id="featured-button-txt">Launch Interactive Map</span>
                    <svg className="btn-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Clean SVG/CSS Orbit Simulation Visual */}
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

          {/* Future Projects Modular Grid */}
          <section className="grid-section" id="labs">
            <div className="section-header">
              <span className="section-tag" data-i18n="future_tag" id="future-tag-txt">Science Labs</span>
              <h2 className="section-title" data-i18n="future_title" id="future-title-txt">Science Lab Modules</h2>
              <p className="section-subtitle" data-i18n="future_subtitle" id="future-subtitle-txt">Explore our collection of interactive science labs, physics sandboxes, and aerospace simulators.</p>
            </div>

            <div className="module-dashboard glass-panel" id="module-dashboard-container">
              {/* Dashboard UI will be populated by modules-data.js */}
            </div>
          </section>

          {/* About Section / Organization Info */}
          <section className="about-section" id="about">
            <div className="about-card glass-panel">
              <div className="about-content">
                <span className="about-tag" data-i18n="about_tag" id="about-tag-txt">About the Society</span>
                <h2 className="about-title" data-i18n="about_title" id="about-title-txt">Ethiopian Space Science Society (ESSS)</h2>
                <p className="about-desc" data-i18n="about_desc" id="about-desc-txt">
                  Established in 2004, the Ethiopian Space Science Society (ESSS) is a non-governmental organization composed of members representing space science professionals, space technology enthusiasts, and interested individuals. ESSS operates with a mission to develop space science and technology capacity in Ethiopia, making the country an active contributor to space applications in East Africa.
                </p>
              </div>
              <div className="about-stats-grid">
                <div className="stat-card">
                  <span className="stat-num">2004</span>
                  <span className="stat-lbl" data-i18n="stat_est" id="stat-est-txt">Established</span>
                </div>
                <div className="stat-card">
                  <span className="stat-num">10K+</span>
                  <span className="stat-lbl" data-i18n="stat_members" id="stat-members-txt">Active Members</span>
                </div>
                <div className="stat-card">
                  <span className="stat-num">15+</span>
                  <span className="stat-lbl" data-i18n="stat_branches" id="stat-branches-txt">Regional Branches</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <div className="container footer-wrapper">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/esss-logo-white.png" alt="ESSS Logo" className="esss-logo-footer" style={{ height: "60px", width: "auto", marginLeft: "-10px" }} />
            </div>
            <p className="footer-tagline" data-i18n="footer_tagline" id="footer-tagline-txt">Advancing astronomical sciences and space technology research in Ethiopia.</p>
          </div>
          
          <div className="footer-links-group">
            <h4 className="footer-group-title" data-i18n="footer_links_title" id="footer-links-title-txt">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#" data-i18n="nav_home" id="footer-home">Home</a></li>
              <li><a href="#apps" data-i18n="nav_apps" id="footer-apps">Space Apps</a></li>
              <li><a href="#labs" data-i18n="nav_labs" id="footer-labs">Science Labs</a></li>
              <li><a href="#about" data-i18n="nav_about" id="footer-about">About Us</a></li>
              <li><a href="https://ethiosss.org.et" target="_blank" rel="noopener noreferrer" data-i18n="footer_main_site" id="footer-main-site-txt">Official Website</a></li>
            </ul>
          </div>

          <div className="footer-social-group">
            <h4 className="footer-group-title" data-i18n="footer_social_title" id="footer-social-title-txt">Connect</h4>
            <div className="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Twitter / X">
                <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Telegram">
                <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="container footer-bottom">
          <p className="copyright">&copy; <span id="copyright-year">2026</span> <span data-i18n="footer_copyright" id="footer-copyright-txt">Ethiopian Space Science Society (ESSS). All rights reserved.</span></p>
        </div>
      </footer>

      {/* 5. Load original static script files dynamically */}
      <Script src="/modules-data.js" strategy="afterInteractive" onLoad={() => {
        if (typeof (window as any).renderModuleDashboard === "function") {
          (window as any).renderModuleDashboard();
        }
      }} />
      <Script src="/app.js" strategy="afterInteractive" onLoad={() => {
        if (typeof (window as any).initApp === "function") {
          (window as any).initApp();
        }
      }} />
    </>
  );
}
