/**
 * ESSS Science Portal - Solar Eclipse Penumbral Contouring Plugin
 * Powered by Astronomy Engine and D3 Contour.
 * Uses a Grid Contouring (Isoline) strategy to calculate and render 
 * maximum eclipse magnitude bands on Leaflet/Mapbox maps in real-time.
 */

(function (global) {
    'use strict';

    let isCalculatingPenumbra = false;
    let pendingPenumbraDate = null;

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
        const resolution = options.gridResolution || 1.0; // 1.0 degree for smooth contours
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
                w: { x: wx, y: wy, z: wz },
                cosTheta0: Math.cos(theta0),
                sinTheta0: Math.sin(theta0)
            });
        }

        if (states.length === 0) return;

        // Local topocentric magnitude calculator
        function getLocalMagnitude(t, lat, lon) {
            const obs = new Astronomy.Observer(lat, lon, 0);
            const sunEq = Astronomy.Equator(Astronomy.Body.Sun, t, obs, true, true);
            const moonEq = Astronomy.Equator(Astronomy.Body.Moon, t, obs, true, true);
            if (!sunEq || !moonEq) return 0;

            const sep = Astronomy.AngleBetween(sunEq.vec, moonEq.vec);
            const distSun = sunEq.dist * AU_KM;
            const distMoon = moonEq.dist * AU_KM;
            const thetaS = Math.asin(RS_KM / distSun) * 180 / Math.PI;
            const thetaM = Math.asin(RM_KM / distMoon) * 180 / Math.PI;

            // Sunrise/Sunset check: if Sun is below horizon, check if eclipse was visible before sunset/after sunrise
            let sunHor = Astronomy.Horizon(t, obs, sunEq.ra, sunEq.dec, 'normal');
            if (sunHor.altitude < 0) {
                if (sunHor.altitude > -15.0) {
                    // Estimate the time of sunset/sunrise (altitude = 0) and evaluate magnitude there
                    const tMs = t.date.getTime();
                    const tPrev = Astronomy.MakeTime(new Date(tMs - 5 * 60000));
                    const sunEqPrev = Astronomy.Equator(Astronomy.Body.Sun, tPrev, obs, true, true);
                    if (sunEqPrev) {
                        const sunHorPrev = Astronomy.Horizon(tPrev, obs, sunEqPrev.ra, sunEqPrev.dec, 'normal');
                        const dAlt = (sunHor.altitude - sunHorPrev.altitude) / (5 * 60000);
                        if (dAlt !== 0) {
                            const dt = -sunHor.altitude / dAlt;
                            const tZeroMs = tMs + dt;
                            if (tZeroMs >= startMs && tZeroMs <= endMs) {
                                const tZero = Astronomy.MakeTime(new Date(tZeroMs));
                                const sunEqZero = Astronomy.Equator(Astronomy.Body.Sun, tZero, obs, true, true);
                                const moonEqZero = Astronomy.Equator(Astronomy.Body.Moon, tZero, obs, true, true);
                                if (sunEqZero && moonEqZero) {
                                    const sepZero = Astronomy.AngleBetween(sunEqZero.vec, moonEqZero.vec);
                                    const distSunZero = sunEqZero.dist * AU_KM;
                                    const distMoonZero = moonEqZero.dist * AU_KM;
                                    const thetaSZero = Math.asin(RS_KM / distSunZero) * 180 / Math.PI;
                                    const thetaMZero = Math.asin(RM_KM / distMoonZero) * 180 / Math.PI;
                                    if (sepZero < thetaSZero + thetaMZero) {
                                        if (sepZero <= Math.abs(thetaSZero - thetaMZero)) return thetaMZero / thetaSZero;
                                        return (thetaSZero + thetaMZero - sepZero) / (2 * thetaSZero);
                                    }
                                }
                            }
                        }
                    }
                }
                return 0;
            }

            if (sep >= thetaS + thetaM) return 0;
            if (sep <= Math.abs(thetaS - thetaM)) return thetaM / thetaS;
            return (thetaS + thetaM - sep) / (2 * thetaS);
        }

        // Interpolated distance from observer to shadow axis
        function getInterpolatedDist(ms, latRad, cosLat, sinLat, cosLon, sinLon) {
            const idx = (ms - startMs) / stepMs;
            const i0 = Math.floor(idx);
            const i1 = Math.min(states.length - 1, i0 + 1);
            const f = idx - i0;

            const s0 = states[i0];
            const s1 = states[i1];

            const Mx = s0.M.x + f * (s1.M.x - s0.M.x);
            const My = s0.M.y + f * (s1.M.y - s0.M.y);
            const Mz = s0.M.z + f * (s1.M.z - s0.M.z);

            const wx = s0.w.x + f * (s1.w.x - s0.w.x);
            const wy = s0.w.y + f * (s1.w.y - s0.w.y);
            const wz = s0.w.z + f * (s1.w.z - s0.w.z);

            const cosTheta0 = s0.cosTheta0 + f * (s1.cosTheta0 - s0.cosTheta0);
            const sinTheta0 = s0.sinTheta0 + f * (s1.sinTheta0 - s0.sinTheta0);

            const cosTheta = cosTheta0 * cosLon - sinTheta0 * sinLon;
            const sinTheta = sinTheta0 * cosLon + cosTheta0 * sinLon;

            const Px = RE * cosLat * cosTheta;
            const Py = RE * cosLat * sinTheta;
            const Pz = RE * sinLat;

            const rx = Px - Mx, ry = Py - My, rz = Pz - Mz;
            const cx = ry * wz - rz * wy;
            const cy = rz * wx - rx * wz;
            const cz = rx * wy - ry * wx;
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
                const peakTime = Astronomy.MakeTime(new Date(bestT));
                gridData[y * width + x] = getLocalMagnitude(peakTime, lat, lon);
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
     * Calculates the instantaneous penumbra contour bands and adds them
     * to the map instance as a distinct, styled Leaflet GeoJSON layer.
     */
    async function appendInstantaneousPenumbraLayer(mapInstance, activeDate, options = {}) {
        if (isCalculatingPenumbra) {
            pendingPenumbraDate = activeDate;
            return;
        }
        isCalculatingPenumbra = true;
        pendingPenumbraDate = null;

        try {
            await ensureDependencies();

            if (!global.Astronomy) return;

            const targetDate = activeDate;
            const Astronomy = global.Astronomy;
            const resolution = options.gridResolution || 1.0; // 1.0 degree for smooth animated contours
            const width = Math.round(360 / resolution);
            const height = Math.round(180 / resolution);
            const gridData = new Array(width * height).fill(0);

            const t = Astronomy.MakeTime(new Date(targetDate));
            const AstronomyHelper = global.AstronomyHelper;
            if (!AstronomyHelper) return;

            const shadow = AstronomyHelper.calculateShadowCenter(new Date(targetDate));
            if (!shadow) {
                if (mapInstance._instantaneousPenumbraLayer) {
                    mapInstance.removeLayer(mapInstance._instantaneousPenumbraLayer);
                    mapInstance._instantaneousPenumbraLayer = null;
                }
                return;
            }

            const centerLat = shadow.lat;
            const centerLon = shadow.lon;

            const AU_KM = 149597870.7;
            const RS_KM = 696340.0;
            const RM_KM = 1737.4;

            // Local topocentric magnitude calculator
            function getLocalMagnitude(lat, lon) {
                const obs = new Astronomy.Observer(lat, lon, 0);
                const sunEq = Astronomy.Equator(Astronomy.Body.Sun, t, obs, true, true);
                const moonEq = Astronomy.Equator(Astronomy.Body.Moon, t, obs, true, true);
                if (!sunEq || !moonEq) return 0;

                const sep = Astronomy.AngleBetween(sunEq.vec, moonEq.vec);
                const distSun = sunEq.dist * AU_KM;
                const distMoon = moonEq.dist * AU_KM;
                const thetaS = Math.asin(RS_KM / distSun) * 180 / Math.PI;
                const thetaM = Math.asin(RM_KM / distMoon) * 180 / Math.PI;

                // Sunrise/Sunset check: if Sun is below horizon, magnitude is 0
                const sunHor = Astronomy.Horizon(t, obs, sunEq.ra, sunEq.dec, 'normal');
                if (sunHor.altitude < 0) {
                    return 0;
                }

                if (sep >= thetaS + thetaM) return 0;
                if (sep <= Math.abs(thetaS - thetaM)) return thetaM / thetaS;
                return (thetaS + thetaM - sep) / (2 * thetaS);
            }

            // Fill grid data (restricting calculations to a 36-degree great-circle spherical circle around the shadow center)
            const centerLatRad = centerLat * Math.PI / 180;
            const sinCenterLat = Math.sin(centerLatRad);
            const cosCenterLat = Math.cos(centerLatRad);

            for (let y = 0; y < height; y++) {
                const lat = -90 + (y / height) * 180;
                const dLat = lat - centerLat;
                if (Math.abs(dLat) >= 36) {
                    continue;
                }

                const latRad = lat * Math.PI / 180;
                const sinLat = Math.sin(latRad);
                const cosLat = Math.cos(latRad);

                for (let x = 0; x < width; x++) {
                    const lon = -180 + (x / width) * 360;
                    let dLon = lon - centerLon;
                    while (dLon < -180) dLon += 360;
                    while (dLon > 180) dLon -= 360;

                    const dLonRad = dLon * Math.PI / 180;
                    const cosDst = sinLat * sinCenterLat + cosLat * cosCenterLat * Math.cos(dLonRad);
                    const distDeg = Math.acos(Math.max(-1, Math.min(1, cosDst))) * 180 / Math.PI;

                    if (distDeg > 36) {
                        continue;
                    }

                    gridData[y * width + x] = getLocalMagnitude(lat, lon);
                }
            }

            // Generate contour isolines with smoothing
            const thresholds = [0.01, 0.25, 0.50, 0.75];
            const contourPolygons = global.d3.contours()
                .size([width, height])
                .smooth(true)
                .thresholds(thresholds)(gridData);

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

            if (mapInstance._instantaneousPenumbraLayer) {
                mapInstance.removeLayer(mapInstance._instantaneousPenumbraLayer);
            }
            penumbraGeoJsonLayer.addTo(mapInstance);
            mapInstance._instantaneousPenumbraLayer = penumbraGeoJsonLayer;

            // Inform 3D globe of instantaneous contours if function exists
            if (typeof global.buildGlobeInstantaneousContours === 'function') {
                global.buildGlobeInstantaneousContours(features);
            }

        } catch (err) {
            console.error("Error in appendInstantaneousPenumbraLayer:", err);
        } finally {
            isCalculatingPenumbra = false;
            if (pendingPenumbraDate !== null) {
                const nextDate = pendingPenumbraDate;
                pendingPenumbraDate = null;
                setTimeout(() => {
                    appendInstantaneousPenumbraLayer(mapInstance, nextDate, options);
                }, 0);
            }
        }
    }

    // Export globally
    global.appendPenumbraLayer = appendPenumbraLayer;
    global.appendInstantaneousPenumbraLayer = appendInstantaneousPenumbraLayer;

})(window);
