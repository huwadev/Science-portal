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

// Globe animation state
let globeSliderVal = 0;
let globeAnimInterval = null;
let isGlobeAnimating = false;
let globeSpeedMultiplier = 5;

// Sidebar Events Database (100-Year Catalog 2000-2100)
let sidebarEvents = [];

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    // Generate the 100-year list for the sidebar
    sidebarEvents = generate100YearCatalog();
    
    initUI();
    init2DMap();
    initGlobeScene();
    
    // Find next upcoming eclipse starting from today (2026-07-14)
    const now = new Date();
    let defaultEv = sidebarEvents.find(ev => dateFromJD(ev.peakJD) > now);
    if (!defaultEv) defaultEv = sidebarEvents[0];
    
    selectEvent(defaultEv);
    loadKotlinFiles();
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

    // Time Sliders
    const sliders = [document.getElementById('time-slider'), document.getElementById('sim-time-slider')];
    sliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            if (isAnimating) {
                stopAnimation();
            }
            timeSliderVal = parseFloat(e.target.value);
            sliders.forEach(s => s.value = timeSliderVal);
            updateSliderGradient();
            updateTimeFromSlider();
        });
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
            loopBtn.classList.toggle('active', isLooping);
        });
    }

    // Speed Select
    const speedSelect = document.getElementById('speed-select');
    if (speedSelect) {
        speedSelect.addEventListener('change', (e) => {
            simSpeedMultiplier = parseFloat(e.target.value) || 5;
        });
    }

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
                const customEv = {
                    id: "custom",
                    name: "Custom Calculation",
                    year: customDate.getUTCFullYear(),
                    type: "solar", // default
                    typeName: "Local View",
                    peakTime: customDate.toISOString(),
                    peakJD: Astronomy.MakeTime(customDate).value,
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

    // Globe Playback Controls
    const globePlayBtn = document.getElementById('globe-play-btn');
    if (globePlayBtn) {
        globePlayBtn.addEventListener('click', () => {
            toggleGlobeAnimation();
        });
    }
    const globeRestartBtn = document.getElementById('globe-restart-btn');
    if (globeRestartBtn) {
        globeRestartBtn.addEventListener('click', () => {
            globeSliderVal = 0;
            document.getElementById('globe-time-slider').value = 0;
            stopGlobeAnimation();
            updateGlobeView();
        });
    }
    const globePrevBtn = document.getElementById('globe-prev-btn');
    if (globePrevBtn) {
        globePrevBtn.addEventListener('click', () => {
            globeSliderVal = Math.max(0, globeSliderVal - 1);
            document.getElementById('globe-time-slider').value = globeSliderVal;
            updateGlobeView();
        });
    }
    const globeNextBtn = document.getElementById('globe-next-btn');
    if (globeNextBtn) {
        globeNextBtn.addEventListener('click', () => {
            globeSliderVal = Math.min(100, globeSliderVal + 1);
            document.getElementById('globe-time-slider').value = globeSliderVal;
            updateGlobeView();
        });
    }
    const globeTimeSlider = document.getElementById('globe-time-slider');
    if (globeTimeSlider) {
        globeTimeSlider.addEventListener('input', (e) => {
            globeSliderVal = parseFloat(e.target.value);
            updateGlobeView();
        });
    }
    const globeSpeedSelect = document.getElementById('globe-speed-select');
    if (globeSpeedSelect) {
        globeSpeedSelect.addEventListener('change', (e) => {
            globeSpeedMultiplier = parseInt(e.target.value);
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
        updateViews();
    });

    dynamicObserverMarker.on('dragend', (e) => {
        const pos = dynamicObserverMarker.getLatLng();
        observerLocation = { lat: pos.lat, lon: pos.lng };
        observerMarker.setLatLng(pos);
        document.getElementById('obs-lat').value = pos.lat.toFixed(4);
        document.getElementById('obs-lon').value = pos.lng.toFixed(4);
        updateViews();
    });

    // 6. Synchronize Map Clicks
    map.on('click', (e) => {
        observerLocation = { lat: e.latlng.lat, lon: e.latlng.lng };
        observerMarker.setLatLng(e.latlng);
        dynamicObserverMarker.setLatLng(e.latlng);
        document.getElementById('obs-lat').value = e.latlng.lat.toFixed(4);
        document.getElementById('obs-lon').value = e.latlng.lng.toFixed(4);
        updateViews();
    });

    dynamicMap.on('click', (e) => {
        observerLocation = { lat: e.latlng.lat, lon: e.latlng.lng };
        observerMarker.setLatLng(e.latlng);
        dynamicObserverMarker.setLatLng(e.latlng);
        document.getElementById('obs-lat').value = e.latlng.lat.toFixed(4);
        document.getElementById('obs-lon').value = e.latlng.lng.toFixed(4);
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
    if (!currentEvent || currentEvent.type !== 'solar') {
        hideHoverTooltip(tooltipId);
        return;
    }
    const lat = event.latlng.lat;
    const lon = event.latlng.lng;
    
    // Bounds check to avoid calculation overflows
    if (lat < -90 || lat > 90) {
        hideHoverTooltip(tooltipId);
        return;
    }

    let obscuration = 0;
    let magnitude = 0;

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
            // For partial eclipses: obscuration ≈ arccos(1-2m)/π - (1-2m)*sqrt(4m-4m²)/π  (where m = magnitude)
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
        const tooltip = document.getElementById(tooltipId);
        if (tooltip) {
            tooltip.innerHTML = `
                <div style="font-weight:700; margin-bottom: 2px;">Exact Location Info</div>
                <div><strong>Obscuration:</strong> ${(obscuration * 100).toFixed(1)}%</div>
                <div><strong>Magnitude:</strong> ${magnitude.toFixed(3)}</div>
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

    // Earth Globe — flat lit (MeshBasicMaterial) for uniform contrast
    const earthGeo = new THREE.SphereGeometry(2, 96, 96);
    const earthMat = new THREE.MeshBasicMaterial({
        map: earthTexture
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
    ctx.beginPath();
    rings.forEach((ring, ringIdx) => {
        if (ring.length < 3) return;
        for (let i = 0; i < ring.length; i++) {
            const [lon, lat] = ring[i];
            const x = ((lon + 180) / 360) * W;
            const y = ((90 - lat) / 180) * H;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
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
    if (!isGlobeAnimating && globeSliderVal === 0) {
        drawContoursOnCanvas(ctx, scene3D.staticContours, W, H);
    } else {
        drawContoursOnCanvas(ctx, scene3D.instantaneousContours, W, H);
        
        // Draw shadow center black dot
        if (currentEvent && currentEvent.type === 'solar') {
            const ev = currentEvent;
            const durationHours = 6;
            const startJD = ev.peakJD - durationHours / 48;
            const fraction = globeSliderVal / 100;
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

    // Sort features from outermost (lowest threshold) to innermost (highest) to layer properly
    const sorted = [...features].sort((a, b) => {
        const ma = a.properties ? (a.properties.magnitude || a.properties.threshold || 0) : 0;
        const mb = b.properties ? (b.properties.magnitude || b.properties.threshold || 0) : 0;
        return ma - mb;
    });

    sorted.forEach(feature => {
        const threshold = feature.properties ? feature.properties.magnitude || feature.properties.threshold : 0.01;
        const style = styleMap[threshold] || styleMap[0.01];

        ctx.fillStyle = style.fillColor;
        ctx.strokeStyle = style.strokeColor;
        ctx.lineWidth = 1.0;

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

    // To prevent antimeridian crossing cuts/fraying, draw the polygon path
    // with three offset copies: shifted left by W, centered, and shifted right by W.
    // This allows unrolled coordinates outside [-180, 180] to wrap seamlessly.
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
    if (!currentEventTrack || currentEventTrack.length === 0) return;

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
    const fraction = globeSliderVal / 100;
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
        if (isGlobeAnimating || globeSliderVal > 0) {
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
            }
            scene3D.instantaneousContours = dynamicFeatures;
        }
    }

    // Draw the active canvas texture layers
    drawGlobeLayers();
}

/**
 * Toggle animation state
 */
function toggleGlobeAnimation() {
    if (isGlobeAnimating) {
        stopGlobeAnimation();
    } else {
        startGlobeAnimation();
    }
}

function startGlobeAnimation() {
    isGlobeAnimating = true;
    const playBtn = document.getElementById('globe-play-btn');
    if (playBtn) {
        playBtn.querySelector('.play-icon').style.display = 'none';
        playBtn.querySelector('.pause-icon').style.display = 'block';
    }

    if (globeAnimInterval) clearInterval(globeAnimInterval);
    globeAnimInterval = setInterval(() => {
        globeSliderVal += 0.15 * globeSpeedMultiplier;
        if (globeSliderVal >= 100) {
            globeSliderVal = 0;
        }
        document.getElementById('globe-time-slider').value = globeSliderVal;
        updateGlobeView();
    }, 30);
}

function stopGlobeAnimation() {
    isGlobeAnimating = false;
    const playBtn = document.getElementById('globe-play-btn');
    if (playBtn) {
        playBtn.querySelector('.play-icon').style.display = 'block';
        playBtn.querySelector('.pause-icon').style.display = 'none';
    }
    if (globeAnimInterval) {
        clearInterval(globeAnimInterval);
        globeAnimInterval = null;
    }
}

// Select Preset Event
function selectEvent(ev) {
    currentEvent = ev;
    stopAnimation();

    // Set side panel values
    document.getElementById('val-name').innerText = ev.name;
    document.getElementById('val-type').innerText = ev.typeName;
    
    const peakDate = dateFromJD(ev.peakJD);
    document.getElementById('val-peak-time').innerText = formatDate(peakDate) + " " + peakDate.toUTCString().split(" ")[4] + " UTC";
    document.getElementById('val-duration').innerText = ev.duration;

    // Reset Sliders
    timeSliderVal = 0;
    document.getElementById('time-slider').value = 0;
    document.getElementById('sim-time-slider').value = 0;
    updateSliderGradient();

    // Reset Globe Slider & Animation
    globeSliderVal = 0;
    const globeTimeSlider = document.getElementById('globe-time-slider');
    if (globeTimeSlider) globeTimeSlider.value = 0;
    stopGlobeAnimation();

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

    // Load NASA photos
    fetchNASAImages(ev);

    // Update time from slider (which will also call updateViews)
    updateTimeFromSlider();
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
    const slider = document.getElementById('time-slider');
    if (slider) {
        const pct = ((slider.value - slider.min) / (slider.max - slider.min) * 100).toFixed(1) + '%';
        slider.style.setProperty('--pct', pct);
    }
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

    animInterval = setInterval(() => {
        timeSliderVal += 0.08 * simSpeedMultiplier;
        if (timeSliderVal > 100) {
            if (isLooping) {
                timeSliderVal = 0;
            } else {
                timeSliderVal = 100;
                stopAnimation();
            }
        }
        
        const sliders = [document.getElementById('time-slider'), document.getElementById('sim-time-slider')];
        sliders.forEach(s => s.value = timeSliderVal);
        updateTimeFromSlider();
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
    
    const simPlayBtn = document.getElementById('sim-play-btn');
    if (simPlayBtn) {
        if (isAnimating) {
            simPlayBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
        } else {
            simPlayBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
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

        // Draw solar-specific static track lines on map
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
    } else {
        // Non-solar: hide shadow center marker
        if (shadowCenterMarker && dynamicMap.hasLayer(shadowCenterMarker)) {
            dynamicMap.removeLayer(shadowCenterMarker);
        }
        if (currentEvent.type === 'lunar') {
            document.getElementById('val-obs-obscuration').innerText = "--";
            document.getElementById('val-shadow-speed').innerText = "--";
        } else {
            document.getElementById('val-obs-obscuration').innerText = "--";
            document.getElementById('val-shadow-speed').innerText = "--";
        }
    }
}




// Deprecated update3DOrbits (orrery moved to orrery-3d.js)

// Local Sky Simulator Canvas rendering
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

        // Draw Sky Background gradient depending on Sun altitude and obscuration
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
        
        // During totality, the sky goes pitch black
        const obsc = local.obscuration;
        const baseColor = `rgba(${Math.floor(13 * (1 - obsc))}, ${Math.floor(27 * (1 - obsc))}, ${Math.floor(66 * (1 - obsc))}, 1)`;
        skyGrad.addColorStop(0, baseColor);
        skyGrad.addColorStop(1, '#000000');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H);

        // Draw stars if sky is dark
        if (obsc > 0.8) {
            ctx.fillStyle = 'rgba(255,255,255,' + ((obsc - 0.8)/0.2) + ')';
            for (let i = 0; i < 30; i++) {
                const sx = (Math.sin(i * 1234.56) * 0.5 + 0.5) * W;
                const sy = (Math.cos(i * 5678.90) * 0.5 + 0.5) * H;
                ctx.fillRect(sx, sy, 1.5, 1.5);
            }
        }

        // Draw local altitude telemetry values
        document.getElementById('val-sun-alt').innerText = local.sunAlt.toFixed(2) + "°";
        document.getElementById('val-sun-az').innerText = local.sunAz.toFixed(2) + "°";
        document.getElementById('val-obscuration').innerText = (local.obscuration * 100).toFixed(2) + "%";
        document.getElementById('val-magnitude').innerText = local.magnitude.toFixed(3);

        const scale = 220 / local.sunRadius; // Map Sun angular size to radius of ~110px

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
        
        // Reset shadows
        ctx.shadowBlur = 0;

        // Draw Moon (Dark circle overlay)
        // Convert J2000 relative separation coordinates to pixels
        const separationPixels = local.separation * scale;
        // Position offset
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
            
            // Draw diamond rays
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

    } else if (currentEvent.type === 'lunar') {
        const local = AstronomyHelper.calculateLocalLunarEclipse(date);
        if (!local) return;

        // Deep Space background
        ctx.fillStyle = '#010410';
        ctx.fillRect(0, 0, W, H);

        document.getElementById('val-sun-alt').innerText = "--";
        document.getElementById('val-sun-az').innerText = "--";
        document.getElementById('val-obscuration').innerText = (local.obscuration * 100).toFixed(2) + "%";
        document.getElementById('val-magnitude').innerText = local.type;

        const scale = 110 / local.moonRadius; // scale Moon radius to ~50px

        const dx = local.dx * scale;
        const dy = -local.dy * scale;

        // Draw Earth Penumbra (Light shadow)
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.arc(cx, cy, local.penumbraRadius * scale, 0, 2*Math.PI);
        ctx.fill();

        // Draw Earth Umbra (Deep shadow with reddish blood moon border glow)
        ctx.fillStyle = 'rgba(10,2,2,0.95)';
        ctx.strokeStyle = 'rgba(220,53,69,0.3)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, local.umbraRadius * scale, 0, 2*Math.PI);
        ctx.fill();
        ctx.stroke();

        // Draw Moon
        // Base moon color
        ctx.fillStyle = '#c4c4c4';
        ctx.beginPath();
        const moonRadius = local.moonRadius * scale;
        ctx.arc(cx + dx, cy + dy, moonRadius, 0, 2*Math.PI);
        ctx.fill();

        // Overlay Earth shadow on the Moon (color calculation)
        const distToCenter = Math.sqrt(dx*dx + dy*dy);
        const rUmbra = local.umbraRadius * scale;

        if (distToCenter < rUmbra + moonRadius) {
            // Moon overlaps with umbral shadow
            ctx.save();
            // Clip to Moon disk
            ctx.beginPath();
            ctx.arc(cx + dx, cy + dy, moonRadius, 0, 2*Math.PI);
            ctx.clip();

            // Draw Red Umbra color (Blood moon)
            ctx.fillStyle = 'rgba(175, 40, 20, 0.75)';
            ctx.beginPath();
            ctx.arc(cx, cy, rUmbra, 0, 2*Math.PI);
            ctx.fill();
            
            // Draw darkest center
            ctx.fillStyle = 'rgba(20, 5, 2, 0.85)';
            ctx.beginPath();
            ctx.arc(cx, cy, rUmbra * 0.8, 0, 2*Math.PI);
            ctx.fill();

            ctx.restore();
        }

    } else if (currentEvent.type === 'transit') {
        // Planetary Transit
        const transitBody = Astronomy.Body.Mercury; // Venus would use Venus
        const local = AstronomyHelper.calculateTransit(date, transitBody, observerLocation.lat, observerLocation.lon);

        if (!local) return;

        // Sky Background
        ctx.fillStyle = '#060a1d';
        ctx.fillRect(0, 0, W, H);

        document.getElementById('val-sun-alt').innerText = local.sunAlt.toFixed(2) + "°";
        document.getElementById('val-sun-az').innerText = local.sunAz.toFixed(2) + "°";
        document.getElementById('val-obscuration').innerText = "0.01% (Tiny)";
        document.getElementById('val-magnitude').innerText = "Transit Active: " + (local.isTransit ? "YES" : "NO");

        const scale = 160 / local.sunRadius; // Map Sun angular size to radius of ~110px

        // Draw Sun
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffcc00';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 140, 0, 2*Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw planet as a tiny black dot crossing the Sun
        const dx = local.dx * scale;
        const dy = -local.dy * scale;

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        // Radii drawn slightly larger for visibility
        ctx.arc(cx + dx, cy + dy, 4.5, 0, 2*Math.PI);
        ctx.fill();
    }
}

// Fetch Real Historical Eclipse/Transit images from NASA APIs using API key
function fetchNASAImages(ev) {
    const gallery = document.getElementById('nasa-gallery');
    gallery.innerHTML = '<div class="gallery-placeholder">Fetching images from NASA Archives...</div>';
    
    const apiKey = 'JQkcP2cMpBoTd2WWMrCrnJ8PN5m99E3N7HZ2gGsk';
    
    // Extract date from event
    const peakDate = dateFromJD(ev.peakJD);
    const dateString = peakDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const today = new Date();
    const isFuture = peakDate.getTime() > today.getTime();
    
    if (isFuture) {
        // Skip APOD query for future events to avoid console 400 errors
        triggerNASAArchiveSearch(ev, gallery);
    } else {
        // Query APOD for the specific date of the eclipse using the API key
        fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${dateString}`)
            .then(res => {
                if (!res.ok) throw new Error("APOD not available for this exact date");
                return res.json();
            })
            .then(data => {
                if (data.media_type === 'image') {
                    gallery.innerHTML = '';
                    const card = document.createElement('div');
                    card.className = 'nasa-apod-card';
                    card.innerHTML = `
                        <img src="${data.url}" alt="${data.title}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="nasa-card-placeholder" style="display: none; height: 140px; justify-content: center; align-items: center; background: linear-gradient(135deg, rgba(2,16,52,0.6), rgba(6,12,32,0.8)); color: rgba(255,255,255,0.4); font-size: 11px; flex-direction: column;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 24px; height: 24px; margin-bottom: 6px;">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            <span>Photograph Offline</span>
                        </div>
                        <div class="info">
                            <div class="title" title="${data.title}">${data.title}</div>
                            <div class="date">NASA APOD • ${data.date}</div>
                        </div>
                    `;
                    gallery.appendChild(card);
                } else {
                    throw new Error("APOD is not an image");
                }
            })
            .catch(err => {
                triggerNASAArchiveSearch(ev, gallery);
            });
    }
}

function triggerNASAArchiveSearch(ev, gallery) {
    const query = ev.type === 'transit' ? 'transit of mercury' : 'solar eclipse';
    fetch(`https://images-api.nasa.gov/search?q=${query}&media_type=image`)
        .then(res => res.json())
        .then(data => {
            const items = data.collection.items;
            if (items && items.length > 0) {
                gallery.innerHTML = '';
                let count = 0;
                for (let i = 0; i < items.length && count < 2; i++) {
                    const item = items[i];
                    if (item.links && item.links[0]) {
                        const imgUrl = item.links[0].href;
                        const title = item.data[0].title;
                        const dateStr = new Date(item.data[0].date_created).toLocaleDateString();
                        
                        const card = document.createElement('div');
                        card.className = 'nasa-apod-card';
                        card.innerHTML = `
                            <img src="${imgUrl}" alt="${title}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="nasa-card-placeholder" style="display: none; height: 140px; justify-content: center; align-items: center; background: linear-gradient(135deg, rgba(2,16,52,0.6), rgba(6,12,32,0.8)); color: rgba(255,255,255,0.4); font-size: 11px; flex-direction: column;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 24px; height: 24px; margin-bottom: 6px;">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                                <span>Photograph Offline</span>
                            </div>
                            <div class="info">
                                <div class="title" title="${title}">${title}</div>
                                <div class="date">NASA Archive • ${dateStr}</div>
                            </div>
                        `;
                        gallery.appendChild(card);
                        count++;
                    }
                }
            } else {
                gallery.innerHTML = '<div class="gallery-placeholder">No matching NASA photographs found.</div>';
            }
        })
        .catch(() => {
            gallery.innerHTML = '<div class="gallery-placeholder">Unable to load NASA gallery.</div>';
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
        card.innerHTML = `
            <div class="title">${ev.name}</div>
            <div class="meta">
                <span class="type ${ev.type}">${ev.typeName}</span>
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
        tr.innerHTML = `
            <td><strong>${ev.name}</strong></td>
            <td><span class="type ${ev.type}" style="text-transform: uppercase; font-size: 11px; font-weight: 700;">${ev.typeName}</span></td>
            <td>${timeVal}</td>
            <td>${coordsText}</td>
            <td><button class="btn btn-primary btn-sm btn-select-catalog-event" data-id="${ev.id}">Load Event</button></td>
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
