/**
 * Eclipses & Transits Lab - Main Application
 * Integrates 2D maps, 3D orbits, sky simulations, and developer assets.
 */

// Global state variables
let currentEvent = null;
let observerLocation = { lat: 9.0300, lon: 38.7400 }; // default: Addis Ababa
let observerMarker = null;
let currentTab = 'map-view';
let timeSliderVal = 50; // percentage along the event timeline
let animInterval = null;
let isAnimating = false;

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

// 3D Scene variables
let scene3D = {
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    earth: null,
    moon: null,
    moonOrbit: null,
    sunLight: null,
    nodesLine: null,
    orbitPlane: null,
    isGlobeMode: false,
    globeShadowDisc: null
};

// Sidebar Events Database (100-Year Catalog 2000-2100)
let sidebarEvents = [];

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    // Generate the 100-year list for the sidebar
    sidebarEvents = generate100YearCatalog();
    
    initUI();
    init2DMap();
    init3DScene();
    
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
            updateTimeFromSlider();
        });
    });

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

    // 3D Buttons
    document.getElementById('btn-toggle-orbit-plane').addEventListener('click', () => {
        if (scene3D.orbitPlane) scene3D.orbitPlane.visible = !scene3D.orbitPlane.visible;
    });
    document.getElementById('btn-reset-camera').addEventListener('click', () => {
        scene3D.controls.reset();
    });
    document.getElementById('btn-3d-mode').addEventListener('click', (e) => {
        scene3D.isGlobeMode = !scene3D.isGlobeMode;
        e.target.innerText = scene3D.isGlobeMode ? "Switch to Space Orrery View" : "Switch to Earth Globe View";
        
        // Hide/Show correct nodes
        if (scene3D.isGlobeMode) {
            scene3D.earth.position.set(0, 0, 0);
            scene3D.earth.scale.set(3, 3, 3);
            scene3D.moon.visible = false;
            scene3D.moonOrbit.visible = false;
            scene3D.orbitPlane.visible = false;
            if (scene3D.nodesLine) scene3D.nodesLine.visible = false;
            if (scene3D.globeShadowDisc) scene3D.globeShadowDisc.visible = true;
        } else {
            scene3D.earth.position.set(0, 0, 0);
            scene3D.earth.scale.set(1.5, 1.5, 1.5);
            scene3D.moon.visible = true;
            scene3D.moonOrbit.visible = true;
            scene3D.orbitPlane.visible = true;
            if (scene3D.nodesLine) scene3D.nodesLine.visible = true;
            if (scene3D.globeShadowDisc) scene3D.globeShadowDisc.visible = false;
        }
        updateViews();
    });

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
}

// 3D Orrery Setup using Three.js
function init3DScene() {
    const container = document.getElementById('canvas-container-3d');
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene3D.scene = new THREE.Scene();
    scene3D.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    scene3D.camera.position.set(0, 15, 20);

    scene3D.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    scene3D.renderer.setSize(width, height);
    scene3D.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(scene3D.renderer.domElement);

    scene3D.controls = new THREE.OrbitControls(scene3D.camera, scene3D.renderer.domElement);
    scene3D.controls.enableDamping = true;
    scene3D.controls.dampingFactor = 0.05;

    // Ambient light
    const ambient = new THREE.AmbientLight(0x222233);
    scene3D.scene.add(ambient);

    // Directional Sun Light (glowing gold)
    scene3D.sunLight = new THREE.DirectionalLight(0xfff6e0, 1.5);
    scene3D.sunLight.position.set(20, 0, 0); // shines from X-axis
    scene3D.scene.add(scene3D.sunLight);

    // Add Earth (Sphere)
    const earthGeo = new THREE.SphereGeometry(1.5, 32, 32);
    // Draw grid lines on earth to look like a telemetry schematic
    const earthMat = new THREE.MeshPhongMaterial({
        color: 0x052a6b,
        emissive: 0x021034,
        specular: 0x111111,
        shininess: 10,
        wireframe: true
    });
    scene3D.earth = new THREE.Mesh(earthGeo, earthMat);
    scene3D.scene.add(scene3D.earth);

    // Add Ecliptic plane grid decoration
    const eclipticGrid = new THREE.GridHelper(30, 30, 0x125dff, 0x223355);
    eclipticGrid.position.y = 0;
    scene3D.scene.add(eclipticGrid);

    // Moon Orbit plane & path (Tilted 5.14 degrees relative to Earth/ecliptic plane)
    scene3D.orbitPlane = new THREE.Group();
    scene3D.orbitPlane.rotation.z = 5.14 * Math.PI / 180; // Tilt!
    scene3D.scene.add(scene3D.orbitPlane);

    // Draw the orbit ring line
    const orbitRingGeo = new THREE.RingGeometry(8, 8.05, 64);
    const orbitRingMat = new THREE.MeshBasicMaterial({ color: 0x125dff, side: THREE.DoubleSide });
    scene3D.moonOrbit = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    scene3D.moonOrbit.rotation.x = Math.PI / 2;
    scene3D.orbitPlane.add(scene3D.moonOrbit);

    // Add Moon (Sphere)
    const moonGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const moonMat = new THREE.MeshPhongMaterial({ color: 0x888888, emissive: 0x111111 });
    scene3D.moon = new THREE.Mesh(moonGeo, moonMat);
    scene3D.orbitPlane.add(scene3D.moon);

    // Draw Line of Nodes (Intersection line along Y-axis or custom)
    const nodesLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-12, 0, 0),
        new THREE.Vector3(12, 0, 0)
    ]);
    const nodesLineMat = new THREE.LineBasicMaterial({ color: 0x28a745, linewidth: 2 });
    scene3D.nodesLine = new THREE.Line(nodesLineGeo, nodesLineMat);
    scene3D.scene.add(scene3D.nodesLine);

    // Create Globe mode shadow projected disc (Only shown in Earth Globe view)
    const shadowDiscGeo = new THREE.RingGeometry(0.1, 0.4, 32);
    const shadowDiscMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, opacity: 0.9, transparent: true });
    scene3D.globeShadowDisc = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
    scene3D.globeShadowDisc.visible = false;
    scene3D.scene.add(scene3D.globeShadowDisc);

    // Resize event
    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        scene3D.camera.aspect = w / h;
        scene3D.camera.updateProjectionMatrix();
        scene3D.renderer.setSize(w, h);
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        scene3D.controls.update();
        
        // Rotate Earth slowly
        if (scene3D.earth) {
            scene3D.earth.rotation.y += 0.001;
        }

        scene3D.renderer.render(scene3D.scene, scene3D.camera);
    }
    animate();
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
    timeSliderVal = 50;
    document.getElementById('time-slider').value = 50;
    document.getElementById('sim-time-slider').value = 50;

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
    
    updateViews();
}

// Animation playback controls
function startAnimation() {
    if (isAnimating) return;
    isAnimating = true;
    
    // Set play buttons to pause icon
    const playBtns = [document.getElementById('play-btn'), document.getElementById('sim-play-btn')];
    playBtns.forEach(btn => {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
    });

    animInterval = setInterval(() => {
        timeSliderVal += 0.4;
        if (timeSliderVal > 100) {
            timeSliderVal = 0; // loop
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
    
    // Set play buttons to play icon
    const playBtns = [document.getElementById('play-btn'), document.getElementById('sim-play-btn')];
    playBtns.forEach(btn => {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    });
}

// Update all visualizations
function updateViews() {
    if (!currentEvent) return;
    const activeTime = getActiveTime();

    // 1. Update 2D Map shadow overlays
    updateMapOverlays(activeTime);

    // 2. Update 3D Orrery orbits
    update3DOrbits(activeTime);
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

    // Clear and draw dynamic day/night terminator on dynamicMap
    if (dynamicTerminatorLayer) {
        dynamicMap.removeLayer(dynamicTerminatorLayer);
        dynamicTerminatorLayer = null;
    }
    const dynamicTerminatorCoords = AstronomyHelper.calculateDayNightTerminator(date);
    if (dynamicTerminatorCoords) {
        dynamicTerminatorLayer = L.polygon(dynamicTerminatorCoords, {
            fillColor: '#000000',
            fillOpacity: 0.28,
            color: 'none',
            stroke: false,
            interactive: false,
            pane: 'terminatorPane'
        }).addTo(dynamicMap);
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
                for (let offset = -360; offset <= 360; offset += 360) {
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
                            dashArray: '6, 6'
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
                                fillOpacity: 0.55,
                                stroke: false
                            }).addTo(map);
                            polygon.bindPopup(`<h4>Path of Central Eclipse</h4>`);
                            mapOverlayLayers.push(polygon);

                            const northLine = L.polyline(northSide, {
                                color: '#d84315',
                                weight: 1.5,
                                opacity: 0.8
                            }).addTo(map);
                            mapOverlayLayers.push(northLine);
                            
                            const southSideForward = central.map(pt => [pt.southLat, pt.southLon + offset]);
                            const southLine = L.polyline(southSideForward, {
                                color: '#d84315',
                                weight: 1.5,
                                opacity: 0.8
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
            for (let offset = -360; offset <= 360; offset += 360) {
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
                        dashArray: '6, 6'
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
                            fillOpacity: 0.55,
                            stroke: false
                        }).addTo(dynamicMap);
                        polygonDynamic.bindPopup(`<h4>Path of Central Eclipse</h4>`);
                        dynamicMapOverlayLayers.push(polygonDynamic);

                        const northLineDynamic = L.polyline(northSide, {
                            color: '#d84315',
                            weight: 1.5,
                            opacity: 0.8
                        }).addTo(dynamicMap);
                        dynamicMapOverlayLayers.push(northLineDynamic);

                        const southSideForward = central.map(pt => [pt.southLat, pt.southLon + offset]);
                        const southLineDynamic = L.polyline(southSideForward, {
                            color: '#d84315',
                            weight: 1.5,
                            opacity: 0.8
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
                for (let offset = -360; offset <= 360; offset += 360) {
                    const offsetCoords = footprints.umbra.coordinates.map(pt => [pt[0], pt[1] + offset]);
                    const poly = L.polygon(offsetCoords, {
                        color: type === 'Total' ? '#ff3b30' : '#ffcc00',
                        weight: 1.5,
                        fillColor: '#000000',
                        fillOpacity: 0.85
                    }).addTo(dynamicMap);
                    
                    poly.bindPopup(`<h4>${type} Shadow Core</h4>Radius: ${footprints.umbra.ru.toFixed(1)} km`);
                    shadowCenterCircles.push(poly);
                }
            }
            // Draw penumbral contours (from largest 0.01 to smallest 0.75)
            const levels = [0.01, 0.25, 0.50, 0.75];
            const styleMap = {
                0.01: { fillColor: '#ffe082', fillOpacity: 0.12, stroke: true, color: '#ffe082', weight: 1.5, opacity: 0.15, interactive: false },
                0.25: { fillColor: '#ffa726', fillOpacity: 0.18, stroke: true, color: '#ffa726', weight: 1.5, opacity: 0.22, interactive: false },
                0.50: { fillColor: '#fb8c00', fillOpacity: 0.24, stroke: true, color: '#fb8c00', weight: 1.5, opacity: 0.28, interactive: false },
                0.75: { fillColor: '#d84315', fillOpacity: 0.30, stroke: true, color: '#d84315', weight: 1.5, opacity: 0.35, interactive: false }
            };

            levels.forEach(l => {
                const coords = footprints.penumbra[l];
                if (coords && coords.length > 2) {
                    for (let offset = -360; offset <= 360; offset += 360) {
                        const offsetCoords = coords.map(pt => [pt[0], pt[1] + offset]);
                        const poly = L.polygon(offsetCoords, styleMap[l]).addTo(dynamicMap);
                        
                        const label = l === 0.01 ? "0.01 (Outer Penumbra)" : `${l.toFixed(2)}`;
                        poly.bindTooltip(`Eclipse Magnitude: &ge; ${label}`, {
                            sticky: true,
                            className: 'penumbra-contour-tooltip'
                        });
                        
                        penumbraCircles.push(poly);
                    }
                }
            });
        }

        const shadow = AstronomyHelper.calculateShadowCenter(date);
        // Update local obscuration statistics for current time & observer
        const local = AstronomyHelper.calculateLocalSolarEclipse(date, observerLocation.lat, observerLocation.lon);
        if (local) {
            document.getElementById('val-obs-obscuration').innerText = (local.obscuration * 100).toFixed(2) + "%";
            document.getElementById('val-shadow-speed').innerText = shadow ? (3400 * Math.cos(shadow.lat * Math.PI / 180)).toFixed(0) + " km/h" : "-- km/h";
        }
    } else {
        if (currentEvent.type === 'lunar') {
            document.getElementById('val-obs-obscuration').innerText = "--";
            document.getElementById('val-shadow-speed').innerText = "--";
        } else {
            document.getElementById('val-obs-obscuration').innerText = "--";
            document.getElementById('val-shadow-speed').innerText = "--";
        }
    }
}




// 3D Orrery Orbit Updates
function update3DOrbits(date) {
    // Calculate Moon orbital angular angle based on date
    // Normalize slider 0-100 to angle in radians [0, 2*PI]
    const angle = (timeSliderVal / 100) * 2 * Math.PI;

    if (scene3D.isGlobeMode) {
        // Globe Mode: project shadow onto rotating 3D Earth
        if (currentEvent.type === 'solar') {
            const shadow = AstronomyHelper.calculateShadowCenter(date);
            if (shadow) {
                // Spherical to Cartesian coordinates
                const latRad = shadow.lat * Math.PI / 180;
                const lonRad = shadow.lon * Math.PI / 180;
                
                const R = 3.02; // Slightly above earth mesh radius (3.0)
                const x = R * Math.cos(latRad) * Math.cos(lonRad);
                const y = R * Math.sin(latRad);
                const z = -R * Math.cos(latRad) * Math.sin(lonRad);
                
                scene3D.globeShadowDisc.position.set(x, y, z);
                scene3D.globeShadowDisc.lookAt(new THREE.Vector3(0, 0, 0));
                scene3D.globeShadowDisc.visible = true;
            } else {
                scene3D.globeShadowDisc.visible = false;
            }
        }
    } else {
        // Orrery Mode: place Moon on its orbits
        const radius = 8.0;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        scene3D.moon.position.set(x, 0, z);

        // Update telemetry indicators
        const eclipticDist = Math.abs(x * Math.sin(5.14 * Math.PI / 180) * 384400 / 8.0).toFixed(0);
        document.getElementById('val-3d-ecliptic-dist').innerText = eclipticDist + " km";
        
        const alignmentAngle = Math.abs(angle * 180 / Math.PI - 180).toFixed(1);
        document.getElementById('val-3d-alignment-angle').innerText = alignmentAngle + "°";
        
        const nodeAngle = (5.14 * Math.sin(angle)).toFixed(2);
        document.getElementById('val-3d-node-angle').innerText = nodeAngle + "°";
    }
}

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
                    <img src="${data.url}" alt="${data.title}" loading="lazy">
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
            // Fallback: search the public image library for the event name or type
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
                                    <img src="${imgUrl}" alt="${title}" loading="lazy">
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
