// ==========================================================================
// MODULE: RADIO APERTURE SYNTHESIS VISUALIZER
// ==========================================================================

const GRID_SIZE = 128; // Grid size for Fourier and CLEAN solvers
const CENTER = GRID_SIZE / 2; // (64, 64)

// State Management
const state = {
    // Array Configuration
    preset: "vla-y",
    scale: 1.0,
    antennas: [], // Array of {x, y} in meters, max 50
    customAntennas: [], // Temp custom array
    
    // Observational Settings
    declination: 30.0, // degrees
    duration: 4.0, // hours
    frequency: 15.0, // GHz
    
    // UV coverage & Beam
    uvMask: new Float32Array(GRID_SIZE * GRID_SIZE),
    dirtyBeam: new Float32Array(GRID_SIZE * GRID_SIZE),
    
    // CLEAN imaging arrays
    targetName: "blackhole",
    trueImage: new Float32Array(GRID_SIZE * GRID_SIZE),
    dirtyImage: new Float32Array(GRID_SIZE * GRID_SIZE),
    cleanComponents: new Float32Array(GRID_SIZE * GRID_SIZE),
    residual: new Float32Array(GRID_SIZE * GRID_SIZE),
    restoredImage: new Float32Array(GRID_SIZE * GRID_SIZE),
    
    // CLEAN config & state
    loopGain: 0.10,
    maxIter: 150,
    currentIter: 0,
    peakResidual: 1.0,
    initialPeak: 1.0,
    cleanStatus: "idle", // "idle", "running", "complete"
    cleanIntervalId: null,
    
    // UI elements
    draggingAntenna: null,
    dragIndex: -1
};

// Antenna Layout Presets (Physical ground coords in meters, range +/- 500m)
const ANTENNA_PRESETS = {
    "vla-y": () => {
        const ants = [];
        // Y shape: 3 arms at 120 degree offsets. 9 antennas per arm
        const arms = [0, 120, 240];
        arms.forEach(angle => {
            const rad = angle * Math.PI / 180;
            for (let i = 1; i <= 9; i++) {
                // Barrowman-like power law spacing to expand resolution coverage
                const d = 50 * Math.pow(i, 1.4);
                ants.push({
                    x: d * Math.sin(rad),
                    y: d * Math.cos(rad)
                });
            }
        });
        // Central antenna
        ants.push({ x: 0, y: 0 });
        return ants;
    },
    "alma-spiral": () => {
        const ants = [];
        // Fermat spiral arrangement
        const goldenAngle = 137.5 * Math.PI / 180;
        for (let i = 1; i <= 50; i++) {
            const r = 60 * Math.sqrt(i);
            const theta = i * goldenAngle;
            ants.push({
                x: r * Math.sin(theta),
                y: r * Math.cos(theta)
            });
        }
        return ants;
    },
    "compact-circle": () => {
        const ants = [];
        const num = 12;
        for (let i = 0; i < num; i++) {
            const angle = (i / num) * 2 * Math.PI;
            ants.push({
                x: 220 * Math.sin(angle),
                y: 220 * Math.cos(angle)
            });
        }
        return ants;
    },
    "vlba-sparse": () => {
        // Continental scale (simulated coordinates stretched within limits)
        return [
            { x: -480, y: 320 }, // Mauna Kea, HI
            { x: -350, y: -20 }, // Owens Valley, CA
            { x: -210, y: 110 }, // Brewster, WA
            { x: -140, y: -90 }, // Kitt Peak, AZ
            { x: -50,  y: -20 }, // Pie Town, NM
            { x: 30,   y: 40  }, // Los Alamos, NM
            { x: 120,  y: -150 }, // Fort Davis, TX
            { x: 260,  y: -80 }, // North Liberty, IA
            { x: 380,  y: 190 }, // Hancock, NH
            { x: 490,  y: -310 } // St. Croix, VI
        ];
    }
};

// Target Sky Sources (128x128 pixel maps)
const TARGET_SOURCES = {
    "blackhole": (grid) => {
        // M87* Ring with relativistic doppler boosting (asymmetrical ring)
        const R_ring = 18;
        const width = 4.5;
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const dy = y - CENTER;
                const dx = x - CENTER;
                const r = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                
                if (Math.abs(r - R_ring) < width) {
                    // Beaming factor: bottom-left (angle around -3/4 pi) is brighter
                    const beaming = 1.0 + 0.85 * Math.sin(angle - Math.PI/4);
                    const env = Math.exp(-Math.pow(r - R_ring, 2) / (2 * width * width));
                    grid[y * GRID_SIZE + x] = beaming * env;
                }
            }
        }
    },
    "double-lobes": (grid) => {
        // Cygnus A: central core and two hot-spot radio lobes
        const coreIntensity = 0.25;
        const lobeSpacing = 32;
        const lobeSigma = 5.0;
        
        // Central Core
        grid[CENTER * GRID_SIZE + CENTER] = coreIntensity;
        
        // Left & Right lobes
        const l1x = CENTER - lobeSpacing;
        const l1y = CENTER - 4; // slight angle
        const l2x = CENTER + lobeSpacing;
        const l2y = CENTER + 4;
        
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                // Lobe 1 Gaussian
                const d1sq = (x - l1x)*(x - l1x) + (y - l1y)*(y - l1y);
                const val1 = Math.exp(-d1sq / (2 * lobeSigma * lobeSigma)) * 0.9;
                
                // Lobe 2 Gaussian
                const d2sq = (x - l2x)*(x - l2x) + (y - l2y)*(y - l2y);
                const val2 = Math.exp(-d2sq / (2 * lobeSigma * lobeSigma)) * 0.95;
                
                // Filament jets connection (subtle)
                let jet = 0;
                const dx_core = x - CENTER;
                const dy_core = y - CENTER;
                if (Math.abs(dx_core) < lobeSpacing) {
                    const jetLineY = CENTER + (dx_core / lobeSpacing) * 4;
                    if (Math.abs(y - jetLineY) < 1.5) {
                        jet = 0.08 * (1 - Math.abs(dx_core) / lobeSpacing);
                    }
                }
                
                grid[y * GRID_SIZE + x] = Math.max(grid[y * GRID_SIZE + x], val1 + val2 + jet);
            }
        }
    },
    "binary-stars": (grid) => {
        // Close double radio stars
        const r1x = CENTER - 10;
        const r1y = CENTER - 10;
        const r2x = CENTER + 8;
        const r2y = CENTER + 8;
        const starSigma = 2.2;
        
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const d1sq = (x - r1x)*(x - r1x) + (y - r1y)*(y - r1y);
                const val1 = Math.exp(-d1sq / (2 * starSigma * starSigma)) * 0.95;
                
                const d2sq = (x - r2x)*(x - r2x) + (y - r2y)*(y - r2y);
                const val2 = Math.exp(-d2sq / (2 * starSigma * starSigma)) * 0.70;
                
                grid[y * GRID_SIZE + x] = val1 + val2;
            }
        }
    },
    "point-source": (grid) => {
        // Pure single calibration point source (Dirac delta function, smoothed slightly)
        const starSigma = 1.5;
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const dsq = (x - CENTER)*(x - CENTER) + (y - CENTER)*(y - CENTER);
                grid[y * GRID_SIZE + x] = Math.exp(-dsq / (2 * starSigma * starSigma));
            }
        }
    }
};

// ==========================================================================
// 1D & 2D COOLEY-TUKEY FAST FOURIER TRANSFORM (FFT) ENGINE
// ==========================================================================

// 1D FFT radix-2 decimation-in-time
function fft1D(real, imag, dir) {
    const n = real.length;
    if (n <= 1) return;
    
    // Bit-reversal sorting
    for (let i = 0, j = 0; i < n; i++) {
        if (i < j) {
            let temp = real[i]; real[i] = real[j]; real[j] = temp;
            temp = imag[i]; imag[i] = imag[j]; imag[j] = temp;
        }
        let bit = n >> 1;
        while (j & bit) {
            j ^= bit;
            bit >>= 1;
        }
        j ^= bit;
    }
    
    // Cooley-Tukey loops
    for (let len = 2; len <= n; len <<= 1) {
        const angle = (2 * Math.PI / len) * (dir === 1 ? -1 : 1);
        const wlen_r = Math.cos(angle);
        const wlen_i = Math.sin(angle);
        for (let i = 0; i < n; i += len) {
            let w_r = 1;
            let w_i = 0;
            for (let j = 0; j < len / 2; j++) {
                const idxA = i + j;
                const idxB = i + j + len/2;
                const u_r = real[idxA];
                const u_i = imag[idxA];
                const v_r = real[idxB] * w_r - imag[idxB] * w_i;
                const v_i = real[idxB] * w_i + imag[idxB] * w_r;
                
                real[idxA] = u_r + v_r;
                imag[idxA] = u_i + v_i;
                real[idxB] = u_r - v_r;
                imag[idxB] = u_i - v_i;
                
                const next_w_r = w_r * wlen_r - w_i * wlen_i;
                w_i = w_r * wlen_i + w_i * wlen_r;
                w_r = next_w_r;
            }
        }
    }
    
    // Scale inverse FFT
    if (dir === -1) {
        for (let i = 0; i < n; i++) {
            real[i] /= n;
            imag[i] /= n;
        }
    }
}

// 2D FFT: performs 1D FFT on rows, then on columns
function fft2D(real, imag, dir) {
    const N = GRID_SIZE;
    
    // 1. Row Transforms
    for (let r = 0; r < N; r++) {
        const rRow = new Float32Array(N);
        const iRow = new Float32Array(N);
        const rowOffset = r * N;
        for (let c = 0; c < N; c++) {
            rRow[c] = real[rowOffset + c];
            iRow[c] = imag[rowOffset + c];
        }
        fft1D(rRow, iRow, dir);
        for (let c = 0; c < N; c++) {
            real[rowOffset + c] = rRow[c];
            imag[rowOffset + c] = iRow[c];
        }
    }
    
    // 2. Column Transforms
    for (let c = 0; c < N; c++) {
        const rCol = new Float32Array(N);
        const iCol = new Float32Array(N);
        for (let r = 0; r < N; r++) {
            rCol[r] = real[r * N + c];
            iCol[r] = imag[r * N + c];
        }
        fft1D(rCol, iCol, dir);
        for (let r = 0; r < N; r++) {
            real[r * N + c] = rCol[r];
            imag[r * N + c] = iCol[r];
        }
    }
}

// FFT Shift: Centers the zero frequency components to (CENTER, CENTER)
// accomplished by flipping signs at odd coordinate sums: f(x,y) * (-1)^(x+y)
function fftShift2D(grid) {
    const N = GRID_SIZE;
    for (let y = 0; y < N; y++) {
        const rowOffset = y * N;
        for (let x = 0; x < N; x++) {
            if ((x + y) % 2 === 1) {
                grid[rowOffset + x] *= -1;
            }
        }
    }
}

// ==========================================================================
// CORE COMPUTATION AND SIMULATION LOGIC
// ==========================================================================

// Initialize array coordinates from selected preset
function initAntennas() {
    if (state.preset === "custom") {
        state.antennas = [...state.customAntennas];
    } else {
        state.antennas = ANTENNA_PRESETS[state.preset]();
    }
    recalculateObservation();
}

// Calculate UV tracks and synthesize beam / dirty image
function recalculateObservation() {
    calculateUVPlaneMask();
    calculateDirtyBeam();
    generateDirtyImage();
    resetCleanSolver();
}

// Projects antenna baselines to UV space based on Earth rotation coordinates
function calculateUVPlaneMask() {
    const N = state.antennas.length;
    const uvMask = state.uvMask;
    uvMask.fill(0.0);
    
    if (N < 2) return;
    
    const lambda = 0.299792458 / state.frequency; // Observing wavelength in meters (c / f)
    const decRad = state.declination * Math.PI / 180;
    
    // Track duration steps (simulate Earth rotation)
    // 30 min intervals
    const trackSec = state.duration * 3600;
    const numSteps = Math.max(1, Math.round(state.duration * 2.5) + 3); // Steps scaling with duration
    
    // Grid coordinate range scaling: we map a radius of 55 pixels to represent a spatial frequency scale
    // maximum baseline scales with the array configuration scale
    const uvGridLimit = 2400 / state.scale; // max spatial frequency range in wavelengths
    const scaleFactor = 55.0 / uvGridLimit;
    
    let totalUVCount = 0;
    
    // Loop over all unique baselines (antenna pairs)
    for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
            // Baseline components in ground coordinates (meters)
            const Dx = (state.antennas[i].x - state.antennas[j].x) * state.scale;
            const Dy = (state.antennas[i].y - state.antennas[j].y) * state.scale;
            
            // For each baseline, compute UV coordinate track swept out by Earth's rotation
            for (let s = 0; s < numSteps; s++) {
                // Hour angle sweeps centered around meridian (0)
                let H = 0;
                if (numSteps > 1) {
                    const frac = s / (numSteps - 1);
                    H = (frac - 0.5) * (state.duration / 12) * Math.PI; // Hour angle in radians
                }
                
                // Earth projection equations:
                // u = (Dx*cos(H) - Dy*sin(H)) / lambda
                // v = ((Dx*sin(H) + Dy*cos(H)) * sin(dec)) / lambda
                const u = (Dx * Math.cos(H) - Dy * Math.sin(H)) / lambda;
                const v = (Dx * Math.sin(H) + Dy * Math.cos(H)) * Math.sin(decRad) / lambda;
                
                // Map to 128x128 grid pixels
                // baseline projection point
                const px1 = Math.round(CENTER + u * scaleFactor);
                const py1 = Math.round(CENTER - v * scaleFactor);
                
                // conjugate baseline point (Hermitian symmetry)
                const px2 = Math.round(CENTER - u * scaleFactor);
                const py2 = Math.round(CENTER + v * scaleFactor);
                
                // Set mask cells to 1 if within bounds
                if (px1 >= 0 && px1 < GRID_SIZE && py1 >= 0 && py1 < GRID_SIZE) {
                    if (uvMask[py1 * GRID_SIZE + px1] === 0) totalUVCount++;
                    uvMask[py1 * GRID_SIZE + px1] = 1.0;
                }
                if (px2 >= 0 && px2 < GRID_SIZE && py2 >= 0 && py2 < GRID_SIZE) {
                    if (uvMask[py2 * GRID_SIZE + px2] === 0) totalUVCount++;
                    uvMask[py2 * GRID_SIZE + px2] = 1.0;
                }
            }
        }
    }
    
    // Central auto-correlation component (DC component)
    uvMask[CENTER * GRID_SIZE + CENTER] = 1.0;
    
    document.getElementById("lbl-uv-points").innerText = totalUVCount;
    drawUVCanvas();
}

// Compute the synthesized beam by taking the 2D Inverse FFT of the UV mask
function calculateDirtyBeam() {
    const N = GRID_SIZE;
    const real = new Float32Array(N * N);
    const imag = new Float32Array(N * N);
    
    // Load UV coverage into real array
    for (let i = 0; i < N * N; i++) {
        real[i] = state.uvMask[i];
    }
    
    // Pre-shift to center the beam in output image space
    fftShift2D(real);
    
    // Perform Inverse FFT
    fft2D(real, imag, -1);
    
    // Shift back and extract real magnitude
    fftShift2D(real);
    
    // Normalize dirty beam so peak value at center (64,64) is exactly 1.0
    let peak = 0.0;
    for (let i = 0; i < N * N; i++) {
        if (real[i] > peak) peak = real[i];
    }
    
    const db = state.dirtyBeam;
    if (peak > 0) {
        for (let i = 0; i < N * N; i++) {
            db[i] = real[i] / peak;
        }
    } else {
        db.fill(0);
        db[CENTER * N + CENTER] = 1.0; // Delta function default
    }
    
    drawBeamCanvas();
    calculateAngularResolution();
}

// Calculate the angular resolution based on the maximum baseline spacing
function calculateAngularResolution() {
    const N = state.antennas.length;
    if (N < 2) {
        document.getElementById("lbl-resolution").innerText = "--";
        return;
    }
    
    // Find max baseline distance on the ground
    let maxB = 0;
    for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
            const dx = (state.antennas[i].x - state.antennas[j].x) * state.scale;
            const dy = (state.antennas[i].y - state.antennas[j].y) * state.scale;
            const b = Math.sqrt(dx*dx + dy*dy);
            if (b > maxB) maxB = b;
        }
    }
    
    const lambda = 0.299792458 / state.frequency; // meters
    // Angular resolution in radians: theta = lambda / B_max
    const resRad = lambda / maxB;
    const resArcsec = resRad * (180 / Math.PI) * 3600;
    
    document.getElementById("lbl-resolution").innerText = resArcsec.toFixed(2);
}

// Synthesize the raw Dirty Image: FFT(trueImage) * UVmask -> IFFT -> dirtyImage
function generateDirtyImage() {
    const N = GRID_SIZE;
    
    // 1. Generate target true image
    const trueImg = state.trueImage;
    trueImg.fill(0.0);
    TARGET_SOURCES[state.targetName](trueImg);
    drawTrueImageCanvas();
    
    // 2. Perform Fourier convolution
    const real = new Float32Array(N * N);
    const imag = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) {
        real[i] = trueImg[i];
    }
    
    // Forward FFT of true sky
    fftShift2D(real);
    fft2D(real, imag, 1);
    fftShift2D(real);
    fftShift2D(imag);
    
    // Multiply by UV coverage mask (spatial filter)
    for (let i = 0; i < N * N; i++) {
        real[i] *= state.uvMask[i];
        imag[i] *= state.uvMask[i];
    }
    
    // Inverse FFT to get Dirty Image
    fftShift2D(real);
    fftShift2D(imag);
    fft2D(real, imag, -1);
    fftShift2D(real);
    
    // Store in dirty image array
    const dirtyImg = state.dirtyImage;
    let maxVal = 0.0;
    for (let i = 0; i < N * N; i++) {
        dirtyImg[i] = Math.max(0.0, real[i]); // Keep values positive
        if (dirtyImg[i] > maxVal) maxVal = dirtyImg[i];
    }
    
    // Scale normalized copy
    if (maxVal > 0) {
        for (let i = 0; i < N * N; i++) {
            dirtyImg[i] /= maxVal;
        }
    }
    
    // Load into clean residual
    state.residual.set(dirtyImg);
    
    drawDirtyImageCanvas();
}

// ==========================================================================
// HOGBOM'S CLEAN DECONVOLUTION SOLVER
// ==========================================================================

// Resets CLEAN deconvolution state
function resetCleanSolver() {
    stopAutoClean();
    state.cleanComponents.fill(0.0);
    state.residual.set(state.dirtyImage);
    state.restoredImage.fill(0.0);
    state.currentIter = 0;
    
    // Find initial peak in dirty image for relative tracking
    let maxVal = 0.0;
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const absVal = Math.abs(state.dirtyImage[i]);
        if (absVal > maxVal) maxVal = absVal;
    }
    state.initialPeak = maxVal;
    state.peakResidual = 1.0;
    
    state.cleanStatus = "idle";
    updateCleanUI();
    drawCleanComponentsCanvas();
    drawRestoredCanvas();
}

// Performs a single iteration of Hogbom CLEAN
function runCleanStep() {
    if (state.currentIter >= state.maxIter) {
        stopAutoClean();
        state.cleanStatus = "complete";
        updateCleanUI();
        restoreFinalCleanedImage();
        return false;
    }
    
    const N = GRID_SIZE;
    const residual = state.residual;
    const beam = state.dirtyBeam;
    
    // 1. Search residual map for absolute peak intensity
    let peakVal = 0.0;
    let peakX = CENTER;
    let peakY = CENTER;
    
    for (let y = 0; y < N; y++) {
        const rowOffset = y * N;
        for (let x = 0; x < N; x++) {
            const val = residual[rowOffset + x];
            if (Math.abs(val) > Math.abs(peakVal)) {
                peakVal = val;
                peakX = x;
                peakY = y;
            }
        }
    }
    
    // Threshold safety check
    if (Math.abs(peakVal) < 0.005 || Math.abs(peakVal) / state.initialPeak < 0.005) {
        stopAutoClean();
        state.cleanStatus = "complete";
        updateCleanUI();
        restoreFinalCleanedImage();
        return false;
    }
    
    // 2. Compute clean component addition
    const cleanDelta = peakVal * state.loopGain;
    state.cleanComponents[peakY * N + peakX] += cleanDelta;
    
    // 3. Subtract scaled dirty beam from residual centered at peak coordinate
    for (let dy = -N/2; dy < N/2; dy++) {
        const ry = peakY + dy;
        if (ry < 0 || ry >= N) continue;
        
        const rOffset = ry * N;
        const beamY = CENTER + dy;
        const bOffset = beamY * N;
        
        for (let dx = -N/2; dx < N/2; dx++) {
            const rx = peakX + dx;
            if (rx < 0 || rx >= N) continue;
            
            const beamX = CENTER + dx;
            const beamVal = beam[bOffset + beamX];
            
            // Subtract beam contribution
            residual[rOffset + rx] -= cleanDelta * beamVal;
        }
    }
    
    state.currentIter++;
    state.peakResidual = Math.abs(peakVal) / state.initialPeak;
    
    // Render canvases intermediate results
    if (state.currentIter % 5 === 0 || state.currentIter === state.maxIter) {
        drawCleanComponentsCanvas();
        restoreFinalCleanedImage(); // Build progress preview
    }
    
    updateCleanUI();
    return true;
}

// Automatically runs CLEAN loop using requestAnimationFrame / Intervals
function startAutoClean() {
    if (state.cleanStatus === "running") return;
    
    state.cleanStatus = "running";
    document.getElementById("btn-auto-clean").innerText = "PAUSE";
    document.getElementById("btn-auto-clean").classList.add("active");
    
    state.cleanIntervalId = setInterval(() => {
        const active = runCleanStep();
        if (!active) {
            stopAutoClean();
        }
    }, 15); // Run ~60 iterations per second
}

function stopAutoClean() {
    if (state.cleanIntervalId) {
        clearInterval(state.cleanIntervalId);
        state.cleanIntervalId = null;
    }
    state.cleanStatus = "idle";
    document.getElementById("btn-auto-clean").innerText = "AUTO CLEAN";
    document.getElementById("btn-auto-clean").classList.remove("active");
    updateCleanUI();
}

// Convolves clean components with smooth Gaussian beam and adds remaining residuals
function restoreFinalCleanedImage() {
    const N = GRID_SIZE;
    const comps = state.cleanComponents;
    const restored = state.restoredImage;
    const residual = state.residual;
    
    restored.fill(0.0);
    
    // Compute optimal Gaussian beam width based on estimated resolution
    let maxB = 0;
    const numAnts = state.antennas.length;
    for (let i = 0; i < numAnts; i++) {
        for (let j = i + 1; j < numAnts; j++) {
            const dx = (state.antennas[i].x - state.antennas[j].x) * state.scale;
            const dy = (state.antennas[i].y - state.antennas[j].y) * state.scale;
            const b = Math.sqrt(dx*dx + dy*dy);
            if (b > maxB) maxB = b;
        }
    }
    if (maxB === 0) maxB = 100;
    
    // Sigma controls clean beam size (narrower for larger max baselines)
    const cleanBeamSigma = Math.max(1.2, Math.min(10.0, 150.0 / (maxB * state.scale * (state.frequency / 15.0))));
    
    // Convolve components with Gaussian: I_restored = Comps * Gaussian + Residual
    // Since comps has only discrete spikes (sparse), we can perform direct convolution efficiently!
    for (let cy = 0; cy < N; cy++) {
        const cOffset = cy * N;
        for (let cx = 0; cx < N; cx++) {
            const intensity = comps[cOffset + cx];
            if (intensity === 0.0) continue;
            
            // Add Gaussian envelope contribution
            const searchLimit = Math.ceil(3 * cleanBeamSigma);
            for (let dy = -searchLimit; dy <= searchLimit; dy++) {
                const ry = cy + dy;
                if (ry < 0 || ry >= N) continue;
                
                const rOffset = ry * N;
                for (let dx = -searchLimit; dx <= searchLimit; dx++) {
                    const rx = cx + dx;
                    if (rx < 0 || rx >= N) continue;
                    
                    const distSq = dx * dx + dy * dy;
                    const w = Math.exp(-distSq / (2 * cleanBeamSigma * cleanBeamSigma));
                    restored[rOffset + rx] += intensity * w;
                }
            }
        }
    }
    
    // Add residual maps (noise and uncleaned structure)
    for (let i = 0; i < N * N; i++) {
        restored[i] = Math.max(0.0, restored[i] + residual[i]);
    }
    
    drawRestoredCanvas();
}

function updateCleanUI() {
    document.getElementById("val-clean-iter").innerText = state.currentIter;
    document.getElementById("val-peak-residual").innerText = `${(state.peakResidual * 100).toFixed(1)}%`;
    
    const badge = document.getElementById("val-clean-status");
    badge.className = `status-badge ${state.cleanStatus}`;
    badge.innerText = state.cleanStatus.toUpperCase();
}

// ==========================================================================
// INTERACTIVE CANVAS RENDERERS
// ==========================================================================

// Color Palette mapping (Thermal/Radio brightness style - Cosmic Orange)
function getHeatmapColor(val) {
    // Clamping
    val = Math.max(0.0, Math.min(1.0, val));
    
    // Black -> Blue -> Red -> Orange/Yellow -> White profile
    let r = 0, g = 0, b = 0;
    
    if (val < 0.2) {
        // Black to Deep Purple/Blue
        b = Math.round(val * 5 * 150);
        r = Math.round(val * 5 * 40);
    } else if (val < 0.5) {
        // Deep Blue to Magenta/Red
        const f = (val - 0.2) / 0.3;
        r = Math.round(40 + f * 180);
        g = Math.round(f * 20);
        b = Math.round(150 - f * 80);
    } else if (val < 0.8) {
        // Red to Golden Yellow
        const f = (val - 0.5) / 0.3;
        r = 220;
        g = Math.round(20 + f * 170);
        b = Math.round(70 - f * 50);
    } else {
        // Golden Yellow to Bright White
        const f = (val - 0.8) / 0.2;
        r = Math.round(220 + f * 35);
        g = Math.round(190 + f * 65);
        b = Math.round(20 + f * 235);
    }
    return `rgb(${r}, ${g}, ${b})`;
}

// Render the Interactive Antenna Placement Pad
function drawAntennaCanvas() {
    const canvas = document.getElementById("antennaCanvas");
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    
    // Clear and draw grid
    ctx.fillStyle = "#01071d";
    ctx.fillRect(0, 0, W, H);
    
    // Circular bounds ring (max baseline radius 500m)
    ctx.strokeStyle = "rgba(18, 93, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let r = 50; r <= 150; r += 50) {
        ctx.beginPath();
        ctx.arc(W/2, H/2, r, 0, 2*Math.PI);
        ctx.stroke();
    }
    
    // Center crosshairs
    ctx.strokeStyle = "rgba(18, 93, 255, 0.12)";
    ctx.beginPath();
    ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H);
    ctx.moveTo(0, H/2); ctx.lineTo(W, H/2);
    ctx.stroke();
    
    // Plot all antennas
    const N = state.antennas.length;
    state.antennas.forEach((ant, idx) => {
        // Coordinate conversion: ground scale mapped to canvas layout
        // Center is (W/2, H/2). radius of 500m matches 110 pixels
        const cx = W/2 + ant.x * (110.0 / 500.0);
        const cy = H/2 - ant.y * (110.0 / 500.0);
        
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2*Math.PI);
        
        // Highlight active dragging
        if (state.dragIndex === idx) {
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#00FF80";
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.fillStyle = "#00FF80";
        }
        ctx.fill();
    });
}

// Render the UV baseline coverage plane
function drawUVCanvas() {
    const canvas = document.getElementById("uvCanvas");
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    
    ctx.fillStyle = "#01071c";
    ctx.fillRect(0, 0, W, H);
    
    // Grid reference circles
    ctx.strokeStyle = "rgba(18, 93, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let r = 40; r <= 120; r += 40) {
        ctx.beginPath();
        ctx.arc(W/2, H/2, r, 0, 2*Math.PI);
        ctx.stroke();
    }
    
    // Coordinates axes
    ctx.strokeStyle = "rgba(18, 93, 255, 0.08)";
    ctx.beginPath();
    ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H);
    ctx.moveTo(0, H/2); ctx.lineTo(W, H/2);
    ctx.stroke();
    
    // Rasterize pixel-map UV data directly onto canvas
    const imgData = ctx.createImageData(W, H);
    const data = imgData.data;
    const mask = state.uvMask;
    
    for (let y = 0; y < H; y++) {
        // Map canvas coordinates to 128x128 grid indices
        const gy = Math.floor(y * (GRID_SIZE / H));
        const rowOffset = gy * GRID_SIZE;
        const canvasRow = y * W * 4;
        
        for (let x = 0; x < W; x++) {
            const gx = Math.floor(x * (GRID_SIZE / W));
            const val = mask[rowOffset + gx];
            
            const idx = canvasRow + x * 4;
            if (val > 0) {
                // Bright cyan UV track point
                data[idx] = 0;
                data[idx + 1] = 230;
                data[idx + 2] = 255;
                data[idx + 3] = 255;
            } else {
                data[idx] = 1;
                data[idx + 1] = 7;
                data[idx + 2] = 28;
                data[idx + 3] = 0; // Transparent fallback
            }
        }
    }
    
    // Put raster overlay first, then overlay grid lines
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = W;
    tempCanvas.height = H;
    tempCanvas.getContext("2d").putImageData(imgData, 0, 0);
    
    ctx.drawImage(tempCanvas, 0, 0);
}

// Render the 2D synthesized beam (PSF) intensity pattern
function drawBeamCanvas() {
    renderFloatArrayToCanvas("beamCanvas", state.dirtyBeam);
}

// Render the true astronomical sky source
function drawTrueImageCanvas() {
    renderFloatArrayToCanvas("trueImageCanvas", state.trueImage);
}

// Render the convolved dirty image
function drawDirtyImageCanvas() {
    renderFloatArrayToCanvas("dirtyImageCanvas", state.dirtyImage);
}

// Render the clean components spikes map
function drawCleanComponentsCanvas() {
    renderFloatArrayToCanvas("componentsCanvas", state.cleanComponents, true); // Use clean spike coloring
}

// Render the restored clean image
function drawRestoredCanvas() {
    renderFloatArrayToCanvas("restoredCanvas", state.restoredImage);
}

// Helper to render float arrays onto canvas as heatmaps
function renderFloatArrayToCanvas(canvasId, arr, isComponents = false) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    
    const imgData = ctx.createImageData(W, H);
    const data = imgData.data;
    
    // Find peak for scaling visual brightness
    let peak = 0.0001;
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const absVal = Math.abs(arr[i]);
        if (absVal > peak) peak = absVal;
    }
    
    for (let y = 0; y < H; y++) {
        const gy = Math.floor(y * (GRID_SIZE / H));
        const rowOffset = gy * GRID_SIZE;
        const canvasRow = y * W * 4;
        
        for (let x = 0; x < W; x++) {
            const gx = Math.floor(x * (GRID_SIZE / W));
            const val = arr[rowOffset + gx];
            
            const idx = canvasRow + x * 4;
            
            if (isComponents) {
                // Clean components display (red spikes on black)
                if (val > 0) {
                    const scaled = Math.min(1.0, val / peak);
                    data[idx] = Math.round(150 + scaled * 105);
                    data[idx + 1] = Math.round(scaled * 50);
                    data[idx + 2] = 0;
                    data[idx + 3] = 255;
                } else {
                    data[idx] = 1;
                    data[idx + 1] = 5;
                    data[idx + 2] = 20;
                    data[idx + 3] = 255;
                }
            } else {
                // Normalize and map to heatmap color
                const colorStr = getHeatmapColor(val / peak);
                const rgb = colorStr.substring(4, colorStr.length - 1).split(", ");
                data[idx] = parseInt(rgb[0]);
                data[idx + 1] = parseInt(rgb[1]);
                data[idx + 2] = parseInt(rgb[2]);
                data[idx + 3] = 255;
            }
        }
    }
    
    ctx.putImageData(imgData, 0, 0);
}

// ==========================================================================
// INTERACTIVE INPUT EVENTS
// ==========================================================================

function attachEventListeners() {
    // Presets
    document.getElementById("array-preset").addEventListener("change", (e) => {
        state.preset = e.target.value;
        initAntennas();
    });
    
    // Array Scale
    const scaleSlider = document.getElementById("array-scale");
    scaleSlider.addEventListener("input", (e) => {
        state.scale = parseFloat(e.target.value);
        document.getElementById("lbl-array-scale").innerText = `${state.scale.toFixed(2)}x`;
        recalculateObservation();
    });
    
    // Declination
    const decSlider = document.getElementById("declination");
    decSlider.addEventListener("input", (e) => {
        state.declination = parseFloat(e.target.value);
        document.getElementById("lbl-declination").innerText = `${state.declination.toFixed(0)}\u00B0`;
        recalculateObservation();
    });
    
    // Duration
    const durSlider = document.getElementById("duration");
    durSlider.addEventListener("input", (e) => {
        state.duration = parseFloat(e.target.value);
        document.getElementById("lbl-duration").innerText = `${state.duration.toFixed(1)} hrs`;
        recalculateObservation();
    });
    
    // Frequency
    const freqSlider = document.getElementById("frequency");
    freqSlider.addEventListener("input", (e) => {
        state.frequency = parseFloat(e.target.value);
        document.getElementById("lbl-frequency").innerText = `${state.frequency.toFixed(1)} GHz`;
        recalculateObservation();
    });
    
    // Target Image selection
    document.getElementById("target-source").addEventListener("change", (e) => {
        state.targetName = e.target.value;
        generateDirtyImage();
        resetCleanSolver();
    });
    
    // CLEAN Gain
    const gainSlider = document.getElementById("loop-gain");
    gainSlider.addEventListener("input", (e) => {
        state.loopGain = parseFloat(e.target.value);
        document.getElementById("lbl-loop-gain").innerText = state.loopGain.toFixed(2);
    });
    
    // CLEAN Max Iter
    const iterSlider = document.getElementById("max-iter");
    iterSlider.addEventListener("input", (e) => {
        state.maxIter = parseInt(e.target.value);
        document.getElementById("lbl-max-iter").innerText = state.maxIter;
    });
    
    // Buttons
    document.getElementById("btn-step-clean").addEventListener("click", () => {
        stopAutoClean();
        state.cleanStatus = "running";
        runCleanStep();
        if (state.cleanStatus === "running") state.cleanStatus = "idle";
        updateCleanUI();
    });
    
    document.getElementById("btn-auto-clean").addEventListener("click", () => {
        if (state.cleanStatus === "running") {
            stopAutoClean();
        } else {
            startAutoClean();
        }
    });
    
    document.getElementById("btn-reset-clean").addEventListener("click", () => {
        resetCleanSolver();
    });
    
    // Setup Antenna Canvas Click & Drag placement events
    setupAntennaCanvasEvents();
}

function setupAntennaCanvasEvents() {
    const canvas = document.getElementById("antennaCanvas");
    
    const getCanvasMousePos = (e) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    };
    
    canvas.addEventListener("mousedown", (e) => {
        const pos = getCanvasMousePos(e);
        const W = canvas.width;
        const H = canvas.height;
        
        // Find if clicked near an existing antenna (threshold 6px)
        let clickedIndex = -1;
        state.antennas.forEach((ant, idx) => {
            const ax = W/2 + ant.x * (110.0 / 500.0);
            const ay = H/2 - ant.y * (110.0 / 500.0);
            const dist = Math.sqrt((pos.x - ax)*(pos.x - ax) + (pos.y - ay)*(pos.y - ay));
            if (dist < 8) clickedIndex = idx;
        });
        
        if (clickedIndex !== -1) {
            // Found antenna: check if click or drag
            state.dragIndex = clickedIndex;
            state.draggingAntenna = true;
            drawAntennaCanvas();
        } else {
            // Clicked empty space: add antenna if under limit of 50
            if (state.antennas.length < 50) {
                // Map back to ground coordinates
                const gx = (pos.x - W/2) * (500.0 / 110.0);
                const gy = (H/2 - pos.y) * (500.0 / 110.0);
                
                // Keep within max boundary
                const distFromCenter = Math.sqrt(gx*gx + gy*gy);
                if (distFromCenter <= 500) {
                    state.preset = "custom";
                    document.getElementById("array-preset").value = "custom";
                    
                    state.customAntennas = [...state.antennas, { x: gx, y: gy }];
                    initAntennas();
                }
            }
        }
    });
    
    canvas.addEventListener("mousemove", (e) => {
        if (!state.draggingAntenna || state.dragIndex === -1) return;
        
        const pos = getCanvasMousePos(e);
        const W = canvas.width;
        const H = canvas.height;
        
        // Map back to ground coordinates
        let gx = (pos.x - W/2) * (500.0 / 110.0);
        let gy = (H/2 - pos.y) * (500.0 / 110.0);
        
        // Clamp inside 500m layout ring boundary
        const dist = Math.sqrt(gx*gx + gy*gy);
        if (dist > 500) {
            gx = (gx / dist) * 500;
            gy = (gy / dist) * 500;
        }
        
        state.preset = "custom";
        document.getElementById("array-preset").value = "custom";
        
        state.antennas[state.dragIndex] = { x: gx, y: gy };
        state.customAntennas = [...state.antennas];
        
        // Live updates during drag
        recalculateObservation();
        drawAntennaCanvas();
    });
    
    const endDrag = (e) => {
        if (state.draggingAntenna) {
            state.draggingAntenna = false;
            // If mouseup occurred on same antenna without drag, delete it (tap to delete)
            state.dragIndex = -1;
            drawAntennaCanvas();
        }
    };
    
    // Tap to delete (on double click or click without drag)
    canvas.addEventListener("dblclick", (e) => {
        const pos = getCanvasMousePos(e);
        const W = canvas.width;
        const H = canvas.height;
        
        let clickIdx = -1;
        state.antennas.forEach((ant, idx) => {
            const ax = W/2 + ant.x * (110.0 / 500.0);
            const ay = H/2 - ant.y * (110.0 / 500.0);
            const dist = Math.sqrt((pos.x - ax)*(pos.x - ax) + (pos.y - ay)*(pos.y - ay));
            if (dist < 8) clickIdx = idx;
        });
        
        if (clickIdx !== -1) {
            // Delete antenna
            state.preset = "custom";
            document.getElementById("array-preset").value = "custom";
            
            state.antennas.splice(clickIdx, 1);
            state.customAntennas = [...state.antennas];
            initAntennas();
        }
    });
    
    window.addEventListener("mouseup", endDrag);
}

// ==========================================================================
// APP START
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initial Load
    initAntennas();
    
    // 2. Attach UI hooks
    attachEventListeners();
    
    // 3. Initial canvases drawing
    drawAntennaCanvas();
});
