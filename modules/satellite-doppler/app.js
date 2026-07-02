// ==========================================================================
// MODULE: LEO SATELLITE PASS & DOPPLER CALCULATOR
// ==========================================================================

// Global Constants
const EARTH_RADIUS_KM = 6378.137;
const SPEED_OF_LIGHT_KMS = 299792.458;
const AUDIO_DOPPLER_SCALE = 50.0; // Simulated acoustic speed to make shift audible (50 km/s)

// State Management
const state = {
    // Ground Station
    station: {
        name: "Entoto, Addis Ababa (Ethiopia)",
        lat: 9.096,
        lon: 38.722,
        alt: 3200 // meters
    },
    minEl: 5.0, // degrees
    
    // Satellite
    satName: "ETRSS-1",
    tleLine1: "1 44884U 19093F   26166.58763888  .00004933  00000+0  39363-3 0  9999",
    tleLine2: "2 44884  97.7862 256.4706 0017963  41.0988 319.1585 15.00635907352182",
    satrec: null,
    
    // Radio & Audio Settings
    txFreq: 137.500, // MHz
    audioEnabled: false,
    beaconType: "telemetry-ping", // "telemetry-ping" or "morse-esss"
    volume: 0.4,
    
    // Modes & Animation
    mode: "live", // "live" or "pass"
    animation: {
        playing: false,
        intervalId: null,
        currentIndex: 0,
        speed: 1, // time warp factor: 1x, 10x, 60x, 300x
        lastTime: 0
    },
    
    // Loaded Pass Data
    activePass: null, // { aos, los, maxEl, maxElTime, points: [{time, el, az, range, rangeRate, lat, lon, alt}] }
    upcomingPasses: [],
    
    // Map & Visual Markers
    map: null,
    stationMarker: null,
    stationCircle: null,
    satMarker: null,
    trackPolylines: [], // Array of Leaflet polylines
    
    // Audio Web nodes
    audioCtx: null,
    oscillator: null,
    gatingGain: null,
    masterGain: null,
    morseIntervalId: null,
    morseStep: 0,
    
    // Charts
    chart: null
};

// Satellites Presets (Retrieved Live Elements for 2026-06-15)
const SAT_PRESETS = {
    "etrss-1": {
        name: "ETRSS-1",
        freq: 137.500,
        line1: "1 44884U 19093F   26166.58763888  .00004933  00000+0  39363-3 0  9999",
        line2: "2 44884  97.7862 256.4706 0017963  41.0988 319.1585 15.00635907352182"
    },
    "iss": {
        name: "ISS (Zarya)",
        freq: 145.800,
        line1: "1 25544U 98067A   26166.51237796  .00007685  00000+0  14626-3 0  9998",
        line2: "2 25544  51.6337 308.3821 0004850 189.0196 171.0706 15.49243792571497"
    },
    "noaa-19": {
        name: "NOAA 19",
        freq: 137.100,
        line1: "1 33591U 09005A   26166.56361701  .00000032  00000+0  41094-4 0  9991",
        line2: "2 33591  98.9521 237.4372 0014357  38.8573 321.3629 14.13474085894250"
    },
    "ao-91": {
        name: "RADFXSAT (AO-91)",
        freq: 145.960,
        line1: "1 43017U 17073E   26166.62044886  .00007281  00000+0  31888-3 0  9990",
        line2: "2 43017  97.4705  33.8675 0149766 334.7230  24.6723 15.12698959465156"
    }
};

const STATION_PRESETS = {
    "addis-ababa": {
        name: "Entoto, Addis Ababa (Ethiopia)",
        lat: 9.096,
        lon: 38.722,
        alt: 3200
    },
    "tromso": {
        name: "Tromsø (Norway - Polar)",
        lat: 69.66,
        lon: 18.94,
        alt: 130
    },
    "mcmurdo": {
        name: "McMurdo Station (Antarctica)",
        lat: -77.85,
        lon: 166.67,
        alt: 10
    }
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    initSatelliteRec();
    initLeafletMap();
    initDopplerChart();
    attachEventListeners();
    
    // Start real-time live tracking
    calculatePasses();
    runLiveLoop();
});

// Setup TLE Propagation Record
function initSatelliteRec() {
    try {
        state.satrec = satellite.twoline2satrec(state.tleLine1, state.tleLine2);
    } catch (e) {
        console.error("Error parsing TLE lines:", e);
        alert("Invalid TLE format. Please correct it.");
    }
}

// Initialise Leaflet map with Dark Matter tiles
function initLeafletMap() {
    state.map = L.map('leaflet-map', {
        zoomControl: true,
        attributionControl: true
    }).setView([state.station.lat, state.station.lon], 3);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(state.map);

    // Custom station marker
    const stationHtml = `<div style="background:#125DFF; width:12px; height:12px; border-radius:50%; border:2px solid #FFF; box-shadow:0 0 10px #125DFF;"></div>`;
    const stationIcon = L.divIcon({
        html: stationHtml,
        className: 'station-ping-marker',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    state.stationMarker = L.marker([state.station.lat, state.station.lon], { icon: stationIcon })
        .addTo(state.map)
        .bindPopup(`<b>Ground Station</b><br>${state.station.name}`);

    // Custom satellite marker (static cyan icon)
    const satHtml = `<div style="background:#00FF80; width:12px; height:12px; border-radius:50%; border:2px solid #FFF; box-shadow:0 0 10px #00FF80;"></div>`;
    const satIcon = L.divIcon({
        html: satHtml,
        className: 'sat-icon-marker',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });

    state.satMarker = L.marker([0, 0], { icon: satIcon }).addTo(state.map);

    // Add coverage and footprint circles
    state.stationCircle = L.circle([state.station.lat, state.station.lon], {
        color: '#125DFF',
        fillColor: '#125DFF',
        fillOpacity: 0.04,
        weight: 1.5,
        radius: 2000000 // Placeholder 2000km, updated dynamically
    }).addTo(state.map);
    
    updateStationCoverageRadius();
    drawMapGraticule();
}

function drawMapGraticule() {
    const graticuleColor = 'rgba(222, 235, 255, 0.06)'; // Subtle blue grid lines
    const graticuleWeight = 0.8;
    
    // Draw latitude lines (parallels) every 30 degrees
    for (let lat = -60; lat <= 60; lat += 30) {
        L.polyline([[lat, -180], [lat, 180]], {
            color: graticuleColor,
            weight: graticuleWeight,
            interactive: false
        }).addTo(state.map);
    }
    
    // Draw longitude lines (meridians) every 30 degrees
    for (let lon = -180; lon <= 180; lon += 30) {
        L.polyline([[-85, lon], [85, lon]], {
            color: graticuleColor,
            weight: graticuleWeight,
            interactive: false
        }).addTo(state.map);
    }
}

// Update coverage radius of the station based on station's altitude and selected satellite's typical orbit height
function updateStationCoverageRadius() {
    if (!state.satrec) return;
    
    // Get average altitude from satellite
    const now = new Date();
    const look = getLookAngles(state.satrec, getObserverGd(), now);
    const satAlt = look ? look.alt : 600; // default to 600km if error
    
    const R = EARTH_RADIUS_KM;
    const theta = state.minEl * Math.PI / 180; // radians
    
    // Central angle beta representing circle range along Earth surface
    const innerValue = (R * Math.cos(theta)) / (R + satAlt);
    const beta = (Math.PI / 2) - theta - Math.asin(innerValue);
    const radiusMeters = R * beta * 1000;
    
    state.stationCircle.setRadius(radiusMeters);
}

// Calculate Look Angles and orbital coordinates at specific date
function getLookAngles(satrec, observerGd, date) {
    try {
        const gmst = satellite.gstime(
            date.getUTCFullYear(),
            date.getUTCMonth() + 1,
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds()
        );
        const positionAndVelocity = satellite.propagate(
            satrec,
            date.getUTCFullYear(),
            date.getUTCMonth() + 1,
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds()
        );
        const positionEci = positionAndVelocity.position;
        if (!positionEci) return null;
        
        const positionEcf = satellite.eciToEcf(positionEci, gmst);
        const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);
        
        const el = lookAngles.elevation * 180 / Math.PI;
        const az = lookAngles.azimuth * 180 / Math.PI;
        const range = lookAngles.rangeSat; // km
        
        // Convert to latitude & longitude of ground track
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        const lat = positionGd.latitude * 180 / Math.PI;
        const lon = positionGd.longitude * 180 / Math.PI;
        const alt = positionGd.height; // km
        
        return { elevation: el, azimuth: az, range, lat, lon, alt, date };
    } catch (e) {
        return null;
    }
}

// Calculate precise range rate (velocity along line-of-sight) using central differences
function getRangeRate(satrec, observerGd, date) {
    const dt = 1000; // 1 second step
    const lookA = getLookAngles(satrec, observerGd, new Date(date.getTime() - dt));
    const lookB = getLookAngles(satrec, observerGd, new Date(date.getTime() + dt));
    if (!lookA || !lookB) return 0;
    return (lookB.range - lookA.range) / 2.0; // km/s
}

// Helper to bundle observer geodetic parameters
function getObserverGd() {
    return {
        latitude: state.station.lat * Math.PI / 180, // radians
        longitude: state.station.lon * Math.PI / 180, // radians
        height: state.station.alt / 1000 // km
    };
}

// Main real-time live tracking loop
function runLiveLoop() {
    setInterval(() => {
        if (state.mode === "live") {
            updateLiveTracking();
        }
    }, 1000);
}

function updateLiveTracking() {
    const now = new Date();
    if (!state.satrec) return;
    
    const observerGd = getObserverGd();
    const look = getLookAngles(state.satrec, observerGd, now);
    
    if (!look) {
        setTelemetryDisconnected();
        return;
    }
    
    const rangeRate = getRangeRate(state.satrec, observerGd, now);
    const dopplerShiftKHz = -state.txFreq * (rangeRate / SPEED_OF_LIGHT_KMS) * 1000;
    const rxFreq = state.txFreq + (dopplerShiftKHz / 1000);
    
    // Update Telemetry panel
    document.getElementById("t-elevation").innerHTML = `${look.elevation.toFixed(1)} <small>\u00B0</small>`;
    document.getElementById("t-azimuth").innerHTML = `${look.azimuth.toFixed(1)} <small>\u00B0</small>`;
    document.getElementById("t-range").innerHTML = `${Math.round(look.range)} <small>km</small>`;
    document.getElementById("t-range-rate").innerHTML = `${rangeRate.toFixed(3)} <small>km/s</small>`;
    document.getElementById("t-doppler-shift").innerHTML = `${dopplerShiftKHz.toFixed(3)} <small>kHz</small>`;
    document.getElementById("t-rx-freq").innerHTML = `${rxFreq.toFixed(5)} <small>MHz</small>`;
    
    // Update Map
    state.satMarker.setLatLng([look.lat, look.lon]);
    
    // Update Sky Radar view
    updateSkyRadarDot(look.elevation, look.azimuth);
    
    // Draw full orbital ground track for live view
    drawOrbitalGroundTrack();
    
    // Update Scrubber text
    document.getElementById("lbl-scrubber-time").innerText = `Live UTC: ${now.toISOString().substring(11, 19)}`;
    
    // Feed range rate to audio generator
    updateAudioFrequencies(rangeRate, look.elevation >= state.minEl);
}

function setTelemetryDisconnected() {
    document.getElementById("t-elevation").innerText = "--";
    document.getElementById("t-azimuth").innerText = "--";
    document.getElementById("t-range").innerText = "--";
    document.getElementById("t-range-rate").innerText = "--";
    document.getElementById("t-doppler-shift").innerText = "--";
    document.getElementById("t-rx-freq").innerText = "--";
}

// Convert look angles to SVG Coordinates for Polar horizon tracker
function updateSkyRadarDot(elevation, azimuth) {
    const radarDot = document.getElementById("sky-sat-marker");
    
    if (elevation < 0) {
        radarDot.style.display = "none";
        return;
    }
    
    radarDot.style.display = "block";
    const maxRadarRadius = 100;
    
    // Radial distance is proportional to (90 - elevation)
    const r = maxRadarRadius * (1 - (elevation / 90.0));
    
    const azRad = azimuth * Math.PI / 180;
    const x = 110 + r * Math.sin(azRad);
    const y = 110 - r * Math.cos(azRad); // Screen Y goes down
    
    radarDot.setAttribute("transform", `translate(${x}, ${y})`);
}

// Clear all map polylines
function clearTrackPolylines() {
    state.trackPolylines.forEach(p => state.map.removeLayer(p));
    state.trackPolylines = [];
}

// Draw satellite ground track line for the next full orbit (approx 100 mins) in Live mode
function drawOrbitalGroundTrack() {
    clearTrackPolylines();
    
    const now = Date.now();
    const observerGd = getObserverGd();
    const points = [];
    
    // Sample points for the next 100 mins in 1-min steps
    for (let m = 0; m <= 100; m += 1) {
        const date = new Date(now + m * 60000);
        const look = getLookAngles(state.satrec, observerGd, date);
        if (look) {
            points.push({ lat: look.lat, lng: look.lon });
        }
    }
    
    // Split track into multiple segments at the 180th meridian (wrap-around prevention)
    const segments = [];
    let currentSegment = [];
    
    for (let i = 0; i < points.length; i++) {
        if (i > 0 && Math.abs(points[i].lng - points[i - 1].lng) > 180) {
            segments.push(currentSegment);
            currentSegment = [];
        }
        currentSegment.push(points[i]);
    }
    if (currentSegment.length > 0) {
        segments.push(currentSegment);
    }
    
    // Add polylines to map
    segments.forEach(seg => {
        const poly = L.polyline(seg, {
            color: 'rgba(18, 93, 255, 0.4)',
            weight: 2,
            dashArray: '4 4'
        }).addTo(state.map);
        state.trackPolylines.push(poly);
    });
}

// Scan next 24 hours to predict upcoming satellite passes
function calculatePasses() {
    if (!state.satrec) return;
    
    const observerGd = getObserverGd();
    const passes = [];
    const start = Date.now();
    const duration24h = 24 * 3600 * 1000;
    const stepSizeMs = 30 * 1000; // 30-sec scanning steps
    const end = start + duration24h;
    
    let inPass = false;
    let activePass = null;
    
    for (let t = start; t < end; t += stepSizeMs) {
        const date = new Date(t);
        const look = getLookAngles(state.satrec, observerGd, date);
        if (!look) continue;
        
        const el = look.elevation;
        
        if (el >= state.minEl) {
            if (!inPass) {
                inPass = true;
                // AOS detected
                activePass = {
                    aos: t,
                    maxEl: el,
                    maxElTime: t,
                    los: null
                };
            } else {
                // Keep track of maximum elevation achieved
                if (el > activePass.maxEl) {
                    activePass.maxEl = el;
                    activePass.maxElTime = t;
                }
            }
        } else {
            if (inPass) {
                inPass = false;
                // LOS detected
                activePass.los = t;
                
                // Refine pass boundary times using binary search for sub-second precision
                activePass.aos = findAosPrecisely(state.satrec, observerGd, activePass.aos - stepSizeMs, activePass.aos, state.minEl);
                activePass.los = findLosPrecisely(state.satrec, observerGd, activePass.los - stepSizeMs, activePass.los, state.minEl);
                
                // Exclude very short passes (less than 1 minute)
                if (activePass.los - activePass.aos >= 60000) {
                    passes.push(activePass);
                }
                activePass = null;
            }
        }
    }
    
    // Close pass if active at the scan end
    if (inPass && activePass) {
        activePass.los = end;
        passes.push(activePass);
    }
    
    state.upcomingPasses = passes;
    renderPassTable();
}

// Binary search refinement tools
function findAosPrecisely(satrec, observerGd, tStart, tEnd, threshold) {
    let low = tStart;
    let high = tEnd;
    while (high - low > 1000) {
        const mid = (low + high) / 2;
        const look = getLookAngles(satrec, observerGd, new Date(mid));
        if (look && look.elevation >= threshold) {
            high = mid;
        } else {
            low = mid;
        }
    }
    return high;
}

function findLosPrecisely(satrec, observerGd, tStart, tEnd, threshold) {
    let low = tStart;
    let high = tEnd;
    while (high - low > 1000) {
        const mid = (low + high) / 2;
        const look = getLookAngles(satrec, observerGd, new Date(mid));
        if (look && look.elevation < threshold) {
            high = mid;
        } else {
            low = mid;
        }
    }
    return low;
}

// Display predicted passes in the sidebar table
function renderPassTable() {
    const tbody = document.getElementById("pass-table-body");
    tbody.innerHTML = "";
    
    if (state.upcomingPasses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="table-empty">No visible passes in the next 24 hours.</td></tr>`;
        return;
    }
    
    state.upcomingPasses.forEach((pass, index) => {
        const aosDate = new Date(pass.aos);
        const durationSec = Math.round((pass.los - pass.aos) / 1000);
        const durationMin = Math.floor(durationSec / 60);
        const durationRemainingSec = durationSec % 60;
        
        // Calculate compass directions
        const observerGd = getObserverGd();
        const aosLook = getLookAngles(state.satrec, observerGd, aosDate);
        const losLook = getLookAngles(state.satrec, observerGd, new Date(pass.los));
        const aosDir = getCompassDirection(aosLook ? aosLook.azimuth : 0);
        const losDir = getCompassDirection(losLook ? losLook.azimuth : 0);
        
        const row = document.createElement("tr");
        row.setAttribute("data-index", index);
        row.innerHTML = `
            <td><b>${aosDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</b></td>
            <td>${durationMin}m ${durationRemainingSec}s</td>
            <td>${pass.maxEl.toFixed(1)}\u00B0</td>
            <td>${aosDir} \u2192 ${losDir}</td>
        `;
        
        row.addEventListener("click", () => loadPassForSimulation(index));
        tbody.appendChild(row);
    });
}

function getCompassDirection(azimuth) {
    const sectors = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(((azimuth % 360) / 45)) % 8;
    return sectors[index];
}

// Setup pass simulation data points for the selected pass
function loadPassForSimulation(index) {
    // Terminate active animation
    pauseSimulation();
    
    state.mode = "pass";
    const pass = state.upcomingPasses[index];
    
    // Highlight table row
    document.querySelectorAll(".pass-table tbody tr").forEach(row => {
        row.classList.remove("selected-pass");
    });
    const selectedRow = document.querySelector(`.pass-table tbody tr[data-index="${index}"]`);
    if (selectedRow) selectedRow.classList.add("selected-pass");
    
    // Display "Switch to Live" button
    document.getElementById("btn-live-mode").style.display = "inline-block";
    
    // Sample pass data points in 2-second steps
    const passPoints = [];
    const observerGd = getObserverGd();
    const startMs = pass.aos;
    const endMs = pass.los;
    const step = 2000; // 2 seconds
    
    for (let t = startMs; t <= endMs; t += step) {
        const date = new Date(t);
        const look = getLookAngles(state.satrec, observerGd, date);
        if (look) {
            const rangeRate = getRangeRate(state.satrec, observerGd, date);
            const dopplerShiftKHz = -state.txFreq * (rangeRate / SPEED_OF_LIGHT_KMS) * 1000;
            const rxFreq = state.txFreq + (dopplerShiftKHz / 1000);
            
            passPoints.push({
                time: t,
                relativeSec: (t - startMs) / 1000,
                elevation: look.elevation,
                azimuth: look.azimuth,
                range: look.range,
                rangeRate: rangeRate,
                dopplerShift: dopplerShiftKHz,
                rxFreq: rxFreq,
                lat: look.lat,
                lon: look.lon,
                alt: look.alt
            });
        }
    }
    
    state.activePass = {
        aos: pass.aos,
        los: pass.los,
        maxEl: pass.maxEl,
        points: passPoints
    };
    
    // Update chart
    updateDopplerChartData();
    
    // Draw pass track on Leaflet Map
    drawPassGroundTrack();
    
    // Draw pass track on Sky radar
    drawPassSkyTrack();
    
    // Reset timeline scrubber
    const timeline = document.getElementById("pass-timeline");
    timeline.min = 0;
    timeline.max = passPoints.length - 1;
    timeline.value = 0;
    
    state.animation.currentIndex = 0;
    updateSimulationFrame(0);
}

// Draw the localized ground track segment of the pass
function drawPassGroundTrack() {
    clearTrackPolylines();
    if (!state.activePass || state.activePass.points.length === 0) return;
    
    const points = state.activePass.points.map(p => ({ lat: p.lat, lng: p.lon }));
    
    const segments = [];
    let currentSegment = [];
    for (let i = 0; i < points.length; i++) {
        if (i > 0 && Math.abs(points[i].lng - points[i - 1].lng) > 180) {
            segments.push(currentSegment);
            currentSegment = [];
        }
        currentSegment.push(points[i]);
    }
    if (currentSegment.length > 0) {
        segments.push(currentSegment);
    }
    
    segments.forEach(seg => {
        const poly = L.polyline(seg, {
            color: '#125DFF',
            weight: 3,
            shadowColor: '#125DFF',
            shadowBlur: 5
        }).addTo(state.map);
        state.trackPolylines.push(poly);
    });
    
    // Focus map on ground station coverage area
    state.map.setView([state.station.lat, state.station.lon], 4);
}

// Draw sky pass path inside the Polar Sky Plot
function drawPassSkyTrack() {
    const skyPath = document.getElementById("sky-pass-path");
    if (!state.activePass || state.activePass.points.length === 0) {
        skyPath.setAttribute("d", "");
        return;
    }
    
    const maxRadarRadius = 100;
    let pathD = "";
    
    state.activePass.points.forEach((p, idx) => {
        const r = maxRadarRadius * (1 - (p.elevation / 90.0));
        const azRad = p.azimuth * Math.PI / 180;
        const x = 110 + r * Math.sin(azRad);
        const y = 110 - r * Math.cos(azRad);
        
        if (idx === 0) {
            pathD += `M ${x} ${y}`;
        } else {
            pathD += ` L ${x} ${y}`;
        }
    });
    
    skyPath.setAttribute("d", pathD);
}

// Animate/scrub the loaded pass simulation frames
function updateSimulationFrame(index) {
    if (!state.activePass || index >= state.activePass.points.length) return;
    
    state.animation.currentIndex = index;
    const pt = state.activePass.points[index];
    const timestamp = new Date(pt.time);
    
    // Update live indicators
    document.getElementById("t-elevation").innerHTML = `${pt.elevation.toFixed(1)} <small>\u00B0</small>`;
    document.getElementById("t-azimuth").innerHTML = `${pt.azimuth.toFixed(1)} <small>\u00B0</small>`;
    document.getElementById("t-range").innerHTML = `${Math.round(pt.range)} <small>km</small>`;
    document.getElementById("t-range-rate").innerHTML = `${pt.rangeRate.toFixed(3)} <small>km/s</small>`;
    document.getElementById("t-doppler-shift").innerHTML = `${pt.dopplerShift.toFixed(3)} <small>kHz</small>`;
    document.getElementById("t-rx-freq").innerHTML = `${pt.rxFreq.toFixed(5)} <small>MHz</small>`;
    
    // Map Position update
    state.satMarker.setLatLng([pt.lat, pt.lon]);
    
    // Polar radar dot update
    updateSkyRadarDot(pt.elevation, pt.azimuth);
    
    // Update timeline labels
    const pct = ((index / (state.activePass.points.length - 1)) * 100).toFixed(0);
    document.getElementById("lbl-scrubber-time").innerText = `T+${Math.round(pt.relativeSec)}s (${timestamp.toLocaleTimeString()})`;
    document.getElementById("pass-timeline").value = index;
    
    // Update Status tag
    const statusTag = document.getElementById("lbl-scrubber-status");
    statusTag.className = "status-tag active-pass";
    statusTag.innerText = "SIMULATING";
    
    // Update sound frequency
    updateAudioFrequencies(pt.rangeRate, true);
    
    // Update Chart.js horizontal tracker dot
    updateChartTrackerDot(index);
}

// Chart.js Configuration & Data binds
function initDopplerChart() {
    const ctx = document.getElementById('dopplerChart').getContext('2d');
    
    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Elevation (\u00B0)',
                    yAxisID: 'yElevation',
                    data: [],
                    borderColor: '#125DFF',
                    backgroundColor: 'rgba(18, 93, 255, 0.05)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true
                },
                {
                    label: 'Doppler Shift (kHz)',
                    yAxisID: 'yDoppler',
                    data: [],
                    borderColor: '#FFBE46',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Live Marker',
                    yAxisID: 'yElevation',
                    data: [],
                    borderColor: '#00FF80',
                    backgroundColor: '#00FF80',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    labels: {
                        boxWidth: 12,
                        font: { family: 'Space Grotesk' },
                        color: '#DEEBFF'
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Pass Duration (seconds)',
                        color: '#C4C4C4',
                        font: { family: 'Space Grotesk', size: 10 }
                    },
                    grid: { color: 'rgba(222, 235, 255, 0.03)' },
                    ticks: { color: '#C4C4C4' }
                },
                yElevation: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Elevation (deg)',
                        color: '#125DFF',
                        font: { family: 'Space Grotesk', size: 10 }
                    },
                    min: 0,
                    max: 90,
                    grid: { color: 'rgba(222, 235, 255, 0.05)' },
                    ticks: { color: '#C4C4C4' }
                },
                yDoppler: {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Doppler Shift (kHz)',
                        color: '#FFBE46',
                        font: { family: 'Space Grotesk', size: 10 }
                    },
                    grid: { drawOnChartArea: false }, // Only show grids from elevation axis
                    ticks: { color: '#C4C4C4' }
                }
            }
        }
    });
}

function updateDopplerChartData() {
    if (!state.activePass || !state.chart) return;
    
    const labels = state.activePass.points.map(pt => `${Math.round(pt.relativeSec)}s`);
    const elevationData = state.activePass.points.map(pt => pt.elevation);
    const dopplerData = state.activePass.points.map(pt => pt.dopplerShift);
    
    state.chart.data.labels = labels;
    state.chart.data.datasets[0].data = elevationData;
    state.chart.data.datasets[1].data = dopplerData;
    
    // Clear live marker initially
    state.chart.data.datasets[2].data = new Array(labels.length).fill(null);
    state.chart.update();
}

function updateChartTrackerDot(index) {
    if (!state.chart || !state.activePass) return;
    
    const count = state.activePass.points.length;
    const markerData = new Array(count).fill(null);
    markerData[index] = state.activePass.points[index].elevation;
    
    state.chart.data.datasets[2].data = markerData;
    state.chart.update('none'); // Update without animation for rapid scrubbing
}

// Toggle back to real-time live mode tracking
function switchToLiveMode() {
    pauseSimulation();
    state.mode = "live";
    
    // De-highlight table selection
    document.querySelectorAll(".pass-table tbody tr").forEach(row => {
        row.classList.remove("selected-pass");
    });
    
    // Reset scrubber interface
    document.getElementById("btn-live-mode").style.display = "none";
    document.getElementById("pass-timeline").value = 0;
    
    const statusTag = document.getElementById("lbl-scrubber-status");
    statusTag.className = "status-tag idle";
    statusTag.innerText = "LIVE TRACK";
    
    // Clear pass path SVG
    document.getElementById("sky-pass-path").setAttribute("d", "");
    
    // Refocus map on default zoom
    state.map.setView([state.station.lat, state.station.lon], 3);
    
    updateStationCoverageRadius();
    updateLiveTracking();
}

// Timeline Player animation engine
function playSimulation() {
    if (!state.activePass) return;
    
    state.animation.playing = true;
    document.getElementById("btn-play-pause").innerText = "PAUSE";
    state.animation.lastTime = performance.now();
    
    const stepIntervalMs = 50; // Update 20 times per second
    
    state.animation.intervalId = setInterval(() => {
        const ptsCount = state.activePass.points.length;
        let nextIndex = state.animation.currentIndex + (1 * state.animation.speed);
        
        if (nextIndex >= ptsCount) {
            // End of Pass simulation reached (Loss of Signal)
            pauseSimulation();
            updateSimulationFrame(ptsCount - 1);
            return;
        }
        
        updateSimulationFrame(Math.floor(nextIndex));
    }, stepIntervalMs);
}

function pauseSimulation() {
    state.animation.playing = false;
    document.getElementById("btn-play-pause").innerText = "PLAY";
    
    if (state.animation.intervalId) {
        clearInterval(state.animation.intervalId);
        state.animation.intervalId = null;
    }
}

// Radio Beacon sound effects synthesis using Web Audio API
function initAudio() {
    if (state.audioCtx) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.audioCtx = new AudioContextClass();
    
    // Primary Tone Oscillator
    state.oscillator = state.audioCtx.createOscillator();
    state.oscillator.type = "sine";
    state.oscillator.frequency.value = 800; // Base frequency (800Hz)
    
    // Gating Gain Node for ping intervals
    state.gatingGain = state.audioCtx.createGain();
    state.gatingGain.gain.value = 0.0;
    
    // Master volume gain
    state.masterGain = state.audioCtx.createGain();
    state.masterGain.gain.value = state.volume;
    
    // Connections
    state.oscillator.connect(state.gatingGain);
    state.gatingGain.connect(state.masterGain);
    state.masterGain.connect(state.audioCtx.destination);
    
    state.oscillator.start(0);
    
    // Start interval beacon scheduler
    startBeaconScheduler();
}

function startBeaconScheduler() {
    if (state.morseIntervalId) {
        clearInterval(state.morseIntervalId);
    }
    
    const stepDurationMs = 120; // dit duration (120ms)
    state.morseStep = 0;
    
    // Patterns (1 = sound, 0 = silence)
    // ESSS Morse Pattern (Dit/Dah timing spacing rules)
    const morseESSS = [
        1, 0, 0, 0,             // E (.) + letter space
        1, 0, 1, 0, 1, 0, 0, 0, // S (...) + letter space
        1, 0, 1, 0, 1, 0, 0, 0, // S (...) + letter space
        1, 0, 1, 0, 1, 0, 0, 0, // S (...) + letter space
        0, 0, 0, 0              // word space padding
    ];
    
    // Sputnik pulsed click pattern
    const pulsePing = [
        1, 0, 0, 0, 0, 0, 0, 0
    ];
    
    state.morseIntervalId = setInterval(() => {
        if (!state.audioEnabled) return;
        
        let pattern = (state.beaconType === "morse-esss") ? morseESSS : pulsePing;
        let active = pattern[state.morseStep % pattern.length];
        
        // Gate volume using linear/target envelopes to prevent pops
        const now = state.audioCtx.currentTime;
        if (active) {
            state.gatingGain.gain.setTargetAtTime(1.0, now, 0.005);
        } else {
            state.gatingGain.gain.setTargetAtTime(0.0, now, 0.012);
        }
        
        state.morseStep++;
    }, stepDurationMs);
}

function updateAudioFrequencies(rangeRate, isVisible) {
    if (!state.audioCtx || !state.oscillator) return;
    
    const now = state.audioCtx.currentTime;
    
    // Mute beacon completely if satellite is below station elevation threshold
    if (!isVisible) {
        state.masterGain.gain.setTargetAtTime(0.0, now, 0.05);
        return;
    } else {
        // Restore volume
        state.masterGain.gain.setTargetAtTime(state.volume, now, 0.05);
    }
    
    // Doppler audio sweep calculation (relative to speed of sound 50 km/s scale)
    const baseFreq = (state.beaconType === "morse-esss") ? 800 : 900;
    const dopplerFactor = 1.0 - (rangeRate / AUDIO_DOPPLER_SCALE);
    const audioFreq = baseFreq * dopplerFactor;
    
    // Apply pitch transition
    state.oscillator.frequency.setTargetAtTime(audioFreq, now, 0.04);
}

// UI Event bindings
function attachEventListeners() {
    // Audio Toggle
    const audioBtn = document.getElementById("audio-toggle");
    audioBtn.addEventListener("click", () => {
        state.audioEnabled = !state.audioEnabled;
        if (state.audioEnabled) {
            initAudio();
            if (state.audioCtx.state === 'suspended') {
                state.audioCtx.resume();
            }
            audioBtn.classList.add("active");
        } else {
            if (state.audioCtx) {
                state.gatingGain.gain.value = 0.0;
            }
            audioBtn.classList.remove("active");
        }
    });

    // Ground Station Preset
    document.getElementById("station-preset").addEventListener("change", (e) => {
        const val = e.target.value;
        const customCoords = document.getElementById("custom-station-coords");
        
        if (val === "custom") {
            customCoords.style.display = "flex";
        } else {
            customCoords.style.display = "none";
            const preset = STATION_PRESETS[val];
            state.station.name = preset.name;
            state.station.lat = preset.lat;
            state.station.lon = preset.lon;
            state.station.alt = preset.alt;
            
            // Sync UI controls
            document.getElementById("station-lat").value = preset.lat;
            document.getElementById("station-lon").value = preset.lon;
            document.getElementById("station-alt").value = preset.alt;
            
            document.getElementById("lbl-station-lat").innerText = preset.lat.toFixed(3);
            document.getElementById("lbl-station-lon").innerText = preset.lon.toFixed(3);
            document.getElementById("lbl-station-alt").innerText = preset.alt;
            
            updateStationPositionOnMap();
        }
    });

    // Custom Station inputs
    document.getElementById("station-lat").addEventListener("input", (e) => {
        state.station.lat = parseFloat(e.target.value);
        document.getElementById("lbl-station-lat").innerText = state.station.lat.toFixed(3);
        state.station.name = "Custom Location";
        updateStationPositionOnMap();
    });
    
    document.getElementById("station-lon").addEventListener("input", (e) => {
        state.station.lon = parseFloat(e.target.value);
        document.getElementById("lbl-station-lon").innerText = state.station.lon.toFixed(3);
        state.station.name = "Custom Location";
        updateStationPositionOnMap();
    });
    
    document.getElementById("station-alt").addEventListener("input", (e) => {
        state.station.alt = parseInt(e.target.value);
        document.getElementById("lbl-station-alt").innerText = state.station.alt;
        state.station.name = "Custom Location";
        updateStationPositionOnMap();
    });

    // Elevation threshold
    document.getElementById("min-el-threshold").addEventListener("input", (e) => {
        state.minEl = parseFloat(e.target.value);
        document.getElementById("lbl-min-el").innerText = state.minEl.toFixed(1);
        updateStationCoverageRadius();
        calculatePasses();
        
        // If we are in live mode, redraw track
        if (state.mode === "live") {
            drawOrbitalGroundTrack();
        }
    });

    // Satellite Preset Selection
    document.getElementById("sat-preset").addEventListener("change", (e) => {
        const val = e.target.value;
        const customTle = document.getElementById("tle-custom-inputs");
        
        if (val === "custom") {
            customTle.style.display = "block";
            // Seed with current values
            document.getElementById("tle-line-1").value = state.tleLine1;
            document.getElementById("tle-line-2").value = state.tleLine2;
        } else {
            customTle.style.display = "none";
            const preset = SAT_PRESETS[val];
            state.satName = preset.name;
            state.tleLine1 = preset.line1;
            state.tleLine2 = preset.line2;
            state.txFreq = preset.freq;
            
            // Sync frequency slider
            document.getElementById("tx-freq").value = preset.freq;
            document.getElementById("lbl-tx-freq").innerText = preset.freq.toFixed(3);
            
            initSatelliteRec();
            updateStationCoverageRadius();
            
            // Load live tracking and recalculate passes
            switchToLiveMode();
            calculatePasses();
        }
    });

    // Apply custom TLE
    document.getElementById("btn-apply-tle").addEventListener("click", () => {
        const line1 = document.getElementById("tle-line-1").value.trim();
        const line2 = document.getElementById("tle-line-2").value.trim();
        
        if (line1.length < 60 || line2.length < 60) {
            alert("TLE lines are too short. Ensure you copy the complete elements.");
            return;
        }
        
        state.satName = "Custom Orbit";
        state.tleLine1 = line1;
        state.tleLine2 = line2;
        
        initSatelliteRec();
        updateStationCoverageRadius();
        switchToLiveMode();
        calculatePasses();
    });

    // Frequency control
    document.getElementById("tx-freq").addEventListener("input", (e) => {
        state.txFreq = parseFloat(e.target.value);
        document.getElementById("lbl-tx-freq").innerText = state.txFreq.toFixed(3);
        if (state.mode === "live") {
            updateLiveTracking();
        } else {
            // Recompute pass frequencies
            loadPassForSimulation(state.upcomingPasses.findIndex(p => p.aos === state.activePass.aos));
        }
    });

    // Sound Selection
    document.getElementById("beacon-sound-type").addEventListener("change", (e) => {
        state.beaconType = e.target.value;
        if (state.audioCtx) {
            startBeaconScheduler();
        }
    });

    // Volume slider
    document.getElementById("beacon-volume").addEventListener("input", (e) => {
        const val = parseInt(e.target.value);
        document.getElementById("lbl-volume").innerText = `${val}%`;
        state.volume = val / 100.0;
        if (state.masterGain) {
            state.masterGain.gain.setTargetAtTime(state.volume, state.audioCtx.currentTime, 0.05);
        }
    });

    // Timeline Scrubber
    document.getElementById("pass-timeline").addEventListener("input", (e) => {
        if (state.mode !== "pass") return;
        pauseSimulation();
        const idx = parseInt(e.target.value);
        updateSimulationFrame(idx);
    });

    // Play/Pause button
    document.getElementById("btn-play-pause").addEventListener("click", () => {
        if (state.mode !== "pass") {
            // Alert user to load a pass from the list first
            alert("Please select an upcoming pass from the schedule to simulate!");
            return;
        }
        
        if (state.animation.playing) {
            pauseSimulation();
        } else {
            // If at the end, wrap to start
            if (state.animation.currentIndex >= state.activePass.points.length - 1) {
                state.animation.currentIndex = 0;
            }
            playSimulation();
        }
    });

    // Switch to live mode
    document.getElementById("btn-live-mode").addEventListener("click", () => {
        switchToLiveMode();
    });

    // Time Warp speed selector buttons
    document.querySelectorAll(".speed-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".speed-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            state.animation.speed = parseInt(e.target.getAttribute("data-speed"));
        });
    });
}

function updateStationPositionOnMap() {
    const latlng = [state.station.lat, state.station.lon];
    state.stationMarker.setLatLng(latlng);
    state.stationCircle.setLatLng(latlng);
    
    // Recalculate passes and reset tracking view
    switchToLiveMode();
    calculatePasses();
}
