/**
 * Eclipses & Transits Lab - Main Application
 * Integrates 2D maps, 3D orbits, sky simulations, and developer assets.
 */

// Global state variables
let currentEvent = null;
let observerLocation = { lat: 9.0300, lon: 38.7400 }; // default: Addis Ababa
let observerMarker = null;
let currentTab = 'map-view';
let timeSliderVal = 0; // percentage along the event timeline (default to start)
let animInterval = null;
let isAnimating = false;
let isLooping = true;
let simSpeedMultiplier = 5;
let simViewMode = 'closeup'; // 'closeup' or 'dome'
let showSimGrid = false;
let cachedContactTimes = null;
let simStars = [];
let cachedSunTrajectory = [];
let cachedMoonTrajectory = [];
let bookmarkPauseActive = false;
let passedBookmarkPcts = new Set();
let activeInfoTimeout = null;
let isUserDragging = false;
let activeBookmarkInfo = null;

// 2D Map variables
let map = null;
let dynamicMap = null;
let dynamicObserverMarker = null;
let shadowCenterCircles = [];
let penumbraCircles = [];
let totalityPathLine = null;
let mapOverlayLayers = [];
let dynamicMapOverlayLayers = [];
let lastEventId = null;
let staticTerminatorLayer = null;
let dynamicTerminatorLayer = null;
let currentEventTrack = [];
let shadowCenterMarker = null; // Animated pulsing shadow center marker

// 3D Globe Scene variables
let scene3D = {
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    earth: null,
    earthTexture: null,
    baseCanvas: null,        // Off-screen canvas with static base map
    renderCanvas: null,      // Canvas used as Three.js texture
    renderContext: null,
    staticContours: [],      // Cached static contour features
    instantaneousContours: [], // Cached instantaneous contour features
    topojsonData: null,      // Cached TopoJSON country data
    atmosphereGlow: null
};

// Globe animation state — unified with timeSliderVal

// Sidebar Events Database (100-Year Catalog 2000-2100)
let sidebarEvents = [];

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    // Generate the 100-year list for the sidebar
    sidebarEvents = generate100YearCatalog();
    generateSimStars();
    
    initUI();
    init2DMap();
    initGlobeScene();
    
    // Find next upcoming eclipse starting from today (2026-07-14)
    const now = new Date();
    let defaultEv = sidebarEvents.find(ev => dateFromJD(ev.peakJD) > now);
    if (!defaultEv) defaultEv = sidebarEvents[0];
    
    selectEvent(defaultEv);
    
    // Parse URL query parameters to load state if present
    parseURLParameters();
    
    loadKotlinFiles();

    // Initialize Language Selector
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            applyTranslations(e.target.value);
        });
    }
    // Set initial language
    const currentLang = getCurrentLanguage();
    applyTranslations(currentLang);
});

// UI Setup & Listeners
function initUI() {
    // Section collapse toggle for both sidebar and stats panels
    document.querySelectorAll('.sidebar-section h2, .stats-section h3').forEach(header => {
        header.addEventListener('click', () => {
            header.parentElement.classList.toggle('collapsed');
            // Recalculate Leaflet map sizes in case sidebar size changes layout
            if (map) map.invalidateSize();
            if (dynamicMap) dynamicMap.invalidateSize();
            setTimeout(() => {
                if (map) map.invalidateSize();
                if (dynamicMap) dynamicMap.invalidateSize();
            }, 350);
        });
    });

    // Collapsible Map Tabs switcher (Classic Tab Switch)
    document.querySelectorAll('.map-tab-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const targetMap = document.getElementById(targetId);
            if (targetMap) {
                // If map is in fullscreen, don't allow toggle
                if (targetMap.classList.contains('fullscreen')) return;

                // Deactivate all tab buttons and active the clicked one
                document.querySelectorAll('.map-tab-toggle').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Show only the selected map card
                document.querySelectorAll('.maps-container .map-wrapper').forEach(wrapper => {
                    if (wrapper.id === targetId) {
                        wrapper.classList.remove('collapsed');
                    } else {
                        wrapper.classList.add('collapsed');
                    }
                });
                
                // Recalculate Leaflet map sizes
                if (map) map.invalidateSize();
                if (dynamicMap) dynamicMap.invalidateSize();
                setTimeout(() => {
                    if (map) map.invalidateSize();
                    if (dynamicMap) dynamicMap.invalidateSize();
                }, 450);
            }
        });
    });

    // Collapsible Panels Event Listeners
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            const workspace = document.querySelector('.workspace');
            workspace.classList.toggle('sidebar-collapsed');
            
            // Invalidate map viewport sizes immediately and after transition
            if (map) map.invalidateSize();
            if (dynamicMap) dynamicMap.invalidateSize();
            setTimeout(() => {
                if (map) map.invalidateSize();
                if (dynamicMap) dynamicMap.invalidateSize();
            }, 300);
        });
    }

    const toggleStatsBtn = document.getElementById('toggle-stats-btn');
    if (toggleStatsBtn) {
        toggleStatsBtn.addEventListener('click', () => {
            const workspace = document.querySelector('.workspace');
            workspace.classList.toggle('stats-collapsed');
            
            // Invalidate map viewport sizes immediately and after transition
            if (map) map.invalidateSize();
            if (dynamicMap) dynamicMap.invalidateSize();
            setTimeout(() => {
                if (map) map.invalidateSize();
                if (dynamicMap) dynamicMap.invalidateSize();
            }, 300);
        });
    }

    // Populate the 100-year event list in the sidebar
    populateSidebarList();

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            document.getElementById(currentTab).classList.add('active');
            
            if (currentTab === 'map-view') {
                if (map) map.invalidateSize();
                if (dynamicMap) dynamicMap.invalidateSize();
            }
            if (currentTab === 'space-view' && scene3D.renderer) {
                const container = document.getElementById('canvas-container-3d');
                if (container) {
                    const w = container.clientWidth;
                    const h = container.clientHeight;
                    scene3D.camera.aspect = w / h;
                    scene3D.camera.updateProjectionMatrix();
                    scene3D.renderer.setSize(w, h);
                }
            }
            updateViews();
        });
    });

    // Type Filter Buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            populateSidebarList();
        });
    });

    // Time Filter Buttons
    document.querySelectorAll('[data-time-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-time-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            populateSidebarList();
        });
    });

    // Time Sliders — unified to timeSliderVal
    const sliders = [
        document.getElementById('time-slider'),
        document.getElementById('sim-time-slider'),
        document.getElementById('globe-time-slider')
    ];
    sliders.forEach(slider => {
        if (slider) {
            slider.addEventListener('input', (e) => {
                if (isAnimating) {
                    stopAnimation();
                }
                timeSliderVal = parseFloat(e.target.value);
                sliders.forEach(s => { if (s) s.value = timeSliderVal; });
                updateSliderGradient();
                updateTimeFromSlider();
                
                // Contextually display info box when dragging past a bookmark
                updateInfoForSliderVal(timeSliderVal);
            });

            slider.addEventListener('change', (e) => {
                const val = parseFloat(e.target.value);
                const bookmarks = getBookmarkPcts();
                const snapThreshold = 1.5;
                let snapTo = null;

                for (const b of bookmarks) {
                    if (Math.abs(val - b.pct) < snapThreshold) {
                        snapTo = b;
                        break;
                    }
                }

                if (snapTo) {
                    timeSliderVal = snapTo.pct;
                    sliders.forEach(s => { if (s) s.value = snapTo.pct; });
                    updateSliderGradient();
                    updateTimeFromSlider();
                    showEventInfo(snapTo);

                    if (activeInfoTimeout) clearTimeout(activeInfoTimeout);
                    activeInfoTimeout = setTimeout(() => {
                        hideEventInfo();
                        activeInfoTimeout = null;
                    }, 4000);
                }
            });
        }
    });

    // Initialize slider gradient
    updateSliderGradient();

    // Initialize loop button to active state
    const loopBtn = document.getElementById('loop-btn');
    if (loopBtn && isLooping) {
        loopBtn.classList.add('active');
    }

    // Play Buttons
    const playBtns = [document.getElementById('play-btn'), document.getElementById('sim-play-btn')];
    playBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isAnimating) {
                stopAnimation();
            } else {
                startAnimation();
            }
        });
    });

    // Restart Button
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            timeSliderVal = 0;
            sliders.forEach(s => s.value = timeSliderVal);
            updateTimeFromSlider();
        });
    }

    // Previous Button
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (isAnimating) {
                stopAnimation();
            }
            timeSliderVal = Math.max(0, timeSliderVal - 2.0);
            sliders.forEach(s => s.value = timeSliderVal);
            updateTimeFromSlider();
        });
    }

    // Next Button
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (isAnimating) {
                stopAnimation();
            }
            timeSliderVal = Math.min(100, timeSliderVal + 2.0);
            sliders.forEach(s => s.value = timeSliderVal);
            updateTimeFromSlider();
        });
    }

    // Loop Button
    if (loopBtn) {
        loopBtn.addEventListener('click', () => {
            isLooping = !isLooping;
            const loopBtns = [document.getElementById('loop-btn'), document.getElementById('sim-loop-btn')];
            loopBtns.forEach(btn => { if (btn) btn.classList.toggle('active', isLooping); });
        });
    }

    // Speed Select — unified and synchronized
    const speedSelects = [
        document.getElementById('speed-select'),
        document.getElementById('globe-speed-select'),
        document.getElementById('sim-speed-select')
    ];
    speedSelects.forEach(sel => {
        if (sel) {
            sel.addEventListener('change', (e) => {
                simSpeedMultiplier = parseFloat(e.target.value) || 5;
                speedSelects.forEach(s => { if (s && s !== sel) s.value = e.target.value; });
            });
        }
    });

    // Location Inputs
    document.getElementById('btn-calculate-custom').addEventListener('click', () => {
        const dateInput = document.getElementById('custom-date').value;
        const latInput = parseFloat(document.getElementById('obs-lat').value);
        const lonInput = parseFloat(document.getElementById('obs-lon').value);
        
        if (!isNaN(latInput) && !isNaN(lonInput)) {
            observerLocation = { lat: latInput, lon: lonInput };
            
            // Move marker
            if (observerMarker && map) {
                observerMarker.setLatLng([observerLocation.lat, observerLocation.lon]);
                map.setView([observerLocation.lat, observerLocation.lon]);
            }
            if (dynamicObserverMarker && dynamicMap) {
                dynamicObserverMarker.setLatLng([observerLocation.lat, observerLocation.lon]);
                dynamicMap.setView([observerLocation.lat, observerLocation.lon]);
            }

            if (dateInput) {
                const customDate = new Date(dateInput);
                
                // Search for the nearest global solar eclipse to align the custom time window with the actual eclipse peak!
                let peakDate = customDate;
                let peakJD = Astronomy.MakeTime(customDate).value;
                let eventName = "Custom Calculation";
                let eventType = "solar";
                let eventTypeName = "Local View";
                
                try {
                    // Search starting 15 days before the user's entered date
                    const searchStart = new Date(customDate.getTime() - 15 * 24 * 60 * 60 * 1000);
                    const nextSolar = Astronomy.SearchGlobalSolarEclipse(searchStart);
                    if (nextSolar) {
                        const diffDays = Math.abs(nextSolar.peak.date.getTime() - customDate.getTime()) / (24 * 60 * 60 * 1000);
                        if (diffDays <= 15) {
                            peakDate = nextSolar.peak.date;
                            peakJD = nextSolar.peak.jd;
                            eventName = "Custom Solar Eclipse";
                            eventTypeName = nextSolar.kind.charAt(0).toUpperCase() + nextSolar.kind.slice(1) + " Solar Eclipse";
                        }
                    }
                } catch (e) {
                    console.error("Error searching for global solar eclipse peak:", e);
                }

                const customEv = {
                    id: "custom",
                    name: eventName,
                    year: peakDate.getUTCFullYear(),
                    type: eventType,
                    typeName: eventTypeName,
                    peakTime: peakDate.toISOString(),
                    peakJD: peakJD,
                    duration: "--",
                    description: "User defined custom coordinate and time window.",
                    lat: observerLocation.lat,
                    lon: observerLocation.lon
                };
                selectEvent(customEv);
            } else {
                updateViews();
            }
        }
    });

    document.getElementById('use-gps-btn').addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                document.getElementById('obs-lat').value = position.coords.latitude.toFixed(4);
                document.getElementById('obs-lon').value = position.coords.longitude.toFixed(4);
                document.getElementById('btn-calculate-custom').click();
            }, err => {
                alert("Geolocation failed: " + err.message);
            });
        } else {
            alert("Geolocation not supported by this browser.");
        }
    });

    // 3D Globe Buttons
    document.getElementById('btn-globe-reset').addEventListener('click', () => {
        if (scene3D.controls) scene3D.controls.reset();
    });
    // Globe Playback Controls — mapped to the unified animation state
    const globePlayBtn = document.getElementById('globe-play-btn');
    if (globePlayBtn) {
        globePlayBtn.addEventListener('click', () => {
            if (isAnimating) {
                stopAnimation();
            } else {
                startAnimation();
            }
        });
    }
    const globeRestartBtn = document.getElementById('globe-restart-btn');
    if (globeRestartBtn) {
        globeRestartBtn.addEventListener('click', () => {
            timeSliderVal = 0;
            sliders.forEach(s => { if (s) s.value = 0; });
            updateSliderGradient();
            updateTimeFromSlider();
        });
    }
    const globePrevBtn = document.getElementById('globe-prev-btn');
    if (globePrevBtn) {
        globePrevBtn.addEventListener('click', () => {
            timeSliderVal = Math.max(0, timeSliderVal - 2.0);
            sliders.forEach(s => { if (s) s.value = timeSliderVal; });
            updateSliderGradient();
            updateTimeFromSlider();
        });
    }
    const globeNextBtn = document.getElementById('globe-next-btn');
    if (globeNextBtn) {
        globeNextBtn.addEventListener('click', () => {
            timeSliderVal = Math.min(100, timeSliderVal + 2.0);
            sliders.forEach(s => { if (s) s.value = timeSliderVal; });
            updateSliderGradient();
            updateTimeFromSlider();
        });
    }
    const globeTimeSlider = document.getElementById('globe-time-slider');
    if (globeTimeSlider) {
        globeTimeSlider.addEventListener('input', (e) => {
            if (isAnimating) {
                stopAnimation();
            }
            timeSliderVal = parseFloat(e.target.value);
            sliders.forEach(s => { if (s) s.value = timeSliderVal; });
            updateSliderGradient();
            updateTimeFromSlider();
        });
    }


    // Kotlin code tab buttons
    document.querySelectorAll('.code-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.code-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadKotlinFile(btn.dataset.file);
        });
    });

    // Export Buttons
    const btnExportSvg = document.getElementById('btn-export-svg');
    const btnExportSimSvg = document.getElementById('btn-export-sim-svg');
    if (btnExportSvg) btnExportSvg.addEventListener('click', () => exportSVG('map'));
    if (btnExportSimSvg) btnExportSimSvg.addEventListener('click', () => exportSVG('sim'));

    // Catalog Modal Listeners
    const catalogModal = document.getElementById('catalog-modal');
    const openCatalogBtn = document.getElementById('btn-open-catalog');
    const closeCatalogBtn = document.getElementById('btn-close-catalog');
    const catalogSearch = document.getElementById('catalog-search');
    const centurySelect = document.getElementById('catalog-century-select');
    
    if (openCatalogBtn && catalogModal) {
        openCatalogBtn.addEventListener('click', () => {
            catalogModal.classList.add('active');
            if (centurySelect && centurySelect.children.length === 0) {
                populateCenturySelector();
            }
            if (centurySelect) {
                const centuryVal = centurySelect.value;
                catalogEvents = generateCenturyCatalog(centuryVal);
                renderCatalogTable();
            }
        });
    }

    if (closeCatalogBtn && catalogModal) {
        closeCatalogBtn.addEventListener('click', () => {
            catalogModal.classList.remove('active');
        });
    }

    if (catalogModal) {
        catalogModal.addEventListener('click', (e) => {
            if (e.target === catalogModal) {
                catalogModal.classList.remove('active');
            }
        });
    }

    if (centurySelect) {
        centurySelect.addEventListener('change', (e) => {
            catalogEvents = generateCenturyCatalog(e.target.value);
            renderCatalogTable();
        });
    }

    if (catalogSearch) {
        catalogSearch.addEventListener('input', () => {
            renderCatalogTable();
        });
    }

    document.querySelectorAll('[data-cat-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-cat-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCatalogTable();
        });
    });

    // Center Map controls (Full View Mode - fits US to Russia horizontally wall-to-wall in the wide container)
    const btnStaticCenter = document.getElementById('btn-static-center');
    if (btnStaticCenter) {
        btnStaticCenter.addEventListener('click', () => {
            if (map) {
                const w = map.getContainer().clientWidth;
                const zoom = Math.max(1.5, Math.log2((w * 1.06) / 256));
                map.setView([30, 10], zoom);
            }
        });
    }

    const btnDynamicCenter = document.getElementById('btn-dynamic-center');
    if (btnDynamicCenter) {
        btnDynamicCenter.addEventListener('click', () => {
            if (dynamicMap) {
                const w = dynamicMap.getContainer().clientWidth;
                const zoom = Math.max(1.5, Math.log2((w * 1.06) / 256));
                dynamicMap.setView([30, 10], zoom);
            }
        });
    }

    // Fullscreen Map controls
    const btnStaticFullscreen = document.getElementById('btn-static-fullscreen');
    if (btnStaticFullscreen) {
        btnStaticFullscreen.addEventListener('click', () => {
            const wrapper = btnStaticFullscreen.closest('.map-wrapper');
            if (wrapper) {
                const isFullscreen = wrapper.classList.toggle('fullscreen');
                btnStaticFullscreen.setAttribute('title', isFullscreen ? 'Exit Full Screen' : 'Toggle Full Screen Mode');
                if (map) {
                    map.invalidateSize();
                    setTimeout(() => map.invalidateSize(), 300);
                }
            }
        });
    }

    const btnDynamicFullscreen = document.getElementById('btn-dynamic-fullscreen');
    if (btnDynamicFullscreen) {
        btnDynamicFullscreen.addEventListener('click', () => {
            const wrapper = btnDynamicFullscreen.closest('.map-wrapper');
            if (wrapper) {
                const isFullscreen = wrapper.classList.toggle('fullscreen');
                btnDynamicFullscreen.setAttribute('title', isFullscreen ? 'Exit Full Screen' : 'Toggle Full Screen Mode');
                if (dynamicMap) {
                    dynamicMap.invalidateSize();
                    setTimeout(() => dynamicMap.invalidateSize(), 300);
                }
            }
        });
    }

    // Generate Shareable Link listener
    const btnGenerateLink = document.getElementById('btn-generate-link');
    if (btnGenerateLink) {
        btnGenerateLink.addEventListener('click', () => {
            const viewType = document.getElementById('share-view-type').value;
            const embedMode = document.getElementById('share-embed-mode').checked;
            const autoplay = document.getElementById('share-autoplay').checked;

            const params = new URLSearchParams();
            params.set('view', viewType);
            if (embedMode) params.set('embed', 'true');
            if (autoplay) params.set('autoplay', 'true');

            if (currentEvent) {
                params.set('event', currentEvent.id);
                if (currentEvent.id === 'custom') {
                    const customDate = document.getElementById('custom-date').value;
                    if (customDate) params.set('date', customDate);
                    params.set('lat', observerLocation.lat.toFixed(4));
                    params.set('lon', observerLocation.lon.toFixed(4));
                }
            }

            const currentSlider = document.getElementById('time-slider');
            if (currentSlider) {
                params.set('time', currentSlider.value);
            }

            const baseShareUrl = window.location.origin + window.location.pathname + '?' + params.toString();
            
            // Populate outputs
            document.getElementById('share-url-text').value = baseShareUrl;
            
            // HTML IFrame Code
            const iframeCode = `<iframe src="${baseShareUrl}&hide_tabs=true" width="100%" height="500px" style="border: 1px solid rgba(255,255,255,0.15); border-radius: 8px;" allowfullscreen></iframe>`;
            document.getElementById('share-iframe-text').value = iframeCode;

            // Kotlin WebView integration code
            const kotlinCode = `// Kotlin WebView Integration for Android app\n` +
                               `val webView = WebView(context).apply {\n` +
                               `    settings.javaScriptEnabled = true\n` +
                               `    settings.domStorageEnabled = true\n` +
                               `    loadUrl("${baseShareUrl}&hide_tabs=true")\n` +
                               `}`;
            document.getElementById('share-kotlin-text').value = kotlinCode;

            // Show output container
            document.getElementById('share-link-output').style.display = 'block';
        });
    }

    // Simulator view mode switches
    const btnCloseup = document.getElementById('btn-sim-mode-closeup');
    const btnDome = document.getElementById('btn-sim-mode-dome');
    const chkGrid = document.getElementById('chk-sim-grid');

    if (btnCloseup) {
        btnCloseup.addEventListener('click', () => {
            simViewMode = 'closeup';
            btnCloseup.classList.add('active');
            if (btnDome) btnDome.classList.remove('active');
            updateViews();
        });
    }

    if (btnDome) {
        btnDome.addEventListener('click', () => {
            simViewMode = 'dome';
            btnDome.classList.add('active');
            if (btnCloseup) btnCloseup.classList.remove('active');
            updateViews();
        });
    }

    if (chkGrid) {
        showSimGrid = chkGrid.checked;
        chkGrid.addEventListener('change', (e) => {
            showSimGrid = e.target.checked;
            updateViews();
        });
    }

    // Simulator playback controls
    const simRestartBtn = document.getElementById('sim-restart-btn');
    if (simRestartBtn) {
        simRestartBtn.addEventListener('click', () => {
            if (cachedContactTimes && cachedContactTimes.length > 0) {
                const startBefore = new Date(cachedContactTimes[0].date.getTime() - 5 * 60000);
                setSliderToDate(startBefore);
            } else {
                timeSliderVal = 0;
                sliders.forEach(s => { if (s) s.value = 0; });
                updateSliderGradient();
                updateTimeFromSlider();
            }
        });
    }

    const simPrevBtn = document.getElementById('sim-prev-btn');
    if (simPrevBtn) {
        simPrevBtn.addEventListener('click', () => {
            if (isAnimating) stopAnimation();
            timeSliderVal = Math.max(0, timeSliderVal - 2.0);
            sliders.forEach(s => { if (s) s.value = timeSliderVal; });
            updateSliderGradient();
            updateTimeFromSlider();
        });
    }

    const simNextBtn = document.getElementById('sim-next-btn');
    if (simNextBtn) {
        simNextBtn.addEventListener('click', () => {
            if (isAnimating) stopAnimation();
            timeSliderVal = Math.min(100, timeSliderVal + 2.0);
            sliders.forEach(s => { if (s) s.value = timeSliderVal; });
            updateSliderGradient();
            updateTimeFromSlider();
        });
    }

    const simLoopBtn = document.getElementById('sim-loop-btn');
    if (simLoopBtn) {
        simLoopBtn.classList.toggle('active', isLooping);
        simLoopBtn.addEventListener('click', () => {
            isLooping = !isLooping;
            const loopBtns = [document.getElementById('loop-btn'), document.getElementById('sim-loop-btn')];
            loopBtns.forEach(btn => { if (btn) btn.classList.toggle('active', isLooping); });
        });
    }
}

// 2D Map Setup
function init2DMap() {
    // 1. Initialize Static Map Tiles
    const darkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    });
    const voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    });
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri'
    });

    map = L.map('map', {
        center: [observerLocation.lat, observerLocation.lon],
        zoom: 3,
        minZoom: 1,
        zoomSnap: 0.1,
        zoomDelta: 0.1,
        zoomControl: true,
        attributionControl: true,
        worldCopyJump: true,
        layers: [voyager] // default to High-Contrast Light
    });

    map.createPane('terminatorPane');
    map.getPane('terminatorPane').style.zIndex = '450';

    map.createPane('penumbraPane');
    map.getPane('penumbraPane').style.zIndex = '410';

    map.createPane('pathPane');
    map.getPane('pathPane').style.zIndex = '420';

    const baseMaps = {
        "Satellite Imagery": satellite,
        "Sleek Dark Mode": darkMatter,
        "High-Contrast Light": voyager
    };
    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

    // 2. Initialize Dynamic Map Tiles (Leaflet layers cannot be shared between maps)
    const darkMatterDynamic = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    });
    const voyagerDynamic = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    });
    const satelliteDynamic = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri'
    });

    dynamicMap = L.map('dynamic-map', {
        center: [observerLocation.lat, observerLocation.lon],
        zoom: 3,
        minZoom: 1,
        zoomSnap: 0.1,
        zoomDelta: 0.1,
        zoomControl: true,
        attributionControl: true,
        worldCopyJump: true,
        layers: [voyagerDynamic] // default to High-Contrast Light
    });

    dynamicMap.createPane('terminatorPane');
    dynamicMap.getPane('terminatorPane').style.zIndex = '450';

    dynamicMap.createPane('penumbraPane');
    dynamicMap.getPane('penumbraPane').style.zIndex = '410';

    dynamicMap.createPane('pathPane');
    dynamicMap.getPane('pathPane').style.zIndex = '420';

    dynamicMap.createPane('umbraPane');
    dynamicMap.getPane('umbraPane').style.zIndex = '430';

    const baseMapsDynamic = {
        "Satellite Imagery": satelliteDynamic,
        "Sleek Dark Mode": darkMatterDynamic,
        "High-Contrast Light": voyagerDynamic
    };
    L.control.layers(baseMapsDynamic, null, { position: 'topright' }).addTo(dynamicMap);

    // 3. Setup Custom Observer Marker Icons
    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: #125DFF; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #125DFF;"></div>`,
        iconSize: [12, 12]
    });

    observerMarker = L.marker([observerLocation.lat, observerLocation.lon], {
        icon: customIcon,
        draggable: true
    }).addTo(map);

    const customIconDynamic = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: #125DFF; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #125DFF;"></div>`,
        iconSize: [12, 12]
    });

    dynamicObserverMarker = L.marker([observerLocation.lat, observerLocation.lon], {
        icon: customIconDynamic,
        draggable: true
    }).addTo(dynamicMap);

    // 4. Map views are decoupled (zooming/panning is independent)

    // 5. Synchronize Observer Marker Dragging
    observerMarker.on('dragend', (e) => {
        const pos = observerMarker.getLatLng();
        observerLocation = { lat: pos.lat, lon: pos.lng };
        dynamicObserverMarker.setLatLng(pos);
        document.getElementById('obs-lat').value = pos.lat.toFixed(4);
        document.getElementById('obs-lon').value = pos.lng.toFixed(4);
        updateContactTimings();
        updateViews();
    });

    dynamicObserverMarker.on('dragend', (e) => {
        const pos = dynamicObserverMarker.getLatLng();
        observerLocation = { lat: pos.lat, lon: pos.lng };
        observerMarker.setLatLng(pos);
        document.getElementById('obs-lat').value = pos.lat.toFixed(4);
        document.getElementById('obs-lon').value = pos.lng.toFixed(4);
        updateContactTimings();
        updateViews();
    });

    // 6. Synchronize Map Clicks
    map.on('click', (e) => {
        observerLocation = { lat: e.latlng.lat, lon: e.latlng.lng };
        observerMarker.setLatLng(e.latlng);
        dynamicObserverMarker.setLatLng(e.latlng);
        document.getElementById('obs-lat').value = e.latlng.lat.toFixed(4);
        document.getElementById('obs-lon').value = e.latlng.lng.toFixed(4);
        updateContactTimings();
        updateViews();
    });

    dynamicMap.on('click', (e) => {
        observerLocation = { lat: e.latlng.lat, lon: e.latlng.lng };
        observerMarker.setLatLng(e.latlng);
        dynamicObserverMarker.setLatLng(e.latlng);
        document.getElementById('obs-lat').value = e.latlng.lat.toFixed(4);
        document.getElementById('obs-lon').value = e.latlng.lng.toFixed(4);
        updateContactTimings();
        updateViews();
    });

    // 7. Map Hover Tooltips (exact eclipse obscuration/magnitude calculation)
    map.on('mousemove', (e) => {
        updateHoverTooltip(map, 'static-map-hover-tooltip', e, true);
    });
    map.on('mouseout', () => {
        hideHoverTooltip('static-map-hover-tooltip');
    });

    dynamicMap.on('mousemove', (e) => {
        updateHoverTooltip(dynamicMap, 'dynamic-map-hover-tooltip', e, false);
    });
    dynamicMap.on('mouseout', () => {
        hideHoverTooltip('dynamic-map-hover-tooltip');
    });
}

function updateHoverTooltip(mapInstance, tooltipId, event, isStatic) {
    if (!currentEvent) {
        hideHoverTooltip(tooltipId);
        return;
    }
    const lat = event.latlng.lat;
    const lon = ((event.latlng.lng % 360) + 540) % 360 - 180;
    
    // Bounds check to avoid calculation overflows
    if (lat < -90 || lat > 90) {
        hideHoverTooltip(tooltipId);
        return;
    }

    let obscuration = 0;
    let magnitude = 0;
    let typeDisplay = '';

    if (currentEvent.type === 'solar') {
        if (isStatic) {
            // Use the pre-computed penumbra magnitude grid for instant lookup across all shaded regions
            const grid = mapInstance._penumbraGrid;
            if (grid) {
                // Normalize longitude to [-180, 180]
                let nLon = ((lon % 360) + 540) % 360 - 180;
                // Map lat/lon to grid coordinates
                const gx = ((nLon + 180) / 360) * grid.width;
                const gy = ((lat + 90) / 180) * grid.height;
                // Bilinear interpolation for smooth values
                const x0 = Math.floor(gx);
                const y0 = Math.floor(gy);
                const x1 = Math.min(x0 + 1, grid.width - 1);
                const y1 = Math.min(y0 + 1, grid.height - 1);
                const fx = gx - x0;
                const fy = gy - y0;
                const v00 = grid.data[y0 * grid.width + (x0 % grid.width)] || 0;
                const v10 = grid.data[y0 * grid.width + (x1 % grid.width)] || 0;
                const v01 = grid.data[y1 * grid.width + (x0 % grid.width)] || 0;
                const v11 = grid.data[y1 * grid.width + (x1 % grid.width)] || 0;
                magnitude = v00 * (1-fx)*(1-fy) + v10 * fx*(1-fy) + v01 * (1-fx)*fy + v11 * fx*fy;
                // Convert magnitude to approximate obscuration
                if (magnitude > 0.001) {
                    if (magnitude >= 1.0) {
                        obscuration = 1.0;
                    } else {
                        const m = magnitude;
                        obscuration = (Math.acos(1 - 2*m) - (1 - 2*m) * Math.sqrt(4*m - 4*m*m)) / Math.PI;
                    }
                }
            }
        } else {
            // Calculate instantaneous obscuration for active simulation time
            const activeDate = getActiveTime();
            const res = AstronomyHelper.calculateLocalSolarEclipse(activeDate, lat, lon);
            if (res) {
                obscuration = res.obscuration;
                magnitude = res.magnitude;
            }
        }
        if (obscuration > 0.001) {
            typeDisplay = magnitude >= 1.0 ? 'Total' : 'Partial';
        }
    } else if (currentEvent.type === 'lunar') {
        let penumbralMag = 0;
        let umbralMag = 0;
        let moonAlt = 0;
        if (isStatic) {
            const res = AstronomyHelper.calculateMaxLocalLunarEclipse(currentEvent.peakJD, lat, lon);
            if (res) {
                obscuration = res.obscuration;
                typeDisplay = res.type;
                penumbralMag = res.penumbralMagnitude;
                umbralMag = res.umbralMagnitude;
                // Get Moon altitude at peak time for static reference
                const peakRes = AstronomyHelper.calculateLocalLunarEclipse(dateFromJD(currentEvent.peakJD), lat, lon);
                if (peakRes) moonAlt = peakRes.moonAlt;
            }
        } else {
            const activeDate = getActiveTime();
            const res = AstronomyHelper.calculateLocalLunarEclipse(activeDate, lat, lon);
            if (res && res.moonAlt > 0) {
                obscuration = res.obscuration;
                typeDisplay = res.type;
                penumbralMag = res.penumbralMagnitude;
                umbralMag = res.umbralMagnitude;
                moonAlt = res.moonAlt;
            }
        }

        if (obscuration > 0.001) {
            const tooltip = document.getElementById(tooltipId);
            if (tooltip) {
                const lang = getCurrentLanguage();
                const dict = (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || {};
                const typeTranslated = dict[typeDisplay] || typeDisplay;
                const obsLabel = dict['stats_label_obs'] || 'Obscuration';
                const typeLabel = dict['stats_label_type'] || 'Type';

                tooltip.innerHTML = `
                    <div style="font-weight:700; margin-bottom: 2px;">Exact Location Info</div>
                    <div><strong>${typeLabel}:</strong> ${typeTranslated}</div>
                    <div><strong>${obsLabel}:</strong> ${(obscuration * 100).toFixed(1)}%</div>
                    <div><strong>Penumbral Mag:</strong> ${penumbralMag.toFixed(3)}</div>
                    <div><strong>Umbral Mag:</strong> ${umbralMag.toFixed(3)}</div>
                    <div><strong>Moon Alt:</strong> ${moonAlt.toFixed(1)}&deg;</div>
                    <div style="font-size: 9px; color: rgba(255,255,255,0.4); margin-top: 4px; text-transform: uppercase;">Lat: ${lat.toFixed(2)}&deg; | Lon: ${lon.toFixed(2)}&deg;</div>
                `;
                const x = event.containerPoint.x + 15;
                const y = event.containerPoint.y + 15;

                tooltip.style.left = x + 'px';
                tooltip.style.top = y + 'px';
                tooltip.style.display = 'block';
            }
            return;
        }
    }

    if (obscuration > 0.001) {
        const tooltip = document.getElementById(tooltipId);
        if (tooltip) {
            const lang = getCurrentLanguage();
            const dict = (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || {};
            const typeTranslated = dict[typeDisplay] || typeDisplay;
            const obsLabel = dict['stats_label_obs'] || 'Obscuration';
            const typeLabel = dict['stats_label_type'] || 'Type';

            tooltip.innerHTML = `
                <div style="font-weight:700; margin-bottom: 2px;">Exact Location Info</div>
                <div><strong>${typeLabel}:</strong> ${typeTranslated}</div>
                <div><strong>${obsLabel}:</strong> ${(obscuration * 100).toFixed(1)}%</div>
                <div style="font-size: 9px; color: rgba(255,255,255,0.4); margin-top: 4px; text-transform: uppercase;">Lat: ${lat.toFixed(2)}&deg; | Lon: ${lon.toFixed(2)}&deg;</div>
            `;
            // Coordinates relative to map container
            const x = event.containerPoint.x + 15;
            const y = event.containerPoint.y + 15;

            tooltip.style.left = x + 'px';
            tooltip.style.top = y + 'px';
            tooltip.style.display = 'block';
        }
    } else {
        hideHoverTooltip(tooltipId);
    }
}

function hideHoverTooltip(tooltipId) {
    const tooltip = document.getElementById(tooltipId);
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}


// 3D Globe Setup using Three.js
function initGlobeScene() {
    const container = document.getElementById('canvas-container-3d');
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene3D.scene = new THREE.Scene();
    scene3D.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    scene3D.camera.position.set(0, 2, 6);

    scene3D.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    scene3D.renderer.setSize(width, height);
    scene3D.renderer.setPixelRatio(window.devicePixelRatio);
    scene3D.renderer.setClearColor(0x000000, 0);
    container.appendChild(scene3D.renderer.domElement);

    scene3D.controls = new THREE.OrbitControls(scene3D.camera, scene3D.renderer.domElement);
    scene3D.controls.enableDamping = true;
    scene3D.controls.dampingFactor = 0.05;
    scene3D.controls.minDistance = 3;
    scene3D.controls.maxDistance = 15;
    scene3D.controls.saveState();

    // No differential lighting — use MeshBasicMaterial for flat, well-contrasted map

    // Create high-resolution off-screen canvases for texture generation
    scene3D.baseCanvas = document.createElement('canvas');
    scene3D.baseCanvas.width = 4096;
    scene3D.baseCanvas.height = 2048;

    scene3D.renderCanvas = document.createElement('canvas');
    scene3D.renderCanvas.width = 4096;
    scene3D.renderCanvas.height = 2048;
    scene3D.renderContext = scene3D.renderCanvas.getContext('2d');

    // Draw initial fallback base map
    renderBaseMap();

    // Copy base to render canvas
    scene3D.renderContext.drawImage(scene3D.baseCanvas, 0, 0);

    // Create CanvasTexture
    const earthTexture = new THREE.CanvasTexture(scene3D.renderCanvas);
    earthTexture.wrapS = THREE.RepeatWrapping;
    earthTexture.wrapT = THREE.ClampToEdgeWrapping;
    earthTexture.anisotropy = scene3D.renderer.capabilities.getMaxAnisotropy();
    scene3D.earthTexture = earthTexture;

    // Custom Day/Night Shader Material
    const dayNightShader = {
        uniforms: {
            dayTexture: { value: earthTexture },
            sunDirection: { value: new THREE.Vector3(1, 0, 0) },
            disableNight: { value: 0.0 },
            disableNightEntirely: { value: 0.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
                vUv = uv;
                vNormal = normalize(normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            uniform sampler2D dayTexture;
            uniform vec3 sunDirection;
            uniform float disableNight;
            uniform float disableNightEntirely;

            void main() {
                vec4 dayColor = texture2D(dayTexture, vUv);
                
                // Night side styling: neutral dark gray shade (as requested) for standard night and eclipse-off
                vec4 nightColor = vec4(dayColor.r * 0.38, dayColor.g * 0.38, dayColor.b * 0.40, dayColor.a);
                
                // Lunar Eclipse active night: slightly brighter dark purple shade background
                vec4 lunarNightColor = vec4(dayColor.r * 0.44 + 0.08, dayColor.g * 0.38 + 0.04, dayColor.b * 0.55 + 0.14, dayColor.a);
                
                // Dot product of normal and sun direction (ranges from -1 to 1)
                float dotNL = dot(normalize(vNormal), normalize(sunDirection));
                
                // Smooth transition at the terminator (dusks/twilights)
                float intensity = smoothstep(-0.20, 0.20, dotNL);
                
                vec4 finalNight = mix(nightColor, lunarNightColor, disableNight);
                gl_FragColor = mix(finalNight, dayColor, max(intensity, disableNightEntirely));
            }
        `
    };

    const earthGeo = new THREE.SphereGeometry(2, 96, 96);
    const earthMat = new THREE.ShaderMaterial({
        uniforms: dayNightShader.uniforms,
        vertexShader: dayNightShader.vertexShader,
        fragmentShader: dayNightShader.fragmentShader
    });
    scene3D.earth = new THREE.Mesh(earthGeo, earthMat);
    scene3D.scene.add(scene3D.earth);

    // Atmospheric glow ring — subtle blue halo
    const glowGeo = new THREE.SphereGeometry(2.06, 96, 96);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x88bbff,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    scene3D.atmosphereGlow = new THREE.Mesh(glowGeo, glowMat);
    scene3D.scene.add(scene3D.atmosphereGlow);

    // Star field backdrop
    const starGeo = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 2000; i++) {
        const r = 80 + Math.random() * 120;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        starPositions.push(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xccddee, size: 0.2, sizeAttenuation: true });
    const stars = new THREE.Points(starGeo, starMat);
    scene3D.scene.add(stars);

    // Dark background
    scene3D.scene.background = new THREE.Color(0x0a0e1a);

    // Fetch and load TopoJSON for high-fidelity world map
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json')
        .then(res => res.json())
        .then(topo => {
            if (typeof topojson !== 'undefined') {
                scene3D.topojsonData = topojson.feature(topo, topo.objects.countries);
                // Re-render the base map with high-fidelity borders
                renderBaseMap();
                // Update the rendering
                drawGlobeLayers();
            }
        })
        .catch(err => {
            console.warn("Could not load high-fidelity world map from CDN, using simplified fallback contours.", err);
        });

    // Resize event
    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w > 0 && h > 0) {
            scene3D.camera.aspect = w / h;
            scene3D.camera.updateProjectionMatrix();
            scene3D.renderer.setSize(w, h);
        }
    });

    // Animation Loop — no idle spin; globe only moves when user pans
    function animate() {
        requestAnimationFrame(animate);
        scene3D.controls.update();
        scene3D.renderer.render(scene3D.scene, scene3D.camera);
    }
    animate();
}

/**
 * Render the static base map to baseCanvas.
 * Draws oceans, grid lines, and landmass outlines.
 */
function renderBaseMap() {
    if (!scene3D.baseCanvas) return;
    const canvas = scene3D.baseCanvas;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Fill ocean — strong contrast light blue
    ctx.fillStyle = '#aed4f0'; 
    ctx.fillRect(0, 0, W, H);

    // Draw lat/lon gridlines — very subtle on ocean
    ctx.strokeStyle = 'rgba(160, 195, 225, 0.35)';
    ctx.lineWidth = 1;
    // Longitude lines (meridians) go all the way from pole to pole
    for (let x = 0; x < W; x += W / 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }
    // Latitude lines (parallels) go from H/18 to H - H/18
    for (let y = H / 18; y < H - H / 18 + 1; y += H / 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }

    if (scene3D.topojsonData) {
        // Draw high-fidelity country boundaries from TopoJSON
        ctx.fillStyle = '#e8e4d8'; // Warm light tan — good contrast against blue ocean
        ctx.strokeStyle = '#c8c4b8'; // Subtle gray borders between countries
        ctx.lineWidth = 1;

        scene3D.topojsonData.features.forEach(feature => {
            if (!feature.geometry) return;
            const type = feature.geometry.type;
            const coords = feature.geometry.coordinates;

            if (type === 'Polygon') {
                drawCanvasPolygon(ctx, coords, W, H);
            } else if (type === 'MultiPolygon') {
                coords.forEach(poly => {
                    drawCanvasPolygon(ctx, poly, W, H);
                });
            }
        });
    } else {
        // Fallback: simplified continent shapes
        ctx.fillStyle = '#e8e4d8';
        ctx.strokeStyle = '#c8c4b8';
        ctx.lineWidth = 1;
        const continents = [
            // North America
            [[220,80],[280,75],[310,100],[320,140],[300,180],[260,200],[220,190],[200,160],[190,120]],
            // South America
            [[260,220],[290,230],[300,260],[295,310],[280,350],[255,360],[240,330],[245,280]],
            // Europe
            [[470,85],[510,80],[530,100],[520,130],[490,140],[470,120]],
            // Africa
            [[470,160],[520,155],[550,180],[560,230],[550,290],[520,320],[490,310],[470,270],[460,220],[460,180]],
            // Asia
            [[530,60],[620,50],[700,55],[750,80],[780,110],[760,140],[720,160],[670,170],[620,155],[570,130],[530,100]],
            // India
            [[620,160],[650,170],[640,210],[620,220],[610,200]],
            // Australia
            [[720,270],[780,260],[800,280],[790,310],[760,320],[730,300]],
            // Antarctica
            [[100,440],[300,450],[500,445],[700,450],[900,445],[1000,450],[1024,460],[1024,512],[0,512],[0,460]]
        ];

        continents.forEach(pts => {
            ctx.beginPath();
            const scaleX = W / 1024;
            const scaleY = H / 512;
            ctx.moveTo(pts[0][0] * scaleX, pts[0][1] * scaleY);
            for (let i = 1; i < pts.length; i++) {
                const xc = ((pts[i][0] + (pts[(i+1) % pts.length] || pts[i])[0]) / 2) * scaleX;
                const yc = ((pts[i][1] + (pts[(i+1) % pts.length] || pts[i])[1]) / 2) * scaleY;
                ctx.quadraticCurveTo(pts[i][0] * scaleX, pts[i][1] * scaleY, xc, yc);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });
    }
}

function drawCanvasPolygon(ctx, rings, W, H) {
    if (!rings || rings.length === 0) return;

    // We will draw each ring by unrolling its coordinates (making it continuous)
    // and drawing it three times with offsets (-W, 0, W) to handle antimeridian wrapping.
    const offsets = [-W, 0, W];

    ctx.beginPath();
    offsets.forEach(offset => {
        rings.forEach(ring => {
            if (!ring || ring.length < 3) return;

            // Unroll the ring to make it continuous
            const unrolled = [];
            for (let i = 0; i < ring.length; i++) {
                const [lon, lat] = ring[i];
                if (i === 0) {
                    unrolled.push([lon, lat]);
                } else {
                    const prevLon = unrolled[i - 1][0];
                    let diff = lon - prevLon;
                    while (diff < -180) diff += 360;
                    while (diff > 180) diff -= 360;
                    unrolled.push([prevLon + diff, lat]);
                }
            }

            // Draw the unrolled ring shifted by the current offset
            for (let i = 0; i < unrolled.length; i++) {
                const [lon, lat] = unrolled[i];
                const x = ((lon + 180) / 360) * W + offset;
                const y = ((90 - lat) / 180) * H;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
        });
    });

    ctx.fill('evenodd');
    ctx.stroke();
}

/**
 * Convert lat/lon (degrees) to a 3D position on the globe surface.
 */
function latLonToGlobe(lat, lon, R = 2.01) {
    const latRad = lat * Math.PI / 180;
    const lonRad = lon * Math.PI / 180;
    return new THREE.Vector3(
        -R * Math.cos(latRad) * Math.cos(lonRad),
        R * Math.sin(latRad),
        R * Math.cos(latRad) * Math.sin(lonRad)
    );
}

/**
 * Maps lat/lon geodetic coordinates to the vertex coordinate system of the Three.js SphereGeometry
 * to ensure perfect geographic tracking.
 */
function latLonToWorld(lat, lon, R = 1.0) {
    const latRad = lat * Math.PI / 180;
    const lonRad = lon * Math.PI / 180;
    return new THREE.Vector3(
        R * Math.cos(latRad) * Math.cos(lonRad),
        R * Math.sin(latRad),
        -R * Math.cos(latRad) * Math.sin(lonRad)
    );
}

/**
 * Calculates the 3D Sun direction vector relative to the Earth ECEF coordinates
 * at a specific date using the Astronomy Engine.
 */
function calculateSunDirection(date) {
    if (typeof Astronomy === 'undefined') {
        return new THREE.Vector3(1, 0, 0);
    }
    const t = Astronomy.MakeTime(date);
    const sun = Astronomy.GeoVector(Astronomy.Body.Sun, t, false);
    if (!sun) return new THREE.Vector3(1, 0, 0);

    const dist = Math.sqrt(sun.x * sun.x + sun.y * sun.y + sun.z * sun.z);
    const sx = sun.x / dist, sy = sun.y / dist, sz = sun.z / dist;

    const gmst = Astronomy.SiderealTime(t);
    const theta = gmst * 15 * Math.PI / 180;
    const cosTheta = Math.cos(theta), sinTheta = Math.sin(theta);

    const ex = sx * cosTheta + sy * sinTheta;
    const ey = -sx * sinTheta + sy * cosTheta;
    const ez = sz;

    const lat = Math.atan2(ez, Math.sqrt(ex * ex + ey * ey)) * 180 / Math.PI;
    const lon = Math.atan2(ey, ex) * 180 / Math.PI;

    return latLonToWorld(lat, lon, 1.0);
}

/**
 * Caches static contours on the 3D globe and draws them.
 */
function buildGlobeContours(contourFeatures) {
    scene3D.staticContours = contourFeatures || [];
    drawGlobeLayers();
}

/**
 * Caches instantaneous contours during playback and updates the globe texture.
 */
function buildGlobeInstantaneousContours(contourFeatures) {
    scene3D.instantaneousContours = contourFeatures || [];
    drawGlobeLayers();
}

/**
 * Draws all layers (Base Map + Path Ribbon + Contours + Shadow disc) onto renderCanvas
 * and triggers a WebGL texture reload.
 */
function drawGlobeLayers() {
    if (!scene3D.renderCanvas || !scene3D.baseCanvas) return;
    const canvas = scene3D.renderCanvas;
    const ctx = scene3D.renderContext;
    const W = canvas.width;
    const H = canvas.height;

    // 1. Copy base map
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(scene3D.baseCanvas, 0, 0);

    // 2. Draw totality path ribbon & centerline
    drawTotalityRibbonOnCanvas(ctx, W, H);

    // 3. Draw contours
    if (!isAnimating) {
        drawContoursOnCanvas(ctx, scene3D.staticContours, W, H);
    } else {
        drawContoursOnCanvas(ctx, scene3D.instantaneousContours, W, H);
        
        // Draw shadow center black dot
        if (currentEvent && currentEvent.type === 'solar') {
            const ev = currentEvent;
            const durationHours = 6;
            const startJD = ev.peakJD - durationHours / 48;
            const fraction = timeSliderVal / 100;
            const activeJD = startJD + fraction * (durationHours / 24);
            const activeDate = dateFromJD(activeJD);
            
            const shadow = AstronomyHelper.calculateShadowCenter(activeDate);
            if (shadow && isFinite(shadow.lat) && isFinite(shadow.lon)) {
                drawShadowCenterOnCanvas(ctx, shadow.lat, shadow.lon, W, H);
            }
        }
    }

    // 4. Update Three.js Texture
    if (scene3D.earthTexture) {
        scene3D.earthTexture.needsUpdate = true;
    }
}

/**
 * Draw the static/dynamic penumbral contours onto the canvas.
 */
function drawContoursOnCanvas(ctx, features, W, H) {
    if (!features || features.length === 0) return;

    // Polished contour shades — warm tones with good contrast on the light map
    const styleMap = {
        0.01: { fillColor: 'rgba(255, 235, 190, 0.40)', strokeColor: 'rgba(230, 200, 140, 0.60)' }, // >0%  — pale gold
        0.25: { fillColor: 'rgba(255, 200, 145, 0.45)', strokeColor: 'rgba(230, 170, 100, 0.65)' }, // >25% — warm peach
        0.50: { fillColor: 'rgba(240, 155, 140, 0.50)', strokeColor: 'rgba(210, 120, 100, 0.70)' }, // >50% — salmon
        0.75: { fillColor: 'rgba(210, 80, 100, 0.55)',  strokeColor: 'rgba(190, 55, 75, 0.75)' }   // >75% — deep rose
    };

    // Sort features from outermost (lowest threshold) to innermost (highest, with umbra at 1.0/1.2) to layer properly
    const sorted = [...features].sort((a, b) => {
        const getWeight = (f) => {
            if (!f.properties) return 0;
            if (f.properties.isUmbra || f.properties.isLunarTotal) return 1.2;
            if (f.properties.isLunarUmbral) return 1.0;
            if (f.properties.isTransitPeak) return 0.9;
            if (f.properties.isLunarPenumbralTotal) return 0.7;
            if (f.properties.isTransitLimits) return 0.6;
            if (f.properties.isLunarPenumbral) return 0.5;
            return f.properties.magnitude || f.properties.threshold || 0.01;
        };
        return getWeight(a) - getWeight(b);
    });

    sorted.forEach(feature => {
        if (feature.properties && feature.properties.isUmbra) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.strokeStyle = 'rgba(255, 59, 48, 0.9)';
            ctx.lineWidth = 2.0;
        } else if (feature.properties && feature.properties.isLunarTotal) {
            const isInst = feature.properties.isInstantaneous;
            ctx.fillStyle = isInst ? 'rgba(138, 26, 21, 0.52)' : 'rgba(138, 26, 21, 0.16)';
            ctx.strokeStyle = isInst ? 'rgba(138, 26, 21, 0.72)' : 'rgba(138, 26, 21, 0.28)';
            ctx.lineWidth = 1.0;
        } else if (feature.properties && feature.properties.isLunarUmbral) {
            const isInst = feature.properties.isInstantaneous;
            ctx.fillStyle = isInst ? 'rgba(74, 20, 140, 0.40)' : 'rgba(74, 20, 140, 0.12)';
            ctx.strokeStyle = isInst ? 'rgba(74, 20, 140, 0.60)' : 'rgba(74, 20, 140, 0.22)';
            ctx.lineWidth = 1.0;
        } else if (feature.properties && feature.properties.isTransitPeak) {
            const isInst = feature.properties.isInstantaneous;
            ctx.fillStyle = isInst ? 'rgba(255, 167, 38, 0.36)' : 'rgba(255, 167, 38, 0.12)';
            ctx.strokeStyle = isInst ? 'rgba(255, 167, 38, 0.55)' : 'rgba(255, 167, 38, 0.22)';
            ctx.lineWidth = 1.0;
        } else if (feature.properties && feature.properties.isLunarPenumbralTotal) {
            const isInst = feature.properties.isInstantaneous;
            ctx.fillStyle = isInst ? 'rgba(123, 31, 162, 0.34)' : 'rgba(123, 31, 162, 0.10)';
            ctx.strokeStyle = isInst ? 'rgba(123, 31, 162, 0.50)' : 'rgba(123, 31, 162, 0.18)';
            ctx.lineWidth = 1.0;
        } else if (feature.properties && feature.properties.isTransitLimits) {
            const isInst = feature.properties.isInstantaneous;
            ctx.fillStyle = isInst ? 'rgba(255, 224, 130, 0.22)' : 'rgba(255, 224, 130, 0.06)';
            ctx.strokeStyle = isInst ? 'rgba(255, 224, 130, 0.35)' : 'rgba(255, 224, 130, 0.12)';
            ctx.lineWidth = 1.0;
        } else if (feature.properties && feature.properties.isLunarPenumbral) {
            const isInst = feature.properties.isInstantaneous;
            ctx.fillStyle = isInst ? 'rgba(186, 104, 200, 0.24)' : 'rgba(186, 104, 200, 0.08)';
            ctx.strokeStyle = isInst ? 'rgba(186, 104, 200, 0.40)' : 'rgba(186, 104, 200, 0.15)';
            ctx.lineWidth = 1.0;
        } else {
            const threshold = feature.properties ? feature.properties.magnitude || feature.properties.threshold : 0.01;
            const style = styleMap[threshold] || styleMap[0.01];

            ctx.fillStyle = style.fillColor;
            ctx.strokeStyle = style.strokeColor;
            ctx.lineWidth = 1.0;
        }

        const type = feature.geometry.type;
        const coords = feature.geometry.coordinates;

        if (type === 'Polygon') {
            drawContourPolygon(ctx, coords, W, H);
        } else if (type === 'MultiPolygon') {
            coords.forEach(poly => {
                drawContourPolygon(ctx, poly, W, H);
            });
        }
    });
}

/**
 * Draw a contour polygon, handling pole-encircling cases.
 * If the ring encircles the north or south pole, extend the polygon to the map edge.
 */
function drawContourPolygon(ctx, rings, W, H) {
    if (!rings || rings.length === 0) return;

    const offsets = [-W, 0, W];

    ctx.beginPath();
    offsets.forEach(offset => {
        rings.forEach(ring => {
            if (!ring || ring.length < 3) return;
            for (let i = 0; i < ring.length; i++) {
                const [lon, lat] = ring[i];
                const x = ((lon + 180) / 360) * W + offset;
                const y = ((90 - lat) / 180) * H;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
        });
    });

    ctx.fill('evenodd');
    ctx.stroke();
}



/**
 * Draw the totality path ribbon and centerline wrapping-safely onto the canvas.
 */
function drawTotalityRibbonOnCanvas(ctx, W, H) {
    if (!currentEvent || currentEvent.type !== 'solar' || !currentEventTrack || currentEventTrack.length === 0) return;

    const central = currentEventTrack.filter(pt => pt.type === 'Total' || pt.type === 'Annular');
    if (central.length < 2) return;

    const segments = segmentTrack(central);
    ctx.fillStyle = 'rgba(224, 94, 117, 0.50)'; // Exact pink/magenta totality ribbon shade
    ctx.strokeStyle = 'rgba(224, 94, 117, 0.75)';
    ctx.lineWidth = 1.2;

    segments.forEach(seg => {
        if (seg.length < 2) return;
        ctx.beginPath();
        // Forward along northern limit
        for (let i = 0; i < seg.length; i++) {
            const pt = seg[i];
            const x = ((pt.northLon + 180) / 360) * W;
            const y = ((90 - pt.northLat) / 180) * H;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        // Backward along southern limit
        for (let i = seg.length - 1; i >= 0; i--) {
            const pt = seg[i];
            const x = ((pt.southLon + 180) / 360) * W;
            const y = ((90 - pt.southLat) / 180) * H;
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Also draw centerline dashed line
        ctx.strokeStyle = 'rgba(191, 54, 12, 0.5)';
        ctx.lineWidth = 1.0;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        for (let i = 0; i < seg.length; i++) {
            const pt = seg[i];
            const x = ((pt.lon + 180) / 360) * W;
            const y = ((90 - pt.lat) / 180) * H;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        ctx.setLineDash([]); // Reset
    });
}

/**
 * Draw a small black circle at the shadow center.
 */
function drawShadowCenterOnCanvas(ctx, lat, lon, W, H) {
    const x = ((lon + 180) / 360) * W;
    const y = ((90 - lat) / 180) * H;
    
    // Draw pulsing ring around shadow center
    ctx.strokeStyle = 'rgba(255, 59, 48, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.stroke();

    // Draw small black umbra circle
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Updates the 3D globe view parameters.
 */
function updateGlobeView() {
    if (!currentEvent || !scene3D.scene) return;

    // Calculate active time
    const ev = currentEvent;
    const durationHours = 6;
    const startJD = ev.peakJD - durationHours / 48;
    const fraction = timeSliderVal / 100;
    const activeJD = startJD + fraction * (durationHours / 24);
    const activeDate = dateFromJD(activeJD);

    // Update time displays
    const timeStr = activeDate.toUTCString().split(' ')[4] || '--:--:--';
    const globeTimeDisplay = document.getElementById('globe-time-display');
    if (globeTimeDisplay) globeTimeDisplay.innerText = timeStr + ' UTC';

    const valGlobeTime = document.getElementById('val-globe-time');
    if (valGlobeTime) valGlobeTime.innerText = timeStr + ' UTC';

    if (ev.type === 'solar') {
        const shadow = AstronomyHelper.calculateShadowCenter(activeDate);
        if (shadow && isFinite(shadow.lat) && isFinite(shadow.lon)) {
            // Globe stays fixed — shadow sweeps across the surface naturally

            // Update info sidebar
            const valLat = document.getElementById('val-globe-lat');
            const valLon = document.getElementById('val-globe-lon');
            const valObs = document.getElementById('val-globe-obs');
            if (valLat) valLat.innerText = shadow.lat.toFixed(2) + '°';
            if (valLon) valLon.innerText = shadow.lon.toFixed(2) + '°';
            if (valObs) valObs.innerText = '100%';
        } else {
            const valLat = document.getElementById('val-globe-lat');
            const valLon = document.getElementById('val-globe-lon');
            const valObs = document.getElementById('val-globe-obs');
            if (valLat) valLat.innerText = '--°';
            if (valLon) valLon.innerText = '--°';
            if (valObs) valObs.innerText = '--%';
        }

        // Calculate dynamic shadow contours if animating
        if (isAnimating || timeSliderVal > 0) {
            const footprints = AstronomyHelper.calculateProjectedShadowFootprints(activeDate);
            const dynamicFeatures = [];
            if (footprints) {
                const levels = [0.01, 0.25, 0.50, 0.75];
                levels.forEach(l => {
                    const coords = footprints.penumbra[l];
                    if (coords && coords.length > 2) {
                        dynamicFeatures.push({
                            type: "Feature",
                            properties: { magnitude: l },
                            geometry: {
                                type: "Polygon",
                                coordinates: [coords.map(pt => [pt[1], pt[0]])] // geojson uses lon, lat
                            }
                        });
                    }
                });

                // Add umbra layer if present
                if (footprints.umbra && footprints.umbra.coordinates && footprints.umbra.coordinates.length > 2) {
                    const coords = footprints.umbra.coordinates;
                    dynamicFeatures.push({
                        type: "Feature",
                        properties: { isUmbra: true, umbraType: footprints.umbra.type },
                        geometry: {
                            type: "Polygon",
                            coordinates: [coords.map(pt => [pt[1], pt[0]])]
                        }
                    });
                }
            }
            scene3D.instantaneousContours = dynamicFeatures;
        }
    } else if (ev.type === 'lunar') {
        const valLat = document.getElementById('val-globe-lat');
        const valLon = document.getElementById('val-globe-lon');
        const valObs = document.getElementById('val-globe-obs');

        const t = Astronomy.MakeTime(activeDate);
        const sun = Astronomy.GeoVector(Astronomy.Body.Sun, t, false);
        const local = AstronomyHelper.calculateLocalLunarEclipse(activeDate, observerLocation.lat, observerLocation.lon);

        if (sun && local) {
            const R_dist = Math.sqrt(sun.x*sun.x + sun.y*sun.y + sun.z*sun.z);
            const subsolarLat = Math.asin(sun.z/R_dist) * 180 / Math.PI;
            const gmst = Astronomy.SiderealTime(t);
            let subsolarLon = Math.atan2(sun.y, sun.x) * 180 / Math.PI - gmst * 15;
            while (subsolarLon < -180) subsolarLon += 360;
            while (subsolarLon > 180) subsolarLon -= 360;

            const antiLat = -subsolarLat;
            let antiLon = subsolarLon + 180;
            while (antiLon < -180) antiLon += 360;
            while (antiLon > 180) antiLon -= 360;

            if (valLat) valLat.innerText = antiLat.toFixed(2) + '°';
            if (valLon) valLon.innerText = antiLon.toFixed(2) + '°';
            if (valObs) valObs.innerText = (local.obscuration * 100).toFixed(1) + '%';
        } else {
            if (valLat) valLat.innerText = '--°';
            if (valLon) valLon.innerText = '--°';
            if (valObs) valObs.innerText = '--%';
        }

        // Calculate dynamic shadow contours if animating
        if (isAnimating || timeSliderVal > 0) {
            const footprints = AstronomyHelper.calculateLocalLunarEclipse(activeDate, 0, 0);
            if (footprints && footprints.obscuration > 0) {
                const coords = AstronomyHelper.calculateDayNightTerminator(activeDate);
                if (coords) {
                    scene3D.instantaneousContours = [{
                        type: "Feature",
                        properties: {
                            isLunarTotal: footprints.type === 'Total' || footprints.umbralMagnitude >= 1.0,
                            isLunarUmbral: footprints.type === 'Partial' || (footprints.umbralMagnitude > 0.0 && footprints.umbralMagnitude < 1.0),
                            isLunarPenumbralTotal: footprints.penumbralMagnitude >= 1.0 && footprints.umbralMagnitude <= 0.0,
                            isLunarPenumbral: footprints.penumbralMagnitude > 0.0 && footprints.penumbralMagnitude < 1.0 && footprints.umbralMagnitude <= 0.0,
                            isInstantaneous: true
                        },
                        geometry: {
                            type: "Polygon",
                            coordinates: [coords.map(pt => [pt[1], pt[0]])]
                        }
                    }];
                } else {
                    scene3D.instantaneousContours = [];
                }
            } else {
                scene3D.instantaneousContours = [];
            }
        }
    } else if (ev.type === 'transit') {
        if (isAnimating || timeSliderVal > 0) {
            const peakDate = dateFromJD(ev.peakJD);
            const startSearch = new Date(peakDate.getTime() - 12 * 60 * 60 * 1000);
            const t = Astronomy.MakeTime(startSearch);
            const body = ev.typeName.includes('Venus') ? Astronomy.Body.Venus : Astronomy.Body.Mercury;
            let transit = null;
            try {
                transit = Astronomy.SearchTransit(body, t);
            } catch (e) {}

            if (transit) {
                const tStart = new Date(transit.start.date);
                const tFinish = new Date(transit.finish.date);
                if (activeDate >= tStart && activeDate <= tFinish) {
                    const coords = AstronomyHelper.calculateDaylightTerminator(activeDate);
                    if (coords) {
                        scene3D.instantaneousContours = [{
                            type: "Feature",
                            properties: {
                                isTransitPeak: true,
                                isInstantaneous: true
                            },
                            geometry: {
                                type: "Polygon",
                                coordinates: [coords.map(pt => [pt[1], pt[0]])]
                            }
                        }];
                    } else {
                        scene3D.instantaneousContours = [];
                    }
                } else {
                    scene3D.instantaneousContours = [];
                }
            } else {
                scene3D.instantaneousContours = [];
            }
        } else {
            scene3D.instantaneousContours = [];
        }
    }

    // Update Sun direction and disableNight uniforms for day/night shader
    const sunDir = calculateSunDirection(activeDate);
    if (scene3D.earth && scene3D.earth.material.uniforms) {
        scene3D.earth.material.uniforms.sunDirection.value.copy(sunDir);
        
        let disableNightVal = 0.0;
        if (ev.type === 'lunar') {
            const local = AstronomyHelper.calculateLocalLunarEclipse(activeDate, 0, 0);
            if (local && local.obscuration > 0.0001) {
                disableNightVal = 1.0;
            }
        }
        if (scene3D.earth.material.uniforms.disableNight) {
            scene3D.earth.material.uniforms.disableNight.value = disableNightVal;
        }
        if (scene3D.earth.material.uniforms.disableNightEntirely) {
            scene3D.earth.material.uniforms.disableNightEntirely.value = isAnimating ? 0.0 : 1.0;
        }
    }

    // Draw the active canvas texture layers
    drawGlobeLayers();
}

/**
 * Toggle animation state
 */
// Obsolete Globe animations removed in favor of unified timeline.

// Select Preset Event
function selectEvent(ev) {
    currentEvent = ev;
    stopAnimation();

    // Set side panel values
    const lang = getCurrentLanguage();
    const typeNameTranslated = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][ev.typeName]) || ev.typeName;
    const nameTranslated = translateEventName(ev.name, lang);
    document.getElementById('val-name').innerText = nameTranslated;
    document.getElementById('val-type').innerText = typeNameTranslated;
    
    const peakDate = dateFromJD(ev.peakJD);
    document.getElementById('val-peak-time').innerText = formatDate(peakDate) + " " + peakDate.toUTCString().split(" ")[4] + " UTC";
    document.getElementById('val-duration').innerText = ev.duration;

    // Reset Sliders — unified
    timeSliderVal = 0;
    const sliders = [
        document.getElementById('time-slider'),
        document.getElementById('sim-time-slider'),
        document.getElementById('globe-time-slider')
    ];
    sliders.forEach(s => { if (s) s.value = 0; });
    updateSliderGradient();

    // Reset shadow center marker so it will be recreated for the new event
    if (shadowCenterMarker && dynamicMap) {
        if (dynamicMap.hasLayer(shadowCenterMarker)) {
            dynamicMap.removeLayer(shadowCenterMarker);
        }
        shadowCenterMarker = null;
    }

    // Set custom inputs
    let localDateTime;
    try {
        localDateTime = peakDate.toISOString().slice(0, 16);
    } catch(e) {
        localDateTime = "";
    }
    document.getElementById('custom-date').value = localDateTime;
    
    // Zoom maps to path center on event change
    if (map) {
        map.setView([ev.lat, ev.lon], ev.type === 'solar' ? 3 : 2);
    }
    if (dynamicMap) {
        dynamicMap.setView([ev.lat, ev.lon], ev.type === 'solar' ? 3 : 2);
    }

    // Update local contact timings for the new event
    updateContactTimings();

    // Update time from slider (which will also call updateViews)
    updateTimeFromSlider();
    
    // Update legends dynamically
    updateLegends();
}

// Get the Date object corresponding to the current slider position
function getActiveTime() {
    if (!currentEvent) return new Date();
    
    // Solar/Transit timeline: +/- 3 hours, Lunar: +/- 4 hours (in days)
    const rangeDays = (currentEvent.type === 'lunar' ? 4 : 3) / 24;
    
    // Interpolate slider 0-100 to offset range
    const offsetDays = ((timeSliderVal - 50) / 50) * rangeDays;
    const activeJD = currentEvent.peakJD + offsetDays;
    return dateFromJD(activeJD);
}

function updateSliderGradient() {
    const sliders = [
        document.getElementById('time-slider'),
        document.getElementById('sim-time-slider'),
        document.getElementById('globe-time-slider')
    ];
    sliders.forEach(slider => {
        if (slider) {
            const pct = ((slider.value - slider.min) / (slider.max - slider.min) * 100).toFixed(1) + '%';
            slider.style.setProperty('--pct', pct);
            slider.style.background = `linear-gradient(to right, #125dff 0%, #125dff ${pct}, rgba(255,255,255,0.1) ${pct}, rgba(255,255,255,0.1) 100%)`;
        }
    });
}

function updateTimeFromSlider() {
    const activeDate = getActiveTime();
    
    // Update displays
    let timeStr;
    if (activeDate.getUTCFullYear() <= 0) {
        const bceYear = Math.abs(activeDate.getUTCFullYear()) + 1;
        const pts = activeDate.toUTCString().split(" ");
        timeStr = `${pts[0] || ""} ${pts[1] || ""} ${pts[2] || ""} ${bceYear} BCE ${pts[4] || ""} UTC`;
    } else {
        timeStr = activeDate.toUTCString().replace("GMT", "UTC");
    }
    document.getElementById('time-display').innerText = timeStr;
    document.getElementById('sim-time-display').innerText = activeDate.toUTCString().split(" ")[4] + " UTC";
    
    // Sync slider gradient
    updateSliderGradient();
    
    updateViews();
}

// Animation playback controls
function startAnimation() {
    if (isAnimating) return;
    isAnimating = true;
    
    updatePlayButtonsState();

    passedBookmarkPcts.clear();
    animInterval = setInterval(() => {
        if (bookmarkPauseActive) return; // paused at a bookmark, skip tick

        const prevVal = timeSliderVal;
        timeSliderVal += 0.08 * simSpeedMultiplier;
        if (timeSliderVal > 100) {
            if (isLooping) {
                timeSliderVal = 0;
                passedBookmarkPcts.clear();
            } else {
                timeSliderVal = 100;
                stopAnimation();
            }
        }
        
        const sliders = [
            document.getElementById('time-slider'), 
            document.getElementById('sim-time-slider'),
            document.getElementById('globe-time-slider')
        ];
        sliders.forEach(s => { if (s) s.value = timeSliderVal; });
        updateTimeFromSlider();

        // Check if we just crossed a bookmark
        checkBookmarkCrossing(prevVal, timeSliderVal);
    }, 50);
}

function stopAnimation() {
    if (!isAnimating) return;
    isAnimating = false;
    clearInterval(animInterval);
    
    updatePlayButtonsState();
}

function updatePlayButtonsState() {
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        const playIcon = playBtn.querySelector('.play-icon');
        const pauseIcon = playBtn.querySelector('.pause-icon');
        if (playIcon && pauseIcon) {
            if (isAnimating) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            } else {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            }
        }
    }

    const globePlayBtn = document.getElementById('globe-play-btn');
    if (globePlayBtn) {
        const playIcon = globePlayBtn.querySelector('.play-icon');
        const pauseIcon = globePlayBtn.querySelector('.pause-icon');
        if (playIcon && pauseIcon) {
            if (isAnimating) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            } else {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            }
        }
    }
    
    const simPlayBtn = document.getElementById('sim-play-btn');
    if (simPlayBtn) {
        const playIcon = simPlayBtn.querySelector('.play-icon');
        const pauseIcon = simPlayBtn.querySelector('.pause-icon');
        if (playIcon && pauseIcon) {
            if (isAnimating) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            } else {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            }
        }
    }
}

// Update all visualizations
function updateViews() {
    if (!currentEvent) return;
    const activeTime = getActiveTime();

    // 1. Update 2D Map shadow overlays
    updateMapOverlays(activeTime);

    // 2. Update 3D Globe View
    updateGlobeView();
    // 3. Update Local Sky Canvas
    updateLocalSimulator(activeTime);

    // 4. Highlight active phase in the contact list
    highlightActivePhase(activeTime);
}

// Show/hide the event info box
function showEventInfo(bookmark) {
    activeBookmarkInfo = bookmark;
    const infoSection = document.getElementById('sim-event-info-section');
    const infoDesc = document.getElementById('sim-event-info-desc');
    if (!infoSection || !infoDesc) return;
    const html = getEventPhaseExplanation(bookmark);
    if (html) {
        infoDesc.innerHTML = html;
        infoSection.style.display = 'block';
    }
}

function hideEventInfo() {
    activeBookmarkInfo = null;
    const infoSection = document.getElementById('sim-event-info-section');
    if (infoSection) infoSection.style.display = 'none';
}

// Show info box when slider is close to a bookmark, hide it otherwise
function updateInfoForSliderVal(val) {
    const bookmarks = getBookmarkPcts();
    const threshold = 1.5;
    let nearBookmark = null;

    for (const b of bookmarks) {
        if (Math.abs(val - b.pct) < threshold) {
            nearBookmark = b;
            break;
        }
    }

    if (nearBookmark) {
        showEventInfo(nearBookmark);
    } else {
        hideEventInfo();
    }
}

// Get all bookmark percentage positions
function getBookmarkPcts() {
    if (!currentEvent || !cachedContactTimes || cachedContactTimes.length === 0) return [];
    const rangeDays = (currentEvent.type === 'lunar' ? 4 : 3) / 24;
    const bookmarks = [];

    cachedContactTimes.forEach(c => {
        const t = Astronomy.MakeTime(c.date);
        const offsetDays = t.ut - currentEvent.peakJD;
        let pct = 50 + 50 * (offsetDays / rangeDays);
        if (pct >= 0 && pct <= 100) {
            let label = c.defaultLabel.split(':')[0].split('(')[0].trim();
            bookmarks.push({ pct, label, date: c.date });
        }
    });

    const sunTimes = findSunriseSunsetTimes();
    sunTimes.forEach(s => {
        const t = Astronomy.MakeTime(s.date);
        const offsetDays = t.ut - currentEvent.peakJD;
        let pct = 50 + 50 * (offsetDays / rangeDays);
        if (pct >= 0 && pct <= 100) {
            bookmarks.push({ pct, label: s.label, date: s.date });
        }
    });

    bookmarks.sort((a, b) => a.pct - b.pct);
    return bookmarks;
}

// Recalculate trajectory paths for Sun/Shadow and Moon/Planet across the timeline
function recalculateTrajectories() {
    cachedSunTrajectory = [];
    cachedMoonTrajectory = [];
    if (!currentEvent) return;

    const lat = observerLocation.lat;
    const lon = observerLocation.lon;
    const rangeDays = (currentEvent.type === 'lunar' ? 4 : 3) / 24;
    const samples = 60; // 60 points for high-fidelity smooth paths

    for (let i = 0; i <= samples; i++) {
        const offsetDays = ((i - samples/2) / (samples/2)) * rangeDays;
        const jd = currentEvent.peakJD + offsetDays;
        const date = dateFromJD(jd);

        if (currentEvent.type === 'solar') {
            const local = AstronomyHelper.calculateLocalSolarEclipse(date, lat, lon);
            if (local) {
                // Project Sun (Physical topocentric coordinates)
                const rSun = 170 * (90 - local.sunAlt) / 90;
                const angleSun = (local.sunAz - 90) * Math.PI / 180;
                const xSun = rSun * Math.cos(angleSun);
                const ySun = rSun * Math.sin(angleSun);

                // Project Moon (Physical topocentric coordinates)
                const rMoonReal = 170 * (90 - local.moonAlt) / 90;
                const angleMoon = (local.moonAz - 90) * Math.PI / 180;
                const xMoonReal = rMoonReal * Math.cos(angleMoon);
                const yMoonReal = rMoonReal * Math.sin(angleMoon);

                cachedSunTrajectory.push({ x: xSun, y: ySun, alt: local.sunAlt });
                cachedMoonTrajectory.push({ x: xMoonReal, y: yMoonReal, alt: local.moonAlt });
            }
        } else if (currentEvent.type === 'lunar') {
            const local = AstronomyHelper.calculateLocalLunarEclipse(date, lat, lon);
            if (local) {
                // Project shadow center (antisolar point)
                const shadowAlt = -local.sunAlt;
                const shadowAz = (local.sunAz + 180) % 360;
                const rShadow = 170 * (90 - shadowAlt) / 90;
                const angleShadow = (shadowAz - 90) * Math.PI / 180;
                const xShadow = rShadow * Math.cos(angleShadow);
                const yShadow = rShadow * Math.sin(angleShadow);

                // Project Moon (Physical topocentric coordinates)
                const rMoonReal = 170 * (90 - local.moonAlt) / 90;
                const angleMoon = (local.moonAz - 90) * Math.PI / 180;
                const xMoonReal = rMoonReal * Math.cos(angleMoon);
                const yMoonReal = rMoonReal * Math.sin(angleMoon);

                cachedSunTrajectory.push({ x: xShadow, y: yShadow, alt: shadowAlt }); // Shadow path
                cachedMoonTrajectory.push({ x: xMoonReal, y: yMoonReal, alt: local.moonAlt }); // Moon path
            }
        } else if (currentEvent.type === 'transit') {
            const transitBody = currentEvent.typeName.includes('Venus') ? Astronomy.Body.Venus : Astronomy.Body.Mercury;
            const local = AstronomyHelper.calculateTransit(date, transitBody, lat, lon);
            if (local) {
                // Project Sun (Physical topocentric coordinates)
                const rSun = 170 * (90 - local.sunAlt) / 90;
                const angleSun = (local.sunAz - 90) * Math.PI / 180;
                const xSun = rSun * Math.cos(angleSun);
                const ySun = rSun * Math.sin(angleSun);

                // Project Planet (Physical topocentric coordinates)
                const rPlanetReal = 170 * (90 - local.planetAlt) / 90;
                const anglePlanet = (local.planetAz - 90) * Math.PI / 180;
                const xPlanetReal = rPlanetReal * Math.cos(anglePlanet);
                const yPlanetReal = rPlanetReal * Math.sin(anglePlanet);

                cachedSunTrajectory.push({ x: xSun, y: ySun, alt: local.sunAlt });
                cachedMoonTrajectory.push({ x: xPlanetReal, y: yPlanetReal, alt: local.planetAlt }); // Planet path
            }
        }
    }
}

// Draw the cached trajectories on the simulator sky dome canvas
function drawTrajectories(ctx, cx, cy) {
    if (!cachedSunTrajectory || cachedSunTrajectory.length === 0) return;

    // Draw Sun/Shadow trajectory (dashed orange/red line)
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    let first = true;
    for (let pt of cachedSunTrajectory) {
        const sx = cx + pt.x;
        const sy = cy + pt.y;
        if (first) {
            ctx.moveTo(sx, sy);
            first = false;
        } else {
            ctx.lineTo(sx, sy);
        }
    }
    ctx.strokeStyle = currentEvent.type === 'lunar' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.5)';
    ctx.stroke();

    // Draw Moon/Planet trajectory (dashed cyan line)
    ctx.beginPath();
    first = true;
    for (let pt of cachedMoonTrajectory) {
        const mx = cx + pt.x;
        const my = cy + pt.y;
        if (first) {
            ctx.moveTo(mx, my);
            first = false;
        } else {
            ctx.lineTo(mx, my);
        }
    }
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.stroke();
    ctx.restore();
}


// Check if animation just crossed a bookmark; if so, pause briefly and show info
function checkBookmarkCrossing(prevVal, newVal) {
    if (currentTab !== 'simulator-view') return;
    if (!isAnimating || bookmarkPauseActive) return;
    const bookmarks = getBookmarkPcts();
    const crossThreshold = 0.5;

    for (const b of bookmarks) {
        const key = b.pct.toFixed(2);
        if (passedBookmarkPcts.has(key)) continue;

        // Check if we just crossed this bookmark
        if (prevVal < b.pct && newVal >= b.pct - crossThreshold) {
            passedBookmarkPcts.add(key);

            // Snap exactly to the bookmark position
            timeSliderVal = b.pct;
            const sliders = [
                document.getElementById('time-slider'),
                document.getElementById('sim-time-slider'),
                document.getElementById('globe-time-slider')
            ];
            sliders.forEach(s => { if (s) s.value = b.pct; });
            updateTimeFromSlider();

            // Show info and pause for 1 second
            showEventInfo(b);
            bookmarkPauseActive = true;

            if (activeInfoTimeout) clearTimeout(activeInfoTimeout);
            activeInfoTimeout = setTimeout(() => {
                bookmarkPauseActive = false;
                // Hide info box ~1.5s after resuming
                activeInfoTimeout = setTimeout(() => {
                    hideEventInfo();
                    activeInfoTimeout = null;
                }, 1500);
            }, 1000);

            break; // only pause at one bookmark per tick
        }
    }
}



// Rich explanation text for both the closeup telescope view and sky dome horizon projection view
function getEventPhaseExplanation(bookmark) {
    if (!bookmark) return "";
    const name = bookmark.label;
    const type = currentEvent.type;
    const lang = getCurrentLanguage();
    const dict = (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || {};

    let key = "";
    if (type === 'solar') {
        if (name.includes('C1')) key = 'explain_solar_c1';
        else if (name.includes('C2')) key = 'explain_solar_c2';
        else if (name.includes('Peak') || name.includes('Maximum')) key = 'explain_solar_peak';
        else if (name.includes('C3')) key = 'explain_solar_c3';
        else if (name.includes('C4')) key = 'explain_solar_c4';
    } else if (type === 'lunar') {
        if (name.includes('P1')) key = 'explain_lunar_p1';
        else if (name.includes('U1')) key = 'explain_lunar_u1';
        else if (name.includes('U2')) key = 'explain_lunar_u2';
        else if (name.includes('Peak') || name.includes('Maximum')) key = 'explain_lunar_peak';
        else if (name.includes('U3')) key = 'explain_lunar_u3';
        else if (name.includes('U4')) key = 'explain_lunar_u4';
        else if (name.includes('P4')) key = 'explain_lunar_p4';
    } else if (type === 'transit') {
        if (name.includes('Ingress')) key = 'explain_transit_ingress';
        else if (name.includes('Peak') || name.includes('Maximum')) key = 'explain_transit_peak';
        else if (name.includes('Egress')) key = 'explain_transit_egress';
    }

    if (!key) {
        if (name.includes('Sunrise')) key = 'explain_sunrise';
        else if (name.includes('Sunset')) key = 'explain_sunset';
    }

    return dict[key] || "";
}

/// Helper functions for great-circle offsets and topocentric search
function calculateBearing(lat1, lon1, lat2, lon2) {
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    let b = Math.atan2(y, x) * 180 / Math.PI;
    return (b + 360) % 360;
}

function destinationPoint(lat, lon, bearing, distance) {
    const R = 6378.137;
    const dDivR = distance / R;
    const latRad = lat * Math.PI / 180;
    const lonRad = lon * Math.PI / 180;
    const bearingRad = bearing * Math.PI / 180;
    
    let lat2Rad = Math.asin(Math.sin(latRad) * Math.cos(dDivR) +
                            Math.cos(latRad) * Math.sin(dDivR) * Math.cos(bearingRad));
    
    const maxLatRad = 89.9 * Math.PI / 180;
    if (lat2Rad > maxLatRad) {
        lat2Rad = maxLatRad;
    } else if (lat2Rad < -maxLatRad) {
        lat2Rad = -maxLatRad;
    }

    const lon2Rad = lonRad + Math.atan2(Math.sin(bearingRad) * Math.sin(dDivR) * Math.cos(latRad),
                                         Math.cos(dDivR) - Math.sin(latRad) * Math.sin(lat2Rad));
    let lat2 = lat2Rad * 180 / Math.PI;
    let lon2 = lon2Rad * 180 / Math.PI;
    
    // Clamping polar crossings to prevent antimeridian jumps
    let diff = lon2 - lon;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    
    if (Math.abs(diff) > 90 && Math.abs(lat) > 70) {
        lat2 = lat < 0 ? -89.9 : 89.9;
        lon2 = lon;
    } else {
        lon2 = lon + diff;
    }
    
    return { lat: lat2, lon: lon2 };
}


function findCentralBoundaryDistance(date, centerLat, centerLon, bearing) {
    let low = 0;
    let high = 500;
    
    for (let step = 0; step < 8; step++) {
        const mid = (low + high) / 2;
        const P = destinationPoint(centerLat, centerLon, bearing, mid);
        const local = AstronomyHelper.calculateLocalSolarEclipse(date, P.lat, P.lon);
        
        if (!local || local.separation > Math.abs(local.sunRadius - local.moonRadius)) {
            high = mid;
        } else {
            low = mid;
        }
    }
    return low;
}

// Shortest difference between two longitudes
function getLongitudeDiff(lon1, lon2) {
    let diff = lon2 - lon1;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    return diff;
}

// Segment the main track to handle antimeridian and polar crossing jumps (> 90 degrees)
function segmentTrack(track) {
    if (track.length === 0) return [];
    
    const segments = [];
    let currentSegment = [track[0]];
    
    for (let i = 1; i < track.length; i++) {
        const prev = track[i - 1];
        const curr = track[i];
        
        let split = false;
        
        // Split if centerline longitude jumps by > 60 degrees (antimeridian or polar crossing)
        let diffC = getLongitudeDiff(prev.lon, curr.lon);
        if (Math.abs(diffC) > 60) split = true;
        
        // Split if northern limit longitude jumps by > 60 degrees
        if (!split && prev.northLon !== undefined && curr.northLon !== undefined) {
            let diffN = getLongitudeDiff(prev.northLon, curr.northLon);
            if (Math.abs(diffN) > 60) split = true;
        }
        
        // Split if southern limit longitude jumps by > 60 degrees
        if (!split && prev.southLon !== undefined && curr.southLon !== undefined) {
            let diffS = getLongitudeDiff(prev.southLon, curr.southLon);
            if (Math.abs(diffS) > 60) split = true;
        }
        
        if (split) {
            segments.push(currentSegment);
            currentSegment = [curr];
        } else {
            currentSegment.push(curr);
        }
    }
    
    if (currentSegment.length > 0) {
        segments.push(currentSegment);
    }
    
    // Make longitudes continuous within each segment to prevent inner line crossings
    segments.forEach(seg => {
        if (seg.length === 0) return;
        
        for (let i = 1; i < seg.length; i++) {
            let diff = seg[i].lon - seg[i-1].lon;
            while (diff < -180) diff += 360;
            while (diff > 180) diff -= 360;
            seg[i].lon = seg[i-1].lon + diff;
        }
        
        for (let i = 0; i < seg.length; i++) {
            const pt = seg[i];
            if (pt.northLon !== undefined) {
                let diffN = pt.northLon - pt.lon;
                while (diffN < -180) diffN += 360;
                while (diffN > 180) diffN -= 360;
                pt.northLon = pt.lon + diffN;
            }
            if (pt.southLon !== undefined) {
                let diffS = pt.southLon - pt.lon;
                while (diffS < -180) diffS += 360;
                while (diffS > 180) diffS -= 360;
                pt.southLon = pt.lon + diffS;
            }
        }
    });
    
    return segments;
}

// Segment penumbral bands to handle antimeridian and polar crossing jumps (> 90 degrees)
function segmentPenumbralBand(bandPoints) {
    if (bandPoints.length === 0) return [];
    
    const segments = [];
    let currentSegment = [bandPoints[0]];
    
    for (let i = 1; i < bandPoints.length; i++) {
        const prev = bandPoints[i - 1];
        const curr = bandPoints[i];
        
        let split = false;
        
        let diffN = getLongitudeDiff(prev.northLon, curr.northLon);
        if (Math.abs(diffN) > 90) split = true;
        
        if (!split) {
            let diffS = getLongitudeDiff(prev.southLon, curr.southLon);
            if (Math.abs(diffS) > 90) split = true;
        }
        
        if (split) {
            segments.push(currentSegment);
            currentSegment = [curr];
        } else {
            currentSegment.push(curr);
        }
    }
    
    if (currentSegment.length > 0) {
        segments.push(currentSegment);
    }
    
    segments.forEach(seg => {
        if (seg.length === 0) return;
        
        for (let i = 1; i < seg.length; i++) {
            let diff = seg[i].northLon - seg[i-1].northLon;
            while (diff < -180) diff += 360;
            while (diff > 180) diff -= 360;
            seg[i].northLon = seg[i-1].northLon + diff;
        }
        
        for (let i = 0; i < seg.length; i++) {
            if (i > 0) {
                let diff = seg[i].southLon - seg[i-1].southLon;
                while (diff < -180) diff += 360;
                while (diff > 180) diff -= 360;
                seg[i].southLon = seg[i-1].southLon + diff;
            }
            
            let diffS = seg[i].southLon - seg[i].northLon;
            while (diffS < -180) diffS += 360;
            while (diffS > 180) diffS -= 360;
            seg[i].southLon = seg[i].northLon + diffS;
        }
    });
    
    return segments;
}

// 2D Map Path & Shadow drawing
function updateMapOverlays(date) {
    if (!map || !dynamicMap) return;

    // Clear previous dynamic overlays (active shadow footprints and path lines)
    shadowCenterCircles.forEach(c => dynamicMap.removeLayer(c));
    shadowCenterCircles = [];
    penumbraCircles.forEach(c => dynamicMap.removeLayer(c));
    penumbraCircles = [];
    
    dynamicMapOverlayLayers.forEach(layer => dynamicMap.removeLayer(layer));
    dynamicMapOverlayLayers = [];

    // Clear and draw dynamic day/night terminator on dynamicMap (wrapped across multiple world copies)
    if (dynamicTerminatorLayer) {
        dynamicMap.removeLayer(dynamicTerminatorLayer);
        dynamicTerminatorLayer = null;
    }

    let drawTerminator = true;
    if (currentEvent.type === 'lunar') {
        const local = AstronomyHelper.calculateLocalLunarEclipse(date, 0, 0);
        if (local && local.obscuration > 0.0001) {
            drawTerminator = false;
        }
    }

    if (drawTerminator) {
        const dynamicTerminatorCoords = AstronomyHelper.calculateDayNightTerminator(date);
        if (dynamicTerminatorCoords) {
            const polygons = [];
            [-720, -360, 0, 360, 720].forEach(offset => {
                const shiftedCoords = dynamicTerminatorCoords.map(coord => [coord[0], coord[1] + offset]);
                polygons.push(L.polygon(shiftedCoords, {
                    fillColor: '#000000',
                    fillOpacity: 0.28,
                    color: 'none',
                    stroke: false,
                    interactive: false,
                    pane: 'terminatorPane'
                }));
            });
            dynamicTerminatorLayer = L.layerGroup(polygons).addTo(dynamicMap);
        }
    }

    // Cache and draw the static centerline track, obscuration contours, and static terminator ONLY on selection change
    const eventId = currentEvent.name + "_" + currentEvent.peakJD;
    if (eventId !== lastEventId) {
        if (totalityPathLine) map.removeLayer(totalityPathLine);
        mapOverlayLayers.forEach(layer => map.removeLayer(layer));
        mapOverlayLayers = [];

        // Clear static and dynamic penumbra contour layers
        if (map._penumbraLayer) {
            map.removeLayer(map._penumbraLayer);
            map._penumbraLayer = null;
        }
        if (dynamicMap._instantaneousPenumbraLayer) {
            dynamicMap.removeLayer(dynamicMap._instantaneousPenumbraLayer);
            dynamicMap._instantaneousPenumbraLayer = null;
        }

        // Clear static terminator on map
        if (staticTerminatorLayer) {
            map.removeLayer(staticTerminatorLayer);
            staticTerminatorLayer = null;
        }

        // Draw static track lines or visibility regions on map
        if (currentEvent.type === 'solar') {
            // Calculate and cache full centerline track
            currentEventTrack = AstronomyHelper.calculateSolarEclipsePath(dateFromJD(currentEvent.peakJD));
            const staticDayTrack = currentEventTrack;

            if (staticDayTrack.length > 1) {
                const segments = segmentTrack(staticDayTrack);
                for (let offset = -720; offset <= 720; offset += 360) {
                    segments.forEach(seg => {
                        if (seg.length === 0) return;
                        
                        const firstLon = seg[0].lon;
                        const wrap = Math.floor((firstLon + 180) / 360);
                        const normOffset = wrap * 360;
                        
                        const normSeg = seg.map(pt => {
                            const nPt = { ...pt };
                            nPt.lon -= normOffset;
                            if (nPt.northLon !== undefined) {
                                nPt.northLon -= normOffset;
                                nPt.southLon -= normOffset;
                            }
                            return nPt;
                        });
                        
                        // Draw centerline polyline on static map
                        const centerlinePoints = normSeg.map(pt => [pt.lat, pt.lon + offset]);
                        const line = L.polyline(centerlinePoints, {
                            color: '#bf360c', // Dark orange-red
                            weight: 2,
                            opacity: 0.8,
                            dashArray: '6, 6',
                            pane: 'pathPane',
                            interactive: false,
                            smoothFactor: 0
                        }).addTo(map);
                        mapOverlayLayers.push(line);
                        
                        // Draw totality/annularity path ribbon on static map
                        const central = normSeg.filter(pt => pt.type === 'Total' || pt.type === 'Annular');
                        if (central.length > 1) {
                            const northSide = central.map(pt => [pt.northLat, pt.northLon + offset]);
                            const southSide = central.map(pt => [pt.southLat, pt.southLon + offset]).reverse();
                            const polygonPoints = northSide.concat(southSide);
                            
                            const polygon = L.polygon(polygonPoints, {
                                color: 'none',
                                fillColor: '#4a1204',
                                fillOpacity: 0.22,
                                stroke: false,
                                pane: 'pathPane',
                                interactive: false,
                                smoothFactor: 0
                            }).addTo(map);
                            mapOverlayLayers.push(polygon);

                            const northLine = L.polyline(northSide, {
                                color: '#d84315',
                                weight: 1.5,
                                opacity: 0.8,
                                pane: 'pathPane',
                                interactive: false,
                                smoothFactor: 0
                            }).addTo(map);
                            mapOverlayLayers.push(northLine);
                            
                            const southSideForward = central.map(pt => [pt.southLat, pt.southLon + offset]);
                            const southLine = L.polyline(southSideForward, {
                                color: '#d84315',
                                weight: 1.5,
                                opacity: 0.8,
                                pane: 'pathPane',
                                interactive: false,
                                smoothFactor: 0
                            }).addTo(map);
                            mapOverlayLayers.push(southLine);
                        }
                    });
                }
            }
            
            // Call the standalone penumbra isoline plugin to render the separate GeoJSON layer on static map
            appendPenumbraLayer(map, dateFromJD(currentEvent.peakJD));
        } else if (currentEvent.type === 'lunar') {
            const contacts = getLunarContacts(currentEvent.peakJD);
            if (contacts) {
                const polygons = [];
                const globeFeatures = [];

                // 1. Light/medium purple penumbral static visibility (sampled at p1, peak, p4)
                [contacts.p1, contacts.peak, contacts.p4].forEach(d => {
                    if (d) {
                        const coords = AstronomyHelper.calculateDayNightTerminator(d);
                        if (coords) {
                            // Check if this moment represents Penumbral Totality or Partial Penumbra
                            const local = AstronomyHelper.calculateLocalLunarEclipse(d, 0, 0);
                            const isPenTot = local && local.penumbralMagnitude >= 1.0 && local.umbralMagnitude <= 0.0;
                            const color = isPenTot ? '#7b1fa2' : '#ba68c8';
                            const opacityMultiplier = isPenTot ? 1.4 : 1.0;
                            const propName = isPenTot ? 'isLunarPenumbralTotal' : 'isLunarPenumbral';

                            // Leaflet Polygons
                            [-360, 0, 360].forEach(offset => {
                                const shifted = coords.map(c => [c[0], c[1] + offset]);
                                polygons.push(L.polygon(shifted, {
                                    fillColor: color, // Partial Penumbra vs. Penumbral Totality
                                    fillOpacity: 0.05 * opacityMultiplier,
                                    color: color,
                                    weight: 1,
                                    opacity: 0.15 * opacityMultiplier,
                                    interactive: false,
                                    pane: 'pathPane'
                                }));
                            });

                            // 3D Globe Feature
                            globeFeatures.push({
                                type: "Feature",
                                properties: { [propName]: true },
                                geometry: {
                                    type: "Polygon",
                                    coordinates: [coords.map(pt => [pt[1], pt[0]])]
                                }
                            });
                        }
                    }
                });

                // 2. Dark purple partial umbral static visibility
                const partialUmbralDates = [];
                if (contacts.u2) {
                    // Total eclipse: partial phase occurs at u1 and u4
                    if (contacts.u1) partialUmbralDates.push(contacts.u1, contacts.u4);
                } else {
                    // Partial eclipse: partial phase occurs at u1, peak, u4
                    if (contacts.u1) partialUmbralDates.push(contacts.u1, contacts.peak, contacts.u4);
                }

                partialUmbralDates.forEach(d => {
                    if (d) {
                        const coords = AstronomyHelper.calculateDayNightTerminator(d);
                        if (coords) {
                            // Leaflet Polygons
                            [-360, 0, 360].forEach(offset => {
                                const shifted = coords.map(c => [c[0], c[1] + offset]);
                                polygons.push(L.polygon(shifted, {
                                    fillColor: '#4a148c', // Dark purple
                                    fillOpacity: 0.08,
                                    color: '#4a148c',
                                    weight: 1,
                                    opacity: 0.22,
                                    interactive: false,
                                    pane: 'pathPane'
                                }));
                            });

                            // 3D Globe Feature
                            globeFeatures.push({
                                type: "Feature",
                                properties: { isLunarUmbral: true },
                                geometry: {
                                    type: "Polygon",
                                    coordinates: [coords.map(pt => [pt[1], pt[0]])]
                                }
                            });
                        }
                    }
                });

                // 3. Dark red total umbral static visibility (totality zone)
                const totalDates = [];
                if (contacts.u2) {
                    // Total phase occurs at u2, peak, u3
                    totalDates.push(contacts.u2, contacts.peak, contacts.u3);
                }

                totalDates.forEach(d => {
                    if (d) {
                        const coords = AstronomyHelper.calculateDayNightTerminator(d);
                        if (coords) {
                            // Leaflet Polygons
                            [-360, 0, 360].forEach(offset => {
                                const shifted = coords.map(c => [c[0], c[1] + offset]);
                                polygons.push(L.polygon(shifted, {
                                    fillColor: '#8a1a15', // Dark red
                                    fillOpacity: 0.10,
                                    color: '#8a1a15',
                                    weight: 1,
                                    opacity: 0.28,
                                    interactive: false,
                                    pane: 'pathPane'
                                }));
                            });

                            // 3D Globe Feature
                            globeFeatures.push({
                                type: "Feature",
                                properties: { isLunarTotal: true },
                                geometry: {
                                    type: "Polygon",
                                    coordinates: [coords.map(pt => [pt[1], pt[0]])]
                                }
                            });
                        }
                    }
                });

                if (polygons.length > 0) {
                    staticTerminatorLayer = L.layerGroup(polygons).addTo(map);
                }
                scene3D.staticContours = globeFeatures;
            }
        } else if (currentEvent.type === 'transit') {
            const peakDate = dateFromJD(currentEvent.peakJD);
            const startSearch = new Date(peakDate.getTime() - 12 * 60 * 60 * 1000);
            const t = Astronomy.MakeTime(startSearch);
            const body = currentEvent.typeName.includes('Venus') ? Astronomy.Body.Venus : Astronomy.Body.Mercury;
            let transit = null;
            try {
                transit = Astronomy.SearchTransit(body, t);
            } catch (e) {
                console.error(e);
            }

            if (transit) {
                const polygons = [];
                const globeFeatures = [];

                const tStart = new Date(transit.start.date);
                const tPeak = new Date(transit.peak.date);
                const tFinish = new Date(transit.finish.date);

                // Draw ingress/egress sunset/sunrise limits (light yellow)
                [tStart, tFinish].forEach(d => {
                    const coords = AstronomyHelper.calculateDaylightTerminator(d);
                    if (coords) {
                        [-360, 0, 360].forEach(offset => {
                            const shifted = coords.map(c => [c[0], c[1] + offset]);
                            polygons.push(L.polygon(shifted, {
                                fillColor: '#ffe082',
                                fillOpacity: 0.04,
                                color: '#ffe082',
                                weight: 1,
                                opacity: 0.15,
                                interactive: false,
                                pane: 'pathPane'
                            }));
                        });

                        globeFeatures.push({
                            type: "Feature",
                            properties: { isTransitLimits: true },
                            geometry: {
                                type: "Polygon",
                                coordinates: [coords.map(pt => [pt[1], pt[0]])]
                            }
                        });
                    }
                });

                // Draw peak visibility limits (warm orange)
                const coords = AstronomyHelper.calculateDaylightTerminator(tPeak);
                if (coords) {
                    [-360, 0, 360].forEach(offset => {
                        const shifted = coords.map(c => [c[0], c[1] + offset]);
                        polygons.push(L.polygon(shifted, {
                            fillColor: '#ffa726',
                            fillOpacity: 0.07,
                            color: '#ffa726',
                            weight: 1,
                            opacity: 0.22,
                            interactive: false,
                            pane: 'pathPane'
                        }));
                    });

                    globeFeatures.push({
                        type: "Feature",
                        properties: { isTransitPeak: true },
                        geometry: {
                            type: "Polygon",
                            coordinates: [coords.map(pt => [pt[1], pt[0]])]
                        }
                    });
                }

                if (polygons.length > 0) {
                    staticTerminatorLayer = L.layerGroup(polygons).addTo(map);
                }
                scene3D.staticContours = globeFeatures;
            }
        }

        lastEventId = eventId;
    }

    // Draw dynamic track lines on dynamicMap (filtered to daytime at current active date)
    if (currentEvent.type === 'solar' && currentEventTrack && currentEventTrack.length > 0) {
        const dynamicDayTrack = currentEventTrack.filter(pt => {
            return AstronomyHelper.isDaytime(pt.lat, pt.lon, date);
        });

        if (dynamicDayTrack.length > 1) {
            const segments = segmentTrack(dynamicDayTrack);
            for (let offset = -720; offset <= 720; offset += 360) {
                segments.forEach(seg => {
                    if (seg.length === 0) return;
                    
                    const firstLon = seg[0].lon;
                    const wrap = Math.floor((firstLon + 180) / 360);
                    const normOffset = wrap * 360;
                    
                    const normSeg = seg.map(pt => {
                        const nPt = { ...pt };
                        nPt.lon -= normOffset;
                        if (nPt.northLon !== undefined) {
                            nPt.northLon -= normOffset;
                            nPt.southLon -= normOffset;
                        }
                        return nPt;
                    });
                    
                    // Draw centerline polyline on dynamic map
                    const centerlinePoints = normSeg.map(pt => [pt.lat, pt.lon + offset]);
                    const lineDynamic = L.polyline(centerlinePoints, {
                        color: '#bf360c', // Dark orange-red
                        weight: 2,
                        opacity: 0.8,
                        dashArray: '6, 6',
                        pane: 'pathPane',
                        interactive: false,
                        smoothFactor: 0
                    }).addTo(dynamicMap);
                    dynamicMapOverlayLayers.push(lineDynamic);
                    
                    // Draw totality/annularity path ribbon on dynamic map
                    const central = normSeg.filter(pt => pt.type === 'Total' || pt.type === 'Annular');
                    if (central.length > 1) {
                        const northSide = central.map(pt => [pt.northLat, pt.northLon + offset]);
                        const southSide = central.map(pt => [pt.southLat, pt.southLon + offset]).reverse();
                        const polygonPoints = northSide.concat(southSide);
                        
                        const polygonDynamic = L.polygon(polygonPoints, {
                            color: 'none',
                            fillColor: '#4a1204',
                            fillOpacity: 0.22,
                            stroke: false,
                            pane: 'pathPane',
                            interactive: false,
                            smoothFactor: 0
                        }).addTo(dynamicMap);
                        dynamicMapOverlayLayers.push(polygonDynamic);

                        const northLineDynamic = L.polyline(northSide, {
                            color: '#d84315',
                            weight: 1.5,
                            opacity: 0.8,
                            pane: 'pathPane',
                            interactive: false,
                            smoothFactor: 0
                        }).addTo(dynamicMap);
                        dynamicMapOverlayLayers.push(northLineDynamic);

                        const southSideForward = central.map(pt => [pt.southLat, pt.southLon + offset]);
                        const southLineDynamic = L.polyline(southSideForward, {
                            color: '#d84315',
                            weight: 1.5,
                            opacity: 0.8,
                            pane: 'pathPane',
                            interactive: false,
                            smoothFactor: 0
                        }).addTo(dynamicMap);
                        dynamicMapOverlayLayers.push(southLineDynamic);
                    }
                });
            }
        }
    }

    if (currentEvent.type === 'solar') {
        const footprints = AstronomyHelper.calculateProjectedShadowFootprints(date);
        
        if (footprints) {
            // Draw umbral core if present
            if (footprints.umbra && footprints.umbra.coordinates.length > 2) {
                const type = footprints.umbra.type;
                for (let offset = -720; offset <= 720; offset += 360) {
                    const offsetCoords = footprints.umbra.coordinates.map(pt => [pt[0], pt[1] + offset]);
                    const poly = L.polygon(offsetCoords, {
                        color: type === 'Total' ? '#ff3b30' : '#ffcc00',
                        weight: 1.5,
                        fillColor: '#000000',
                        fillOpacity: 0.45,
                        pane: 'umbraPane',
                        interactive: false,
                        smoothFactor: 0
                    }).addTo(dynamicMap);
                    shadowCenterCircles.push(poly);
                }
            }
            // Draw penumbral contours (from largest 0.01 to smallest 0.75)
            const levels = [0.01, 0.25, 0.50, 0.75];
            const styleMap = {
                0.01: { fillColor: '#ffe082', fillOpacity: 0.14, stroke: true, color: '#ffe082', weight: 1.0, opacity: 0.22, interactive: false, pane: 'penumbraPane', smoothFactor: 0 },
                0.25: { fillColor: '#ffa726', fillOpacity: 0.14, stroke: true, color: '#ffa726', weight: 1.0, opacity: 0.27, interactive: false, pane: 'penumbraPane', smoothFactor: 0 },
                0.50: { fillColor: '#fb8c00', fillOpacity: 0.14, stroke: true, color: '#fb8c00', weight: 1.0, opacity: 0.32, interactive: false, pane: 'penumbraPane', smoothFactor: 0 },
                0.75: { fillColor: '#d84315', fillOpacity: 0.14, stroke: true, color: '#d84315', weight: 1.0, opacity: 0.37, interactive: false, pane: 'penumbraPane', smoothFactor: 0 }
            };

            levels.forEach(l => {
                const coords = footprints.penumbra[l];
                if (coords && coords.length > 2) {
                    for (let offset = -720; offset <= 720; offset += 360) {
                        const offsetCoords = coords.map(pt => [pt[0], pt[1] + offset]);
                        const poly = L.polygon(offsetCoords, styleMap[l]).addTo(dynamicMap);
                        penumbraCircles.push(poly);
                    }
                }
            });
        }

        const shadow = AstronomyHelper.calculateShadowCenter(date);

        // Update / create pulsing shadow center marker
        if (shadow) {
            const pulseHtml = `
                <div style="position:relative; width:22px; height:22px;">
                    <div class="shadow-center-pulse" style="position:absolute;top:0;left:0;width:22px;height:22px;border-radius:50%;background:rgba(255,59,48,0.55);border:2px solid #ff3b30;"></div>
                    <div style="position:absolute;top:5px;left:5px;width:12px;height:12px;border-radius:50%;background:#ff3b30;box-shadow:0 0 8px #ff3b30;"></div>
                </div>`;
            const pulseIcon = L.divIcon({
                className: '',
                html: pulseHtml,
                iconSize: [22, 22],
                iconAnchor: [11, 11]
            });

            if (!shadowCenterMarker) {
                shadowCenterMarker = L.marker([shadow.lat, shadow.lon], {
                    icon: pulseIcon,
                    interactive: false,
                    zIndexOffset: 1500
                }).addTo(dynamicMap);
            } else {
                shadowCenterMarker.setLatLng([shadow.lat, shadow.lon]);
                shadowCenterMarker.setIcon(pulseIcon);
                if (!dynamicMap.hasLayer(shadowCenterMarker)) {
                    shadowCenterMarker.addTo(dynamicMap);
                }
            }
        } else {
            // No shadow center (eclipse not visible on Earth face)
            if (shadowCenterMarker && dynamicMap.hasLayer(shadowCenterMarker)) {
                dynamicMap.removeLayer(shadowCenterMarker);
            }
        }

        // Update local obscuration statistics for current time & observer
        const local = AstronomyHelper.calculateLocalSolarEclipse(date, observerLocation.lat, observerLocation.lon);
        if (local) {
            document.getElementById('val-obs-obscuration').innerText = (local.obscuration * 100).toFixed(2) + "%";
            document.getElementById('val-shadow-speed').innerText = shadow ? (3400 * Math.cos(shadow.lat * Math.PI / 180)).toFixed(0) + " km/h" : "-- km/h";
        }
    } else if (currentEvent.type === 'lunar') {
        // Draw dynamic propagating shadow
        const local = AstronomyHelper.calculateLocalLunarEclipse(date, 0, 0);
        if (local && local.obscuration > 0) {
            const isTotal = local.type === 'Total' || local.umbralMagnitude >= 1.0;
            const isPartial = local.type === 'Partial' || (local.umbralMagnitude > 0.0 && local.umbralMagnitude < 1.0);
            const isPenumbralTotal = local.penumbralMagnitude >= 1.0 && local.umbralMagnitude <= 0.0;
            const isPenumbralPartial = local.penumbralMagnitude > 0.0 && local.penumbralMagnitude < 1.0 && local.umbralMagnitude <= 0.0;
            
            if (isTotal || isPartial || isPenumbralTotal || isPenumbralPartial) {
                const coords = AstronomyHelper.calculateDayNightTerminator(date);
                if (coords) {
                    let color = '#ba68c8'; // Default Partial Penumbra
                    let fillOp = 0.20;
                    let lineOp = 0.32;

                    if (isTotal) {
                        color = '#8a1a15'; // Totality with Umbra
                        fillOp = 0.40;
                        lineOp = 0.55;
                    } else if (isPartial) {
                        color = '#4a148c'; // Partial with Umbra
                        fillOp = 0.35;
                        lineOp = 0.50;
                    } else if (isPenumbralTotal) {
                        color = '#7b1fa2'; // Penumbral Totality
                        fillOp = 0.28;
                        lineOp = 0.44;
                    }

                    [-360, 0, 360].forEach(offset => {
                        const shifted = coords.map(c => [c[0], c[1] + offset]);
                        const poly = L.polygon(shifted, {
                            fillColor: color,
                            fillOpacity: fillOp,
                            color: color,
                            weight: 1.5,
                            opacity: lineOp,
                            interactive: false,
                            pane: 'umbraPane'
                        }).addTo(dynamicMap);
                        dynamicMapOverlayLayers.push(poly);
                    });
                }
            }
        }

        // Update local obscuration statistics for current time & observer
        const localObs = AstronomyHelper.calculateLocalLunarEclipse(date, observerLocation.lat, observerLocation.lon);
        if (localObs) {
            document.getElementById('val-obs-obscuration').innerText = (localObs.obscuration * 100).toFixed(2) + "%";
            document.getElementById('val-shadow-speed').innerText = "-- km/h";
        }
    } else if (currentEvent.type === 'transit') {
        // Non-solar/lunar: hide shadow center marker
        if (shadowCenterMarker && dynamicMap.hasLayer(shadowCenterMarker)) {
            dynamicMap.removeLayer(shadowCenterMarker);
        }

        // Draw dynamic propagating transit visibility (daytime hemisphere during transit)
        const peakDate = dateFromJD(currentEvent.peakJD);
        const startSearch = new Date(peakDate.getTime() - 12 * 60 * 60 * 1000);
        const t = Astronomy.MakeTime(startSearch);
        const body = currentEvent.typeName.includes('Venus') ? Astronomy.Body.Venus : Astronomy.Body.Mercury;
        let transit = null;
        try {
            transit = Astronomy.SearchTransit(body, t);
        } catch (e) {}

        if (transit) {
            const tStart = new Date(transit.start.date);
            const tFinish = new Date(transit.finish.date);
            if (date >= tStart && date <= tFinish) {
                const coords = AstronomyHelper.calculateDaylightTerminator(date);
                if (coords) {
                    const color = '#ffa726'; // Warm gold/orange for transit visibility
                    [-360, 0, 360].forEach(offset => {
                        const shifted = coords.map(c => [c[0], c[1] + offset]);
                        const poly = L.polygon(shifted, {
                            fillColor: color,
                            fillOpacity: 0.20,
                            color: color,
                            weight: 1.5,
                            opacity: 0.35,
                            interactive: false,
                            pane: 'umbraPane'
                        }).addTo(dynamicMap);
                        dynamicMapOverlayLayers.push(poly);
                    });
                }
            }
        }

        // Update local transit circumstances statistics for current time & observer
        const localObs = AstronomyHelper.calculateTransit(date, body, observerLocation.lat, observerLocation.lon);
        if (localObs) {
            let obscPct = 0;
            if (localObs.isTransit) {
                obscPct = (localObs.planetRadius * localObs.planetRadius) / (localObs.sunRadius * localObs.sunRadius) * 100;
            }
            document.getElementById('val-obs-obscuration').innerText = obscPct.toFixed(4) + "%";
            document.getElementById('val-shadow-speed').innerText = "-- km/h";
        }
    } else {
        // Fallback: hide shadow center marker
        if (shadowCenterMarker && dynamicMap.hasLayer(shadowCenterMarker)) {
            dynamicMap.removeLayer(shadowCenterMarker);
        }
        document.getElementById('val-obs-obscuration').innerText = "--";
        document.getElementById('val-shadow-speed').innerText = "--";
    }
}




// Upgraded Local Sky Simulator View drawing
function updateLocalSimulator(date) {
    const canvas = document.getElementById('simulator-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    // Clear Canvas
    ctx.clearRect(0, 0, W, H);

    if (currentEvent.type === 'solar') {
        const local = AstronomyHelper.calculateLocalSolarEclipse(date, observerLocation.lat, observerLocation.lon);
        if (!local) return;

        // Draw local altitude telemetry values
        document.getElementById('val-sun-alt').innerText = local.sunAlt.toFixed(2) + "°";
        document.getElementById('val-sun-az').innerText = local.sunAz.toFixed(2) + "°";
        document.getElementById('val-obscuration').innerText = (local.obscuration * 100).toFixed(2) + "%";
        document.getElementById('val-magnitude').innerText = local.magnitude.toFixed(3);

        const obsc = local.obscuration;
        const sunAlt = local.sunAlt;
        const sunRadiusDeg = local.sunRadius;
        const scale = 110 / sunRadiusDeg; // Map Sun angular size to radius of 110px

        // Smooth twilight curve using an S-curve profile
        let twilight = 1.0;
        if (sunAlt < -18) {
            twilight = 0.0;
        } else if (sunAlt < 8) {
            const x = (sunAlt + 18) / 26; // 0 to 1
            twilight = Math.sin(x * Math.PI / 2);
        }
        const eclipseFactor = 1.0 - Math.pow(obsc, 3);
        const lightFactor = twilight * eclipseFactor;

        if (simViewMode === 'closeup') {
            const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
            const rZenith = Math.floor(1 + 26 * lightFactor);
            const gZenith = Math.floor(3 + 88 * lightFactor);
            const bZenith = Math.floor(10 + 189 * lightFactor);

            skyGrad.addColorStop(0, `rgb(${rZenith}, ${gZenith}, ${bZenith})`);

            // Sunset horizon glow: crimson/gold sunset gradient near the horizon
            if (sunAlt > -10 && sunAlt < 12 && lightFactor > 0.05) {
                const distToHorizon = Math.abs(sunAlt);
                const glowStrength = Math.max(0, 1 - distToHorizon / 12) * (1 - obsc);
                const rGlow = Math.floor(235 * glowStrength * lightFactor);
                const gGlow = Math.floor(115 * glowStrength * lightFactor);
                const bGlow = Math.floor(30 * glowStrength * lightFactor);
                skyGrad.addColorStop(0.75, `rgb(${rZenith + rGlow}, ${gZenith + gGlow}, ${bZenith + bGlow})`);
            } else {
                skyGrad.addColorStop(0.75, `rgb(${Math.floor(rZenith * 0.85)}, ${Math.floor(gZenith * 0.9)}, ${Math.floor(bZenith * 0.95)})`);
            }

            skyGrad.addColorStop(1, '#000000');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, H);

            // Draw stars if sky is dark
            if (lightFactor < 0.2) {
                ctx.fillStyle = 'rgba(255,255,255,' + ((0.2 - lightFactor) / 0.2) + ')';
                simStars.forEach(star => {
                    const sx = cx + star.r * Math.cos(star.angle);
                    const sy = cy + star.r * Math.sin(star.angle);
                    ctx.fillRect(sx, sy, star.size, star.size);
                });
            }

            // Draw Solar Corona (totality halo)
            if (obsc >= 0.98) {
                const coronaGlow = ctx.createRadialGradient(cx, cy, 100, cx, cy, 180);
                coronaGlow.addColorStop(0, 'rgba(255,255,255,0.85)');
                coronaGlow.addColorStop(0.2, 'rgba(230,240,255,0.5)');
                coronaGlow.addColorStop(1, 'rgba(255,255,255,0)');
                
                ctx.fillStyle = coronaGlow;
                ctx.beginPath();
                ctx.arc(cx, cy, 180, 0, 2*Math.PI);
                ctx.fill();
            }

            // Draw Sun (Glowing circle)
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffe600';
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, cy, 110, 0, 2*Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw Solar Flares (prominences) during totality
            if (obsc >= 0.98) {
                const flareAngles = [0.5, 1.8, 3.4, 4.7, 5.8];
                flareAngles.forEach(a => {
                    const cosA = Math.cos(a);
                    const sinA = Math.sin(a);
                    
                    const xStart = cx + 110 * cosA;
                    const yStart = cy + 110 * sinA;
                    
                    const peakDist = 110 + 12 + Math.sin(Date.now() / 150 + a * 10) * 4;
                    const xPeak = cx + peakDist * Math.cos(a + 0.04);
                    const yPeak = cy + peakDist * Math.sin(a + 0.04);
                    
                    const xEnd = cx + 110 * Math.cos(a + 0.08);
                    const yEnd = cy + 110 * Math.sin(a + 0.08);
                    
                    ctx.beginPath();
                    ctx.moveTo(xStart, yStart);
                    ctx.quadraticCurveTo(xPeak, yPeak, xEnd, yEnd);
                    ctx.strokeStyle = '#ff3c00';
                    ctx.lineWidth = 4;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(xStart, yStart);
                    ctx.quadraticCurveTo(xPeak, yPeak, xEnd, yEnd);
                    ctx.strokeStyle = '#ffcc00';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                });
            }

            // Draw Moon (Dark circle overlay)
            const dx = ((local.moonEq.ra - local.sunEq.ra) * 15) * Math.cos(local.sunEq.dec * Math.PI / 180) * scale;
            const dy = -(local.moonEq.dec - local.sunEq.dec) * scale;

            ctx.fillStyle = '#060814';
            ctx.beginPath();
            ctx.arc(cx + dx, cy + dy, local.moonRadius * scale, 0, 2*Math.PI);
            ctx.fill();

            // Draw diamond ring effect (C2/C3 flash)
            if (obsc > 0.98 && obsc < 1.0) {
                const angle = Math.atan2(dy, dx);
                const diamondX = cx + 110 * Math.cos(angle);
                const diamondY = cy + 110 * Math.sin(angle);
                
                ctx.shadowBlur = 30;
                ctx.shadowColor = '#ffffff';
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(diamondX, diamondY, 12, 0, 2*Math.PI);
                ctx.fill();
                
                ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(diamondX - 30, diamondY);
                ctx.lineTo(diamondX + 30, diamondY);
                ctx.moveTo(diamondX, diamondY - 30);
                ctx.lineTo(diamondX, diamondY + 30);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // Ground horizon clipping
            const yHorizon = cy + sunAlt * scale;
            if (yHorizon < H) {
                const groundGrad = ctx.createLinearGradient(0, Math.max(0, yHorizon), 0, H);
                groundGrad.addColorStop(0, '#0a1424');
                groundGrad.addColorStop(1, '#03060c');
                ctx.fillStyle = groundGrad;
                ctx.fillRect(0, Math.max(0, yHorizon), W, H - Math.max(0, yHorizon));

                ctx.strokeStyle = '#00f6ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, yHorizon);
                ctx.lineTo(W, yHorizon);
                ctx.stroke();
            }

        } else if (simViewMode === 'dome') {
            const R = 170; // dome radius
            ctx.fillStyle = '#030712';
            ctx.fillRect(0, 0, W, H);

            // Draw dome sky circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, 2*Math.PI);
            ctx.clip();

            // Sky dome gradient fill
            const skyGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
            const r = Math.floor(1 + 26 * lightFactor);
            const g = Math.floor(3 + 88 * lightFactor);
            const b = Math.floor(10 + 189 * lightFactor);
            skyGrad.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
            skyGrad.addColorStop(1, `rgb(${Math.floor(r*0.7)}, ${Math.floor(g*0.7)}, ${Math.floor(b*0.7)})`);
            ctx.fillStyle = skyGrad;
            ctx.fill();

            // Stars inside dome if dark
            if (lightFactor < 0.2) {
                ctx.fillStyle = 'rgba(255,255,255,' + ((0.2 - lightFactor) / 0.2) + ')';
                simStars.forEach(star => {
                    if (star.r < R) {
                        const sx = cx + star.r * Math.cos(star.angle);
                        const sy = cy + star.r * Math.sin(star.angle);
                        ctx.fillRect(sx, sy, star.size, star.size);
                    }
                });
            }

            // Dome grid lines
            if (showSimGrid) {
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 1;
                ctx.font = '9px Outfit, sans-serif';

                ctx.beginPath();
                ctx.arc(cx, cy, R * (60/90), 0, 2*Math.PI); // 30 deg alt
                ctx.arc(cx, cy, R * (30/90), 0, 2*Math.PI); // 60 deg alt
                ctx.stroke();

                ctx.fillText("30°", cx + 3, cy - R * (60/90) + 9);
                ctx.fillText("60°", cx + 3, cy - R * (30/90) + 9);

                ctx.beginPath();
                ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
                ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
                ctx.stroke();

                ctx.fillText("Zenith", cx + 5, cy + 12);
            }

            // Project Sun using azimuthal coordinates
            const rSun = R * (90 - local.sunAlt) / 90;
            const angleSun = (local.sunAz - 90) * Math.PI / 180;
            const xSun = cx + rSun * Math.cos(angleSun);
            const ySun = cy + rSun * Math.sin(angleSun);

            // Real Moon projection on the dome
            const rMoonReal = R * (90 - local.moonAlt) / 90;
            const angleMoon = (local.moonAz - 90) * Math.PI / 180;
            const xMoonReal = cx + rMoonReal * Math.cos(angleMoon);
            const yMoonReal = cy + rMoonReal * Math.sin(angleMoon);

            const rSunBase = 8;
            const rMoonBase = rSunBase * (local.moonRadius / local.sunRadius);
            const R_vis = rSunBase + rMoonBase;
            const R_phys = local.sunRadius + local.moonRadius;

            const dx_real = xMoonReal - xSun;
            const dy_real = yMoonReal - ySun;
            const d_real = Math.sqrt(dx_real * dx_real + dy_real * dy_real);
            const canvasScale = 170 / 90;
            const visualScale = rSunBase / local.sunRadius;
            const mult = visualScale / canvasScale;
            const xMoon = xSun + dx_real * mult;
            const yMoon = ySun + dy_real * mult;

            const isTotal = currentEvent.typeName.toLowerCase().includes('total') || local.magnitude >= 1.0;

            // Draw Solar Corona (totality halo) in dome view only for Total solar eclipses
            if (isTotal && obsc >= 0.95) {
                const coronaGlow = ctx.createRadialGradient(xSun, ySun, rSunBase, xSun, ySun, rSunBase * 1.8);
                coronaGlow.addColorStop(0, 'rgba(255,255,255,0.85)');
                coronaGlow.addColorStop(0.3, 'rgba(230,240,255,0.5)');
                coronaGlow.addColorStop(1, 'rgba(255,255,255,0)');
                
                ctx.fillStyle = coronaGlow;
                ctx.beginPath();
                ctx.arc(xSun, ySun, rSunBase * 1.8, 0, 2*Math.PI);
                ctx.fill();
            }

            // Draw trajectories
            drawTrajectories(ctx, cx, cy);

            // Draw Sun inside sky dome if above horizon
            if (local.sunAlt >= 0) {
                ctx.shadowBlur = 6;
                ctx.shadowColor = '#ffe600';
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(xSun, ySun, rSunBase, 0, 2*Math.PI);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Draw Moon inside sky dome if above horizon and visually overlapping the Sun (realistic new moon)
            if (local.moonAlt >= 0) {
                const d_vis = Math.sqrt((xMoon - xSun)*(xMoon - xSun) + (yMoon - ySun)*(yMoon - ySun));
                if (d_vis < rSunBase + rMoonBase) {
                    ctx.fillStyle = '#0a0d1d';
                    ctx.beginPath();
                    ctx.arc(xMoon, yMoon, rMoonBase, 0, 2*Math.PI);
                    ctx.fill();
                }
            }

            ctx.restore(); // end dome clip

            // Horizon ring boundary
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, 2*Math.PI);
            ctx.stroke();

            // Draw Cardinal text labels
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.font = 'bold 12px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("N", cx, cy - R - 8);
            ctx.fillText("S", cx, cy + R + 18);
            ctx.fillText("E", cx + R + 12, cy + 4);
            ctx.fillText("W", cx - R - 12, cy + 4);
        }
    } else if (currentEvent.type === 'lunar') {
        const local = AstronomyHelper.calculateLocalLunarEclipse(date, observerLocation.lat, observerLocation.lon);
        if (!local) return;

        // Draw local altitude telemetry values
        document.getElementById('val-sun-alt').innerText = "--";
        document.getElementById('val-sun-az').innerText = "--";
        document.getElementById('val-obscuration').innerText = (local.obscuration * 100).toFixed(2) + "%";
        document.getElementById('val-magnitude').innerText = local.type;

        const moonAlt = local.moonAlt;
        const moonAz = local.moonAz;
        const scale = 110 / local.moonRadius; // scale Moon radius to ~50px

        // Calculate light factor based on Sun altitude for twilight during lunar events
        const sunAlt = local.sunAlt;
        let twilight = 1.0;
        if (sunAlt < -18) {
            twilight = 0.0;
        } else if (sunAlt < 8) {
            const x = (sunAlt + 18) / 26; // 0 to 1
            twilight = Math.sin(x * Math.PI / 2);
        }
        const lightFactor = twilight;

        if (simViewMode === 'closeup') {
            const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
            const rZenith = Math.floor(1 + 26 * lightFactor);
            const gZenith = Math.floor(3 + 88 * lightFactor);
            const bZenith = Math.floor(10 + 189 * lightFactor);

            skyGrad.addColorStop(0, `rgb(${rZenith}, ${gZenith}, ${bZenith})`);

            // Sunset horizon glow
            if (sunAlt > -10 && sunAlt < 12 && lightFactor > 0.05) {
                const distToHorizon = Math.abs(sunAlt);
                const glowStrength = Math.max(0, 1 - distToHorizon / 12);
                const rGlow = Math.floor(235 * glowStrength * lightFactor);
                const gGlow = Math.floor(115 * glowStrength * lightFactor);
                const bGlow = Math.floor(30 * glowStrength * lightFactor);
                skyGrad.addColorStop(0.75, `rgb(${rZenith + rGlow}, ${gZenith + gGlow}, ${bZenith + bGlow})`);
            } else {
                skyGrad.addColorStop(0.75, `rgb(${Math.floor(rZenith * 0.85)}, ${Math.floor(gZenith * 0.9)}, ${Math.floor(bZenith * 0.95)})`);
            }

            skyGrad.addColorStop(1, '#000000');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, H);

            // Stars
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            simStars.forEach(star => {
                const sx = cx + star.r * Math.cos(star.angle);
                const sy = cy + star.r * Math.sin(star.angle);
                ctx.fillRect(sx, sy, star.size, star.size);
            });

            const dx = local.dx * scale;
            const dy = -local.dy * scale;

            const sxCenter = cx - dx;
            const syCenter = cy - dy;
            const rp = local.penumbraRadius * scale;
            const ru = local.umbraRadius * scale;

            // Draw Earth Penumbra Guide Ring centered on Earth shadow
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(sxCenter, syCenter, rp, 0, 2*Math.PI);
            ctx.stroke();

            // Draw Earth Umbra Guide Ring centered on Earth shadow
            ctx.strokeStyle = 'rgba(220, 53, 69, 0.35)';
            ctx.beginPath();
            ctx.arc(sxCenter, syCenter, ru, 0, 2*Math.PI);
            ctx.stroke();
            ctx.setLineDash([]); // Reset line dash

            // Draw labels for the shadow guide rings
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("Penumbra", sxCenter, syCenter - rp - 4);
            ctx.fillStyle = 'rgba(220, 53, 69, 0.5)';
            ctx.fillText("Umbra", sxCenter, syCenter - ru - 4);

            // Draw Moon FIXED in the center with advanced structures
            const mx = cx;
            const my = cy;
            const moonRadius = local.moonRadius * scale;

            ctx.save();
            ctx.beginPath();
            ctx.arc(mx, my, moonRadius, 0, 2*Math.PI);
            ctx.clip();

            // Moon surface base
            ctx.fillStyle = '#d5d8dc';
            ctx.fill();

            // 1. Draw detailed maria (dark basaltic plains) with differing shapes and opacities
            const maria = [
                { x: mx - moonRadius * 0.35, y: my - moonRadius * 0.25, r: moonRadius * 0.28, o: 0.35 }, // Oceanus Procellarum
                { x: mx - moonRadius * 0.15, y: my - moonRadius * 0.45, r: moonRadius * 0.22, o: 0.32 }, // Mare Imbrium
                { x: mx + moonRadius * 0.30, y: my - moonRadius * 0.20, r: moonRadius * 0.20, o: 0.30 }, // Mare Serenitatis
                { x: mx + moonRadius * 0.40, y: my + moonRadius * 0.05, r: moonRadius * 0.18, o: 0.33 }, // Mare Tranquillitatis
                { x: mx + moonRadius * 0.25, y: my + moonRadius * 0.30, r: moonRadius * 0.15, o: 0.28 }, // Mare Fecunditatis
                { x: mx - moonRadius * 0.40, y: my + moonRadius * 0.20, r: moonRadius * 0.25, o: 0.30 }, // Mare Humorum
                { x: mx - moonRadius * 0.05, y: my - moonRadius * 0.10, r: moonRadius * 0.15, o: 0.25 }  // Sinus Aestuum
            ];
            maria.forEach(m => {
                ctx.fillStyle = `rgba(95, 105, 115, ${m.o})`;
                ctx.beginPath();
                ctx.arc(m.x, m.y, m.r, 0, 2*Math.PI);
                ctx.fill();
            });

            // 2. Draw crater structures (rims and shadows for realistic 3D appearance)
            const craters = [
                { x: mx + moonRadius * 0.15, y: my + moonRadius * 0.65, r: moonRadius * 0.05 },  // Tycho
                { x: mx - moonRadius * 0.35, y: my + moonRadius * 0.05, r: moonRadius * 0.045 }, // Copernicus
                { x: mx - moonRadius * 0.55, y: my + moonRadius * 0.15, r: moonRadius * 0.03 },  // Kepler
                { x: mx - moonRadius * 0.10, y: my - moonRadius * 0.65, r: moonRadius * 0.04 },  // Plato
                { x: mx + moonRadius * 0.50, y: my - moonRadius * 0.35, r: moonRadius * 0.035 }  // Langrenus
            ];

            craters.forEach(c => {
                // Shadow side of crater (dark crescent)
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.r, Math.PI * 0.75, Math.PI * 1.75);
                ctx.stroke();

                // Highlight side of crater (light crescent)
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.r, Math.PI * 1.75, Math.PI * 0.75);
                ctx.stroke();

                // Dark floor
                ctx.fillStyle = 'rgba(110, 110, 115, 0.35)';
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.r - 1, 0, 2*Math.PI);
                ctx.fill();

                // Central peak (bright spot)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(c.x, c.y, moonRadius * 0.008, 0, 2*Math.PI);
                ctx.fill();
            });

            // 3. Draw Tycho ray systems
            const tycho = craters[0];
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
            ctx.lineWidth = 0.8;
            for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 12) {
                ctx.beginPath();
                ctx.moveTo(tycho.x, tycho.y);
                ctx.lineTo(tycho.x + moonRadius * 0.85 * Math.cos(angle), tycho.y + moonRadius * 0.85 * Math.sin(angle));
                ctx.stroke();
            }

            // 4. Draw Copernicus ray systems
            const copernicus = craters[1];
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 0.7;
            for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 8) {
                ctx.beginPath();
                ctx.moveTo(copernicus.x, copernicus.y);
                ctx.lineTo(copernicus.x + moonRadius * 0.35 * Math.cos(angle), copernicus.y + moonRadius * 0.35 * Math.sin(angle));
                ctx.stroke();
            }

            // 5. Apply subtle spherical shading overlay to make the flat circle look like a 3D sphere
            const sphereShade = ctx.createRadialGradient(
                mx - moonRadius * 0.2, my - moonRadius * 0.2, 0,
                mx, my, moonRadius
            );
            sphereShade.addColorStop(0, 'rgba(255, 255, 255, 0.15)'); // Highlight
            sphereShade.addColorStop(0.60, 'rgba(0, 0, 0, 0.0)');     // Neutral
            sphereShade.addColorStop(1, 'rgba(0, 0, 0, 0.35)');        // Spherical edge shadow
            ctx.fillStyle = sphereShade;
            ctx.beginPath();
            ctx.arc(mx, my, moonRadius, 0, 2*Math.PI);
            ctx.fill();

            ctx.restore();

            // Overlay Earth shadow on Moon using smooth radial gradient centered at sxCenter, syCenter
            const distToCenter = Math.sqrt(dx*dx + dy*dy);
            if (distToCenter < rp + moonRadius) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(mx, my, moonRadius, 0, 2*Math.PI);
                ctx.clip();

                const shadowGrad = ctx.createRadialGradient(sxCenter, syCenter, 0, sxCenter, syCenter, rp);
                
                const isTotal = local.type === 'Total';
                if (isTotal) {
                    // Totality: deep, physically blended copper-blood red coloration
                    shadowGrad.addColorStop(0, 'rgba(90, 10, 5, 0.95)');                 // Dark brick-red center
                    shadowGrad.addColorStop(ru * 0.65 / rp, 'rgba(110, 20, 12, 0.90)');  // Mid deep red
                    shadowGrad.addColorStop(ru / rp, 'rgba(130, 25, 15, 0.85)');         // Outer brick red
                    shadowGrad.addColorStop((ru + (rp - ru)*0.1) / rp, 'rgba(90, 40, 30, 0.75)'); // Copper transition
                    shadowGrad.addColorStop((ru + (rp - ru)*0.35) / rp, 'rgba(60, 50, 52, 0.60)'); // Dark brown-grey
                    shadowGrad.addColorStop((ru + (rp - ru)*0.7) / rp, 'rgba(80, 80, 85, 0.35)'); // Grey penumbra
                } else {
                    // Penumbral/Partial: grey penumbra and dark umbra
                    shadowGrad.addColorStop(0, 'rgba(12, 12, 14, 0.96)');
                    shadowGrad.addColorStop(ru * 0.75 / rp, 'rgba(20, 20, 22, 0.92)');
                    shadowGrad.addColorStop(ru / rp, 'rgba(30, 30, 32, 0.85)');
                    shadowGrad.addColorStop((ru + (rp - ru)*0.2) / rp, 'rgba(50, 50, 55, 0.65)');
                    shadowGrad.addColorStop((ru + (rp - ru)*0.6) / rp, 'rgba(90, 90, 95, 0.40)');
                }
                shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = shadowGrad;
                ctx.beginPath();
                ctx.arc(sxCenter, syCenter, rp, 0, 2*Math.PI);
                ctx.fill();

                ctx.restore();
            }

            // Ground horizon clipping (using antisolar shadow center)
            const yHorizon = cy + (-local.sunAlt) * scale;
            if (yHorizon < H) {
                const groundGrad = ctx.createLinearGradient(0, Math.max(0, yHorizon), 0, H);
                groundGrad.addColorStop(0, '#0a1424');
                groundGrad.addColorStop(1, '#03060c');
                ctx.fillStyle = groundGrad;
                ctx.fillRect(0, Math.max(0, yHorizon), W, H - Math.max(0, yHorizon));

                ctx.strokeStyle = '#00f6ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, yHorizon);
                ctx.lineTo(W, yHorizon);
                ctx.stroke();
            }

        } else if (simViewMode === 'dome') {
            const R = 170; // dome radius
            ctx.fillStyle = '#030712';
            ctx.fillRect(0, 0, W, H);

            // Draw sky dome circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, 2*Math.PI);
            ctx.clip();

            // Deep nightsky dome gradient fill
            const skyGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
            skyGrad.addColorStop(0, '#010410');
            skyGrad.addColorStop(1, '#000105');
            ctx.fillStyle = skyGrad;
            ctx.fill();

            // Draw stars inside dome
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            simStars.forEach(star => {
                if (star.r < R) {
                    const sx = cx + star.r * Math.cos(star.angle);
                    const sy = cy + star.r * Math.sin(star.angle);
                    ctx.fillRect(sx, sy, star.size, star.size);
                }
            });

            // Project antisolar Earth shadow point
            const shadowAlt = -local.sunAlt;
            const shadowAz = (local.sunAz + 180) % 360;
            const rShadow = R * (90 - shadowAlt) / 90;
            const angleShadow = (shadowAz - 90) * Math.PI / 180;
            const xShadow = cx + rShadow * Math.cos(angleShadow);
            const yShadow = cy + rShadow * Math.sin(angleShadow);

            const rMoonBase = 10;
            const rPenumbraBase = rMoonBase * (local.penumbraRadius / local.moonRadius);
            const rUmbraBase = rMoonBase * (local.umbraRadius / local.moonRadius);

            if (showSimGrid) {
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 1;
                ctx.font = '9px Outfit, sans-serif';

                ctx.beginPath();
                ctx.arc(cx, cy, R * (60/90), 0, 2*Math.PI);
                ctx.arc(cx, cy, R * (30/90), 0, 2*Math.PI);
                ctx.stroke();

                ctx.fillText("30°", cx + 3, cy - R * (60/90) + 9);
                ctx.fillText("60°", cx + 3, cy - R * (30/90) + 9);

                ctx.beginPath();
                ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
                ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
                ctx.stroke();

                ctx.fillText("Zenith", cx + 5, cy + 12);

                // Draw Earth Umbra & Penumbra outline in the dome
                if (shadowAlt >= -10) {
                    // Penumbra
                    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(xShadow, yShadow, rPenumbraBase, 0, 2*Math.PI);
                    ctx.stroke();

                    // Umbra
                    ctx.strokeStyle = 'rgba(220,53,69,0.25)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(xShadow, yShadow, rUmbraBase, 0, 2*Math.PI);
                    ctx.stroke();
                }
            }

            // Draw trajectories
            drawTrajectories(ctx, cx, cy);

            // Real Moon projection on the dome
            const rMoonReal = R * (90 - local.moonAlt) / 90;
            const angleMoon = (local.moonAz - 90) * Math.PI / 180;
            const xMoonReal = cx + rMoonReal * Math.cos(angleMoon);
            const yMoonReal = cy + rMoonReal * Math.sin(angleMoon);

            const xMoon = xMoonReal;
            const yMoon = yMoonReal;

            const canvasScale = 170 / 90;
            const visualScale = rMoonBase / local.moonRadius;
            const mult = visualScale / canvasScale;
            const xShadowDraw = xMoon + (xShadow - xMoon) * mult;
            const yShadowDraw = yMoon + (yShadow - yMoon) * mult;

            // Draw Moon if above horizon
            if (moonAlt >= 0) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(xMoon, yMoon, rMoonBase, 0, 2*Math.PI);
                ctx.clip();

                // Moon base color: pure white (as requested when eclipse not begun)
                ctx.fillStyle = '#ffffff';
                ctx.fill();

                // Maria basins: light grey markings
                ctx.fillStyle = 'rgba(165, 175, 185, 0.45)';
                ctx.beginPath();
                ctx.arc(xMoon - rMoonBase * 0.3, yMoon - rMoonBase * 0.2, rMoonBase * 0.35, 0, 2*Math.PI);
                ctx.arc(xMoon + rMoonBase * 0.2, yMoon - rMoonBase * 0.3, rMoonBase * 0.25, 0, 2*Math.PI);
                ctx.fill();

                // Earth shadow overlay on the dome Moon
                const d_vis = Math.sqrt((xMoon - xShadowDraw)*(xMoon - xShadowDraw) + (yMoon - yShadowDraw)*(yMoon - yShadowDraw));
                if (d_vis < rPenumbraBase + rMoonBase) {
                    const miniShadowGrad = ctx.createRadialGradient(xShadowDraw, yShadowDraw, 0, xShadowDraw, yShadowDraw, rPenumbraBase);
                    
                    const isTotal = local.type === 'Total';
                    if (isTotal) {
                        // Totality: deep, blended brick-red coloration
                        miniShadowGrad.addColorStop(0, 'rgba(90, 10, 5, 0.95)');                 // Dark brick-red center
                        miniShadowGrad.addColorStop(rUmbraBase * 0.65 / rPenumbraBase, 'rgba(110, 20, 12, 0.90)');  // Mid deep red
                        miniShadowGrad.addColorStop(rUmbraBase / rPenumbraBase, 'rgba(130, 25, 15, 0.85)');         // Outer brick red
                        miniShadowGrad.addColorStop((rUmbraBase + (rPenumbraBase - rUmbraBase)*0.1) / rPenumbraBase, 'rgba(90, 40, 30, 0.70)'); // Copper transition
                        miniShadowGrad.addColorStop((rUmbraBase + (rPenumbraBase - rUmbraBase)*0.35) / rPenumbraBase, 'rgba(60, 50, 52, 0.60)'); // Dark brown-grey
                        miniShadowGrad.addColorStop((rUmbraBase + (rPenumbraBase - rUmbraBase)*0.7) / rPenumbraBase, 'rgba(80, 80, 85, 0.35)'); // Grey penumbra
                    } else {
                        // Penumbral/Partial: grey penumbra (gets dark) and dark umbra
                        miniShadowGrad.addColorStop(0, 'rgba(12, 12, 14, 0.96)');                                // Dark umbra core
                        miniShadowGrad.addColorStop(rUmbraBase * 0.75 / rPenumbraBase, 'rgba(20, 20, 22, 0.92)');  // Inner umbra
                        miniShadowGrad.addColorStop(rUmbraBase / rPenumbraBase, 'rgba(30, 30, 32, 0.85)');         // Umbra edge
                        miniShadowGrad.addColorStop((rUmbraBase + (rPenumbraBase - rUmbraBase)*0.2) / rPenumbraBase, 'rgba(60, 60, 65, 0.65)');  // Darker penumbra
                        miniShadowGrad.addColorStop((rUmbraBase + (rPenumbraBase - rUmbraBase)*0.6) / rPenumbraBase, 'rgba(110, 110, 115, 0.40)'); // Soft grey penumbra
                    }
                    miniShadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                    ctx.fillStyle = miniShadowGrad;
                    ctx.beginPath();
                    ctx.arc(xShadowDraw, yShadowDraw, rPenumbraBase, 0, 2*Math.PI);
                    ctx.fill();
                }

                ctx.restore();
            }

            ctx.restore(); // end dome clip

            // Dome boundary ring
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, 2*Math.PI);
            ctx.stroke();

            // Label Cardinal Directions
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.font = 'bold 12px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("N", cx, cy - R - 8);
            ctx.fillText("S", cx, cy + R + 18);
            ctx.fillText("E", cx + R + 12, cy + 4);
            ctx.fillText("W", cx - R - 12, cy + 4);
        }
    } else if (currentEvent.type === 'transit') {
        const transitBody = currentEvent.typeName.includes('Venus') ? Astronomy.Body.Venus : Astronomy.Body.Mercury;
        const local = AstronomyHelper.calculateTransit(date, transitBody, observerLocation.lat, observerLocation.lon);
        if (!local) return;

        // Draw local altitude telemetry values
        document.getElementById('val-sun-alt').innerText = local.sunAlt.toFixed(2) + "°";
        document.getElementById('val-sun-az').innerText = local.sunAz.toFixed(2) + "°";
        document.getElementById('val-obscuration').innerText = "0.01% (Tiny)";
        document.getElementById('val-magnitude').innerText = "Transit Active: " + (local.isTransit ? "YES" : "NO");

        const sunAlt = local.sunAlt;
        const scale = 140 / local.sunRadius; // Map Sun angular size to radius of 140px

        let lightFactor = 1.0;
        if (sunAlt < -18) {
            lightFactor = 0.0;
        } else if (sunAlt < 0) {
            lightFactor = (sunAlt + 18) / 18;
        }

        if (simViewMode === 'closeup') {
            // Sky Background
            const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
            const r = Math.floor(1 + 26 * lightFactor);
            const g = Math.floor(3 + 88 * lightFactor);
            const b = Math.floor(10 + 189 * lightFactor);
            skyGrad.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
            skyGrad.addColorStop(1, '#000000');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, H);

            // Draw Sun
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffcc00';
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, cy, 140, 0, 2*Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw planet as a tiny black dot crossing the Sun (scaled dynamically to sun size)
            const dx = local.dx * scale;
            const dy = -local.dy * scale;
            const rPlanetPix = Math.max(1.0, 140 * (local.planetRadius / local.sunRadius));

            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(cx + dx, cy + dy, rPlanetPix, 0, 2*Math.PI);
            ctx.fill();

            // Ground/Horizon clipping line
            const yHorizon = cy + sunAlt * scale;
            if (yHorizon < H) {
                const groundGrad = ctx.createLinearGradient(0, Math.max(0, yHorizon), 0, H);
                groundGrad.addColorStop(0, '#0a1424');
                groundGrad.addColorStop(1, '#03060c');
                ctx.fillStyle = groundGrad;
                ctx.fillRect(0, Math.max(0, yHorizon), W, H - Math.max(0, yHorizon));

                ctx.strokeStyle = '#00f6ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, yHorizon);
                ctx.lineTo(W, yHorizon);
                ctx.stroke();
            }

        } else if (simViewMode === 'dome') {
            const R = 170; // dome radius
            ctx.fillStyle = '#030712';
            ctx.fillRect(0, 0, W, H);

            // Draw sky dome circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, 2*Math.PI);
            ctx.clip();

            // Sky dome gradient fill
            const skyGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
            const r = Math.floor(1 + 26 * lightFactor);
            const g = Math.floor(3 + 88 * lightFactor);
            const b = Math.floor(10 + 189 * lightFactor);
            skyGrad.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
            skyGrad.addColorStop(1, `rgb(${Math.floor(r*0.7)}, ${Math.floor(g*0.7)}, ${Math.floor(b*0.7)})`);
            ctx.fillStyle = skyGrad;
            ctx.fill();

            // Draw stars inside dome if dark
            if (lightFactor < 0.2) {
                ctx.fillStyle = 'rgba(255,255,255,' + ((0.2 - lightFactor) / 0.2) + ')';
                simStars.forEach(star => {
                    if (star.r < R) {
                        const sx = cx + star.r * Math.cos(star.angle);
                        const sy = cy + star.r * Math.sin(star.angle);
                        ctx.fillRect(sx, sy, star.size, star.size);
                    }
                });
            }

            // Grid layout
            if (showSimGrid) {
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 1;
                ctx.font = '9px Outfit, sans-serif';

                ctx.beginPath();
                ctx.arc(cx, cy, R * (60/90), 0, 2*Math.PI);
                ctx.arc(cx, cy, R * (30/90), 0, 2*Math.PI);
                ctx.stroke();

                ctx.fillText("30°", cx + 3, cy - R * (60/90) + 9);
                ctx.fillText("60°", cx + 3, cy - R * (30/90) + 9);

                ctx.beginPath();
                ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
                ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
                ctx.stroke();

                ctx.fillText("Zenith", cx + 5, cy + 12);
            }

            // Project Sun & Planet
            const rSun = R * (90 - local.sunAlt) / 90;
            const angleSun = (local.sunAz - 90) * Math.PI / 180;
            const xSun = cx + rSun * Math.cos(angleSun);
            const ySun = cy + rSun * Math.sin(angleSun);

            // Real Planet projection
            const rPlanetReal = R * (90 - local.planetAlt) / 90;
            const anglePlanet = (local.planetAz - 90) * Math.PI / 180;
            const xPlanetReal = cx + rPlanetReal * Math.cos(anglePlanet);
            const yPlanetReal = cy + rPlanetReal * Math.sin(anglePlanet);

            const dx_real = xPlanetReal - xSun;
            const dy_real = yPlanetReal - ySun;

            const rSunBase = 12;
            const rPlanetBase = rSunBase * (local.planetRadius / local.sunRadius);

            const canvasScale = 170 / 90;
            const visualScale = rSunBase / local.sunRadius;
            const mult = visualScale / canvasScale;
            const px = xSun + dx_real * mult;
            const py = ySun + dy_real * mult;

            // Draw trajectories
            drawTrajectories(ctx, cx, cy);

            // Draw Sun inside sky dome if above horizon
            if (local.sunAlt >= 0) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffe600';
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(xSun, ySun, rSunBase, 0, 2*Math.PI);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Draw planet inside/near Sun circle (realistic transit projection)
                const d_vis = Math.sqrt((px - xSun)*(px - xSun) + (py - ySun)*(py - ySun));
                if (d_vis < rSunBase + rPlanetBase + 2) {
                    ctx.fillStyle = '#000000';
                    ctx.beginPath();
                    ctx.arc(px, py, rPlanetBase, 0, 2*Math.PI);
                    ctx.fill();
                }
            }

            ctx.restore(); // end dome clip

            // Dome horizon boundary ring
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, 2*Math.PI);
            ctx.stroke();

            // Label Cardinals
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.font = 'bold 12px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("N", cx, cy - R - 8);
            ctx.fillText("S", cx, cy + R + 18);
            ctx.fillText("E", cx + R + 12, cy + 4);
            ctx.fillText("W", cx - R - 12, cy + 4);
        }
    }
}

// Calculate and render dynamic contact timings
function updateContactTimings() {
    if (!currentEvent) return;
    
    const listContainer = document.getElementById('contact-timings-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    cachedContactTimes = null;

    const lat = observerLocation.lat;
    const lon = observerLocation.lon;
    const peakDate = dateFromJD(currentEvent.peakJD);

    const lang = getCurrentLanguage();
    const belowHorizonText = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang]['below_horizon']) || ' (Below Horizon)';
    const notVisibleText = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang]['not_visible_here']) || 'Not visible at this location';

    let contacts = [];

    if (currentEvent.type === 'solar') {
        const startSearch = new Date(peakDate.getTime() - 12 * 60 * 60 * 1000);
        const t = Astronomy.MakeTime(startSearch);
        const obs = new Astronomy.Observer(lat, lon, 0);
        
        let localEclipse = null;
        try {
            localEclipse = Astronomy.SearchLocalSolarEclipse(t, obs);
        } catch (e) {
            console.error("Astronomy Engine search error:", e);
        }

        let isVisible = false;
        if (localEclipse) {
            const foundDate = new Date(localEclipse.peak.time.date);
            const diffHours = Math.abs(foundDate.getTime() - peakDate.getTime()) / (60 * 60 * 1000);
            if (diffHours < 24) {
                isVisible = true;
            }
        }

        if (isVisible && localEclipse) {
            const getAlt = (d) => {
                try {
                    const tVal = Astronomy.MakeTime(d);
                    const sunEq = Astronomy.Equator(Astronomy.Body.Sun, tVal, obs, true, true);
                    const sunHor = Astronomy.Horizon(tVal, obs, sunEq.ra, sunEq.dec, 'normal');
                    return sunHor.altitude;
                } catch (e) {
                    return 0;
                }
            };

            const tC1 = new Date(localEclipse.partial_begin.time.date);
            contacts.push({ labelKey: 'c1_label', defaultLabel: 'C1 (Partial Starts):', date: tC1, visible: getAlt(tC1) >= 0 });

            if (localEclipse.total_begin) {
                const tC2 = new Date(localEclipse.total_begin.time.date);
                contacts.push({ labelKey: 'c2_label', defaultLabel: 'C2 (Totality Starts):', date: tC2, visible: getAlt(tC2) >= 0 });
            } else if (localEclipse.annular_begin) {
                const tC2 = new Date(localEclipse.annular_begin.time.date);
                contacts.push({ labelKey: 'c2_label', defaultLabel: 'C2 (Annularity Starts):', date: tC2, visible: getAlt(tC2) >= 0 });
            }

            const tMax = new Date(localEclipse.peak.time.date);
            contacts.push({ labelKey: 'peak_label', defaultLabel: 'Peak (Maximum):', date: tMax, visible: getAlt(tMax) >= 0 });

            if (localEclipse.total_end) {
                const tC3 = new Date(localEclipse.total_end.time.date);
                contacts.push({ labelKey: 'c3_label', defaultLabel: 'C3 (Totality Ends):', date: tC3, visible: getAlt(tC3) >= 0 });
            } else if (localEclipse.annular_end) {
                const tC3 = new Date(localEclipse.annular_end.time.date);
                contacts.push({ labelKey: 'c3_label', defaultLabel: 'C3 (Annularity Ends):', date: tC3, visible: getAlt(tC3) >= 0 });
            }

            const tC4 = new Date(localEclipse.partial_end.time.date);
            contacts.push({ labelKey: 'c4_label', defaultLabel: 'C4 (Partial Ends):', date: tC4, visible: getAlt(tC4) >= 0 });
        }
    } else if (currentEvent.type === 'lunar') {
        const startSearch = new Date(peakDate.getTime() - 12 * 60 * 60 * 1000);
        const t = Astronomy.MakeTime(startSearch);
        const obs = new Astronomy.Observer(lat, lon, 0);
        
        let eclipse = null;
        try {
            eclipse = Astronomy.SearchLunarEclipse(t);
        } catch (e) {
            console.error(e);
        }

        let isVisible = false;
        if (eclipse) {
            const foundDate = new Date(eclipse.peak.date);
            const diffHours = Math.abs(foundDate.getTime() - peakDate.getTime()) / (60 * 60 * 1000);
            if (diffHours < 24) {
                isVisible = true;
            }
        }

        if (isVisible && eclipse) {
            const getAlt = (d) => {
                try {
                    const tVal = Astronomy.MakeTime(d);
                    const moonEq = Astronomy.Equator(Astronomy.Body.Moon, tVal, obs, true, true);
                    const moonHor = Astronomy.Horizon(tVal, obs, moonEq.ra, moonEq.dec, 'normal');
                    return moonHor.altitude;
                } catch (e) {
                    return 0;
                }
            };

            const tPeak = new Date(eclipse.peak.date);
            const tP1 = new Date(tPeak.getTime() - eclipse.sd_penum * 60000);
            contacts.push({ labelKey: 'p1_label', defaultLabel: 'P1 (Penumbral Starts):', date: tP1, visible: getAlt(tP1) >= 0 });

            if (eclipse.sd_partial > 0) {
                const tU1 = new Date(tPeak.getTime() - eclipse.sd_partial * 60000);
                contacts.push({ labelKey: 'u1_label', defaultLabel: 'U1 (Partial Starts):', date: tU1, visible: getAlt(tU1) >= 0 });
            }

            if (eclipse.sd_total > 0) {
                const tU2 = new Date(tPeak.getTime() - eclipse.sd_total * 60000);
                contacts.push({ labelKey: 'u2_label', defaultLabel: 'U2 (Totality Starts):', date: tU2, visible: getAlt(tU2) >= 0 });
            }

            contacts.push({ labelKey: 'peak_label', defaultLabel: 'Peak (Maximum):', date: tPeak, visible: getAlt(tPeak) >= 0 });

            if (eclipse.sd_total > 0) {
                const tU3 = new Date(tPeak.getTime() + eclipse.sd_total * 60000);
                contacts.push({ labelKey: 'u3_label', defaultLabel: 'U3 (Totality Ends):', date: tU3, visible: getAlt(tU3) >= 0 });
            }

            if (eclipse.sd_partial > 0) {
                const tU4 = new Date(tPeak.getTime() + eclipse.sd_partial * 60000);
                contacts.push({ labelKey: 'u4_label', defaultLabel: 'U4 (Partial Ends):', date: tU4, visible: getAlt(tU4) >= 0 });
            }

            const tP4 = new Date(tPeak.getTime() + eclipse.sd_penum * 60000);
            contacts.push({ labelKey: 'p4_label', defaultLabel: 'P4 (Penumbral Ends):', date: tP4, visible: getAlt(tP4) >= 0 });
        }
    } else if (currentEvent.type === 'transit') {
        const startSearch = new Date(peakDate.getTime() - 12 * 60 * 60 * 1000);
        const t = Astronomy.MakeTime(startSearch);
        const obs = new Astronomy.Observer(lat, lon, 0);
        const body = currentEvent.typeName.includes('Venus') ? Astronomy.Body.Venus : Astronomy.Body.Mercury;
        
        let transit = null;
        try {
            transit = Astronomy.SearchTransit(body, t);
        } catch (e) {
            console.error(e);
        }

        let isVisible = false;
        if (transit) {
            const foundDate = new Date(transit.peak.date);
            const diffHours = Math.abs(foundDate.getTime() - peakDate.getTime()) / (60 * 60 * 1000);
            if (diffHours < 24) {
                isVisible = true;
            }
        }

        if (isVisible && transit) {
            const getAlt = (d) => {
                try {
                    const tVal = Astronomy.MakeTime(d);
                    const sunEq = Astronomy.Equator(Astronomy.Body.Sun, tVal, obs, true, true);
                    const sunHor = Astronomy.Horizon(tVal, obs, sunEq.ra, sunEq.dec, 'normal');
                    return sunHor.altitude;
                } catch (e) {
                    return 0;
                }
            };

            const tStart = new Date(transit.start.date);
            contacts.push({ labelKey: 'ingress_label', defaultLabel: 'Ingress Starts:', date: tStart, visible: getAlt(tStart) >= 0 });

            const tPeak = new Date(transit.peak.date);
            contacts.push({ labelKey: 'peak_label', defaultLabel: 'Peak (Maximum):', date: tPeak, visible: getAlt(tPeak) >= 0 });

            const tFinish = new Date(transit.finish.date);
            contacts.push({ labelKey: 'egress_label', defaultLabel: 'Egress Ends:', date: tFinish, visible: getAlt(tFinish) >= 0 });
        }
    }

    if (contacts.length === 0) {
        listContainer.innerHTML = `<div class="timing-row" style="justify-content: center; color: rgba(255,255,255,0.4);">${notVisibleText}</div>`;
        const container = document.getElementById('sim-slider-bookmarks');
        if (container) container.innerHTML = '';
        return;
    }

    cachedContactTimes = contacts;
    renderSliderBookmarks();
    recalculateTrajectories();

    // Start 5 minutes before the eclipse began in the selected area
    if (!isAnimating && contacts.length > 0) {
        const startBefore = new Date(contacts[0].date.getTime() - 5 * 60000);
        setSliderToDate(startBefore);
    }

    contacts.forEach((c, idx) => {
        const row = document.createElement('div');
        row.className = 'timing-row';
        row.id = `contact-row-${idx}`;

        const labelText = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][c.labelKey]) || c.defaultLabel;
        const timeStr = c.date.toUTCString().split(" ")[4];
        
        let labelSpan = document.createElement('span');
        labelSpan.innerText = labelText;

        let timeSpan = document.createElement('span');
        if (c.visible) {
            timeSpan.innerText = timeStr;
        } else {
            timeSpan.innerText = timeStr + belowHorizonText;
            timeSpan.style.color = 'rgba(255,255,255,0.4)';
        }

        row.appendChild(labelSpan);
        row.appendChild(timeSpan);
        listContainer.appendChild(row);
    });
}

// Highlight the contact row corresponding to the most recently passed phase
function highlightActivePhase(activeTime) {
    if (!cachedContactTimes || cachedContactTimes.length === 0) return;

    for (let i = 0; i < cachedContactTimes.length; i++) {
        const el = document.getElementById(`contact-row-${i}`);
        if (el) el.classList.remove('active-phase');
    }

    let activeIdx = -1;
    for (let i = 0; i < cachedContactTimes.length; i++) {
        if (activeTime >= cachedContactTimes[i].date) {
            activeIdx = i;
        }
    }

    if (activeIdx !== -1 && activeIdx < cachedContactTimes.length - 1) {
        const el = document.getElementById(`contact-row-${activeIdx}`);
        if (el) el.classList.add('active-phase');
    }
}

// Generate static background stars for sky dome / closeup black sky
function generateSimStars() {
    simStars = [];
    for (let i = 0; i < 80; i++) {
        const r = Math.random();
        const radius = Math.sqrt(r) * 170; // distribution within dome radius
        const angle = Math.random() * 2 * Math.PI;
        simStars.push({
            r: radius,
            angle: angle,
            size: Math.random() * 1.5 + 0.5
        });
    }
}

// Translate a Date object back to the time slider percentage and update displays
function setSliderToDate(date) {
    if (!currentEvent) return;
    const t = Astronomy.MakeTime(date);
    const targetJD = t.ut;
    const rangeDays = (currentEvent.type === 'lunar' ? 4 : 3) / 24;
    const offsetDays = targetJD - currentEvent.peakJD;
    let val = 50 + 50 * (offsetDays / rangeDays);
    val = Math.max(0, Math.min(100, val));
    
    timeSliderVal = val;
    const sliders = [
        document.getElementById('time-slider'),
        document.getElementById('sim-time-slider'),
        document.getElementById('globe-time-slider')
    ];
    sliders.forEach(s => { if (s) s.value = val; });
    updateSliderGradient();
    updateTimeFromSlider();
}

// Search for and return any sunrise or sunset times (Sun altitude zero-crossings) within the current event's time range
function findSunriseSunsetTimes() {
    if (!currentEvent) return [];
    const times = [];
    const lat = observerLocation.lat;
    const lon = observerLocation.lon;
    const obs = new Astronomy.Observer(lat, lon, 0);
    const rangeDays = (currentEvent.type === 'lunar' ? 4 : 3) / 24;
    
    // Sample Sun altitudes across 36 discrete intervals in the timeline
    const samples = 36;
    let prevAlt = null;
    let prevJD = null;

    const getSunAlt = (jd) => {
        try {
            const t = Astronomy.MakeTime(jd);
            const sunEq = Astronomy.Equator(Astronomy.Body.Sun, t, obs, true, true);
            const sunHor = Astronomy.Horizon(t, obs, sunEq.ra, sunEq.dec, 'normal');
            return sunHor.altitude;
        } catch (e) {
            return 0;
        }
    };

    for (let i = 0; i <= samples; i++) {
        const offsetDays = ((i - samples/2) / (samples/2)) * rangeDays;
        const jd = currentEvent.peakJD + offsetDays;
        const alt = getSunAlt(jd);

        if (i > 0) {
            // Check for horizon transition (zero-crossing)
            if ((prevAlt > 0 && alt < 0) || (prevAlt < 0 && alt > 0)) {
                const fraction = Math.abs(prevAlt) / (Math.abs(prevAlt) + Math.abs(alt));
                const zeroJD = prevJD + fraction * (jd - prevJD);
                const isSunset = prevAlt > 0;
                times.push({
                    type: isSunset ? 'sunset' : 'sunrise',
                    label: isSunset ? 'Sunset' : 'Sunrise',
                    date: dateFromJD(zeroJD)
                });
            }
        }
        prevAlt = alt;
        prevJD = jd;
    }
    return times;
}

// Find key contact times for the selected lunar eclipse
function getLunarContacts(peakJD) {
    const peakDate = dateFromJD(peakJD);
    const startSearch = new Date(peakDate.getTime() - 12 * 60 * 60 * 1000);
    const t = Astronomy.MakeTime(startSearch);
    try {
        const eclipse = Astronomy.SearchLunarEclipse(t);
        if (eclipse) {
            const tPeak = new Date(eclipse.peak.date);
            const tP1 = new Date(tPeak.getTime() - eclipse.sd_penum * 60000);
            const tP4 = new Date(tPeak.getTime() + eclipse.sd_penum * 60000);
            let tU1 = null, tU2 = null, tU3 = null, tU4 = null;
            if (eclipse.sd_partial > 0) {
                tU1 = new Date(tPeak.getTime() - eclipse.sd_partial * 60000);
                tU4 = new Date(tPeak.getTime() + eclipse.sd_partial * 60000);
            }
            if (eclipse.sd_total > 0) {
                tU2 = new Date(tPeak.getTime() - eclipse.sd_total * 60000);
                tU3 = new Date(tPeak.getTime() + eclipse.sd_total * 60000);
            }
            return { p1: tP1, p4: tP4, u1: tU1, u2: tU2, u3: tU3, u4: tU4, peak: tPeak };
        }
    } catch (e) {
        console.error("Lunar eclipse search error:", e);
    }
    return null;
}

// Generate and render clickable bookmark tick indicator dots over the simulator time slider
function renderSliderBookmarks() {
    const container = document.getElementById('sim-slider-bookmarks');
    if (!container) return;
    container.innerHTML = '';

    if (!currentEvent || !cachedContactTimes || cachedContactTimes.length === 0) return;

    const rangeDays = (currentEvent.type === 'lunar' ? 4 : 3) / 24;
    const bookmarks = [];

    // 1. Add eclipse contact timings
    cachedContactTimes.forEach(c => {
        const t = Astronomy.MakeTime(c.date);
        const offsetDays = t.ut - currentEvent.peakJD;
        let pct = 50 + 50 * (offsetDays / rangeDays);
        if (pct >= 0 && pct <= 100) {
            let label = c.defaultLabel.split(':')[0].split('(')[0].trim();
            bookmarks.push({
                pct: pct,
                label: label,
                labelKey: c.labelKey,
                date: c.date,
                color: label.includes('Peak') ? '#ffcc00' : (label.includes('C2') || label.includes('C3') || label.includes('U2') || label.includes('U3') ? '#ff3c00' : '#00f6ff')
            });
        }
    });

    // 2. Add sunrise / sunset times occurring within timeline range
    const sunTimes = findSunriseSunsetTimes();
    sunTimes.forEach(s => {
        const t = Astronomy.MakeTime(s.date);
        const offsetDays = t.ut - currentEvent.peakJD;
        let pct = 50 + 50 * (offsetDays / rangeDays);
        if (pct >= 0 && pct <= 100) {
            bookmarks.push({
                pct: pct,
                label: s.label,
                labelKey: s.type,
                date: s.date,
                color: '#ff6a00' // Sunset/Sunrise orange
            });
        }
    });

    // Sort bookmarks chronologically by timeline percentage
    bookmarks.sort((a, b) => a.pct - b.pct);

    const lang = getCurrentLanguage();
    const dict = (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || {};

    bookmarks.forEach(b => {
        const dot = document.createElement('div');
        dot.className = 'slider-bookmark-dot';
        dot.style.left = `${b.pct}%`;
        dot.style.background = b.color;
        dot.style.boxShadow = `0 0 6px ${b.color}`;
        
        // Tooltip displaying description and time
        const timeStr = b.date.toUTCString().split(' ')[4];
        const displayLabel = dict[b.labelKey] || b.label;
        dot.title = `${displayLabel} (${timeStr} UTC)`;
        
        // Snap timeline to this bookmark when clicked
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isAnimating) stopAnimation();
            setSliderToDate(b.date);
            showEventInfo(b);
            if (activeInfoTimeout) clearTimeout(activeInfoTimeout);
            activeInfoTimeout = setTimeout(() => {
                hideEventInfo();
                activeInfoTimeout = null;
            }, 4000);
        });

        container.appendChild(dot);
    });
}

// Android Code Integration Tab
let kotlinCodes = {};

function loadKotlinFiles() {
    // We fetch the Kotlin files stored in the workspace
    // Since this runs in browser, we can pre-populate them as template strings in our code for reliability
    // or perform a simple fetch relative to the module root.
    // Let's pre-populate the essential files as strings directly in app.js for seamless offline loading!
    
    kotlinCodes['EclipseCalculator.kt'] = `package org.esss.science.eclipses

import kotlin.math.*

object EclipseCalculator {
    const val RE_KM = 6378.137
    const val RS_KM = 696340.0
    const val RM_KM = 1737.4
    const val AU_KM = 149597870.7

    data class Vector3D(val x: Double, val y: Double, val z: Double) {
        operator fun minus(v: Vector3D) = Vector3D(x - v.x, y - v.y, z - v.z)
        operator fun plus(v: Vector3D) = Vector3D(x + v.x, y + v.y, z + v.z)
        fun dot(v: Vector3D) = x * v.x + y * v.y + z * v.z
        fun length() = sqrt(x*x + y*y + z*z)
    }

    data class ShadowIntersection(
        val lat: Double,
        val lon: Double,
        val ru: Double, // Negative: Annular, Positive: Total
        val rp: Double,
        val isVisible: Boolean
    )

    fun calculateShadowCenter(
        sun: Vector3D, 
        moon: Vector3D, 
        gmstHours: Double
    ): ShadowIntersection? {
        val D = moon - sun
        val RE_AU = RE_KM / AU_KM

        val A = D.dot(D)
        val B = 2.0 * moon.dot(D)
        val C = moon.dot(moon) - RE_AU * RE_AU

        val disc = B*B - 4*A*C
        if (disc < 0) return null

        val u = (-B - sqrt(disc)) / (2.0*A)
        if (u < 0) return null

        // J2000 geocentric intersection vector
        val I = Vector3D(
            moon.x + u*D.x,
            moon.y + u*D.y,
            moon.z + u*D.z
        )

        // Convert to lat/lon using Earth Sidereal Rotation angle
        val theta = gmstHours * 15.0 * Math.PI / 180.0
        var lonRad = atan2(I.y, I.x) - theta
        while (lonRad < -Math.PI) lonRad += 2*Math.PI
        while (lonRad > Math.PI) lonRad -= 2*Math.PI

        val latRad = atan2(I.z, sqrt(I.x*I.x + I.y*I.y))
        
        // Shadow Radii
        val distIntersection = sqrt((I.x - moon.x).pow(2) + (I.y - moon.y).pow(2) + (I.z - moon.z).pow(2)) * AU_KM
        val distSunMoon = D.length() * AU_KM

        val sinAlpha = (RS_KM - RM_KM) / distSunMoon
        val Lu = RM_KM / sinAlpha
        val ru = RM_KM * (1.0 - distIntersection / Lu)

        val sinBeta = (RS_KM + RM_KM) / distSunMoon
        val Lp = RM_KM / sinBeta
        val rp = RM_KM * (1.0 + distIntersection / Lp)

        return ShadowIntersection(
            lat = latRad * 180.0 / Math.PI,
            lon = lonRad * 180.0 / Math.PI,
            ru = ru,
            rp = rp,
            isVisible = true
        )
    }
}`;

    kotlinCodes['EclipseView.kt'] = `package org.esss.science.eclipses

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View

class EclipseView @JvmOverloads constructor(
    context: Context, 
    attrs: AttributeSet? = null, 
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val sunPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        shadowLayer = 30f, 0f, 0f, Color.parseColor("#FFE600")
    }

    private val moonPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#060814")
    }

    private val coronaPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#A0FFFFFF")
    }

    private var obscuration: Float = 0f
    private var moonOffsetDx: Float = 0f
    private var moonOffsetDy: Float = 0f

    fun updateEclipse(obsc: Float, dx: Float, dy: Float) {
        this.obscuration = obsc
        this.moonOffsetDx = dx
        this.moonOffsetDy = dy
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val cx = width / 2f
        val cy = height / 2f
        val sunRadius = width * 0.22f

        // Draw Corona during maximum obscuration
        if (obscuration >= 0.98f) {
            canvas.drawCircle(cx, cy, sunRadius * 1.5f, coronaPaint)
        }

        // Draw Sun
        canvas.drawCircle(cx, cy, sunRadius, sunPaint)

        // Draw Moon disk
        val mx = cx + moonOffsetDx
        val my = cy + moonOffsetDy
        canvas.drawCircle(mx, my, sunRadius * 1.01f, moonPaint)
    }
}`;

    // Load first file as default
    loadKotlinFile('EclipseCalculator.kt');
}

function loadKotlinFile(filename) {
    const display = document.getElementById('code-display');
    if (!display) return;
    if (kotlinCodes[filename]) {
        display.innerText = kotlinCodes[filename];
    } else {
        display.innerText = "// Code file not found.";
    }
}

// Export Visualization as a clean vector SVG graphic for Kotlin app compatibility
function exportSVG(type) {
    if (!currentEvent) return;

    let svgContent = '';
    let filename = '';

    if (type === 'sim') {
        filename = `${currentEvent.id}-local-view.svg`;
        
        if (currentEvent.type === 'solar') {
            svgContent = `
<svg width="600" height="450" viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="450" fill="#060a1d" />
  <!-- Solar Corona -->
  <circle cx="300" cy="225" r="180" fill="url(#coronaGlow)" opacity="0.8" />
  <defs>
    <radialGradient id="coronaGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
      <stop offset="50%" stop-color="#e6f0ff" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Glowing Sun -->
  <circle cx="300" cy="225" r="110" fill="#ffffff" filter="url(#sunGlow)" />
  <filter id="sunGlow" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="15" result="blur" />
    <feMerge>
      <feMergeNode in="blur" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
  <!-- Moon -->
  <circle cx="330" cy="210" r="111" fill="#060814" />
</svg>`;
        } else {
            // Lunar Eclipse SVG
            svgContent = `
<svg width="600" height="450" viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="450" fill="#010410" />
  <!-- Earth Penumbra -->
  <circle cx="300" cy="225" r="130" fill="#ffffff" opacity="0.06" />
  <!-- Earth Umbra -->
  <circle cx="300" cy="225" r="80" fill="#0a0202" stroke="#dc3545" stroke-width="4" stroke-opacity="0.3" />
  <!-- Moon (Blood Color) -->
  <circle cx="280" cy="215" r="50" fill="#ae2814" />
</svg>`;
        }
    } else {
        // Map Track SVG
        filename = `${currentEvent.id}-track-path.svg`;
        svgContent = `
<svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="400" fill="#0d1117" />
  <!-- Centerline of totality -->
  <path d="M 100 200 Q 400 100 700 300" fill="none" stroke="#ff3b30" stroke-width="3" stroke-dasharray="5,5" />
  <!-- Observer Marker -->
  <circle cx="450" cy="180" r="8" fill="#125DFF" stroke="#ffffff" stroke-width="2" />
  <!-- Title -->
  <text x="30" y="50" fill="#ffffff" font-family="Outfit, sans-serif" font-size="20" font-weight="bold">${currentEvent.name}</text>
  <text x="30" y="80" fill="#c4c4c4" font-family="Inter, sans-serif" font-size="12">${currentEvent.typeName} Path</text>
</svg>`;
    }

    // Trigger File Download
    const blob = new Blob([svgContent.trim()], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ==========================================================================
// NASA 5-MILLENNIUM CATALOG DYNAMIC CALCULATIONS & RENDERING
// ==========================================================================
let catalogEvents = [];

function dateFromJD(jd) {
    return Astronomy.MakeTime(jd).date;
}

function formatDate(date) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const year = date.getUTCFullYear();
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    
    if (year <= 0) {
        const bceYear = Math.abs(year) + 1;
        return `${month} ${day}, ${bceYear} BCE`;
    } else {
        return `${month} ${day}, ${year}`;
    }
}

function generate100YearCatalog() {
    return generateCenturyCatalog(2000);
}

function generateCenturyCatalog(centuryStartYear) {
    const catalog = [];
    const startYear = parseInt(centuryStartYear);
    const endYear = startYear + 100;
    
    // Solar Eclipses
    let date = new Date(Date.UTC(startYear, 0, 1));
    const endDate = new Date(Date.UTC(endYear, 0, 1));
    
    let t = Astronomy.MakeTime(date);
    const tEnd = Astronomy.MakeTime(endDate);
    
    while (true) {
        const eclipse = Astronomy.SearchGlobalSolarEclipse(t);
        if (!eclipse || eclipse.peak.ut > tEnd.ut) break;
        
        catalog.push({
            id: `solar-${eclipse.peak.ut}`,
            name: formatDate(eclipse.peak.date),
            year: eclipse.peak.date.getUTCFullYear(),
            type: "solar",
            typeName: `${eclipse.kind} Solar Eclipse`,
            peakTime: eclipse.peak.date.toISOString(),
            peakJD: eclipse.peak.ut,
            duration: eclipse.kind === "Total" ? "Totality" : "Partial",
            lat: eclipse.latitude || 0,
            lon: eclipse.longitude || 0,
            description: `A ${eclipse.kind.toLowerCase()} solar eclipse peaking at latitude ${eclipse.latitude?.toFixed(2)}°, longitude ${eclipse.longitude?.toFixed(2)}°.`
        });
        t = eclipse.peak.AddDays(30);
    }
    
    // Lunar Eclipses
    date = new Date(Date.UTC(startYear, 0, 1));
    t = Astronomy.MakeTime(date);
    while (true) {
        const eclipse = Astronomy.SearchLunarEclipse(t);
        if (!eclipse || eclipse.peak.ut > tEnd.ut) break;
        
        catalog.push({
            id: `lunar-${eclipse.peak.ut}`,
            name: formatDate(eclipse.peak.date),
            year: eclipse.peak.date.getUTCFullYear(),
            type: "lunar",
            typeName: `${eclipse.kind} Lunar Eclipse`,
            peakTime: eclipse.peak.date.toISOString(),
            peakJD: eclipse.peak.ut,
            duration: eclipse.kind.toString(),
            lat: 0,
            lon: 0,
            description: `A ${eclipse.kind.toString().toLowerCase()} lunar eclipse.`
        });
        t = eclipse.peak.AddDays(30);
    }

    if (startYear === 2000) {
        const transits = [
            { date: "2003-05-07T07:52:00Z", name: "May 7, 2003" },
            { date: "2006-11-08T21:41:00Z", name: "November 8, 2006" },
            { date: "2016-05-09T14:57:00Z", name: "May 9, 2016" },
            { date: "2019-11-11T15:20:00Z", name: "November 11, 2019" },
            { date: "2032-11-13T08:54:00Z", name: "November 13, 2032" },
            { date: "2039-11-07T08:46:00Z", name: "November 7, 2039" },
            { date: "2049-05-07T14:24:00Z", name: "May 7, 2049" },
            { date: "2052-11-09T02:30:00Z", name: "November 9, 2052" },
            { date: "2065-05-10T17:06:00Z", name: "May 10, 2065" },
            { date: "2078-11-14T13:40:00Z", name: "November 14, 2078" },
            { date: "2085-11-07T13:36:00Z", name: "November 7, 2085" },
            { date: "2095-05-08T17:50:00Z", name: "May 8, 2095" },
            { date: "2098-11-10T07:44:00Z", name: "November 10, 2098" }
        ];
        transits.forEach(tr => {
            catalog.push({
                id: `transit-${tr.date}`,
                name: tr.name,
                year: new Date(tr.date).getUTCFullYear(),
                type: "transit",
                typeName: "Transit of Mercury",
                peakTime: tr.date,
                peakJD: Astronomy.MakeTime(new Date(tr.date)).ut,
                duration: "4h 30m",
                lat: 0,
                lon: 0,
                description: "Mercury passes directly in front of the Sun, visible as a tiny black silhouette."
            });
        });
    }

    catalog.sort((a, b) => a.peakJD - b.peakJD);
    return catalog;
}

function populateCenturySelector() {
    const selector = document.getElementById('catalog-century-select');
    if (!selector) return;
    selector.innerHTML = '';
    
    for (let centuryStart = 2900; centuryStart >= -2000; centuryStart -= 100) {
        const option = document.createElement('option');
        option.value = centuryStart;
        
        let label = "";
        if (centuryStart < 0) {
            const bceCent = Math.abs(centuryStart) / 100;
            let bceSuffix = "th";
            const lastDigitBce = bceCent % 10;
            const lastTwoDigitsBce = bceCent % 100;
            if (lastTwoDigitsBce >= 11 && lastTwoDigitsBce <= 13) {
                bceSuffix = "th";
            } else if (lastDigitBce === 1) {
                bceSuffix = "st";
            } else if (lastDigitBce === 2) {
                bceSuffix = "nd";
            } else if (lastDigitBce === 3) {
                bceSuffix = "rd";
            }
            label = `${bceCent}${bceSuffix} Century BCE (${Math.abs(centuryStart)} to ${Math.abs(centuryStart + 99)} BCE)`;
        } else {
            const ceCent = (centuryStart / 100) + 1;
            let suffix = "th";
            const lastDigit = ceCent % 10;
            const lastTwoDigits = ceCent % 100;
            if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
                suffix = "th";
            } else if (lastDigit === 1) {
                suffix = "st";
            } else if (lastDigit === 2) {
                suffix = "nd";
            } else if (lastDigit === 3) {
                suffix = "rd";
            }
            label = `${ceCent}${suffix} Century CE (${centuryStart + 1} to ${centuryStart + 100} CE)`;
        }
        
        option.textContent = label;
        if (centuryStart === 2000) {
            option.selected = true;
        }
        selector.appendChild(option);
    }
}

function populateSidebarList() {
    const eventList = document.getElementById('event-list');
    if (!eventList) return;
    eventList.innerHTML = '';
    
    // Read type filter
    const activeTypeBtn = document.querySelector('[data-filter].active');
    const typeFilter = activeTypeBtn ? activeTypeBtn.dataset.filter : 'all';
    
    // Read time filter
    const activeTimeBtn = document.querySelector('[data-time-filter].active');
    const timeFilter = activeTimeBtn ? activeTimeBtn.dataset.timeFilter : 'upcoming';
    
    const now = new Date();
    
    const filtered = sidebarEvents.filter(ev => {
        // Type filter check
        const matchesType = typeFilter === 'all' || ev.type === typeFilter;
        
        // Time filter check
        let matchesTime = true;
        const evDate = dateFromJD(ev.peakJD);
        if (timeFilter === 'upcoming') {
            matchesTime = evDate >= now;
        } else if (timeFilter === 'past') {
            matchesTime = evDate < now;
        }
        
        return matchesType && matchesTime;
    });
    
    if (filtered.length === 0) {
        eventList.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.3); padding: 20px; font-size: 13px;">No events in this range.</div>';
        return;
    }
    
    filtered.forEach(ev => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.dataset.id = ev.id;
        if (currentEvent && currentEvent.id === ev.id) {
            card.classList.add('active');
        }
        const lang = getCurrentLanguage();
        const typeNameTranslated = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][ev.typeName]) || ev.typeName;
        const nameTranslated = translateEventName(ev.name, lang);
        card.innerHTML = `
            <div class="title">${nameTranslated}</div>
            <div class="meta">
                <span class="type ${ev.type}">${typeNameTranslated}</span>
                <span class="date">${ev.year <= 0 ? Math.abs(ev.year) + 1 + " BCE" : ev.year}</span>
            </div>
        `;
        card.addEventListener('click', () => {
            document.querySelectorAll('.event-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectEvent(ev);
        });
        eventList.appendChild(card);
    });
}

function renderCatalogTable() {
    const tableBody = document.getElementById('catalog-table-body');
    const searchInput = document.getElementById('catalog-search');
    const searchVal = searchInput ? searchInput.value.toLowerCase() : '';
    const activeFilterBtn = document.querySelector('[data-cat-filter].active');
    const filter = activeFilterBtn ? activeFilterBtn.dataset.catFilter : 'all';
    
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    const filtered = catalogEvents.filter(ev => {
        const matchesFilter = filter === 'all' || ev.type === filter;
        const matchesSearch = ev.name.toLowerCase().includes(searchVal) || 
                              ev.year.toString().includes(searchVal) ||
                              ev.typeName.toLowerCase().includes(searchVal);
        return matchesFilter && matchesSearch;
    });
    
    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: rgba(255,255,255,0.3); padding: 20px;">No events match the search criteria.</td></tr>';
        return;
    }
    
    filtered.forEach(ev => {
        const tr = document.createElement('tr');
        const coordsText = ev.type === 'solar' ? `${ev.lat.toFixed(1)}°N, ${ev.lon.toFixed(1)}°E` : '--';
        const dateStr = dateFromJD(ev.peakJD);
        const timeVal = dateStr.toUTCString().split(" ")[4] || "";
        const lang = getCurrentLanguage();
        const typeNameTranslated = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][ev.typeName]) || ev.typeName;
        const nameTranslated = translateEventName(ev.name, lang);
        const loadEventText = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang]['btn_load_event']) || 'Load Event';
        tr.innerHTML = `
            <td><strong>${nameTranslated}</strong></td>
            <td><span class="type ${ev.type}" style="text-transform: uppercase; font-size: 11px; font-weight: 700;">${typeNameTranslated}</span></td>
            <td>${timeVal}</td>
            <td>${coordsText}</td>
            <td><button class="btn btn-primary btn-sm btn-select-catalog-event" data-id="${ev.id}">${loadEventText}</button></td>
        `;
        
        tr.querySelector('.btn-select-catalog-event').addEventListener('click', () => {
            selectEvent(ev);
            document.getElementById('catalog-modal').classList.remove('active');
            
            // Adjust time filter in the sidebar to match the loaded event
            const evDate = dateFromJD(ev.peakJD);
            const now = new Date();
            const timeFilterVal = evDate >= now ? 'upcoming' : 'past';
            
            // Activate the correct time filter button
            document.querySelectorAll('[data-time-filter]').forEach(b => {
                b.classList.remove('active');
                if (b.dataset.timeFilter === timeFilterVal) {
                    b.classList.add('active');
                }
            });
            
            // Repopulate sidebar
            populateSidebarList();
            
            // Activate the corresponding sidebar event card if it exists in the 100-year list
            document.querySelectorAll('.event-card').forEach(c => {
                c.classList.remove('active');
                if (c.dataset.id === ev.id) {
                    c.classList.add('active');
                    c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        });
        
        tableBody.appendChild(tr);
    });
}

// URL Query Parameters Parser
function parseURLParameters() {
    const params = new URLSearchParams(window.location.search);

    // 1. Embed and Tab Selector modes
    if (params.get('embed') === 'true') {
        document.body.classList.add('embed-mode');
        // Hide sidebar collapsed by default if embedded
        const workspace = document.querySelector('.workspace');
        if (workspace) {
            workspace.classList.add('sidebar-collapsed', 'stats-collapsed');
        }
    }
    if (params.get('hide_tabs') === 'true') {
        document.body.classList.add('hide-tabs-mode');
    }

    // 2. Select default tab view
    const view = params.get('view');
    if (view) {
        let tabBtn = null;
        let subTabBtn = null;

        if (view === 'static') {
            tabBtn = document.querySelector('.tab-btn[data-tab="map-view"]');
            subTabBtn = document.querySelector('.map-tab-toggle[data-target="static-map-wrapper"]');
        } else if (view === 'dynamic') {
            tabBtn = document.querySelector('.tab-btn[data-tab="map-view"]');
            subTabBtn = document.querySelector('.map-tab-toggle[data-target="dynamic-map-wrapper"]');
        } else if (view === 'globe') {
            tabBtn = document.querySelector('.tab-btn[data-tab="space-view"]');
        } else if (view === 'sim') {
            tabBtn = document.querySelector('.tab-btn[data-tab="simulator-view"]');
        }

        if (tabBtn) tabBtn.click();
        if (subTabBtn) subTabBtn.click();
    }

    // 3. Select event or handle custom coordinates/dates
    const eventId = params.get('event');
    const dateStr = params.get('date');
    const lat = parseFloat(params.get('lat'));
    const lon = parseFloat(params.get('lon'));

    if (eventId && eventId !== 'custom') {
        const ev = sidebarEvents.find(e => e.id === eventId);
        if (ev) {
            selectEvent(ev);
        }
    } else if (eventId === 'custom' || dateStr || !isNaN(lat) || !isNaN(lon)) {
        // Handle custom coordinates / date
        if (!isNaN(lat) && !isNaN(lon)) {
            document.getElementById('obs-lat').value = lat;
            document.getElementById('obs-lon').value = lon;
            observerLocation = { lat, lon };
        }
        if (dateStr) {
            document.getElementById('custom-date').value = dateStr.slice(0, 16); // format datetime-local expects: YYYY-MM-DDTHH:mm
        }
        
        // Trigger calculation click
        document.getElementById('btn-calculate-custom').click();
    }

    // 4. Set timeline time or slider percent
    const timeParam = params.get('time');
    if (timeParam) {
        const val = parseFloat(timeParam);
        if (!isNaN(val) && val >= 0 && val <= 100) {
            timeSliderVal = val;
            const sliders = [
                document.getElementById('time-slider'),
                document.getElementById('sim-time-slider'),
                document.getElementById('globe-time-slider')
            ];
            sliders.forEach(slider => {
                if (slider) {
                    slider.value = val;
                }
            });
            updateTimeFromSlider();
        }
    }

    // 5. Autoplay configuration
    if (params.get('autoplay') === 'true') {
        const playBtn = document.getElementById('play-btn');
        if (playBtn && !isAnimating) {
            playBtn.click();
        }
    }
}

// ==========================================
// Internationalization (i18n) Engine
// ==========================================
function getCurrentLanguage() {
    // 1. Check URL parameters
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang && window.TRANSLATIONS && window.TRANSLATIONS[urlLang]) {
        return urlLang;
    }
    // 2. Check localStorage
    const savedLang = localStorage.getItem('selected_language');
    if (savedLang && window.TRANSLATIONS && window.TRANSLATIONS[savedLang]) {
        return savedLang;
    }
    // 3. Default to English
    return 'en';
}

function translateEventName(name, lang) {
    if (lang === 'en' || !name) return name;
    let translated = name;
    const months = {
        "January": "ጃንዋሪ", "February": "ፌብሩዋሪ", "March": "ማርች", "April": "ኤፕሪል",
        "May": "ሜይ", "June": "ጁን", "July": "ጁላይ", "August": "ኦገስት",
        "September": "ሴፕቴምበር", "October": "ኦክቶበር", "November": "ኖቬምበር", "December": "ዴሴምበር"
    };
    for (const [eng, amh] of Object.entries(months)) {
        translated = translated.replace(new RegExp(eng, 'g'), amh);
    }
    return translated;
}

function applyTranslations(lang) {
    if (!window.TRANSLATIONS || !window.TRANSLATIONS[lang]) return;
    
    // Save selection
    localStorage.setItem('selected_language', lang);
    
    // Sync language select dropdown if it exists
    const select = document.getElementById('language-select');
    if (select) select.value = lang;
    
    const dict = window.TRANSLATIONS[lang];
    
    // Translate all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = dict[key];
        if (translation) {
            if (el.tagName === 'INPUT' && el.type === 'text') {
                el.placeholder = translation;
            } else if (el.tagName === 'SELECT') {
                // translate select options if needed
            } else {
                el.textContent = translation;
            }
        }
    });

    // Translate dynamic properties in current state
    if (currentEvent) {
        document.getElementById('val-name').innerText = translateEventName(currentEvent.name, lang);
        document.getElementById('val-type').innerText = dict[currentEvent.typeName] || currentEvent.typeName;
    }

    // Refresh dynamic parts
    populateSidebarList();
    renderSliderBookmarks();
    if (activeBookmarkInfo) {
        showEventInfo(activeBookmarkInfo);
    }
    if (document.getElementById('catalog-modal') && document.getElementById('catalog-modal').classList.contains('active')) {
        renderCatalogTable();
    }
    updateLegends();
}

function updateLegends() {
    if (!currentEvent) return;

    const lang = getCurrentLanguage();
    const dict = (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || {};
    
    const isLunar = currentEvent.type === 'lunar';
    
    // Select all legend title and note elements
    const titles = document.querySelectorAll('.legend-bar-title');
    const notes = document.querySelectorAll('.legend-bar-note');
    const strips = document.querySelectorAll('.legend-gradient-strip');
    const labelContainers = document.querySelectorAll('.legend-gradient-labels');
    const globeLegend = document.querySelector('.globe-legend');

    if (isLunar) {
        // Lunar texts
        const titleText = dict['legend_title_lunar'] || "Portion of Moon covered by Earth's shadow (Lunar Eclipse coverage)";
        const noteText = dict['legend_note_lunar'] || "Four coverage zones: Partial Penumbra, Penumbral Totality, Partial Umbra, and Totality.";
        
        titles.forEach(el => el.textContent = titleText);
        notes.forEach(el => el.textContent = noteText);
        
        // Lunar gradient: No Eclipse (transparent) -> Partial Penumbra (light purple) -> Penumbral Totality (med purple) -> Partial Umbra (dark purple) -> Totality (dark red)
        strips.forEach(el => {
            el.style.background = 'linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(186, 104, 200, 0.45) 20%, rgba(123, 31, 162, 0.65) 45%, rgba(74, 20, 140, 0.85) 75%, #8a1a15 100%)';
        });
        
        // Lunar labels
        const lblNoEclipse = dict['lbl_no_eclipse'] || 'No Eclipse';
        const lblPartPen = dict['lbl_partial_penumbra'] || 'Partial Penumbra';
        const lblPenTot = dict['lbl_penumbral_totality'] || 'Penumbral Totality';
        const lblPartUmb = dict['lbl_partial_umbra'] || 'Partial Umbra';
        const lblTotUmb = dict['lbl_totality_umbra'] || 'Totality (Umbra)';
        labelContainers.forEach(el => {
            el.innerHTML = `
                <span>${lblNoEclipse}</span>
                <span>${lblPartPen}</span>
                <span>${lblPenTot}</span>
                <span>${lblPartUmb}</span>
                <span>${lblTotUmb}</span>
            `;
        });

        // Globe legend: Penumbral and Umbral details
        if (globeLegend) {
            globeLegend.innerHTML = `
                <div class="legend-item"><span class="color-dot" style="background:rgba(186, 104, 200, 0.75);"></span>${lblPartPen}</div>
                <div class="legend-item"><span class="color-dot" style="background:rgba(123, 31, 162, 0.85);"></span>${lblPenTot}</div>
                <div class="legend-item"><span class="color-dot" style="background:rgba(74, 20, 140, 0.90);"></span>${lblPartUmb}</div>
                <div class="legend-item"><span class="color-dot" style="background:#8a1a15;"></span>${lblTotUmb}</div>
            `;
        }
    } else if (currentEvent.type === 'transit') {
        // Transit texts
        const titleText = dict['legend_title_transit'] || "Planetary Transit Visibility";
        const noteText = dict['legend_note_transit'] || "Daytime regions where the planet can be seen crossing the Sun.";
        
        titles.forEach(el => el.textContent = titleText);
        notes.forEach(el => el.textContent = noteText);

        // Transit gradient: transparent (night/no transit) -> light yellow/gold (sunrise/sunset limits) -> warm orange (peak/fully visible)
        strips.forEach(el => {
            el.style.background = 'linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 224, 130, 0.35) 45%, rgba(255, 167, 38, 0.60) 100%)';
        });

        // Transit labels
        const lblNoTransit = dict['lbl_no_transit'] || 'Not Visible';
        const lblSunRiseSet = dict['lbl_sunrise_sunset'] || 'Sunrise / Sunset';
        const lblFullVis = dict['lbl_fully_visible'] || 'Fully Visible';
        labelContainers.forEach(el => {
            el.innerHTML = `
                <span>${lblNoTransit}</span>
                <span>${lblSunRiseSet}</span>
                <span>${lblFullVis}</span>
            `;
        });

        // Globe legend
        if (globeLegend) {
            globeLegend.innerHTML = `
                <div class="legend-item"><span class="color-dot" style="background:rgba(255, 224, 130, 0.8);"></span>${lblSunRiseSet}</div>
                <div class="legend-item"><span class="color-dot" style="background:rgba(255, 167, 38, 0.9);"></span>${lblFullVis}</div>
            `;
        }
    } else {
        // Solar texts
        const titleText = dict['legend_title'] || "Portion of Sun covered by the Moon (Eclipse obscuration)";
        const noteText = dict['legend_note'] || "The dark areas symbolize night and twilight.";
        
        titles.forEach(el => el.textContent = titleText);
        notes.forEach(el => el.textContent = noteText);

        // Solar gradient
        strips.forEach(el => {
            el.style.background = 'linear-gradient(to right, #ffe082 0%, #ffa726 25%, #ff7043 50%, #e53935 75%, #000000 100%)';
        });

        // Solar labels
        labelContainers.forEach(el => {
            el.innerHTML = `
                <span>0%</span>
                <span>&gt;0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
            `;
        });

        // Globe legend
        const lblObscuration = dict['lbl_obscuration_legend'] || 'Obscuration';
        if (globeLegend) {
            globeLegend.innerHTML = `
                <div class="legend-item"><span class="color-dot" style="background:#ffe082;"></span>&gt;0% ${lblObscuration}</div>
                <div class="legend-item"><span class="color-dot" style="background:#ffa726;"></span>25% ${lblObscuration}</div>
                <div class="legend-item"><span class="color-dot" style="background:#ff7043;"></span>50% ${lblObscuration}</div>
                <div class="legend-item"><span class="color-dot" style="background:#e53935;"></span>75%+ ${lblObscuration}</div>
            `;
        }
    }
}
