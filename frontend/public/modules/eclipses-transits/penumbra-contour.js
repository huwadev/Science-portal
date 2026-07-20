/**
 * ESSS Science Portal - Solar Eclipse Penumbral Contouring Plugin
 * Powered by Astronomy Engine and D3 Contour.
 * Uses a Grid Contouring (Isoline) strategy to calculate and render 
 * maximum eclipse magnitude bands on Leaflet/Mapbox maps in real-time.
 */

(function (global) {
    'use strict';

    // Script loader helper
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Ensure d3-contour and d3-array are loaded in the global window object
    async function ensureDependencies() {
        if (global.d3 && global.d3.contours) {
            return;
        }
        try {
            if (!global.d3) {
                await loadScript("https://cdn.jsdelivr.net/npm/d3-array@3");
            }
            if (!global.d3 || !global.d3.contours) {
                await loadScript("https://cdn.jsdelivr.net/npm/d3-contour@4");
            }
        } catch (e) {
            console.error("ESSS Penumbra Contour: Failed to load D3 dependencies.", e);
            throw e;
        }
    }

    /**
     * Standalone function to calculate the penumbra contour bands and add them
     * to the map instance as a distinct, styled Leaflet GeoJSON layer.
     * 
     * @param {Object} mapInstance - Leaflet map instance
     * @param {Date|String} eclipseDate - Target date/time of the eclipse peak
     * @param {Object} [options] - Custom configuration overrides
     * @param {Number} [options.gridResolution=1.5] - Grid cell size in degrees (e.g., 1.0 or 1.5)
     */
    async function appendPenumbraLayer(mapInstance, eclipseDate, options = {}) {
        await ensureDependencies();

        if (!global.Astronomy) {
            console.error("ESSS Penumbra Contour: astronomy-engine library not found.");
            return;
        }

        // Clean up previous penumbra layers if present
        if (mapInstance._penumbraLayer) {
            mapInstance.removeLayer(mapInstance._penumbraLayer);
            mapInstance._penumbraLayer = null;
        }

        const Astronomy = global.Astronomy;
        const resolution = options.gridResolution || 0.25; // 0.25 degrees for ultra-smooth contours
        const width = Math.round(360 / resolution);
        const height = Math.round(180 / resolution);

        const peakMs = new Date(eclipseDate).getTime();
        const startMs = peakMs - 210 * 60000; // 3.5 hours before peak
        const endMs = peakMs + 210 * 60000;   // 3.5 hours after peak
        const steps = 31;                     // 14-minute steps for global trajectory
        const stepMs = (endMs - startMs) / (steps - 1);

        const RE = 6378.137;      // Earth equatorial radius
        const RS_KM = 696340.0;   // Sun radius
        const RM_KM = 1737.4;     // Moon radius
        const AU_KM = 149597870.7;// Astronomical unit in km

        // 1. Pre-compute global J2000 state (Sun, Moon, shadow axis, GMST) at steps
        const states = [];
        for (let i = 0; i < steps; i++) {
            const t = Astronomy.MakeTime(new Date(startMs + i * stepMs));
            const sun = Astronomy.GeoVector(Astronomy.Body.Sun, t, false);
            const moon = Astronomy.GeoVector(Astronomy.Body.Moon, t, false);
            if (!sun || !moon) continue;

            const Mx = moon.x * AU_KM, My = moon.y * AU_KM, Mz = moon.z * AU_KM;
            const Sx = sun.x * AU_KM, Sy = sun.y * AU_KM, Sz = sun.z * AU_KM;
            const Dx = Mx - Sx, Dy = My - Sy, Dz = Mz - Sz;
            const dist = Math.sqrt(Dx*Dx + Dy*Dy + Dz*Dz);
            const wx = Dx / dist, wy = Dy / dist, wz = Dz / dist;
            const gmst = Astronomy.SiderealTime(t);
            const theta0 = gmst * 15 * Math.PI / 180;

            states.push({
                M: { x: Mx, y: My, z: Mz },
                S: { x: Sx, y: Sy, z: Sz },
                w: { x: wx, y: wy, z: wz },
                cosTheta0: Math.cos(theta0),
                sinTheta0: Math.sin(theta0)
            });
        }

        if (states.length === 0) return;

        // Retrieve interpolated state at a given millisecond timestamp
        function getInterpolatedState(ms) {
            const idx = Math.max(0, Math.min(states.length - 1, (ms - startMs) / stepMs));
            const i0 = Math.floor(idx);
            const i1 = Math.min(states.length - 1, i0 + 1);
            const f = idx - i0;

            const s0 = states[i0];
            const s1 = states[i1];

            return {
                Mx: s0.M.x + f * (s1.M.x - s0.M.x),
                My: s0.M.y + f * (s1.M.y - s0.M.y),
                Mz: s0.M.z + f * (s1.M.z - s0.M.z),
                Sx: s0.S.x + f * (s1.S.x - s0.S.x),
                Sy: s0.S.y + f * (s1.S.y - s0.S.y),
                Sz: s0.S.z + f * (s1.S.z - s0.S.z),
                wx: s0.w.x + f * (s1.w.x - s0.w.x),
                wy: s0.w.y + f * (s1.w.y - s0.w.y),
                wz: s0.w.z + f * (s1.w.z - s0.w.z),
                cosTheta0: s0.cosTheta0 + f * (s1.cosTheta0 - s0.cosTheta0),
                sinTheta0: s0.sinTheta0 + f * (s1.sinTheta0 - s0.sinTheta0)
            };
        }

        // Get Sun's sine of altitude at a timestamp (stable, no trig calls needed)
        function getSunSinAlt(ms, latRad, cosLat, sinLat, cosLon, sinLon) {
            const s = getInterpolatedState(ms);
            const cosTheta = s.cosTheta0 * cosLon - s.sinTheta0 * sinLon;
            const sinTheta = s.sinTheta0 * cosLon + s.cosTheta0 * sinLon;

            const Px = RE * cosLat * cosTheta;
            const Py = RE * cosLat * sinTheta;
            const Pz = RE * sinLat;

            const rsx = s.Sx - Px, rsy = s.Sy - Py, rsz = s.Sz - Pz;
            const distSun = Math.sqrt(rsx*rsx + rsy*rsy + rsz*rsz);

            return (rsx * cosLat * cosTheta + rsy * cosLat * sinTheta + rsz * sinLat) / distSun;
        }

        // Evaluate topocentric magnitude at a timestamp
        function evaluateMagnitudeAtTime(ms, latRad, cosLat, sinLat, cosLon, sinLon) {
            const s = getInterpolatedState(ms);
            const cosTheta = s.cosTheta0 * cosLon - s.sinTheta0 * sinLon;
            const sinTheta = s.sinTheta0 * cosLon + s.cosTheta0 * sinLon;

            const Px = RE * cosLat * cosTheta;
            const Py = RE * cosLat * sinTheta;
            const Pz = RE * sinLat;

            const rx = s.Mx - Px, ry = s.My - Py, rz = s.Mz - Pz;
            const rsx = s.Sx - Px, rsy = s.Sy - Py, rsz = s.Sz - Pz;

            const distMoon = Math.sqrt(rx*rx + ry*ry + rz*rz);
            const distSun = Math.sqrt(rsx*rsx + rsy*rsy + rsz*rsz);

            const cosSep = (rx*rsx + ry*rsy + rz*rsz) / (distMoon * distSun);
            const sep = Math.acos(Math.max(-1, Math.min(1, cosSep)));

            const thetaS = Math.asin(RS_KM / distSun);
            const thetaM = Math.asin(RM_KM / distMoon);

            if (sep >= thetaS + thetaM) return 0;
            if (sep <= Math.abs(thetaS - thetaM)) return thetaM / thetaS;
            return (thetaS + thetaM - sep) / (2 * thetaS);
        }

        // Fast vector-based topocentric magnitude calculator with stable sunrise/sunset interpolation
        function getLocalMagnitude(ms, lat, lon) {
            const latRad = lat * Math.PI / 180;
            const lonRad = lon * Math.PI / 180;
            const cosLat = Math.cos(latRad);
            const sinLat = Math.sin(latRad);
            const cosLon = Math.cos(lonRad);
            const sinLon = Math.sin(lonRad);

            // 1. Check if Sun is above horizon at the closest approach time
            const sinAltBest = getSunSinAlt(ms, latRad, cosLat, sinLat, cosLon, sinLon);
            if (sinAltBest >= 0) {
                return evaluateMagnitudeAtTime(ms, latRad, cosLat, sinLat, cosLon, sinLon);
            }

            // 2. Sun is below horizon at closest approach time.
            // Check if sunset occurred during the eclipse window
            const sinAltStart = getSunSinAlt(startMs, latRad, cosLat, sinLat, cosLon, sinLon);
            if (sinAltStart > 0) {
                // Sunset occurred! Interpolate to find exact sunset time
                const fraction = sinAltStart / (sinAltStart - sinAltBest);
                const tZeroMs = startMs + fraction * (ms - startMs);
                return evaluateMagnitudeAtTime(tZeroMs, latRad, cosLat, sinLat, cosLon, sinLon);
            }

            // Check if sunrise occurred during the eclipse window
            const sinAltEnd = getSunSinAlt(endMs, latRad, cosLat, sinLat, cosLon, sinLon);
            if (sinAltEnd > 0) {
                // Sunrise occurred! Interpolate to find exact sunrise time
                const fraction = sinAltEnd / (sinAltEnd - sinAltBest);
                const tZeroMs = endMs - fraction * (endMs - ms);
                return evaluateMagnitudeAtTime(tZeroMs, latRad, cosLat, sinLat, cosLon, sinLon);
            }

            // Completely below horizon during the entire eclipse window
            return 0;
        }

        // Interpolated distance from observer to shadow axis
        function getInterpolatedDist(ms, latRad, cosLat, sinLat, cosLon, sinLon) {
            const s = getInterpolatedState(ms);
            const cosTheta = s.cosTheta0 * cosLon - s.sinTheta0 * sinLon;
            const sinTheta = s.sinTheta0 * cosLon + s.cosTheta0 * sinLon;

            const Px = RE * cosLat * cosTheta;
            const Py = RE * cosLat * sinTheta;
            const Pz = RE * sinLat;

            const rx = Px - s.Mx, ry = Py - s.My, rz = Pz - s.Mz;
            const cx = ry * s.wz - rz * s.wy;
            const cy = rz * s.wx - rx * s.wz;
            const cz = rx * s.wy - ry * s.wx;
            return Math.sqrt(cx*cx + cy*cy + cz*cz);
        }

        // 2. Sample magnitudes across the grid
        const gridData = new Array(width * height);
        for (let y = 0; y < height; y++) {
            const lat = -90 + (y / height) * 180;
            const latRad = lat * Math.PI / 180;
            const cosLat = Math.cos(latRad);
            const sinLat = Math.sin(latRad);

            for (let x = 0; x < width; x++) {
                const lon = -180 + (x / width) * 360;
                const lonRad = lon * Math.PI / 180;
                const cosLon = Math.cos(lonRad);
                const sinLon = Math.sin(lonRad);

                // Find index of closest approach in J2000 steps (trig-free lookup)
                let minDist = Infinity;
                let minIdx = -1;
                for (let i = 0; i < states.length; i++) {
                    const s = states[i];
                    const cosTheta = s.cosTheta0 * cosLon - s.sinTheta0 * sinLon;
                    const sinTheta = s.sinTheta0 * cosLon + s.cosTheta0 * sinLon;

                    const Px = RE * cosLat * cosTheta;
                    const Py = RE * cosLat * sinTheta;
                    const Pz = RE * sinLat;

                    const rx = Px - s.M.x;
                    const ry = Py - s.M.y;
                    const rz = Pz - s.M.z;

                    const cx = ry * s.w.z - rz * s.w.y;
                    const cy = rz * s.w.x - rx * s.w.z;
                    const cz = rx * s.w.y - ry * s.w.x;
                    const d = cx*cx + cy*cy + cz*cz;

                    if (d < minDist) {
                        minDist = d;
                        minIdx = i;
                    }
                }
                minDist = Math.sqrt(minDist);

                // If shadow center is further than RE + Penumbra radius (~4500km) from observer, magnitude is 0
                if (minDist > 4500) {
                    gridData[y * width + x] = 0;
                    continue;
                }

                // Ternary search for closest approach time using interpolated J2000 state
                const leftMs = startMs + Math.max(0, minIdx - 1) * stepMs;
                const rightMs = startMs + Math.min(states.length - 1, minIdx + 1) * stepMs;

                let lo = leftMs;
                let hi = rightMs;
                let bestT = startMs + minIdx * stepMs;
                for (let iter = 0; iter < 6; iter++) {
                    const m1 = lo + (hi - lo) / 3;
                    const m2 = hi - (hi - lo) / 3;
                    const d1 = getInterpolatedDist(m1, latRad, cosLat, sinLat, cosLon, sinLon);
                    const d2 = getInterpolatedDist(m2, latRad, cosLat, sinLat, cosLon, sinLon);
                    if (d1 < d2) {
                        hi = m2;
                        bestT = m1;
                    } else {
                        lo = m1;
                        bestT = m2;
                    }
                }

                // Compute exact topocentric magnitude at closest approach time
                gridData[y * width + x] = getLocalMagnitude(bestT, lat, lon);
            }
        }

        // 3. Generate contour isolines for magnitudes [0.01, 0.25, 0.50, 0.75]
        const thresholds = [0.01, 0.25, 0.50, 0.75];
        const contourPolygons = global.d3.contours()
            .size([width, height])
            .smooth(true)
            .thresholds(thresholds)(gridData);

        // 4. Map grid coordinates back to real-world Geodetic Lat/Lon
        const features = [];
        contourPolygons.forEach(contour => {
            if (!contour.coordinates || contour.coordinates.length === 0) return;

            // Generate 5 copies shifted horizontally by [-720, -360, 0, 360, 720]
            const offsets = [-720, -360, 0, 360, 720];
            offsets.forEach(offset => {
                const transformedCoords = contour.coordinates.map(polygon => {
                    return polygon.map(ring => {
                        return ring.map(pt => {
                            const px = pt[0];
                            const py = pt[1];
                            const lon = -180 + px * (360 / width) + offset;
                            const lat = -90 + py * (180 / height);
                            return [lon, lat];
                        });
                    });
                });

                features.push({
                    type: "Feature",
                    properties: {
                        magnitude: contour.value
                    },
                    geometry: {
                        type: "MultiPolygon",
                        coordinates: transformedCoords
                    }
                });
            });
        });

        const geoJsonData = {
            type: "FeatureCollection",
            features: features
        };

        // 5. Style and render separate Leaflet GeoJSON layer
        const styleMap = {
            0.01: { fillColor: '#ffe082', fillOpacity: 0.14, stroke: true, color: '#ffe082', weight: 1.0, opacity: 0.22, pane: 'penumbraPane', interactive: false, smoothFactor: 0 },
            0.25: { fillColor: '#ffa726', fillOpacity: 0.14, stroke: true, color: '#ffa726', weight: 1.0, opacity: 0.27, pane: 'penumbraPane', interactive: false, smoothFactor: 0 },
            0.50: { fillColor: '#fb8c00', fillOpacity: 0.14, stroke: true, color: '#fb8c00', weight: 1.0, opacity: 0.32, pane: 'penumbraPane', interactive: false, smoothFactor: 0 },
            0.75: { fillColor: '#d84315', fillOpacity: 0.14, stroke: true, color: '#d84315', weight: 1.0, opacity: 0.37, pane: 'penumbraPane', interactive: false, smoothFactor: 0 }
        };

        const penumbraGeoJsonLayer = L.geoJSON(geoJsonData, {
            style: function (feature) {
                const mag = feature.properties.magnitude;
                return styleMap[mag] || { stroke: false, fill: false };
            },
            pane: 'penumbraPane'
        });

        // Add to map and save reference for removal
        penumbraGeoJsonLayer.addTo(mapInstance);
        mapInstance._penumbraLayer = penumbraGeoJsonLayer;

        // Save the magnitude grid for hover tooltip lookups
        mapInstance._penumbraGrid = { data: gridData, width, height, resolution };

        // Inform 3D globe to build contours if function exists
        if (typeof global.buildGlobeContours === 'function') {
            global.buildGlobeContours(features);
        }
    }

    /**
     * Calculates the instantaneous penumbra contour bands using fast, analytical
     * projections and adds them to the map instance as a distinct Leaflet GeoJSON layer.
     * This provides smooth, continuous, and lag-free rendering during animation.
     */
    async function appendInstantaneousPenumbraLayer(mapInstance, activeDate, options = {}) {
        if (!global.AstronomyHelper) return;

        const date = new Date(activeDate);
        const footprints = global.AstronomyHelper.calculateProjectedShadowFootprints(date);
        if (!footprints) {
            if (mapInstance._instantaneousPenumbraLayer) {
                mapInstance.removeLayer(mapInstance._instantaneousPenumbraLayer);
                mapInstance._instantaneousPenumbraLayer = null;
            }
            if (typeof global.buildGlobeInstantaneousContours === 'function') {
                global.buildGlobeInstantaneousContours([]);
            }
            return;
        }

        const features = [];
        const levels = [0.01, 0.25, 0.50, 0.75];
        levels.forEach(l => {
            const coords = footprints.penumbra[l];
            if (coords && coords.length > 2) {
                // Generate 5 copies shifted horizontally by [-720, -360, 0, 360, 720] for wrapping
                const offsets = [-720, -360, 0, 360, 720];
                offsets.forEach(offset => {
                    const ring = coords.map(pt => [pt[1] + offset, pt[0]]); // pt is [lat, lon], geojson is [lon, lat]
                    features.push({
                        type: "Feature",
                        properties: { magnitude: l },
                        geometry: {
                            type: "Polygon",
                            coordinates: [ring]
                        }
                    });
                });
            }
        });

        // Add umbra layer if present
        if (footprints.umbra && footprints.umbra.coordinates && footprints.umbra.coordinates.length > 2) {
            const coords = footprints.umbra.coordinates;
            const offsets = [-720, -360, 0, 360, 720];
            offsets.forEach(offset => {
                const ring = coords.map(pt => [pt[1] + offset, pt[0]]);
                features.push({
                    type: "Feature",
                    properties: { isUmbra: true, umbraType: footprints.umbra.type },
                    geometry: {
                        type: "Polygon",
                        coordinates: [ring]
                    }
                });
            });
        }

        const geoJsonData = {
            type: "FeatureCollection",
            features: features
        };

        const styleMap = {
            0.01: { fillColor: '#ffe082', fillOpacity: 0.14, stroke: true, color: '#ffe082', weight: 1.0, opacity: 0.22, pane: 'penumbraPane', interactive: false },
            0.25: { fillColor: '#ffa726', fillOpacity: 0.14, stroke: true, color: '#ffa726', weight: 1.0, opacity: 0.27, pane: 'penumbraPane', interactive: false },
            0.50: { fillColor: '#fb8c00', fillOpacity: 0.14, stroke: true, color: '#fb8c00', weight: 1.0, opacity: 0.32, pane: 'penumbraPane', interactive: false },
            0.75: { fillColor: '#d84315', fillOpacity: 0.14, stroke: true, color: '#d84315', weight: 1.0, opacity: 0.37, pane: 'penumbraPane', interactive: false }
        };

        const penumbraGeoJsonLayer = L.geoJSON(geoJsonData, {
            style: function (feature) {
                if (feature.properties && feature.properties.isUmbra) {
                    return { fillColor: '#000000', fillOpacity: 0.85, stroke: true, color: '#ff3b30', weight: 1.5, opacity: 0.9, pane: 'penumbraPane', interactive: false };
                }
                const mag = feature.properties.magnitude;
                return styleMap[mag] || { stroke: false, fill: false };
            },
            pane: 'penumbraPane'
        });

        if (mapInstance._instantaneousPenumbraLayer) {
            mapInstance.removeLayer(mapInstance._instantaneousPenumbraLayer);
        }
        penumbraGeoJsonLayer.addTo(mapInstance);
        mapInstance._instantaneousPenumbraLayer = penumbraGeoJsonLayer;

        // Also inform the 3D globe of these new features!
        if (typeof global.buildGlobeInstantaneousContours === 'function') {
            global.buildGlobeInstantaneousContours(features);
        }
    }

    // Export globally
    global.appendPenumbraLayer = appendPenumbraLayer;
    global.appendInstantaneousPenumbraLayer = appendInstantaneousPenumbraLayer;

})(window);
