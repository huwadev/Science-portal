document.addEventListener('DOMContentLoaded', () => {
    // UI Elements - Designer
    const noseLengthInput = document.getElementById('nose-length');
    const noseMassInput = document.getElementById('nose-mass');
    const tubeLengthInput = document.getElementById('tube-length');
    const tubeDiameterInput = document.getElementById('tube-diameter');
    const tubeMassInput = document.getElementById('tube-mass');
    const finCountSelect = document.getElementById('fin-count');
    const finSpanInput = document.getElementById('fin-span');
    const finRootInput = document.getElementById('fin-root');
    const finTipInput = document.getElementById('fin-tip');
    const finSweepInput = document.getElementById('fin-sweep');
    const finMassInput = document.getElementById('fin-mass');
    const drogueDiaInput = document.getElementById('drogue-dia');
    const mainDiaInput = document.getElementById('main-dia');
    const mainDeployAltInput = document.getElementById('main-deploy-alt');
    const stabilityBadge = document.getElementById('stability-badge');
    const rocketSvgGroup = document.getElementById('rocket-group');

    // UI Elements - Simulator & Environment
    const windSpeedInput = document.getElementById('wind-speed');
    const railAngleInput = document.getElementById('rail-angle');
    const btnLaunch = document.getElementById('btn-launch');
    const simCanvas = document.getElementById('simCanvas');
    const ctxSim = simCanvas.getContext('2d');
    const flightStatusDot = document.getElementById('flight-status-dot');
    const flightStatusLbl = document.getElementById('flight-status-lbl');
    const audioToggle = document.getElementById('audio-toggle');

    // UI Elements - Telemetry & Presets
    const presetSelect = document.getElementById('rocket-preset');
    const motorConfigWrapper = document.getElementById('motor-config-wrapper');
    const motorThrustInput = document.getElementById('motor-thrust');
    const motorBurnTimeInput = document.getElementById('motor-burntime');
    const motorPropellantInput = document.getElementById('motor-propellant');
    const motorDryMassInput = document.getElementById('motor-drymass');

    // Telemetry readouts
    const tApogee = document.getElementById('t-apogee');
    const tMaxV = document.getElementById('t-max-v');
    const tMaxA = document.getElementById('t-max-a');
    const tFlightTime = document.getElementById('t-flight-time');
    const tBurnoutAlt = document.getElementById('t-burnout-alt');
    const tDrift = document.getElementById('t-drift');

    // Labels display elements
    const labelsMap = {
        'nose-length': 'lbl-nose-length',
        'nose-mass': 'lbl-nose-mass',
        'tube-length': 'lbl-tube-length',
        'tube-diameter': 'lbl-tube-diameter',
        'tube-mass': 'lbl-tube-mass',
        'fin-span': 'lbl-fin-span',
        'fin-root': 'lbl-fin-root',
        'fin-tip': 'lbl-fin-tip',
        'fin-sweep': 'lbl-fin-sweep',
        'fin-mass': 'lbl-fin-mass',
        'drogue-dia': 'lbl-drogue-dia',
        'main-dia': 'lbl-main-dia',
        'main-deploy-alt': 'lbl-main-deploy-alt',
        'wind-speed': 'lbl-wind-speed',
        'rail-angle': 'lbl-rail-angle',
        'motor-thrust': 'lbl-motor-thrust',
        'motor-burntime': 'lbl-motor-burntime',
        'motor-propellant': 'lbl-motor-propellant',
        'motor-drymass': 'lbl-motor-drymass'
    };

    // Presets Configuration
    const presets = {
        'estes-alpha': {
            noseLength: 15, noseMass: 10,
            tubeLength: 45, tubeDiameter: 24.8, tubeMass: 40,
            finCount: 3, finSpan: 4, finRoot: 8, finTip: 3, finSweep: 2.5, finMass: 5,
            drogueDia: 0, mainDia: 30, mainDeployAlt: 0,
            motorThrust: 8.5, motorBurnTime: 0.8, motorPropellant: 12.5, motorDryMass: 15
        },
        'hp-level2': {
            noseLength: 30, noseMass: 350,
            tubeLength: 120, tubeDiameter: 75, tubeMass: 900,
            finCount: 4, finSpan: 10, finRoot: 22, finTip: 8, finSweep: 8, finMass: 120,
            drogueDia: 40, mainDia: 150, mainDeployAlt: 250,
            motorThrust: 350, motorBurnTime: 1.8, motorPropellant: 480, motorDryMass: 540
        },
        'esss-hybrid': {
            noseLength: 45, noseMass: 1200,
            tubeLength: 180, tubeDiameter: 120, tubeMass: 3800,
            finCount: 4, finSpan: 16, finRoot: 30, finTip: 12, finSweep: 12, finMass: 450,
            drogueDia: 60, mainDia: 250, mainDeployAlt: 400,
            motorThrust: 1200, motorBurnTime: 4.0, motorPropellant: 2800, motorDryMass: 3200
        }
    };

    // Simulation Data & Playback State
    let simHistory = [];
    let isSimulating = false;
    let playbackTime = 0;
    let animationId = null;
    let chartInstance = null;
    let activeGraphType = 'altitude'; // default active graph tab

    // Web Audio sonification elements
    let audioCtx = null;
    let isAudioEnabled = false;
    let engineNoiseNode = null;
    let windNoiseNode = null;
    let engineGainNode = null;
    let windGainNode = null;
    let windFilterNode = null;

    // --- Web Audio Synthesis setup ---
    function createWhiteNoiseBuffer(ctx) {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return noiseBuffer;
    }

    function initAudio() {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // 1. Engine sound (rumble)
        const engineNoise = audioCtx.createBufferSource();
        engineNoise.buffer = createWhiteNoiseBuffer(audioCtx);
        engineNoise.loop = true;
        
        const engineFilter = audioCtx.createBiquadFilter();
        engineFilter.type = 'lowpass';
        engineFilter.frequency.setValueAtTime(150, audioCtx.currentTime);
        
        engineGainNode = audioCtx.createGain();
        engineGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        
        engineNoise.connect(engineFilter);
        engineFilter.connect(engineGainNode);
        engineGainNode.connect(audioCtx.destination);
        engineNoise.start();

        // 2. Airflow/Wind sound
        const windNoise = audioCtx.createBufferSource();
        windNoise.buffer = createWhiteNoiseBuffer(audioCtx);
        windNoise.loop = true;

        windFilterNode = audioCtx.createBiquadFilter();
        windFilterNode.type = 'bandpass';
        windFilterNode.frequency.setValueAtTime(400, audioCtx.currentTime);
        windFilterNode.Q.setValueAtTime(3.0, audioCtx.currentTime);

        windGainNode = audioCtx.createGain();
        windGainNode.gain.setValueAtTime(0, audioCtx.currentTime);

        windNoise.connect(windFilterNode);
        windFilterNode.connect(windGainNode);
        windGainNode.connect(audioCtx.destination);
        windNoise.start();
    }

    function playPopSound(freq, duration) {
        if (!isAudioEnabled || !audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + duration);
        
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    audioToggle.addEventListener('click', () => {
        if (!isAudioEnabled) {
            if (!audioCtx) initAudio();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            isAudioEnabled = true;
            audioToggle.classList.add('active');
        } else {
            if (engineGainNode) engineGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            if (windGainNode) windGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            isAudioEnabled = false;
            audioToggle.classList.remove('active');
        }
    });

    // Update Slider Value Label & Redraw Rocket on Input
    function updateLabel(inputEl) {
        const labelId = labelsMap[inputEl.id];
        if (labelId) {
            const labelNode = document.getElementById(labelId);
            if (labelNode) {
                let unit = '';
                if (inputEl.id.includes('mass') || inputEl.id.includes('propellant')) unit = ' g';
                else if (inputEl.id.includes('diameter')) unit = ' mm';
                else if (inputEl.id.includes('deploy-alt')) unit = ' m';
                else if (inputEl.id.includes('burntime')) unit = ' s';
                else if (inputEl.id.includes('thrust')) unit = ' N';
                else if (inputEl.id.includes('speed')) unit = ' m/s';
                else if (inputEl.id.includes('angle')) unit = '°';
                else unit = ' cm';
                labelNode.textContent = parseFloat(inputEl.value).toFixed(1) + unit;
            }
        }
    }

    // --- Stability (CG & CP) calculations (Barrowman's method) ---
    function calculateStability() {
        // Dimensions in cm, masses in grams
        const noseLen = parseFloat(noseLengthInput.value);
        const noseMass = parseFloat(noseMassInput.value);
        const tubeLen = parseFloat(tubeLengthInput.value);
        const caliber = parseFloat(tubeDiameterInput.value) / 10; // mm to cm
        const tubeMass = parseFloat(tubeMassInput.value);
        
        const finCount = parseInt(finCountSelect.value);
        const finSpan = parseFloat(finSpanInput.value);
        const finRoot = parseFloat(finRootInput.value);
        const finTip = parseFloat(finTipInput.value);
        const finSweep = parseFloat(finSweepInput.value);
        const finMass = parseFloat(finMassInput.value) * finCount;

        // Motor mass
        const isCustom = presetSelect.value === 'custom';
        const motorDry = isCustom ? parseFloat(motorDryMassInput.value) : presets[presetSelect.value].motorDryMass;
        const motorProp = isCustom ? parseFloat(motorPropellantInput.value) : presets[presetSelect.value].motorPropellant;
        const motorMass = motorDry + motorProp;
        const motorLen = 15; // assumed constant motor length for CG calculation

        // Avionics & parachute mass (placed in upper body tube)
        const recovMass = 100; // grams
        const recovPos = noseLen + tubeLen * 0.35;

        // 1. Center of Gravity (CG)
        const noseCG = noseLen * 0.5;
        const tubeCG = noseLen + tubeLen * 0.5;
        const finCG = noseLen + tubeLen - finRoot * 0.5;
        const motorCG = noseLen + tubeLen - motorLen * 0.5;

        const totalMass = noseMass + tubeMass + finMass + motorMass + recovMass;
        const weightedMoments = (noseMass * noseCG) + (tubeMass * tubeCG) + (finMass * finCG) + (motorMass * motorCG) + (recovMass * recovPos);
        const CG = weightedMoments / totalMass;

        // 2. Center of Pressure (CP) using Barrowman's Equations
        // Nose cone normal force slope
        const C_N_nose = 2.0;
        const CP_nose = noseLen * 0.466; // Ogive nose cone shape

        // Fins normal force slope
        const R = caliber / 2;
        const Lm = Math.sqrt(finSweep * finSweep + finSpan * finSpan);
        const K_f = 1 + R / (R + finSpan); // interference factor
        const C_N_fins = K_f * (4 * finCount * Math.pow(finSpan / caliber, 2)) / (1 + Math.sqrt(1 + Math.pow(2 * Lm / (finRoot + finTip), 2)));

        // CP of the fins relative to fin root leading edge
        const X_CP_fins_root = (finSweep * (finRoot + 2 * finTip)) / (3 * (finRoot + finTip)) + (finRoot + finTip - (finRoot * finTip) / (finRoot + finTip)) / 6;
        const finAttachmentPoint = noseLen + tubeLen - finRoot;
        const CP_fins = finAttachmentPoint + X_CP_fins_root;

        // Combined Center of Pressure
        const CP = (C_N_nose * CP_nose + C_N_fins * CP_fins) / (C_N_nose + C_N_fins);

        // Static Stability Margin (in calibers)
        const stabilityMargin = (CP - CG) / caliber;

        return {
            totalMass: totalMass,
            CG: CG,
            CP: CP,
            stability: stabilityMargin,
            caliber: caliber,
            noseLen: noseLen,
            tubeLen: tubeLen,
            finSpan: finSpan,
            finRoot: finRoot,
            finTip: finTip,
            finSweep: finSweep
        };
    }

    // Draw Rocket SVG Schematic
    function drawRocketSchematic(st) {
        rocketSvgGroup.innerHTML = '';

        const viewWidth = 160;
        const viewHeight = 500;
        const centerX = 80;
        
        // Scale dimensions so they fit the SVG box (about 400px maximum height)
        const paddingY = 40;
        const usableHeight = 400;
        const totalHeightCm = st.noseLen + st.tubeLen;
        const k = usableHeight / totalHeightCm; // pixels per cm

        // Translate units
        const noseH = st.noseLen * k;
        const tubeH = st.tubeLen * k;
        const caliberPx = st.caliber * k;
        const radX = caliberPx / 2;

        const yNoseTip = paddingY;
        const yNoseBase = paddingY + noseH;
        const yTubeBase = yNoseBase + tubeH;

        // Draw Nose Cone (Ogive Bezier curve)
        const noseCone = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dNose = `M ${centerX} ${yNoseTip} 
                       Q ${centerX - radX} ${yNoseTip + noseH * 0.4}, ${centerX - radX} ${yNoseBase} 
                       L ${centerX + radX} ${yNoseBase} 
                       Q ${centerX + radX} ${yNoseTip + noseH * 0.4}, ${centerX} ${yNoseTip} Z`;
        noseCone.setAttribute('d', dNose);
        noseCone.setAttribute('fill', 'rgba(120, 160, 255, 0.1)');
        noseCone.setAttribute('stroke', '#5AA6FF');
        noseCone.setAttribute('stroke-width', '1.5');
        rocketSvgGroup.appendChild(noseCone);

        // Draw Body Tube
        const bodyTube = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bodyTube.setAttribute('x', centerX - radX);
        bodyTube.setAttribute('y', yNoseBase);
        bodyTube.setAttribute('width', caliberPx);
        bodyTube.setAttribute('height', tubeH);
        bodyTube.setAttribute('fill', 'rgba(120, 160, 255, 0.05)');
        bodyTube.setAttribute('stroke', '#5AA6FF');
        bodyTube.setAttribute('stroke-width', '1.5');
        rocketSvgGroup.appendChild(bodyTube);

        // Draw Engine Nozzle (aesthetic bottom)
        const nozzle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const nzW = radX * 0.6;
        const nzH = 8;
        const pNozzle = `${centerX - nzW},${yTubeBase} ${centerX + nzW},${yTubeBase} ${centerX + nzW * 1.3},${yTubeBase + nzH} ${centerX - nzW * 1.3},${yTubeBase + nzH}`;
        nozzle.setAttribute('points', pNozzle);
        nozzle.setAttribute('fill', '#ff9d2e');
        nozzle.setAttribute('stroke', '#ffce4d');
        rocketSvgGroup.appendChild(nozzle);

        // Draw Fins (Left & Right)
        const finSpanPx = st.finSpan * k;
        const finRootPx = st.finRoot * k;
        const finTipPx = st.finTip * k;
        const finSweepPx = st.finSweep * k;

        const yFinTop = yTubeBase - finRootPx;
        const yFinTipTop = yFinTop + finSweepPx;
        const yFinTipBottom = yFinTipTop + finTipPx;

        // Left Fin
        const leftFin = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const pLeft = `${centerX - radX},${yFinTop} 
                       ${centerX - radX - finSpanPx},${yFinTipTop} 
                       ${centerX - radX - finSpanPx},${yFinTipBottom} 
                       ${centerX - radX},${yTubeBase}`;
        leftFin.setAttribute('points', pLeft);
        leftFin.setAttribute('fill', 'rgba(120, 160, 255, 0.15)');
        leftFin.setAttribute('stroke', '#5AA6FF');
        leftFin.setAttribute('stroke-width', '1.5');
        rocketSvgGroup.appendChild(leftFin);

        // Right Fin
        const rightFin = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const pRight = `${centerX + radX},${yFinTop} 
                        ${centerX + radX + finSpanPx},${yFinTipTop} 
                        ${centerX + radX + finSpanPx},${yFinTipBottom} 
                        ${centerX + radX},${yTubeBase}`;
        rightFin.setAttribute('points', pRight);
        rightFin.setAttribute('fill', 'rgba(120, 160, 255, 0.15)');
        rightFin.setAttribute('stroke', '#5AA6FF');
        rightFin.setAttribute('stroke-width', '1.5');
        rocketSvgGroup.appendChild(rightFin);

        // Center of Gravity (CG) visual marker (Yellow/Black quarter circle)
        const yCG = paddingY + st.CG * k;
        const cgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        cgGroup.setAttribute('transform', `translate(${centerX}, ${yCG})`);

        // Outer Ring
        const cgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        cgCircle.setAttribute('cx', '0');
        cgCircle.setAttribute('cy', '0');
        cgCircle.setAttribute('r', '8');
        cgCircle.setAttribute('fill', 'transparent');
        cgCircle.setAttribute('stroke', '#ffce4d');
        cgCircle.setAttribute('stroke-width', '1.5');
        cgGroup.appendChild(cgCircle);

        // Quarters
        const q1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        q1.setAttribute('d', 'M 0 0 L 8 0 A 8 8 0 0 1 0 8 Z');
        q1.setAttribute('fill', '#ffce4d');
        const q2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        q2.setAttribute('d', 'M 0 0 L -8 0 A 8 8 0 0 1 0 -8 Z');
        q2.setAttribute('fill', '#ffce4d');
        cgGroup.appendChild(q1);
        cgGroup.appendChild(q2);

        // Label Line to side for CG
        const cgLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        cgLine.setAttribute('x1', '8');
        cgLine.setAttribute('y1', '0');
        cgLine.setAttribute('x2', '34');
        cgLine.setAttribute('y2', '0');
        cgLine.setAttribute('stroke', '#ffce4d');
        cgLine.setAttribute('stroke-width', '1');
        cgLine.setAttribute('stroke-dasharray', '2,2');
        cgGroup.appendChild(cgLine);

        const cgText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        cgText.setAttribute('x', '38');
        cgText.setAttribute('y', '4');
        cgText.setAttribute('fill', '#ffce4d');
        cgText.setAttribute('font-family', 'monospace');
        cgText.setAttribute('font-size', '10px');
        cgText.setAttribute('font-weight', '700');
        cgText.textContent = 'CG';
        cgGroup.appendChild(cgText);

        rocketSvgGroup.appendChild(cgGroup);

        // Center of Pressure (CP) visual marker (Red crosshair circle)
        const yCP = paddingY + st.CP * k;
        const cpGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        cpGroup.setAttribute('transform', `translate(${centerX}, ${yCP})`);

        // Outer Ring
        const cpCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        cpCircle.setAttribute('cx', '0');
        cpCircle.setAttribute('cy', '0');
        cpCircle.setAttribute('r', '7');
        cpCircle.setAttribute('fill', 'transparent');
        cpCircle.setAttribute('stroke', '#ff4500');
        cpCircle.setAttribute('stroke-width', '1.5');
        cpGroup.appendChild(cpCircle);

        // Dot
        const cpDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        cpDot.setAttribute('cx', '0');
        cpDot.setAttribute('cy', '0');
        cpDot.setAttribute('r', '2');
        cpDot.setAttribute('fill', '#ff4500');
        cpGroup.appendChild(cpDot);

        // Crosshairs
        const crsH = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        crsH.setAttribute('d', 'M -10 0 L 10 0 M 0 -10 L 0 10');
        crsH.setAttribute('stroke', '#ff4500');
        crsH.setAttribute('stroke-width', '1');
        cpGroup.appendChild(crsH);

        // Label Line to side for CP (opposite direction to avoid overlapping)
        const cpLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        cpLine.setAttribute('x1', '-10');
        cpLine.setAttribute('y1', '0');
        cpLine.setAttribute('x2', '-34');
        cpLine.setAttribute('y2', '0');
        cpLine.setAttribute('stroke', '#ff4500');
        cpLine.setAttribute('stroke-width', '1');
        cpLine.setAttribute('stroke-dasharray', '2,2');
        cpGroup.appendChild(cpLine);

        const cpText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        cpText.setAttribute('x', '-50');
        cpText.setAttribute('y', '4');
        cpText.setAttribute('fill', '#ff4500');
        cpText.setAttribute('font-family', 'monospace');
        cpText.setAttribute('font-size', '10px');
        cpText.setAttribute('font-weight', '700');
        cpText.textContent = 'CP';
        cpGroup.appendChild(cpText);

        rocketSvgGroup.appendChild(cpGroup);
    }

    // Triggers CG, CP, Badge, and SVG updates
    function updateStabilityUI() {
        const st = calculateStability();
        
        // Update stability margin text & color
        let rating = '';
        let className = '';
        if (st.stability < 0) {
            rating = 'Unstable';
            className = 'unstable';
        } else if (st.stability < 1.0) {
            rating = 'Marginal';
            className = 'marginal';
        } else if (st.stability <= 2.5) {
            rating = 'Stable';
            className = 'stable';
        } else {
            rating = 'Overstable';
            className = 'overstable';
        }

        stabilityBadge.className = `stability-tag ${className}`;
        stabilityBadge.textContent = `Stability: ${st.stability.toFixed(2)} Calibers (${rating})`;

        drawRocketSchematic(st);
    }

    // --- Core 2D Runge-Kutta 4 Simulator ---
    function simulateRocketFlight() {
        // Collect rocket dimensions and masses
        const st = calculateStability();
        const massDryKg = st.totalMass / 1000; // g to kg

        const isCustom = presetSelect.value === 'custom';
        const motorThrustVal = isCustom ? parseFloat(motorThrustInput.value) : presets[presetSelect.value].motorThrust;
        const motorBurnTimeVal = isCustom ? parseFloat(motorBurnTimeInput.value) : presets[presetSelect.value].motorBurnTime;
        const motorPropellantVal = isCustom ? parseFloat(motorPropellantInput.value) : presets[presetSelect.value].motorPropellant;
        
        const propMassKg = motorPropellantVal / 1000; // g to kg
        const totalMassKg = massDryKg; // st.totalMass already includes motor mass (dry + propellant)

        // Guide rail and wind environment
        const windX = parseFloat(windSpeedInput.value);
        const railAngleDeg = parseFloat(railAngleInput.value);
        const thetaRail = (90 - railAngleDeg) * Math.PI / 180; // horizontal angle
        const railLength = 3.0; // guide rail length in meters

        // Recovery diameters
        const drogueDia = parseFloat(drogueDiaInput.value);
        const mainDia = parseFloat(mainDiaInput.value);
        const mainDeployAlt = parseFloat(mainDeployAltInput.value);

        const drogueArea = Math.PI * Math.pow(drogueDia / 200, 2); // cm to m radius
        const mainArea = Math.PI * Math.pow(mainDia / 200, 2); // cm to m radius
        const caliberM = st.caliber / 100; // cm to m
        const rocketArea = Math.PI * Math.pow(caliberM / 2, 2);

        // Pre-parachute drag
        const Cd_rocket = 0.55;

        // Motor parameters
        const burnRate = propMassKg / motorBurnTimeVal; // kg/s

        // State vector: [x, y, vx, vy]
        let t = 0;
        let x = 0;
        let y = 0;
        let vx = 0;
        let vy = 0;
        let ax = 0;
        let ay = 0;

        simHistory = [];

        // Save initial state
        simHistory.push({
            t: 0, x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0,
            mass: totalMassKg,
            stage: 'Thrust',
            drogue: false, main: false
        });

        const dtSim = 0.01; // integration step (seconds)
        let apogeeReached = false;
        let drogueDeployed = false;
        let mainDeployed = false;
        let maxAlt = 0;
        let maxVel = 0;
        let maxAcc = 0;
        let burnoutAlt = 0;
        let burnoutTime = motorBurnTimeVal;

        // Equations of motion solver helper
        function getDerivatives(tSim, px, py, curVx, curVy) {
            // Compute mass at current time
            let currMass = massDryKg;
            if (tSim <= motorBurnTimeVal) {
                currMass = massDryKg - burnRate * (motorBurnTimeVal - tSim); 
                // linear fuel depletion towards burn complete
            }
            if (currMass < (massDryKg - propMassKg)) {
                currMass = massDryKg - propMassKg;
            }

            // Variable Gravity
            const g = 9.80665 * Math.pow(6371000 / (6371000 + py), 2);
            
            // Atmospheric Density
            const rho = 1.225 * Math.exp(-py / 8500);

            // Parachute / Recovery check
            let dragArea = rocketArea;
            let Cd = Cd_rocket;
            let stageName = 'Thrust';

            if (tSim > motorBurnTimeVal) {
                stageName = 'Coast';
            }

            if (apogeeReached) {
                if (mainDeployed) {
                    dragArea = mainArea;
                    Cd = 1.5;
                    stageName = 'Main';
                } else if (drogueDeployed) {
                    dragArea = drogueArea;
                    Cd = 1.5;
                    stageName = 'Drogue';
                } else {
                    dragArea = rocketArea;
                    Cd = Cd_rocket;
                    stageName = 'Descent';
                }
            }

            // Relative airspeed including wind
            const vRelX = curVx - windX;
            const vRelY = curVy;
            const vRelMag = Math.sqrt(vRelX * vRelX + vRelY * vRelY);

            // Pitch Angle (theta)
            let theta = thetaRail;
            const displacement = Math.sqrt(px * px + py * py);

            if (displacement <= railLength) {
                theta = thetaRail;
            } else {
                // Zero angle of attack assumption in free flight
                if (vRelMag > 0.1) {
                    theta = Math.atan2(vRelY, vRelX);
                } else {
                    theta = thetaRail;
                }
            }

            // Thrust forces
            let Tx = 0;
            let Ty = 0;
            if (tSim <= motorBurnTimeVal) {
                Tx = motorThrustVal * Math.cos(theta);
                Ty = motorThrustVal * Math.sin(theta);
            }

            // Aerodynamic drag force
            let Fdx = 0;
            let Fdy = 0;
            if (vRelMag > 0.001) {
                const Fd_mag = 0.5 * Cd * rho * dragArea * vRelMag * vRelMag;
                Fdx = -Fd_mag * (vRelX / vRelMag);
                Fdy = -Fd_mag * (vRelY / vRelMag);
            }

            // Sum forces
            let FxNet = Tx + Fdx;
            let FyNet = Ty + Fdy - currMass * g;

            let curAx = FxNet / currMass;
            let curAy = FyNet / currMass;

            // Restrict movement while sliding on the guide rail
            if (displacement <= railLength) {
                const aMag = curAx * Math.cos(thetaRail) + curAy * Math.sin(thetaRail);
                if (aMag < 0 && tSim < 0.05) {
                    // Prevent rocket from sinking before ignition
                    curAx = 0;
                    curAy = 0;
                } else {
                    curAx = aMag * Math.cos(thetaRail);
                    curAy = aMag * Math.sin(thetaRail);
                }
            }

            return {
                vx: curVx,
                vy: curVy,
                ax: curAx,
                ay: curAy,
                mass: currMass,
                stage: stageName
            };
        }

        // Integration Loop
        while (t < 500) { // Safety limit of 500s
            // State: [x, y, vx, vy]
            const x0 = x, y0 = y, vx0 = vx, vy0 = vy;

            // Check apogee deployment condition
            if (!apogeeReached && t > motorBurnTimeVal && vy0 < 0 && y0 > 5) {
                apogeeReached = true;
                if (drogueDia > 0) {
                    drogueDeployed = true;
                } else {
                    // If no drogue, deploy main directly at apogee
                    mainDeployed = true;
                }
            }

            // Check main deployment altitude
            if (apogeeReached && !mainDeployed && mainDia > 0 && y0 <= mainDeployAlt) {
                mainDeployed = true;
                drogueDeployed = false;
            }

            // RK4 Step
            // k1
            const d1 = getDerivatives(t, x0, y0, vx0, vy0);
            
            // k2
            const d2 = getDerivatives(
                t + dtSim / 2,
                x0 + d1.vx * dtSim / 2,
                y0 + d1.vy * dtSim / 2,
                vx0 + d1.ax * dtSim / 2,
                vy0 + d1.ay * dtSim / 2
            );

            // k3
            const d3 = getDerivatives(
                t + dtSim / 2,
                x0 + d2.vx * dtSim / 2,
                y0 + d2.vy * dtSim / 2,
                vx0 + d2.ax * dtSim / 2,
                vy0 + d2.ay * dtSim / 2
            );

            // k4
            const d4 = getDerivatives(
                t + dtSim,
                x0 + d3.vx * dtSim,
                y0 + d3.vy * dtSim,
                vx0 + d3.ax * dtSim,
                vy0 + d3.ay * dtSim
            );

            // Update state
            x += (d1.vx + 2 * d2.vx + 2 * d3.vx + d4.vx) / 6 * dtSim;
            y += (d1.vy + 2 * d2.vy + 2 * d3.vy + d4.vy) / 6 * dtSim;
            vx += (d1.ax + 2 * d2.ax + 2 * d3.ax + d4.ax) / 6 * dtSim;
            vy += (d1.ay + 2 * d2.ay + 2 * d3.ay + d4.ay) / 6 * dtSim;

            // Log acceleration and mass from derivatives
            ax = d1.ax;
            ay = d1.ay;

            t += dtSim;

            // Track stats
            if (y > maxAlt) maxAlt = y;
            const currentV = Math.sqrt(vx * vx + vy * vy);
            if (currentV > maxVel) maxVel = currentV;
            const currentA = Math.sqrt(ax * ax + ay * ay);
            if (currentA > maxAcc) maxAcc = currentA;

            if (Math.abs(t - motorBurnTimeVal) < dtSim) {
                burnoutAlt = y;
            }

            // Store step
            simHistory.push({
                t: t,
                x: x,
                y: y,
                vx: vx,
                vy: vy,
                ax: ax,
                ay: ay,
                mass: d1.mass,
                stage: d1.stage,
                drogue: drogueDeployed,
                main: mainDeployed
            });

            // Landing termination
            if (y <= 0 && t > 0.5) {
                y = 0;
                vx = 0;
                vy = 0;
                ax = 0;
                ay = 0;
                break;
            }
        }

        // Render digital telemetry readouts
        tApogee.innerHTML = `${maxAlt.toLocaleString(undefined, {maximumFractionDigits: 1})} <small>m</small>`;
        
        const mach = maxVel / 343;
        tMaxV.innerHTML = `${maxVel.toFixed(1)} <small>m/s</small> <span class="unit-mach">(Mach ${mach.toFixed(2)})</span>`;
        
        const gForce = maxAcc / 9.80665;
        tMaxA.innerHTML = `${gForce.toFixed(1)} <small>G</small>`;
        
        tFlightTime.innerHTML = `${t.toFixed(1)} <small>s</small>`;
        tBurnoutAlt.innerHTML = `${burnoutAlt.toLocaleString(undefined, {maximumFractionDigits: 1})} <small>m</small>`;
        tDrift.innerHTML = `${Math.abs(x).toFixed(1)} <small>m</small>`;

        // Update charts and trigger playback
        updateTelemetryChart();
        startSimulationPlayback();
    }

    // --- Chart.js Graph updates ---
    function updateTelemetryChart() {
        if (simHistory.length === 0) return;

        // Decimate data arrays to keep Chart.js rendering fast (target ~300 points)
        const skip = Math.max(1, Math.ceil(simHistory.length / 300));
        
        const labels = [];
        const dataValues = [];

        let labelText = '';
        let borderColor = '#125DFF';
        let fillGradient = 'rgba(18, 93, 255, 0.05)';

        if (activeGraphType === 'altitude') {
            labelText = 'Altitude (m)';
            borderColor = '#5AA6FF';
            fillGradient = 'rgba(90, 166, 255, 0.08)';
        } else if (activeGraphType === 'velocity') {
            labelText = 'Velocity (m/s)';
            borderColor = '#FFA500';
            fillGradient = 'rgba(255, 165, 0, 0.08)';
        } else if (activeGraphType === 'acceleration') {
            labelText = 'Acceleration (m/s²)';
            borderColor = '#FF4500';
            fillGradient = 'rgba(255, 69, 0, 0.08)';
        } else if (activeGraphType === 'mass') {
            labelText = 'Total Mass (kg)';
            borderColor = '#DEEBFF';
            fillGradient = 'rgba(222, 235, 255, 0.05)';
        }

        for (let i = 0; i < simHistory.length; i += skip) {
            const step = simHistory[i];
            labels.push(step.t.toFixed(1));
            
            if (activeGraphType === 'altitude') {
                dataValues.push(step.y);
            } else if (activeGraphType === 'velocity') {
                const vel = Math.sqrt(step.vx * step.vx + step.vy * step.vy);
                dataValues.push(step.vy < 0 ? -vel : vel); // positive upwards, negative descent
            } else if (activeGraphType === 'acceleration') {
                const acc = Math.sqrt(step.ax * step.ax + step.ay * step.ay);
                dataValues.push(step.ay < 0 ? -acc : acc);
            } else if (activeGraphType === 'mass') {
                dataValues.push(step.mass);
            }
        }

        if (chartInstance) {
            chartInstance.destroy();
        }

        const ctx = document.getElementById('telemetryChart').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: labelText,
                    data: dataValues,
                    borderColor: borderColor,
                    backgroundColor: fillGradient,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(222, 235, 255, 0.03)' },
                        ticks: { color: '#8b97c4', font: { size: 9 } },
                        title: { display: true, text: 'Time (s)', color: '#8b97c4' }
                    },
                    y: {
                        grid: { color: 'rgba(222, 235, 255, 0.03)' },
                        ticks: { color: '#8b97c4', font: { size: 9 } }
                    }
                }
            }
        });
    }

    // Chart tab events
    document.querySelectorAll('.graph-selector-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.graph-selector-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeGraphType = btn.getAttribute('data-graph');
            updateTelemetryChart();
        });
    });

    // --- 2D Simulation Playback and Canvas Visualizer ---
    function startSimulationPlayback() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        isSimulating = true;
        playbackTime = 0;
        flightStatusDot.className = 'pulse-dot powered';
        flightStatusLbl.textContent = 'Powered Flight';

        let lastTime = performance.now();
        let droguePopped = false;
        let mainPopped = false;
        let landedSoundPlayed = false;

        function renderFrame(now) {
            if (!isSimulating) return;

            // Time scaling: play simulation at 1.0x real-time rate
            const deltaSec = (now - lastTime) / 1000;
            lastTime = now;

            playbackTime += deltaSec;

            // Find closest historical step in simHistory
            let step = simHistory[0];
            for (let i = 0; i < simHistory.length; i++) {
                if (simHistory[i].t >= playbackTime) {
                    step = simHistory[i];
                    break;
                }
            }

            // Loop termination at touchdown
            if (playbackTime >= simHistory[simHistory.length - 1].t) {
                step = simHistory[simHistory.length - 1];
                isSimulating = false;
                flightStatusDot.className = 'pulse-dot idle';
                flightStatusLbl.textContent = 'Landed';
                btnLaunch.innerText = 'LAUNCH ROCKET';
                
                if (isAudioEnabled) {
                    if (engineGainNode) engineGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
                    if (windGainNode) windGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
                    if (!landedSoundPlayed) {
                        playPopSound(120, 0.3); // land click
                        landedSoundPlayed = true;
                    }
                }
                drawSimulationCanvas(step);
                return;
            }

            // Sound Sonification updates
            if (isAudioEnabled && audioCtx) {
                const vel = Math.sqrt(step.vx * step.vx + step.vy * step.vy);
                const mach = vel / 343;

                // Engine noise active during thrust
                if (step.stage === 'Thrust') {
                    engineGainNode.gain.setTargetAtTime(0.06, audioCtx.currentTime, 0.05);
                } else {
                    engineGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
                }

                // Wind shear noise active based on velocity
                if (vel > 1.0) {
                    const windVol = Math.min(0.05, 0.05 * (vel / 200));
                    windGainNode.gain.setTargetAtTime(windVol, audioCtx.currentTime, 0.1);
                    // Filter frequency matches speed
                    const cutoff = Math.min(1800, 300 + mach * 1500);
                    windFilterNode.frequency.setValueAtTime(cutoff, audioCtx.currentTime);
                } else {
                    windGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
                }

                // Parachute pop triggers
                if (step.drogue && !droguePopped) {
                    playPopSound(280, 0.15);
                    droguePopped = true;
                }
                if (step.main && !mainPopped) {
                    playPopSound(180, 0.25);
                    mainPopped = true;
                }
            }

            // Update state label
            if (step.stage === 'Thrust') {
                flightStatusDot.className = 'pulse-dot powered';
                flightStatusLbl.textContent = 'Powered Flight';
            } else if (step.stage === 'Coast') {
                flightStatusDot.className = 'pulse-dot coasting';
                flightStatusLbl.textContent = 'Coasting';
            } else if (step.stage === 'Drogue') {
                flightStatusDot.className = 'pulse-dot drogue';
                flightStatusLbl.textContent = 'Drogue Descent';
            } else if (step.stage === 'Main') {
                flightStatusDot.className = 'pulse-dot main';
                flightStatusLbl.textContent = 'Main Descent';
            }

            drawSimulationCanvas(step);
            animationId = requestAnimationFrame(renderFrame);
        }

        animationId = requestAnimationFrame(renderFrame);
    }

    // Render Canvas Layout with Parallax Tracking
    function drawSimulationCanvas(step) {
        ctxSim.clearRect(0, 0, simCanvas.width, simCanvas.height);
        
        const width = simCanvas.width;
        const height = simCanvas.height;

        // Apogee of the current flight to establish altitude scale
        const maxAlt = simHistory[simHistory.length - 1].y; // wait, apogee is max, not landing y
        let apogee = 100;
        simHistory.forEach(h => { if (h.y > apogee) apogee = h.y; });

        // Camera Tracking System:
        // Panning coordinates
        let camY = step.y; // Camera locks vertically on the rocket
        let camX = step.x; // Camera locks horizontally on the rocket

        // Scale factors: how many pixels per meter
        // Zoom out dynamically as altitude increases to keep context
        const scaleY = Math.min(3.0, (height * 0.45) / (step.y + 10)); // zoom out as it climbs
        
        const centerY = height * 0.65; // keep rocket positioned 65% up the screen
        const centerX = width / 2;

        // Helper to convert real coordinates [x, y] to canvas coordinates [px, py]
        function getCanvasCoords(rx, ry) {
            return {
                x: centerX + (rx - camX) * scaleY,
                y: centerY - (ry - camY) * scaleY
            };
        }

        // 1. Draw Sky Gradient
        // Deeper navy blue as altitude increases
        const skyAlt = Math.max(0, step.y);
        const colorBlend = Math.min(1.0, skyAlt / 2500); // dark space by 2500m
        const skyGrad = ctxSim.createLinearGradient(0, 0, 0, height);
        
        // RGB definitions
        const r1 = Math.round(2 + (8 - 2) * (1 - colorBlend));
        const g1 = Math.round(16 + (30 - 16) * (1 - colorBlend));
        const b1 = Math.round(52 + (85 - 52) * (1 - colorBlend));
        
        const r2 = Math.round(6 + (26 - 6) * (1 - colorBlend));
        const g2 = Math.round(26 + (50 - 26) * (1 - colorBlend));
        const b2 = Math.round(74 + (100 - 74) * (1 - colorBlend));

        skyGrad.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
        skyGrad.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`);
        ctxSim.fillStyle = skyGrad;
        ctxSim.fillRect(0, 0, width, height);

        // 2. Draw Ground and Launch Pad (only visible when close to the ground)
        const groundY = 0;
        const groundC = getCanvasCoords(0, groundY);

        if (groundC.y < height) {
            // Draw Ground block
            ctxSim.fillStyle = '#060a1e';
            ctxSim.fillRect(0, groundC.y, width, height - groundC.y);
            
            // Ground Line
            ctxSim.beginPath();
            ctxSim.moveTo(0, groundC.y);
            ctxSim.lineTo(width, groundC.y);
            ctxSim.strokeStyle = 'rgba(90, 166, 255, 0.2)';
            ctxSim.lineWidth = 2;
            ctxSim.stroke();

            // Launch Rail Pad
            const padW = 20 * scaleY;
            const padH = 3 * scaleY;
            ctxSim.fillStyle = '#1e284a';
            ctxSim.fillRect(centerX - camX * scaleY - padW / 2, groundC.y - padH, padW, padH);

            // Launch Rail Rod
            const railAngle = parseFloat(railAngleInput.value) * Math.PI / 180;
            const railLenM = 3.0; // 3 meters
            const railTip = getCanvasCoords(railLenM * Math.sin(railAngle), railLenM * Math.cos(railAngle));
            
            ctxSim.beginPath();
            ctxSim.moveTo(centerX - camX * scaleY, groundC.y - padH);
            ctxSim.lineTo(railTip.x, railTip.y);
            ctxSim.strokeStyle = '#c4c4c4';
            ctxSim.lineWidth = Math.max(1, 1.5 * scaleY);
            ctxSim.stroke();
        }

        // 3. Draw Parallax Clouds in background
        ctxSim.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let i = 0; i < 4; i++) {
            // Cloud altitude ranges from 200m to 1200m
            const cloudAlt = 300 + i * 350;
            const cloudX = (i * 300 - camX * 0.15) % (width + 200) - 100;
            const cloudC = getCanvasCoords(0, cloudAlt);
            
            ctxSim.beginPath();
            ctxSim.arc(cloudX, cloudC.y, 40 * scaleY, 0, Math.PI * 2);
            ctxSim.arc(cloudX + 30 * scaleY, cloudC.y - 10 * scaleY, 30 * scaleY, 0, Math.PI * 2);
            ctxSim.arc(cloudX - 30 * scaleY, cloudC.y + 10 * scaleY, 30 * scaleY, 0, Math.PI * 2);
            ctxSim.fill();
        }

        // 4. Draw Trajectory Line (Dashed trail)
        ctxSim.beginPath();
        ctxSim.setLineDash([4, 4]);
        ctxSim.strokeStyle = 'rgba(222, 235, 255, 0.4)';
        ctxSim.lineWidth = 1.5;
        
        simHistory.forEach((h, idx) => {
            if (h.t > step.t) return;
            const c = getCanvasCoords(h.x, h.y);
            if (idx === 0) {
                ctxSim.moveTo(c.x, c.y);
            } else {
                ctxSim.lineTo(c.x, c.y);
            }
        });
        ctxSim.stroke();
        ctxSim.setLineDash([]); // Reset dash

        // 5. Draw Rocket
        const rocketC = getCanvasCoords(step.x, step.y);
        
        // Rocket dimensions (make it visually visible even when zoomed out)
        const rocketH_px = Math.max(22, 25 * scaleY);
        const rocketW_px = Math.max(4, 5 * scaleY);

        ctxSim.save();
        ctxSim.translate(rocketC.x, rocketC.y);

        // Rocket orientation
        let theta = Math.PI / 2; // vertical
        const velMag = Math.sqrt(step.vx * step.vx + step.vy * step.vy);
        if (velMag > 0.1) {
            // Align with velocity
            theta = Math.atan2(step.vy, step.vx);
        } else {
            // Align with rail
            const railAngle = parseFloat(railAngleInput.value) * Math.PI / 180;
            theta = Math.PI / 2 - railAngle;
        }

        // Rotate canvas so rocket points towards its movement direction (SVG/Canvas rotation is offset by 90deg)
        ctxSim.rotate(-theta + Math.PI / 2);

        // Draw rocket body tube
        ctxSim.fillStyle = '#DEEBFF';
        ctxSim.fillRect(-rocketW_px / 2, -rocketH_px * 0.3, rocketW_px, rocketH_px * 0.8);

        // Draw nose cone (red)
        ctxSim.beginPath();
        ctxSim.moveTo(-rocketW_px / 2, -rocketH_px * 0.3);
        ctxSim.quadraticCurveTo(0, -rocketH_px * 0.55, 0, -rocketH_px * 0.6);
        ctxSim.quadraticCurveTo(0, -rocketH_px * 0.55, rocketW_px / 2, -rocketH_px * 0.3);
        ctxSim.closePath();
        ctxSim.fillStyle = '#FF4500';
        ctxSim.fill();

        // Draw fins (red)
        ctxSim.fillStyle = '#FF4500';
        ctxSim.beginPath();
        ctxSim.moveTo(-rocketW_px / 2, rocketH_px * 0.2);
        ctxSim.lineTo(-rocketW_px * 1.5, rocketH_px * 0.5);
        ctxSim.lineTo(-rocketW_px / 2, rocketH_px * 0.5);
        ctxSim.fill();

        ctxSim.beginPath();
        ctxSim.moveTo(rocketW_px / 2, rocketH_px * 0.2);
        ctxSim.lineTo(rocketW_px * 1.5, rocketH_px * 0.5);
        ctxSim.lineTo(rocketW_px / 2, rocketH_px * 0.5);
        ctxSim.fill();

        // Draw Flame (Thrust Phase)
        if (step.stage === 'Thrust') {
            ctxSim.beginPath();
            ctxSim.moveTo(-rocketW_px * 0.4, rocketH_px * 0.5);
            ctxSim.lineTo(0, rocketH_px * (0.5 + 0.3 * (1 + Math.random() * 0.5)));
            ctxSim.lineTo(rocketW_px * 0.4, rocketH_px * 0.5);
            ctxSim.closePath();
            
            const flameGrad = ctxSim.createLinearGradient(0, rocketH_px * 0.5, 0, rocketH_px * 0.9);
            flameGrad.addColorStop(0, '#FFFFFF');
            flameGrad.addColorStop(0.3, '#FFBE46');
            flameGrad.addColorStop(1, 'rgba(255, 69, 0, 0)');
            ctxSim.fillStyle = flameGrad;
            ctxSim.fill();
        }

        ctxSim.restore();

        // 6. Draw Parachute Deployment (above the rocket, so no rotation constraint)
        if (step.stage === 'Drogue' || step.stage === 'Main') {
            const chuteYOffset = 25 * scaleY;
            const chuteC = getCanvasCoords(step.x, step.y + chuteYOffset / scaleY);
            
            // Connect lines (shroud lines)
            ctxSim.beginPath();
            ctxSim.moveTo(rocketC.x, rocketC.y);
            ctxSim.lineTo(chuteC.x - 8 * scaleY, chuteC.y);
            ctxSim.lineTo(rocketC.x, rocketC.y);
            ctxSim.lineTo(chuteC.x + 8 * scaleY, chuteC.y);
            ctxSim.strokeStyle = 'rgba(255,255,255,0.3)';
            ctxSim.lineWidth = 1;
            ctxSim.stroke();

            // Canopy
            const canopyRad = step.stage === 'Main' ? 14 * scaleY : 6 * scaleY;
            ctxSim.beginPath();
            ctxSim.arc(chuteC.x, chuteC.y, canopyRad, Math.PI, 0, false);
            ctxSim.closePath();
            ctxSim.fillStyle = step.stage === 'Main' ? '#00FF80' : '#FFA500'; // main = green, drogue = orange
            ctxSim.fill();
            ctxSim.strokeStyle = '#FFFFFF';
            ctxSim.lineWidth = 1;
            ctxSim.stroke();
        }

        // 7. Visual HUD (Alt, Speed, Stage label overlay on Canvas)
        ctxSim.fillStyle = '#FFFFFF';
        ctxSim.font = 'bold 12px Orbitron, sans-serif';
        ctxSim.fillText(`ALTITUDE: ${step.y.toFixed(1)} m`, 15, 25);
        ctxSim.fillText(`SPEED: ${Math.sqrt(step.vx*step.vx + step.vy*step.vy).toFixed(1)} m/s`, 15, 45);
        
        ctxSim.font = '10px monospace';
        ctxSim.fillStyle = 'rgba(222, 235, 255, 0.7)';
        ctxSim.fillText(`WIND: ${parseFloat(windSpeedInput.value).toFixed(1)} m/s (drift)`, 15, 65);
    }

    // Initialize/Reset preview
    function initSimulationPreview() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        isSimulating = false;
        simHistory = [];
        playbackTime = 0;
        
        tApogee.innerHTML = '-- <small>m</small>';
        tMaxV.innerHTML = '-- <small>m/s</small>';
        tMaxA.innerHTML = '-- <small>G</small>';
        tFlightTime.innerHTML = '-- <small>s</small>';
        tBurnoutAlt.innerHTML = '-- <small>m</small>';
        tDrift.innerHTML = '-- <small>m</small>';

        flightStatusDot.className = 'pulse-dot idle';
        flightStatusLbl.textContent = 'Idle';

        // Clear Audio
        if (engineGainNode) engineGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        if (windGainNode) windGainNode.gain.setValueAtTime(0, audioCtx.currentTime);

        // Draw starting visual frame (Rocket on pad)
        ctxSim.clearRect(0, 0, simCanvas.width, simCanvas.height);
        
        const width = simCanvas.width;
        const height = simCanvas.height;

        // Sky
        const skyGrad = ctxSim.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#081e55');
        skyGrad.addColorStop(1, '#1a3264');
        ctxSim.fillStyle = skyGrad;
        ctxSim.fillRect(0, 0, width, height);

        // Ground
        const groundY = height * 0.75;
        ctxSim.fillStyle = '#060a1e';
        ctxSim.fillRect(0, groundY, width, height - groundY);
        ctxSim.beginPath();
        ctxSim.moveTo(0, groundY);
        ctxSim.lineTo(width, groundY);
        ctxSim.strokeStyle = 'rgba(90, 166, 255, 0.2)';
        ctxSim.lineWidth = 2;
        ctxSim.stroke();

        // Launch Rail Pad
        const padW = 35;
        const padH = 5;
        ctxSim.fillStyle = '#1e284a';
        ctxSim.fillRect(width/2 - padW/2, groundY - padH, padW, padH);

        // Launch Rail Rod
        const railAngle = parseFloat(railAngleInput.value) * Math.PI / 180;
        const railLen = 60;
        const rTipX = width/2 + railLen * Math.sin(railAngle);
        const rTipY = groundY - padH - railLen * Math.cos(railAngle);
        
        ctxSim.beginPath();
        ctxSim.moveTo(width/2, groundY - padH);
        ctxSim.lineTo(rTipX, rTipY);
        ctxSim.strokeStyle = '#c4c4c4';
        ctxSim.lineWidth = 2;
        ctxSim.stroke();

        // Draw small rocket on pad
        ctxSim.save();
        ctxSim.translate(width/2, groundY - padH - 15);
        ctxSim.rotate(railAngle);
        
        ctxSim.fillStyle = '#DEEBFF';
        ctxSim.fillRect(-3, -15, 6, 20); // body
        ctxSim.beginPath();
        ctxSim.moveTo(-3, -15);
        ctxSim.lineTo(0, -23);
        ctxSim.lineTo(3, -15);
        ctxSim.closePath();
        ctxSim.fillStyle = '#FF4500';
        ctxSim.fill(); // nose
        
        ctxSim.fillStyle = '#FF4500';
        ctxSim.beginPath();
        ctxSim.moveTo(-3, 0);
        ctxSim.lineTo(-7, 5);
        ctxSim.lineTo(-3, 5);
        ctxSim.fill(); // fin L
        ctxSim.beginPath();
        ctxSim.moveTo(3, 0);
        ctxSim.lineTo(7, 5);
        ctxSim.lineTo(3, 5);
        ctxSim.fill(); // fin R
        
        ctxSim.restore();

        // Draw HUD
        ctxSim.fillStyle = '#FFFFFF';
        ctxSim.font = 'bold 12px Orbitron, sans-serif';
        ctxSim.fillText(`ALTITUDE: 0.0 m`, 15, 25);
        ctxSim.fillText(`SPEED: 0.0 m/s`, 15, 45);
    }

    // Launch Button Event
    btnLaunch.addEventListener('click', () => {
        if (isSimulating) {
            // Abort/Reset
            initSimulationPreview();
            btnLaunch.innerText = 'LAUNCH ROCKET';
        } else {
            simulateRocketFlight();
            btnLaunch.innerText = 'RESET SIMULATOR';
        }
    });

    // Preset Selection change
    presetSelect.addEventListener('change', () => {
        const val = presetSelect.value;
        if (val === 'custom') {
            motorConfigWrapper.style.display = 'block';
        } else {
            motorConfigWrapper.style.display = 'none';
            if (presets[val]) {
                const p = presets[val];
                noseLengthInput.value = p.noseLength;
                noseMassInput.value = p.noseMass;
                tubeLengthInput.value = p.tubeLength;
                tubeDiameterInput.value = p.tubeDiameter;
                tubeMassInput.value = p.tubeMass;
                finCountSelect.value = p.finCount;
                finSpanInput.value = p.finSpan;
                finRootInput.value = p.finRoot;
                finTipInput.value = p.finTip;
                finSweepInput.value = p.finSweep;
                finMassInput.value = p.finMass;
                drogueDiaInput.value = p.drogueDia;
                mainDiaInput.value = p.mainDia;
                mainDeployAltInput.value = p.mainDeployAlt;
            }
        }
        
        // Trigger updates on all sliders
        [noseLengthInput, noseMassInput, tubeLengthInput, tubeDiameterInput, tubeMassInput,
         finSpanInput, finRootInput, finTipInput, finSweepInput, finMassInput,
         drogueDiaInput, mainDiaInput, mainDeployAltInput, windSpeedInput, railAngleInput].forEach(inp => {
             updateLabel(inp);
         });

        updateStabilityUI();
        initSimulationPreview();
    });

    // Attach listeners to all inputs
    [noseLengthInput, noseMassInput, tubeLengthInput, tubeDiameterInput, tubeMassInput,
     finSpanInput, finRootInput, finTipInput, finSweepInput, finMassInput,
     drogueDiaInput, mainDiaInput, mainDeployAltInput, windSpeedInput, railAngleInput,
     motorThrustInput, motorBurnTimeInput, motorPropellantInput, motorDryMassInput].forEach(input => {
         input.addEventListener('input', () => {
             if (presetSelect.value !== 'custom' && input.id !== 'wind-speed' && input.id !== 'rail-angle') {
                 presetSelect.value = 'custom';
                 motorConfigWrapper.style.display = 'block';
             }
             updateLabel(input);
             updateStabilityUI();
             initSimulationPreview();
         });
     });

    finCountSelect.addEventListener('change', () => {
        if (presetSelect.value !== 'custom') {
            presetSelect.value = 'custom';
            motorConfigWrapper.style.display = 'block';
        }
        updateStabilityUI();
        initSimulationPreview();
    });

    // Initial load
    presetSelect.dispatchEvent(new Event('change'));

    // Resize canvas fit
    function handleResize() {
        const d = simCanvas.parentElement;
        simCanvas.width = d.clientWidth;
        simCanvas.height = d.clientHeight;
        initSimulationPreview();
    }
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);
});
