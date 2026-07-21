const modulesData = [
    {
        id: "module-eclipses-transits",
        num: "11",
        title: "Eclipse & Transit Physics Lab",
        category: "Planetary Science",
        complexity: "High",
        audience: "Students & Enthusiasts",
        concept: "Explore the optical geometry, shadow structures (umbra/penumbra), and orbital alignment physics that create eclipses and planetary transits.",
        tech: "WebGL • Physics Engine • Light Simulation",
        status: "pending",
        href: "#",
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9" stroke-width="1.5"/><circle cx="12" cy="12" r="5" fill="currentColor"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke-width="1.5"/></svg>`
    },
    {
        id: "module-cosmic-ladder",
        num: "10",
        title: "The Cosmic Distance Ladder",
        category: "Cosmology & Relativity",
        complexity: "Medium",
        audience: "Students & Enthusiasts",
        concept: "Interactive journey through history to measure the scale of the universe.",
        tech: "Three.js • Chart.js • MathJax",
        status: "build",
        href: "modules/cosmic-ladder/index.html",
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 20h16M4 12h16M4 4h16M8 20V4M16 20V4" stroke-width="1.5"/></svg>`
    },
    {
        id: "module-1",
        num: "01",
        title: "Exoplanet Transit Light Curve Lab",
        category: "Astrophysics",
        complexity: "Medium",
        audience: "Students & Teachers",
        concept: "Simulate a planet crossing a star to plot light dimming curves.",
        tech: "NASA Astronify • Chart.js",
        status: "build", // ready to build
        href: "modules/exoplanet-lab/index.html",
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5" stroke-width="1.5"/><circle cx="20" cy="12" r="2" fill="currentColor"/><path d="M4 12h16" stroke-dasharray="2 2"/></svg>`
    },
    {
        id: "module-2",
        num: "02",
        title: "Gravitational Slingshot Sandbox",
        category: "Astrophysics",
        complexity: "High",
        audience: "Enthusiasts & Nerds",
        concept: "Launch a probe past a moving planet to alter its heliocentric velocity.",
        tech: "Matter.js • HTML5 Canvas",
        status: "build",
        href: "modules/slingshot-sandbox/index.html",
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path d="M2 20 Q 12 18, 16 8 T 22 2" stroke-width="1.5"/></svg>`
    },
    {
        id: "module-3",
        num: "03",
        title: "Amateur Rocket Ballistics Engine",
        category: "Aerospace Engineering",
        complexity: "High",
        audience: "Enthusiasts & Nerds",
        concept: "Design a rocket, calculate stability, and simulate flight profiles with 2D wind drift.",
        tech: "Barrowman Equations • Chart.js",
        status: "build",
        href: "modules/rocket-ballistics/index.html",
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L9 9l-2 9 5-2 5 2-2-9-3-7z" stroke-width="1.5"/><path d="M10 20l2 2 2-2" stroke-width="1.5"/></svg>`
    },
    {
        id: "module-4",
        num: "04",
        title: "LEO Satellite Pass & Doppler Calculator",
        category: "Aerospace Engineering",
        complexity: "Medium",
        audience: "Students & Teachers",
        concept: "Predict satellite visibility footprints and real-time radio frequency shifts.",
        tech: "SatNOGS • satellite.js • Leaflet.js",
        status: "build",
        href: "modules/satellite-doppler/index.html",
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="10" width="18" height="4" rx="1"/><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M4 10V6h2m14 4V6h-2M4 14v4h2m14-4v4h-2"/></svg>`
    },
    {
        id: "module-5",
        num: "05",
        title: "Radio Aperture Synthesis Visualizer",
        category: "Radio Science",
        complexity: "Ultra",
        audience: "Enthusiasts & Nerds",
        concept: "Arrange antenna arrays to observe how layouts dictate radio image resolution.",
        tech: "NASA Open MCT • Canvas",
        status: "build",
        href: "modules/aperture-synthesis/index.html",
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20V10M7 5a7.5 7.5 0 0 1 10 0M4 8a11.5 11.5 0 0 1 16 0" stroke-width="1.5"/></svg>`
    },
    {
        id: "module-6",
        num: "06",
        title: "Multi-Phase Orbital Mechanics Simulator",
        category: "Aerospace Engineering",
        complexity: "High",
        audience: "Enthusiasts & Nerds",
        concept: "Gamified physics sandbox for gravity turns, Hohmann transfers, and rendezvous.",
        tech: "Three.js • WebGL • RK4",
        status: "build",
        href: "modules/orbital-mechanics/index.html",
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`
    },
    {
        id: "module-7",
        num: "07",
        title: "Live Solar Activity & SOHO Viewer",
        category: "Space Weather & Physics",
        complexity: "Low",
        audience: "All",
        concept: "Real-time dashboard fetching live sun imagery from SOHO and GOES.",
        tech: "SOHO API • NOAA SWPC",
        status: "pending",
        href: "#",
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 2v2m0 16v2m7-17l-1.4 1.4M6.4 17.6L5 19m17-7h-2M4 12H2m17.6 6.4l-1.4-1.4M6.4 6.4L5 5"/></svg>`
    },
    {
        id: "module-8",
        num: "08",
        title: "Virtual Wave Optics Lab",
        category: "Space Weather & Physics",
        complexity: "Medium",
        audience: "Students & Teachers",
        concept: "Interactive lab to simulate double-slit diffraction, interference, and polarization.",
        tech: "PhET Interactive Models",
        status: "pending",
        href: "#",
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12q2-4 4 0t4 0t4 0t4 0" stroke-width="1.5"/><path d="M3 16q2-4 4 0t4 0t4 0t4 0" stroke-width="1.5" opacity="0.5"/></svg>`
    },
    {
        id: "module-9",
        num: "09",
        title: "Plasma & EM Field Simulator",
        category: "Space Weather & Physics",
        complexity: "High",
        audience: "Enthusiasts & Nerds",
        concept: "Visualize how charged particles interact with Earth's magnetic field.",
        tech: "Three.js",
        status: "pending",
        href: "#",
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke-dasharray="4 4"/><path d="M4 12c0 4.4 3.6 8 8 8s8-3.6 8-8" stroke-dasharray="4 4"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`
    }
];

const CATEGORIES = [
    "Planetary Science",
    "Astrophysics",
    "Cosmology & Relativity",
    "Astrobiology",
    "Aerospace Engineering",
    "Space Weather & Physics",
    "Radio Science",
    "Earth Observation & Climate"
];

function renderModuleDashboard() {
    const container = document.getElementById('module-dashboard-container');
    if (!container) return;

    let tabsHTML = '<div class="module-tabs">';
    let showcaseHTML = '<div class="module-showcase">';

    let isFirst = true;

    let categoryIndex = 0;
    CATEGORIES.forEach((category) => {
        const categoryModules = modulesData.filter(m => m.category === category && m.status !== 'pending');
        
        if (categoryModules.length === 0) {
            return; // Skip empty categories
        }

        // First rendered category is expanded by default
        const isExpanded = categoryIndex === 0 ? 'expanded' : ''; 
        
        tabsHTML += `<div class="category-group ${isExpanded}">`;
        
        // Render category header button with chevron
        const catKey = 'cat_' + category.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
        tabsHTML += `
            <button class="category-header">
                <span class="category-name" data-i18n="${catKey}">${category}</span>
                <svg class="chevron-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
            </button>
            <div class="category-content">
        `;
        
        categoryModules.forEach(mod => {
            const isActive = isFirst ? 'active' : '';
            const complexityClass = mod.complexity.toLowerCase() === 'ultra' ? 'ultra' :
                                    mod.complexity.toLowerCase() === 'high' ? 'high' :
                                    mod.complexity.toLowerCase() === 'medium' ? 'medium' : 'low';
            
            let buttonHTML = `<a href="#" class="btn btn-primary btn-launch disabled" onclick="return false;"><span data-i18n="mod_btn_pending">Pending</span></a>`;
            if (mod.status === 'build') {
                buttonHTML = `<a href="${mod.href}" class="btn btn-primary btn-launch">
                                <span data-i18n="mod_btn_launch">Launch Module</span>
                                <svg class="btn-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                                </svg>
                              </a>`;
            }

            // Tab Button
            tabsHTML += `
                <button class="module-tab ${isActive}" data-id="${mod.id}">
                    <div class="tab-icon">${mod.iconSvg}</div>
                    <div class="tab-label">
                        <span class="tab-num">${mod.num}</span>
                        <span class="tab-title" data-i18n="${mod.id}_title">${mod.title}</span>
                    </div>
                </button>
            `;

            // Showcase Pane
            const modCatKey = 'cat_' + mod.category.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
            showcaseHTML += `
                <div class="module-pane ${isActive}" id="pane-${mod.id}">
                    <div class="pane-visual">
                        <div class="visual-placeholder">
                            ${mod.iconSvg}
                        </div>
                    </div>
                    <div class="pane-content">
                        <div class="pane-meta">
                            <span class="meta-tag complexity-${complexityClass}" data-i18n="comp_${complexityClass}">${mod.complexity} Complexity</span>
                            <span class="meta-tag audience" data-i18n="aud_${mod.audience.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}">${mod.audience}</span>
                        </div>
                        <span class="category-lbl" data-i18n="${modCatKey}">${mod.category}</span>
                        <h3 data-i18n="${mod.id}_title">${mod.title}</h3>
                        <p data-i18n="${mod.id}_concept">${mod.concept}</p>
                        <div class="pane-tech">
                            <span data-i18n="powered_by">Powered by:</span> ${mod.tech}
                        </div>
                        ${buttonHTML}
                    </div>
                </div>
            `;
            
            isFirst = false;
        });
        
        tabsHTML += `</div></div>`; // Close category-content and category-group
        categoryIndex++;
    });

    const pendingModules = modulesData.filter(m => m.status === 'pending');
    if (pendingModules.length > 0) {
        tabsHTML += `<hr class="module-divider" style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 15px 0;">`;
        tabsHTML += `<div class="category-group">`;
        
        // Render category header button with chevron
        tabsHTML += `
            <button class="category-header">
                <span class="category-name" data-i18n="in_development">In Development</span>
                <svg class="chevron-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
            </button>
            <div class="category-content">
        `;
        
        pendingModules.forEach(mod => {
            const isActive = isFirst ? 'active' : '';
            const complexityClass = mod.complexity.toLowerCase() === 'ultra' ? 'ultra' :
                                    mod.complexity.toLowerCase() === 'high' ? 'high' :
                                    mod.complexity.toLowerCase() === 'medium' ? 'medium' : 'low';
            
            let buttonHTML = `<a href="#" class="btn btn-primary btn-launch disabled" onclick="return false;"><span data-i18n="mod_btn_pending">Pending</span></a>`;

            // Tab Button
            tabsHTML += `
                <button class="module-tab ${isActive}" data-id="${mod.id}">
                    <div class="tab-icon">${mod.iconSvg}</div>
                    <div class="tab-label">
                        <span class="tab-num">${mod.num}</span>
                        <span class="tab-title" data-i18n="${mod.id}_title">${mod.title}</span>
                    </div>
                </button>
            `;

            // Showcase Pane
            const modCatKey = 'cat_' + mod.category.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
            showcaseHTML += `
                <div class="module-pane ${isActive}" id="pane-${mod.id}">
                    <div class="pane-visual">
                        <div class="visual-placeholder">
                            ${mod.iconSvg}
                        </div>
                    </div>
                    <div class="pane-content">
                        <div class="pane-meta">
                            <span class="meta-tag complexity-${complexityClass}" data-i18n="comp_${complexityClass}">${mod.complexity} Complexity</span>
                            <span class="meta-tag audience" data-i18n="aud_${mod.audience.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}">${mod.audience}</span>
                        </div>
                        <span class="category-lbl" data-i18n="${modCatKey}">${mod.category}</span>
                        <h3 data-i18n="${mod.id}_title">${mod.title}</h3>
                        <p data-i18n="${mod.id}_concept">${mod.concept}</p>
                        <div class="pane-tech">
                            <span data-i18n="powered_by">Powered by:</span> ${mod.tech}
                        </div>
                        ${buttonHTML}
                    </div>
                </div>
            `;
            
            isFirst = false;
        });
        
        tabsHTML += `</div></div>`; // Close category-content and category-group
    }

    tabsHTML += '</div>';
    showcaseHTML += '</div>';

    container.innerHTML = tabsHTML + showcaseHTML;

    // Attach event listeners for tabs
    const tabs = document.querySelectorAll('.module-tab');
    const panes = document.querySelectorAll('.module-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));

            // Add active class to clicked tab and corresponding pane
            tab.classList.add('active');
            const paneId = 'pane-' + tab.getAttribute('data-id');
            const targetPane = document.getElementById(paneId);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });

    // Attach event listeners for category headers (collapse/expand)
    const categoryHeaders = document.querySelectorAll('.category-header');
    categoryHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const group = header.parentElement;
            group.classList.toggle('expanded');
        });
    });

    // Apply translations to the newly generated DOM elements
    if (window.setLanguage) {
        window.setLanguage(localStorage.getItem('esss_science_lang') || 'en');
    }
}


// Expose for Next.js Script onLoad callback
window.renderModuleDashboard = renderModuleDashboard;

// Auto-run when loaded normally (non-Next.js / standalone)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderModuleDashboard);
} else {
    renderModuleDashboard();
}
