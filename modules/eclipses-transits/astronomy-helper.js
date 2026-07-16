/**
 * Eclipses & Transits Lab - Astronomical Calculation Helper
 * Powered by Astronomy Engine (Don Cross)
 * Performs geometric shadow intersections and topocentric projection calculations.
 */

const AstronomyHelper = {
    // Physical Constants
    RE_KM: 6378.137,      // Earth equatorial radius
    RP_KM: 6356.7523,     // Earth polar radius
    RS_KM: 696340.0,      // Sun radius
    RM_KM: 1737.4,        // Moon radius
    AU_KM: 149597870.7,   // Astronomical Unit in km
    WGS84_E2: (6378.137*6378.137) / (6356.7523*6356.7523) - 1,

    /**
     * Computes the fractional area of circle 1 (Sun, radius r1) covered by circle 2 (Moon, radius r2)
     * when their centers are separated by angular distance d. All units are consistent (radians).
     */
    circleOverlapFraction(r1, r2, d) {
        if (d >= r1 + r2) return 0;
        if (d <= Math.abs(r1 - r2)) {
            return r2 >= r1 ? 1.0 : (r2 * r2) / (r1 * r1);
        }
        const part1 = r1 * r1 * Math.acos((d*d + r1*r1 - r2*r2) / (2*d*r1));
        const part2 = r2 * r2 * Math.acos((d*d + r2*r2 - r1*r1) / (2*d*r2));
        const part3 = 0.5 * Math.sqrt((-d+r1+r2)*(d+r1-r2)*(d-r1+r2)*(d+r1+r2));
        return (part1 + part2 - part3) / (Math.PI * r1 * r1);
    },

    /**
     * Binary search for the angular separation (radians) between Sun and Moon centers
     * that produces the given target obscuration level (0..1).
     */
    findSeparationForObscuration(thetaS, thetaM, target) {
        let lo = 0;
        let hi = thetaS + thetaM;
        const maxObs = this.circleOverlapFraction(thetaS, thetaM, 0);
        if (target >= maxObs) return 0;
        if (target <= 0) return hi;
        for (let i = 0; i < 40; i++) {
            const mid = (lo + hi) / 2;
            if (this.circleOverlapFraction(thetaS, thetaM, mid) > target) {
                lo = mid;
            } else {
                hi = mid;
            }
        }
        return (lo + hi) / 2;
    },

    /**
     * Calculates the umbral limits (centerline, northern limit, and southern limit)
     * of a solar eclipse at a given instant using fundamental plane projection on the WGS84 ellipsoid.
     */
    calculateUmbralLimits(date) {
        const t = Astronomy.MakeTime(date);
        const sun = Astronomy.GeoVector(Astronomy.Body.Sun, t, false);
        const moon = Astronomy.GeoVector(Astronomy.Body.Moon, t, false);
        if (!sun || !moon) return null;

        const Mx = moon.x * this.AU_KM;
        const My = moon.y * this.AU_KM;
        const Mz = moon.z * this.AU_KM;
        const Sx = sun.x * this.AU_KM;
        const Sy = sun.y * this.AU_KM;
        const Sz = sun.z * this.AU_KM;

        const Dx = Mx - Sx;
        const Dy = My - Sy;
        const Dz = Mz - Sz;
        const distSunMoon = Math.sqrt(Dx*Dx + Dy*Dy + Dz*Dz);

        const wx = Dx / distSunMoon;
        const wy = Dy / distSunMoon;
        const wz = Dz / distSunMoon;

        let ux = -wy;
        let uy = wx;
        let uz = 0;
        let uLen = Math.sqrt(ux*ux + uy*uy);
        if (uLen === 0) {
            ux = 1; uy = 0; uz = 0;
        } else {
            ux /= uLen; uy /= uLen;
        }

        const vx = wy*uz - wz*uy;
        const vy = wz*ux - wx*uz;
        const vz = wx*uy - wy*ux;

        const x_0 = Mx * ux + My * uy + Mz * uz;
        const y_0 = Mx * vx + My * vy + Mz * vz;
        const z_M = Mx * wx + My * wy + Mz * wz;

        const d_0_2 = x_0*x_0 + y_0*y_0;
        const d_0 = Math.sqrt(d_0_2);

        if (d_0 >= this.RE_KM) return null;

        // Iteratively solve for z-coordinate of intersection with WGS84 ellipsoid
        let z = -Math.sqrt(this.RE_KM*this.RE_KM - d_0_2);
        let Px, Py, Pz;
        for (let iter = 0; iter < 3; iter++) {
            Px = x_0 * ux + y_0 * vx + z * wx;
            Py = x_0 * uy + y_0 * vy + z * wy;
            Pz = x_0 * uz + y_0 * vz + z * wz;

            const r_gc = Math.sqrt(Px*Px + Py*Py + Pz*Pz);
            if (r_gc === 0) break;
            const sin_lat = Pz / r_gc;
            const Re = this.RE_KM / Math.sqrt(1 + this.WGS84_E2 * sin_lat * sin_lat);

            const z2 = Re*Re - d_0_2;
            if (z2 < 0) return null;
            z = -Math.sqrt(z2);
        }

        const gmst = Astronomy.SiderealTime(t);
        const theta = gmst * 15 * Math.PI / 180;

        let lonRad = Math.atan2(Py, Px) - theta;
        while (lonRad < -Math.PI) lonRad += 2*Math.PI;
        while (lonRad > Math.PI) lonRad -= 2*Math.PI;

        const lat_gc_rad = Math.atan2(Pz, Math.sqrt(Px*Px + Py*Py));
        const lat_gd_rad = Math.atan((this.RE_KM*this.RE_KM)/(this.RP_KM*this.RP_KM) * Math.tan(lat_gc_rad));

        const center = {
            lat: lat_gd_rad * 180 / Math.PI,
            lon: lonRad * 180 / Math.PI
        };

        const sin_f2 = (this.RS_KM - this.RM_KM) / distSunMoon;
        const cos_f2 = Math.sqrt(1 - sin_f2*sin_f2);
        const tan_f2 = sin_f2 / cos_f2;

        const Lu = this.RM_KM / sin_f2;
        const z_V = z_M + Lu;
        const isTotal = z < z_V;

        const self = this;
        function getBoundaryPoint(cos_theta, sin_theta) {
            let z_bp = z;
            let Px_bp, Py_bp, Pz_bp;
            let outside = false;

            for (let iter = 0; iter < 4; iter++) {
                let l_2 = Math.abs(z_V - z_bp) * tan_f2;
                let x = x_0 + l_2 * cos_theta;
                let y = y_0 + l_2 * sin_theta;

                Px_bp = x * ux + y * vx + z_bp * wx;
                Py_bp = x * uy + y * vy + z_bp * wy;
                Pz_bp = x * uz + y * vz + z_bp * wz;

                const r_gc = Math.sqrt(Px_bp*Px_bp + Py_bp*Py_bp + Pz_bp*Pz_bp);
                if (r_gc === 0) {
                    outside = true;
                    break;
                }
                const sin_lat = Pz_bp / r_gc;
                const Re = self.RE_KM / Math.sqrt(1 + self.WGS84_E2 * sin_lat * sin_lat);

                const d_bp_2 = x*x + y*y;
                const z2 = Re*Re - d_bp_2;
                if (z2 < 0) {
                    outside = true;
                    z_bp = 0;
                    const scale = Re / Math.sqrt(d_bp_2);
                    const x_clamped = x * scale;
                    const y_clamped = y * scale;
                    Px_bp = x_clamped * ux + y_clamped * vx + 0 * wx;
                    Py_bp = x_clamped * uy + y_clamped * vy + 0 * wy;
                    Pz_bp = x_clamped * uz + y_clamped * vz + 0 * wz;
                    break;
                }
                z_bp = -Math.sqrt(z2);
            }

            let lonRad_bp = Math.atan2(Py_bp, Px_bp) - theta;
            while (lonRad_bp < -Math.PI) lonRad_bp += 2*Math.PI;
            while (lonRad_bp > Math.PI) lonRad_bp -= 2*Math.PI;

            const lat_gc_rad_bp = Math.atan2(Pz_bp, Math.sqrt(Px_bp*Px_bp + Py_bp*Py_bp));
            const lat_gd_rad_bp = Math.atan((self.RE_KM*self.RE_KM)/(self.RP_KM*self.RP_KM) * Math.tan(lat_gc_rad_bp));

            return {
                lat: lat_gd_rad_bp * 180 / Math.PI,
                lon: lonRad_bp * 180 / Math.PI,
                outside
            };
        }

        const north = getBoundaryPoint(0, 1);
        const south = getBoundaryPoint(0, -1);

        return {
            center,
            north,
            south,
            ru: Math.abs(z_V - z) * tan_f2,
            rp: Math.abs(z_M) * tan_f2, // approximate penumbral radius in km
            type: isTotal ? "Total" : "Annular"
        };
    },

    /**
     * Finds the intersection of the Moon's shadow axis with the Earth's surface.
     * If the axis misses the Earth, projects the point of closest approach if the penumbra touches.
     * Returns {lat, lon, ru, rp, type, isProjected} or null if the shadow misses the Earth.
     */
    calculateShadowCenter(date) {
        const limits = this.calculateUmbralLimits(date);
        if (limits) {
            return {
                lat: limits.center.lat,
                lon: limits.center.lon,
                ru: limits.ru,
                rp: limits.rp,
                type: limits.type,
                isProjected: false
            };
        }

        // Fallback for partial phase
        const t = Astronomy.MakeTime(date);
        const sun = Astronomy.GeoVector(Astronomy.Body.Sun, t, false);
        const moon = Astronomy.GeoVector(Astronomy.Body.Moon, t, false);
        if (!sun || !moon) return null;

        const Dx = (moon.x - sun.x) * this.AU_KM;
        const Dy = (moon.y - sun.y) * this.AU_KM;
        const Dz = (moon.z - sun.z) * this.AU_KM;
        const distSunMoon = Math.sqrt(Dx*Dx + Dy*Dy + Dz*Dz);

        const wx = Dx / distSunMoon;
        const wy = Dy / distSunMoon;
        const wz = Dz / distSunMoon;

        const Mx = moon.x * this.AU_KM;
        const My = moon.y * this.AU_KM;
        const Mz = moon.z * this.AU_KM;

        let ux = -wy;
        let uy = wx;
        let uz = 0;
        let uLen = Math.sqrt(ux*ux + uy*uy);
        if (uLen === 0) { ux = 1; uy = 0; } else { ux /= uLen; uy /= uLen; }
        const vx = wy*uz - wz*uy;
        const vy = wz*ux - wx*uz;
        const vz = wx*uy - wy*ux;

        const x_0 = Mx * ux + My * uy + Mz * uz;
        const y_0 = Mx * vx + My * vy + Mz * vz;
        const z_M = Mx * wx + My * wy + Mz * wz;

        const d_0 = Math.sqrt(x_0*x_0 + y_0*y_0);

        const sinBeta = (this.RS_KM + this.RM_KM) / distSunMoon;
        const Lp = this.RM_KM / sinBeta;
        const distMoonClosest_km = Math.abs(z_M);
        const rp = this.RM_KM * (1 + distMoonClosest_km / Lp);

        if (d_0 >= this.RE_KM + rp) {
            return null; // Penumbra misses completely
        }

        const scale = this.RE_KM / d_0;
        const Px = x_0 * scale * ux + y_0 * scale * vx;
        const Py = x_0 * scale * uy + y_0 * scale * vy;
        const Pz = x_0 * scale * uz + y_0 * scale * vz;

        const gmst = Astronomy.SiderealTime(t);
        const theta = gmst * 15 * Math.PI / 180;

        let lonRad = Math.atan2(Py, Px) - theta;
        while (lonRad < -Math.PI) lonRad += 2*Math.PI;
        while (lonRad > Math.PI) lonRad -= 2*Math.PI;

        const lat_gc_rad = Math.atan2(Pz, Math.sqrt(Px*Px + Py*Py));
        const lat_gd_rad = Math.atan((this.RE_KM*this.RE_KM)/(this.RP_KM*this.RP_KM) * Math.tan(lat_gc_rad));

        return {
            lat: lat_gd_rad * 180 / Math.PI,
            lon: lonRad * 180 / Math.PI,
            ru: 0,
            rp: rp,
            type: "Partial",
            isProjected: true
        };
    },

    /**
     * Projects a circle of a given radius in the fundamental plane onto the oblate Earth spheroid.
     * Incorporates day/night terminator clipping and returns coordinates for Leaflet polygon drawing.
     */
    calculateProjectedShadowPolygon(t, radiusKm, numPoints = 120) {
        const sun = Astronomy.GeoVector(Astronomy.Body.Sun, t, false);
        const moon = Astronomy.GeoVector(Astronomy.Body.Moon, t, false);
        if (!sun || !moon) return null;

        const Mx = moon.x * this.AU_KM, My = moon.y * this.AU_KM, Mz = moon.z * this.AU_KM;
        const Sx = sun.x * this.AU_KM, Sy = sun.y * this.AU_KM, Sz = sun.z * this.AU_KM;
        const Dx = Mx - Sx, Dy = My - Sy, Dz = Mz - Sz;
        const dist = Math.sqrt(Dx*Dx + Dy*Dy + Dz*Dz);
        const wx = Dx/dist, wy = Dy/dist, wz = Dz/dist;

        let ux = -wy, uy = wx, uz = 0;
        let uLen = Math.sqrt(ux*ux + uy*uy);
        if (uLen === 0) { ux = 1; uy = 0; } else { ux /= uLen; uy /= uLen; }
        const vx = wy*uz - wz*uy, vy = wz*ux - wx*uz, vz = wx*uy - wy*ux;

        const x_0 = Mx*ux + My*uy + Mz*uz;
        const y_0 = Mx*vx + My*vy + Mz*vz;
        const d_0_2 = x_0*x_0 + y_0*y_0;
        const d_0 = Math.sqrt(d_0_2);

        // Check if shadow is close to Earth
        if (d_0 >= this.RE_KM + radiusKm) return null;

        const gmst = Astronomy.SiderealTime(t);
        const theta = gmst * 15 * Math.PI / 180;

        // Normal unit vector towards the Sun
        const sunDist = Math.sqrt(Sx*Sx + Sy*Sy + Sz*Sz);
        const sx = Sx / sunDist, sy = Sy / sunDist, sz = Sz / sunDist;

        const coords = [];
        for (let i = 0; i <= numPoints; i++) {
            const phi = (i / numPoints) * 2 * Math.PI;
            const cos_th = Math.cos(phi);
            const sin_th = Math.sin(phi);

            let x = x_0 + radiusKm * cos_th;
            let y = y_0 + radiusKm * sin_th;
            let d2 = x*x + y*y;

            let Px, Py, Pz;
            if (d2 >= this.RE_KM * this.RE_KM) {
                // Project to limb
                const scale = this.RE_KM / Math.sqrt(d2);
                const xi = x * scale;
                const yi = y * scale;
                Px = xi * ux + yi * vx;
                Py = xi * uy + yi * vy;
                Pz = xi * uz + yi * vz;
            } else {
                let z = -Math.sqrt(this.RE_KM * this.RE_KM - d2);
                for (let iter = 0; iter < 3; iter++) {
                    Px = x * ux + y * vx + z * wx;
                    Py = x * uy + y * vy + z * wy;
                    Pz = x * uz + y * vz + z * wz;
                    const r_gc = Math.sqrt(Px*Px + Py*Py + Pz*Pz);
                    const sin_lat = Pz / r_gc;
                    const Re = this.RE_KM / Math.sqrt(1 + this.WGS84_E2 * sin_lat * sin_lat);
                    const z2 = Re*Re - d2;
                    z = z2 > 0 ? -Math.sqrt(z2) : 0;
                }
            }



            let lonRad = Math.atan2(Py, Px) - theta;
            while (lonRad < -Math.PI) lonRad += 2*Math.PI;
            while (lonRad > Math.PI) lonRad -= 2*Math.PI;

            const lat_gc = Math.atan2(Pz, Math.sqrt(Px*Px + Py*Py));
            const lat_gd = Math.atan((this.RE_KM*this.RE_KM)/(this.RP_KM*this.RP_KM) * Math.tan(lat_gc));
            let lat = lat_gd * 180 / Math.PI;
            if (lat > 85.0) lat = 85.0;
            if (lat < -85.0) lat = -85.0;
            coords.push([lat, lonRad * 180 / Math.PI]);
        }

        // Make continuous
        for (let i = 1; i < coords.length; i++) {
            let diff = coords[i][1] - coords[i-1][1];
            while (diff < -180) diff += 360;
            while (diff > 180) diff -= 360;
            coords[i][1] = coords[i-1][1] + diff;
        }

        // Polar Closure: If the polygon contains the pole (spans > 270 degrees of longitude),
        // route the closing boundary along the top/bottom edge of the Mercator map to prevent diagonal twisting.
        if (coords.length > 2) {
            const span = coords[coords.length - 1][1] - coords[0][1];
            if (Math.abs(span) > 270) {
                const poleLat = (coords[0][0] > 0) ? 85.0 : -85.0;
                coords.push([poleLat, coords[coords.length - 1][1]]);
                coords.push([poleLat, coords[0][1]]);
            }
        }

        return coords;
    },

    /**
     * Calculates the projected penumbra and umbra shadow polygons at a given instant.
     * Used for the dynamic player to show a mathematically correct, projected shadow footprint.
     */
    calculateProjectedShadowFootprints(date) {
        const t = Astronomy.MakeTime(date);
        const sun = Astronomy.GeoVector(Astronomy.Body.Sun, t, false);
        const moon = Astronomy.GeoVector(Astronomy.Body.Moon, t, false);
        if (!sun || !moon) return null;

        const Mx = moon.x * this.AU_KM, My = moon.y * this.AU_KM, Mz = moon.z * this.AU_KM;
        const Sx = sun.x * this.AU_KM, Sy = sun.y * this.AU_KM, Sz = sun.z * this.AU_KM;
        const Dx = Mx - Sx, Dy = My - Sy, Dz = Mz - Sz;
        const dist = Math.sqrt(Dx*Dx + Dy*Dy + Dz*Dz);
        const wx = Dx/dist, wy = Dy/dist, wz = Dz/dist;

        let ux = -wy, uy = wx, uz = 0;
        let uLen = Math.sqrt(ux*ux + uy*uy);
        if (uLen === 0) { ux = 1; uy = 0; } else { ux /= uLen; uy /= uLen; }
        const vx = wy*uz - wz*uy, vy = wz*ux - wx*uz, vz = wx*uy - wy*ux;

        const x_0 = Mx*ux + My*uy + Mz*uz;
        const y_0 = Mx*vx + My*vy + Mz*vz;
        const d_0_2 = x_0*x_0 + y_0*y_0;
        const d_0 = Math.sqrt(d_0_2);

        // If shadow center is too far off-Earth, don't draw anything
        if (d_0 >= this.RE_KM + 3900) return null;

        let z_surface = d_0 < this.RE_KM ? -Math.sqrt(this.RE_KM * this.RE_KM - d_0_2) : 0;
        const z_M = Mx*wx + My*wy + Mz*wz;
        const dist_surface_to_moon = Math.abs(z_M - z_surface);
        const distSun = Math.sqrt(Sx*Sx + Sy*Sy + Sz*Sz);
        const thetaS = this.RS_KM / (distSun + Math.abs(z_surface));
        const thetaM = this.RM_KM / dist_surface_to_moon;

        const footprints = {
            umbra: null,
            penumbra: {}
        };

        // 1. Calculate penumbra contours at levels [0.01, 0.25, 0.50, 0.75]
        const levels = [0.01, 0.25, 0.50, 0.75];
        levels.forEach(l => {
            const sep = this.findSeparationForObscuration(thetaS, thetaM, l);
            const radius = sep * dist_surface_to_moon;
            const poly = this.calculateProjectedShadowPolygon(t, radius);
            if (poly) {
                footprints.penumbra[l] = poly;
            }
        });

        // 2. Calculate umbra footprint (shadow.ru)
        if (d_0 < this.RE_KM) {
            const type = (thetaM > thetaS) ? "Total" : "Annular";
            const ru = dist_surface_to_moon * Math.abs(thetaS - thetaM);
            const poly = this.calculateProjectedShadowPolygon(t, ru);
            if (poly) {
                footprints.umbra = {
                    type: type,
                    coordinates: poly,
                    ru: ru
                };
            }
        }

        return footprints;
    },

    /**
     * Calculates the full path of a global solar eclipse centered around its peak date.
     * Iterates through the eclipse duration in 1-minute steps for a smooth high-resolution trace,
     * returning only the central totality/annularity path segment points.
     */
    calculateSolarEclipsePath(peakDate) {
        const path = [];
        const tPeak = Astronomy.MakeTime(peakDate);
        const eclipse = Astronomy.SearchGlobalSolarEclipse(tPeak);

        let startMs, endMs;
        if (eclipse && Math.abs(eclipse.peak.ut - tPeak.ut) < 0.5) {
            const durationMinutes = eclipse.sd_penum || 180;
            startMs = eclipse.peak.date.getTime() - durationMinutes * 60 * 1000;
            endMs = eclipse.peak.date.getTime() + durationMinutes * 60 * 1000;
        } else {
            const peakMs = new Date(peakDate).getTime();
            startMs = peakMs - 180 * 60000;
            endMs = peakMs + 180 * 60000;
        }

        const stepMs = 60 * 1000; // 1-minute steps
        for (let ms = startMs; ms <= endMs; ms += stepMs) {
            const date = new Date(ms);
            const limits = this.calculateUmbralLimits(date);
            if (limits) {
                const local = this.calculateLocalSolarEclipse(date, limits.center.lat, limits.center.lon);
                path.push({
                    time: date.toISOString(),
                    lat: limits.center.lat,
                    lon: limits.center.lon,
                    northLat: limits.north.lat,
                    northLon: limits.north.lon,
                    southLat: limits.south.lat,
                    southLon: limits.south.lon,
                    ru: limits.ru,
                    rp: limits.rp,
                    type: limits.type,
                    obscuration: local ? local.obscuration : 1.0
                });
            }
        }
        return path;
    },

    /**
     * Calculates penumbral shadow contour bands for a solar eclipse.
     * For each timestep and each obscuration level, projects the north/south boundary points
     * at the radius that produces that obscuration onto the WGS84 ellipsoid.
     * @param {Date} peakDate - Peak date of the eclipse
     * @param {number[]} levels - Obscuration levels to compute (default: [0.80, 0.60, 0.40, 0.20])
     * @returns {Object} Map from level to array of {time, northLat, northLon, southLat, southLon}
     */
    calculatePenumbralBands(peakDate, levels = [0.80, 0.60, 0.40, 0.20]) {
        const bands = {};
        levels.forEach(l => bands[l] = []);

        const tPeak = Astronomy.MakeTime(peakDate);
        const eclipse = Astronomy.SearchGlobalSolarEclipse(tPeak);

        let startMs, endMs;
        if (eclipse && Math.abs(eclipse.peak.ut - tPeak.ut) < 0.5) {
            const durationMinutes = eclipse.sd_penum || 180;
            startMs = eclipse.peak.date.getTime() - durationMinutes * 60 * 1000;
            endMs = eclipse.peak.date.getTime() + durationMinutes * 60 * 1000;
        } else {
            const peakMs = new Date(peakDate).getTime();
            startMs = peakMs - 210 * 60000;
            endMs = peakMs + 210 * 60000;
        }

        const stepMs = 2 * 60 * 1000; // 2-minute steps for penumbra (wider, smoother)
        const self = this;

        for (let ms = startMs; ms <= endMs; ms += stepMs) {
            const date = new Date(ms);
            const t = Astronomy.MakeTime(date);
            const sun = Astronomy.GeoVector(Astronomy.Body.Sun, t, false);
            const moon = Astronomy.GeoVector(Astronomy.Body.Moon, t, false);
            if (!sun || !moon) continue;

            const Mx = moon.x * this.AU_KM;
            const My = moon.y * this.AU_KM;
            const Mz = moon.z * this.AU_KM;
            const Sx = sun.x * this.AU_KM;
            const Sy = sun.y * this.AU_KM;
            const Sz = sun.z * this.AU_KM;

            const Dx = Mx - Sx, Dy = My - Sy, Dz = Mz - Sz;
            const distSunMoon = Math.sqrt(Dx*Dx + Dy*Dy + Dz*Dz);

            const wx = Dx/distSunMoon, wy = Dy/distSunMoon, wz = Dz/distSunMoon;

            let ux = -wy, uy = wx, uz = 0;
            let uLen = Math.sqrt(ux*ux + uy*uy);
            if (uLen === 0) { ux = 1; uy = 0; } else { ux /= uLen; uy /= uLen; }
            const vx = wy*uz - wz*uy, vy = wz*ux - wx*uz, vz = wx*uy - wy*ux;

            const x_0 = Mx*ux + My*uy + Mz*uz;
            const y_0 = Mx*vx + My*vy + Mz*vz;
            const z_M = Mx*wx + My*wy + Mz*wz; // Moon's z in fundamental plane

            // Check if shadow center is within Earth disk
            const d_0_2 = x_0*x_0 + y_0*y_0;
            const d_0 = Math.sqrt(d_0_2);

            // Sun distance from Earth center (for angular size)
            const d_S_km = Math.sqrt(Sx*Sx + Sy*Sy + Sz*Sz);

            // Earth surface z-coordinate at shadow center (first approximation)
            let z_surface;
            if (d_0 < this.RE_KM) {
                z_surface = -Math.sqrt(this.RE_KM * this.RE_KM - d_0_2);
            } else {
                z_surface = 0; // shadow center is off Earth, use limb
            }

            // Distance from Earth surface to Moon along the shadow axis
            const dist_surface_to_moon = Math.abs(z_M - z_surface);

            // Angular radii as seen from Earth surface (radians)
            const thetaS = this.RS_KM / (d_S_km + Math.abs(z_surface)); // approximate correction
            const thetaM = this.RM_KM / dist_surface_to_moon;

            const gmst = Astronomy.SiderealTime(t);
            const theta = gmst * 15 * Math.PI / 180;

            // Project a point at a given radius from the shadow axis onto Earth.
            // If the point falls off the Earth's disk, find the exact intersection of the contour circle with the limb.
            function projectAtRadius(radius, cos_th, sin_th) {
                let x = x_0 + radius * cos_th;
                let y = y_0 + radius * sin_th;
                let d2 = x*x + y*y;
                let Re = self.RE_KM;
                let z2 = Re * Re - d2;

                let Px, Py, Pz;
                if (z2 < 0) {
                    // Off-Earth: calculate exact intersection of the contour circle with the Earth's limb.
                    const C = (Re * Re + d_0_2 - radius * radius) / 2;
                    const term = d_0_2 * Re * Re - C * C;
                    const H_q = term > 0 ? Math.sqrt(term) : 0;
                    
                    // Choose the intersection point corresponding to the north (sin_th > 0) or south (sin_th < 0) boundary
                    let xi, yi;
                    if (sin_th > 0) {
                        const x1 = (C * x_0 - y_0 * H_q) / d_0_2;
                        const y1 = (C * y_0 + x_0 * H_q) / d_0_2;
                        const x2 = (C * x_0 + y_0 * H_q) / d_0_2;
                        const y2 = (C * y_0 - x_0 * H_q) / d_0_2;
                        if (y1 > y2) { xi = x1; yi = y1; } else { xi = x2; yi = y2; }
                    } else {
                        const x1 = (C * x_0 - y_0 * H_q) / d_0_2;
                        const y1 = (C * y_0 + x_0 * H_q) / d_0_2;
                        const x2 = (C * x_0 + y_0 * H_q) / d_0_2;
                        const y2 = (C * y_0 - x_0 * H_q) / d_0_2;
                        if (y1 < y2) { xi = x1; yi = y1; } else { xi = x2; yi = y2; }
                    }
                    Px = xi * ux + yi * vx;
                    Py = xi * uy + yi * vy;
                    Pz = xi * uz + yi * vz;
                } else {
                    let z = -Math.sqrt(z2);
                    for (let iter = 0; iter < 3; iter++) {
                        Px = x * ux + y * vx + z * wx;
                        Py = x * uy + y * vy + z * wy;
                        Pz = x * uz + y * vz + z * wz;
                        const r_gc = Math.sqrt(Px*Px + Py*Py + Pz*Pz);
                        if (r_gc === 0) break;
                        const sin_lat = Pz / r_gc;
                        Re = self.RE_KM / Math.sqrt(1 + self.WGS84_E2 * sin_lat * sin_lat);
                        z2 = Re*Re - d2;
                        if (z2 < 0) {
                            // Fallback to exact limb intersection for oblate spheroid boundary
                            const C = (Re * Re + d_0_2 - radius * radius) / 2;
                            const H_q = Math.sqrt(Math.max(0, d_0_2 * Re * Re - C * C));
                            let xi, yi;
                            if (sin_th > 0) {
                                const x1 = (C * x_0 - y_0 * H_q) / d_0_2, y1 = (C * y_0 + x_0 * H_q) / d_0_2;
                                const x2 = (C * x_0 + y_0 * H_q) / d_0_2, y2 = (C * y_0 - x_0 * H_q) / d_0_2;
                                if (y1 > y2) { xi = x1; yi = y1; } else { xi = x2; yi = y2; }
                            } else {
                                const x1 = (C * x_0 - y_0 * H_q) / d_0_2, y1 = (C * y_0 + x_0 * H_q) / d_0_2;
                                const x2 = (C * x_0 + y_0 * H_q) / d_0_2, y2 = (C * y_0 - x_0 * H_q) / d_0_2;
                                if (y1 < y2) { xi = x1; yi = y1; } else { xi = x2; yi = y2; }
                            }
                            Px = xi * ux + yi * vx;
                            Py = xi * uy + yi * vy;
                            Pz = xi * uz + yi * vz;
                            break;
                        }
                        z = -Math.sqrt(z2);
                    }
                    if (z2 >= 0) {
                        Px = x * ux + y * vx + (-Math.sqrt(z2)) * wx;
                        Py = x * uy + y * vy + (-Math.sqrt(z2)) * wy;
                        Pz = x * uz + y * vz + (-Math.sqrt(z2)) * wz;
                    }
                }

                let lonRad = Math.atan2(Py, Px) - theta;
                while (lonRad < -Math.PI) lonRad += 2*Math.PI;
                while (lonRad > Math.PI) lonRad -= 2*Math.PI;

                const lat_gc = Math.atan2(Pz, Math.sqrt(Px*Px + Py*Py));
                const lat_gd = Math.atan((self.RE_KM*self.RE_KM)/(self.RP_KM*self.RP_KM) * Math.tan(lat_gc));

                return {
                    lat: lat_gd * 180 / Math.PI,
                    lon: lonRad * 180 / Math.PI
                };
            }

            for (const level of levels) {
                const sep = this.findSeparationForObscuration(thetaS, thetaM, level);
                const radius = sep * dist_surface_to_moon; // lateral distance in fundamental plane (km)

                // Mathematically check if the contour circle actually intersects the Earth's disk.
                // It must not be completely outside (d_0 >= self.RE_KM + radius)
                // and the Earth must not be completely inside the contour (radius >= self.RE_KM + d_0)
                if (d_0 >= self.RE_KM + radius || radius >= self.RE_KM + d_0) {
                    continue;
                }

                const north = projectAtRadius(radius, 0, 1);
                const south = projectAtRadius(radius, 0, -1);

                if (north && south) {
                    bands[level].push({
                        time: date.toISOString(),
                        northLat: north.lat,
                        northLon: north.lon,
                        southLat: south.lat,
                        southLon: south.lon
                    });
                }
            }
        }
        return bands;
    },

    /**
     * Computes local circumstances for a solar eclipse at a specific observer location.
     */
    calculateLocalSolarEclipse(date, observerLat, observerLon) {
        const t = Astronomy.MakeTime(date);
        const obs = new Astronomy.Observer(observerLat, observerLon, 0);

        const sunEq = Astronomy.Equator(Astronomy.Body.Sun, t, obs, true, true);
        const moonEq = Astronomy.Equator(Astronomy.Body.Moon, t, obs, true, true);

        if (!sunEq || !moonEq) return null;

        // Topocentric angular distance in degrees
        const sep = Astronomy.AngleBetween(sunEq.vec, moonEq.vec);

        // Calculate angular sizes of Sun and Moon
        const distSun_km = sunEq.dist * this.AU_KM;
        const distMoon_km = moonEq.dist * this.AU_KM;

        const thetaS = Math.asin(this.RS_KM / distSun_km) * 180 / Math.PI;
        const thetaM = Math.asin(this.RM_KM / distMoon_km) * 180 / Math.PI;

        // Obscuration calculations
        let obscuration = 0;
        let magnitude = 0;

        if (sep >= thetaS + thetaM) {
            obscuration = 0;
            magnitude = 0;
        } else if (sep <= Math.abs(thetaS - thetaM)) {
            // One circle inside the other
            if (thetaM >= thetaS) {
                obscuration = 1.0; // Total
                magnitude = thetaM / thetaS;
            } else {
                obscuration = (thetaM * thetaM) / (thetaS * thetaS); // Annular
                magnitude = thetaM / thetaS;
            }
        } else {
            // Partial overlap: circular intersection area
            const r1 = thetaS;
            const r2 = thetaM;
            const d = sep;

            const part1 = r1 * r1 * Math.acos((d*d + r1*r1 - r2*r2) / (2*d*r1));
            const part2 = r2 * r2 * Math.acos((d*d + r2*r2 - r1*r1) / (2*d*r2));
            const part3 = 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
            
            const areaIntersection = part1 + part2 - part3;
            const areaSun = Math.PI * r1 * r1;

            obscuration = areaIntersection / areaSun;
            magnitude = (r1 + r2 - d) / (2 * r1);
        }

        // Get local Alt/Az
        const sunHor = Astronomy.Horizon(t, obs, sunEq.ra, sunEq.dec, 'normal');
        const moonHor = Astronomy.Horizon(t, obs, moonEq.ra, moonEq.dec, 'normal');

        if (sunHor.altitude < 0) {
            obscuration = 0;
            magnitude = 0;
        }

        return {
            sunAlt: sunHor.altitude,
            sunAz: sunHor.azimuth,
            moonAlt: moonHor.altitude,
            moonAz: moonHor.azimuth,
            separation: sep,
            sunRadius: thetaS,
            moonRadius: thetaM,
            obscuration: obscuration, // 0 to 1
            magnitude: magnitude,
            sunEq: sunEq,
            moonEq: moonEq
        };
    },

    /**
     * Computes local circumstances for a lunar eclipse.
     */
    calculateLocalLunarEclipse(date) {
        const t = Astronomy.MakeTime(date);

        // Get geocentric J2000 positions
        const sun = Astronomy.GeoVector(Astronomy.Body.Sun, t, false);
        const moon = Astronomy.GeoVector(Astronomy.Body.Moon, t, false);

        if (!sun || !moon) return null;

        // Shadow center is directly opposite the Sun
        const shadowCenter = {
            x: -sun.x,
            y: -sun.y,
            z: -sun.z
        };

        const distMoon_km = Math.sqrt(moon.x*moon.x + moon.y*moon.y + moon.z*moon.z) * this.AU_KM;
        const distSun_km = Math.sqrt(sun.x*sun.x + sun.y*sun.y + sun.z*sun.z) * this.AU_KM;

        // Radii of umbra and penumbra at Moon's distance
        const ru = this.RE_KM - distMoon_km * (this.RS_KM - this.RE_KM) / distSun_km;
        const rp = this.RE_KM + distMoon_km * (this.RS_KM + this.RE_KM) / distSun_km;

        const thetaU = Math.asin(ru / distMoon_km) * 180 / Math.PI;
        const thetaP = Math.asin(rp / distMoon_km) * 180 / Math.PI;
        const thetaM = Math.asin(this.RM_KM / distMoon_km) * 180 / Math.PI;

        // Angular distance from Moon to shadow center
        // Convert shadow center to RA/Dec
        const shadowDist = Math.sqrt(shadowCenter.x*shadowCenter.x + shadowCenter.y*shadowCenter.y + shadowCenter.z*shadowCenter.z);
        const shadowDec = Math.asin(shadowCenter.z / shadowDist) * 180 / Math.PI;
        let shadowRa = Math.atan2(shadowCenter.y, shadowCenter.x) * 180 / Math.PI;
        if (shadowRa < 0) shadowRa += 360;

        // Convert Moon to RA/Dec
        const moonDist = Math.sqrt(moon.x*moon.x + moon.y*moon.y + moon.z*moon.z);
        const moonDec = Math.asin(moon.z / moonDist) * 180 / Math.PI;
        let moonRa = Math.atan2(moon.y, moon.x) * 180 / Math.PI;
        if (moonRa < 0) moonRa += 360;

        // Calculate angular distance on celestial sphere
        const dec1 = shadowDec * Math.PI / 180;
        const dec2 = moonDec * Math.PI / 180;
        const raDiff = (shadowRa - moonRa) * Math.PI / 180;

        const cosSep = Math.sin(dec1)*Math.sin(dec2) + Math.cos(dec1)*Math.cos(dec2)*Math.cos(raDiff);
        const sep = Math.acos(Math.max(-1, Math.min(1, cosSep))) * 180 / Math.PI;

        // Determine Eclipse Phase
        let type = "None";
        let obscuration = 0;
        if (sep < thetaP + thetaM) {
            type = "Penumbral";
            obscuration = (thetaP + thetaM - sep) / (2 * thetaM);
            if (sep < thetaU + thetaM) {
                type = "Partial";
                if (sep <= thetaU - thetaM) {
                    type = "Total";
                    obscuration = 1.0;
                }
            }
        }

        // Relative coordinates for plotting (normalized so shadow center is 0,0)
        // Express in degrees
        const dx = (moonRa - shadowRa) * Math.cos(dec1);
        const dy = moonDec - shadowDec;

        return {
            separation: sep,
            dx: dx,
            dy: dy,
            umbraRadius: thetaU,
            penumbraRadius: thetaP,
            moonRadius: thetaM,
            type: type,
            obscuration: Math.min(1.0, obscuration)
        };
    },

    /**
     * Calculates local circumstances for planetary transits (Mercury/Venus crossing Sun).
     */
    calculateTransit(date, body, observerLat, observerLon) {
        const t = Astronomy.MakeTime(date);
        const obs = new Astronomy.Observer(observerLat, observerLon, 0);

        const sunEq = Astronomy.Equator(Astronomy.Body.Sun, t, obs, true, true);
        const planetEq = Astronomy.Equator(body, t, obs, true, true);

        if (!sunEq || !planetEq) return null;

        const sep = Astronomy.AngleBetween(sunEq.vec, planetEq.vec);

        const distSun_km = sunEq.dist * this.AU_KM;
        const distPlanet_km = planetEq.dist * this.AU_KM;

        const planetRadius_km = body === Astronomy.Body.Mercury ? 2439.7 : 6051.8;

        const thetaS = Math.asin(this.RS_KM / distSun_km) * 180 / Math.PI;
        const thetaP = Math.asin(planetRadius_km / distPlanet_km) * 180 / Math.PI;

        const sunHor = Astronomy.Horizon(t, obs, sunEq.ra, sunEq.dec, 'normal');
        const planetHor = Astronomy.Horizon(t, obs, planetEq.ra, planetEq.dec, 'normal');

        // Check if transit is occurring
        const isTransit = sep < thetaS + thetaP;

        // Relative coordinates for plotting
        const dec1 = sunEq.dec * Math.PI / 180;
        const dx = (planetEq.ra - sunEq.ra) * 15 * Math.cos(dec1); // RA is in hours, multiply by 15 for degrees
        const dy = planetEq.dec - sunEq.dec;

        return {
            sunAlt: sunHor.altitude,
            sunAz: sunHor.azimuth,
            planetAlt: planetHor.altitude,
            planetAz: planetHor.azimuth,
            separation: sep,
            sunRadius: thetaS,
            planetRadius: thetaP,
            isTransit: isTransit,
            dx: dx,
            dy: dy
        };
    },

    /**
     * Calculates the night side polygon (day/night terminator coords) at a given date.
     */
    calculateDayNightTerminator(date) {
        const t = Astronomy.MakeTime(date);
        const sun = Astronomy.GeoVector(Astronomy.Body.Sun, t, false);
        if (!sun) return null;

        const R = Math.sqrt(sun.x*sun.x + sun.y*sun.y + sun.z*sun.z);
        const sx = sun.x/R, sy = sun.y/R, sz = sun.z/R;

        const phi0 = Math.asin(sz); // Sun declination in radians
        const gmst = Astronomy.SiderealTime(t);
        const theta = gmst * 15 * Math.PI / 180;
        let lambda0 = Math.atan2(sy, sx) - theta; // Sun subsolar longitude in radians
        while (lambda0 < -Math.PI) lambda0 += 2*Math.PI;
        while (lambda0 > Math.PI) lambda0 -= 2*Math.PI;

        const tanPhi0 = Math.tan(phi0 === 0 ? 1e-7 : phi0);

        const coords = [];
        if (phi0 >= 0) {
            coords.push([-90, -180]);
            for (let lon = -180; lon <= 180; lon += 2) {
                const lonRad = lon * Math.PI / 180;
                const latRad = Math.atan(-Math.cos(lonRad - lambda0) / tanPhi0);
                coords.push([latRad * 180 / Math.PI, lon]);
            }
            coords.push([-90, 180]);
        } else {
            coords.push([90, 180]);
            for (let lon = 180; lon >= -180; lon -= 2) {
                const lonRad = lon * Math.PI / 180;
                const latRad = Math.atan(-Math.cos(lonRad - lambda0) / tanPhi0);
                coords.push([latRad * 180 / Math.PI, lon]);
            }
            coords.push([90, -180]);
        }

        return coords;
    },

    /**
     * Checks if a specific location (lat, lon) is in daytime at a given date.
     */
    isDaytime(lat, lon, date) {
        const t = Astronomy.MakeTime(date);
        const sun = Astronomy.GeoVector(Astronomy.Body.Sun, t, false);
        if (!sun) return true;

        const R = Math.sqrt(sun.x*sun.x + sun.y*sun.y + sun.z*sun.z);
        const sx = sun.x/R, sy = sun.y/R, sz = sun.z/R;

        const phi0 = Math.asin(sz); // Sun declination in radians
        const gmst = Astronomy.SiderealTime(t);
        const theta = gmst * 15 * Math.PI / 180;
        let lambda0 = Math.atan2(sy, sx) - theta; // Sun subsolar longitude in radians
        while (lambda0 < -Math.PI) lambda0 += 2*Math.PI;
        while (lambda0 > Math.PI) lambda0 -= 2*Math.PI;

        const latRad = lat * Math.PI / 180;
        const lonRad = lon * Math.PI / 180;

        // Calculate Sun's altitude (sine of altitude)
        const sin_alt = Math.sin(latRad) * Math.sin(phi0) + Math.cos(latRad) * Math.cos(phi0) * Math.cos(lonRad - lambda0);
        return sin_alt > 0;
    }
};
