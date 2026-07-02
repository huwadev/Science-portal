// ==========================================================================
//  MULTI-PHASE ORBITAL MECHANICS SIMULATOR
//  Physics engine inspired by NASA GMAT (General Mission Analysis Tool)
//  Integrator: 4th-order Runge-Kutta with J2 oblateness perturbation
// ==========================================================================

// ==========================================================================
//  SECTION 1: PHYSICAL CONSTANTS (GMAT-derived)
// ==========================================================================
const MU_EARTH       = 3.986004418e14;   // Earth gravitational parameter (m³/s²)
const RADIUS_EARTH   = 6371000;          // Mean Earth radius (m)
const J2             = 1.08263e-3;       // J2 zonal harmonic (GMAT HarmonicField)
const OMEGA_EARTH    = 7.2921159e-5;     // Earth rotation rate (rad/s)
const G0             = 9.80665;          // Standard gravity (m/s²)
const RHO0           = 1.225;            // Sea-level air density (kg/m³)
const ATM_SCALE_H    = 8500;             // Atmospheric scale height (m)
const KARMAN_LINE    = 100000;           // Kármán line (m)
const VIEW_SCALE     = 1e-5;            // Meters → Three.js units

// ==========================================================================
//  SECTION 2: SPACECRAFT SPECIFICATIONS (2-stage vehicle)
// ==========================================================================
const STAGES = {
    1: { name: "Stage 1 — Booster",  thrust: 200000, isp: 311, fuelMass: 8000, dryMass: 1200, dragCd: 0.35, dragArea: 6.0 },
    2: { name: "Stage 2 — Vacuum",   thrust: 20000,  isp: 348, fuelMass: 2000, dryMass: 500,  dragCd: 0.25, dragArea: 3.0 }
};
const PAYLOAD_MASS = 300; // kg

// ==========================================================================
//  SECTION 3: SIMULATION STATE
// ==========================================================================
const sim = {
    // Position & velocity (ECI, meters)
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    
    // Time
    met: 0,              // Mission Elapsed Time (seconds)
    isPaused: true,       // Start paused
    timeWarp: 1,
    
    // Vehicle state
    stage: 1,
    fuel: STAGES[1].fuelMass,
    isIgnited: false,
    throttle: 0,
    steeringAngle: 90,   // 90 = straight up, 0 = horizontal
    
    // Autopilot
    autopilot: "manual",
    
    // Mission phase
    phase: "launch",
    
    // Downrange tracking
    downrange: 0,
    launchLat: 9.03 * Math.PI / 180,    // Addis Ababa latitude
    launchLon: 38.74 * Math.PI / 180,   // Addis Ababa longitude
    
    // Rendezvous target state
    targetPos: new THREE.Vector3(),
    targetVel: new THREE.Vector3(),
    
    // Flags
    successTriggered: false,
    crashTriggered: false,
    audioInitialized: false,
    
    // Trail data
    trailPoints: [],
    targetTrailPoints: [],
    
    // Chart data
    chartData: { alt: [], vel: [], time: [] }
};

// ==========================================================================
//  SECTION 4: FORCE MODELS (GMAT-inspired modular stacking)
// ==========================================================================

/**
 * Two-body point-mass gravity: a = -μ·r / |r|³
 */
function pointMassGravity(pos) {
    const r = pos.length();
    if (r < 100) return new THREE.Vector3(); // safety
    const factor = -MU_EARTH / (r * r * r);
    return new THREE.Vector3(pos.x * factor, pos.y * factor, pos.z * factor);
}

/**
 * J2 oblateness perturbation (GMAT HarmonicField, degree=2, order=0)
 * Accounts for Earth's equatorial bulge — the single biggest perturbation in LEO.
 * 
 * a_J2x = (3/2)·J2·μ·Re²/r⁵ · x · (5z²/r² - 1)
 * a_J2y = (3/2)·J2·μ·Re²/r⁵ · y · (5z²/r² - 1)
 * a_J2z = (3/2)·J2·μ·Re²/r⁵ · z · (5z²/r² - 3)
 */
function j2Perturbation(pos) {
    const r = pos.length();
    if (r < RADIUS_EARTH * 0.5) return new THREE.Vector3();
    const r2 = r * r;
    const r5 = r2 * r2 * r;
    const Re2 = RADIUS_EARTH * RADIUS_EARTH;
    const coeff = 1.5 * J2 * MU_EARTH * Re2 / r5;
    const z2r2 = 5.0 * pos.z * pos.z / r2;
    return new THREE.Vector3(
        coeff * pos.x * (z2r2 - 1.0),
        coeff * pos.y * (z2r2 - 1.0),
        coeff * pos.z * (z2r2 - 3.0)
    );
}

/**
 * Atmospheric drag: F_d = -½ρ·v²_rel·Cd·A·v̂_rel / m
 * Uses exponential atmosphere with altitude-dependent scale height.
 * Velocity is relative to rotating atmosphere (GMAT pattern).
 */
function atmosphericDrag(pos, vel, mass, stage) {
    const alt = pos.length() - RADIUS_EARTH;
    if (alt > 300000 || alt < 0 || mass <= 0) return new THREE.Vector3();
    
    // Scale height varies with altitude (GMAT layered model simplified)
    let H = ATM_SCALE_H;
    if (alt > 100000) H = 12000;
    else if (alt > 50000) H = 10000;
    
    const rho = RHO0 * Math.exp(-alt / H);
    
    // Velocity relative to rotating atmosphere
    const vRel = vel.clone();
    vRel.x += OMEGA_EARTH * pos.y;
    vRel.y -= OMEGA_EARTH * pos.x;
    
    const vRelMag = vRel.length();
    if (vRelMag < 0.1) return new THREE.Vector3();
    
    const spec = STAGES[stage];
    const dragForce = -0.5 * rho * vRelMag * spec.dragCd * spec.dragArea / mass;
    return new THREE.Vector3(
        dragForce * vRel.x,
        dragForce * vRel.y,
        dragForce * vRel.z
    );
}

/**
 * Thrust acceleration: a = (T·throttle / m) · t̂
 * GMAT FiniteBurn model with mass depletion: dm/dt = -T/(g₀·Isp)
 * Direction determined by steering angle + autopilot mode.
 */
function thrustAcceleration(pos, vel, mass, throttle, steeringAngle, autopilot) {
    const spec = STAGES[sim.stage];
    const T = spec.thrust * (throttle / 100);
    if (T <= 0 || mass <= 0) return new THREE.Vector3();
    
    const aMag = T / mass;
    let dir;
    
    if (autopilot === "prograde") {
        dir = vel.clone().normalize();
    } else if (autopilot === "retrograde") {
        dir = vel.clone().normalize().negate();
    } else if (autopilot === "target" && sim.phase === "rendezvous") {
        const toTarget = sim.targetPos.clone().sub(pos);
        dir = toTarget.length() > 1 ? toTarget.normalize() : vel.clone().normalize();
    } else {
        // Manual: steeringAngle determines pitch from local vertical
        const up = pos.clone().normalize();
        const east = new THREE.Vector3(-pos.y, pos.x, 0).normalize();
        const pitchRad = steeringAngle * Math.PI / 180;
        dir = up.clone().multiplyScalar(Math.sin(pitchRad))
            .add(east.clone().multiplyScalar(Math.cos(pitchRad)));
        dir.normalize();
    }
    
    return dir.multiplyScalar(aMag);
}

/**
 * Sum all force accelerations (GMAT modular force-model stacking pattern)
 */
function computeTotalAcceleration(pos, vel, mass, thrustActive, throttle, angle, autopilot, stage) {
    const acc = pointMassGravity(pos);
    acc.add(j2Perturbation(pos));
    
    const alt = pos.length() - RADIUS_EARTH;
    if (alt < 300000) {
        acc.add(atmosphericDrag(pos, vel, mass, stage));
    }
    
    if (thrustActive && throttle > 0 && sim.fuel > 0) {
        acc.add(thrustAcceleration(pos, vel, mass, throttle, angle, autopilot));
    }
    
    return acc;
}

// ==========================================================================
//  SECTION 5: RK4 INTEGRATOR (Clean implementation — no reference aliasing)
// ==========================================================================

function getTotalMass() {
    const spec = STAGES[sim.stage];
    const structural = sim.stage === 1
        ? spec.dryMass + STAGES[2].fuelMass + STAGES[2].dryMass + PAYLOAD_MASS
        : spec.dryMass + PAYLOAD_MASS;
    return structural + sim.fuel;
}

function stepPhysics(dt) {
    if (sim.isPaused || sim.crashTriggered) return;
    
    const warpDt = dt * sim.timeWarp;
    const maxSubStep = 5.0;
    const numSteps = Math.ceil(warpDt / maxSubStep);
    const h = warpDt / numSteps;
    
    for (let step = 0; step < numSteps; step++) {
        const mass = getTotalMass();
        const thrustOn = sim.isIgnited;
        const throttle = sim.throttle;
        const angle = sim.steeringAngle;
        const ap = sim.autopilot;
        const stage = sim.stage;
        
        // Ground lock: if on pad and TWR < 1, stay pinned
        const alt = sim.pos.length() - RADIUS_EARTH;
        if (alt <= 50 && !sim.isIgnited) {
            // Rotate with Earth surface
            const angle_rot = OMEGA_EARTH * h;
            const cosA = Math.cos(angle_rot), sinA = Math.sin(angle_rot);
            const px = sim.pos.x, py = sim.pos.y;
            sim.pos.x = px * cosA - py * sinA;
            sim.pos.y = px * sinA + py * cosA;
            // Surface velocity
            sim.vel.set(-OMEGA_EARTH * sim.pos.y, OMEGA_EARTH * sim.pos.x, 0);
            sim.met += h;
            continue;
        }
        
        if (alt <= 0 && sim.isIgnited) {
            // Check TWR
            const spec = STAGES[stage];
            const twr = (spec.thrust * throttle / 100) / (mass * G0);
            if (twr < 1.0) {
                // Pin to surface
                sim.pos.setLength(RADIUS_EARTH + 10);
                const angle_rot = OMEGA_EARTH * h;
                const cosA = Math.cos(angle_rot), sinA = Math.sin(angle_rot);
                const px = sim.pos.x, py = sim.pos.y;
                sim.pos.x = px * cosA - py * sinA;
                sim.pos.y = px * sinA + py * cosA;
                sim.vel.set(-OMEGA_EARTH * sim.pos.y, OMEGA_EARTH * sim.pos.x, 0);
                sim.met += h;
                continue;
            }
        }
        
        // ---- RK4 (proper vector cloning — no reference aliasing) ----
        const r0 = sim.pos.clone();
        const v0 = sim.vel.clone();
        
        // k1
        const a1 = computeTotalAcceleration(r0, v0, mass, thrustOn, throttle, angle, ap, stage);
        const k1r = v0.clone();
        const k1v = a1;
        
        // k2
        const r2 = r0.clone().addScaledVector(k1r, h * 0.5);
        const v2 = v0.clone().addScaledVector(k1v, h * 0.5);
        const a2 = computeTotalAcceleration(r2, v2, mass, thrustOn, throttle, angle, ap, stage);
        const k2r = v2.clone();
        const k2v = a2;
        
        // k3
        const r3 = r0.clone().addScaledVector(k2r, h * 0.5);
        const v3 = v0.clone().addScaledVector(k2v, h * 0.5);
        const a3 = computeTotalAcceleration(r3, v3, mass, thrustOn, throttle, angle, ap, stage);
        const k3r = v3.clone();
        const k3v = a3;
        
        // k4
        const r4 = r0.clone().addScaledVector(k3r, h);
        const v4 = v0.clone().addScaledVector(k3v, h);
        const a4 = computeTotalAcceleration(r4, v4, mass, thrustOn, throttle, angle, ap, stage);
        const k4r = v4.clone();
        const k4v = a4;
        
        // Weighted sum: y_{n+1} = y_n + (h/6)(k1 + 2k2 + 2k3 + k4)
        sim.pos.addScaledVector(k1r, h / 6);
        sim.pos.addScaledVector(k2r, h / 3);
        sim.pos.addScaledVector(k3r, h / 3);
        sim.pos.addScaledVector(k4r, h / 6);
        
        sim.vel.addScaledVector(k1v, h / 6);
        sim.vel.addScaledVector(k2v, h / 3);
        sim.vel.addScaledVector(k3v, h / 3);
        sim.vel.addScaledVector(k4v, h / 6);
        
        // Fuel consumption: dm/dt = -T / (g₀·Isp) (GMAT FiniteBurn)
        if (thrustOn && throttle > 0 && sim.fuel > 0) {
            const spec = STAGES[stage];
            const fuelRate = (spec.thrust * throttle / 100) / (G0 * spec.isp);
            sim.fuel = Math.max(0, sim.fuel - fuelRate * h);
        }
        
        sim.met += h;
        
        // Crash detection
        const newAlt = sim.pos.length() - RADIUS_EARTH;
        if (newAlt < -500 && sim.isIgnited) {
            triggerCrash("The spacecraft re-entered the atmosphere and was destroyed.");
            return;
        }
    }
    
    // Update downrange relative to the rotating launch pad
    const currentLon = Math.atan2(sim.pos.y, sim.pos.x);
    const padLon = sim.launchLon + OMEGA_EARTH * sim.met;
    let dLon = currentLon - padLon;
    // Normalize dLon to [-PI, PI]
    dLon = Math.atan2(Math.sin(dLon), Math.cos(dLon));
    sim.downrange = Math.abs(dLon) * RADIUS_EARTH;
    
    // Propagate target if in rendezvous phase
    if (sim.phase === "rendezvous") {
        propagateTarget(warpDt);
    }
}

/**
 * Propagate rendezvous target (space station) using simple Keplerian motion
 */
function propagateTarget(dt) {
    const maxSubStep = 5.0;
    const numSteps = Math.ceil(dt / maxSubStep);
    const h = dt / numSteps;
    
    for (let i = 0; i < numSteps; i++) {
        const r0 = sim.targetPos.clone();
        const v0 = sim.targetVel.clone();
        
        const a1 = pointMassGravity(r0).add(j2Perturbation(r0));
        const k1r = v0.clone();
        
        const r2 = r0.clone().addScaledVector(k1r, h * 0.5);
        const v2 = v0.clone().addScaledVector(a1, h * 0.5);
        const a2 = pointMassGravity(r2).add(j2Perturbation(r2));
        
        const r3 = r0.clone().addScaledVector(v2, h * 0.5);
        const v3 = v0.clone().addScaledVector(a2, h * 0.5);
        const a3 = pointMassGravity(r3).add(j2Perturbation(r3));
        
        const r4 = r0.clone().addScaledVector(v3, h);
        const v4 = v0.clone().addScaledVector(a3, h);
        const a4 = pointMassGravity(r4).add(j2Perturbation(r4));
        
        sim.targetPos.addScaledVector(k1r, h / 6).addScaledVector(v2, h / 3).addScaledVector(v3, h / 3).addScaledVector(v4, h / 6);
        sim.targetVel.addScaledVector(a1, h / 6).addScaledVector(a2, h / 3).addScaledVector(a3, h / 3).addScaledVector(a4, h / 6);
    }
}

// ==========================================================================
//  SECTION 6: THREE.JS SCENE
// ==========================================================================
let scene, camera, renderer, controls;
let earthMesh, shipMesh, shipGlow, targetMesh;
let orbitTrail, targetTrail, predictedTrail;
let atmosMesh;

// Launch environment objects
let launchGroup, groundPlane, exhaustFlame;
let altitudeLabels = [];

// Demo mission state
let demoActive = false;
let demoTimers = [];
let demoStepIndex = 0;

// View mode: "launch" = local ground-level view, "orbital" = planetary view
let viewMode = "launch";
const VIEW_TRANSITION_ALT = 120000; // Switch views at 120 km
const LAUNCH_SCALE = 0.5;  // 1 unit = 2 km altitude (100km = 50 units)
const SHIP_SCALE_LAUNCH = 0.15; // Rocket size in launch view (small, proportional)
const SHIP_SCALE_ORBITAL = 0.15; // Rocket size in orbital view (was 0.5, reduced to avoid Earth overlap)

// Camera mode: "track" = auto-follow rocket, "free" = user-controlled orbit
const camState = {
    mode: "track"  // "track" or "free"
};

function initThreeJS() {
    const container = document.getElementById("webgl-container");
    if (!container) return;
    
    scene = new THREE.Scene();
    
    // Camera
    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 50000);
    camera.position.set(0, -200, 100);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    
    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.5;
    controls.maxDistance = 5000;
    
    // Detect user manual camera interaction — auto-switch to FREE mode
    controls.addEventListener('start', () => {
        if (camState.mode === "track") {
            setCameraMode("free");
        }
    });
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x334466, 0.6);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(200, 100, 150);
    scene.add(sunLight);
    
    // Earth (orbital view)
    buildEarth();
    
    // Spacecraft
    buildSpacecraft();
    
    // Target (space station for rendezvous)
    buildTarget();
    
    // Launch environment (ground view)
    buildLaunchEnvironment();
    
    // Orbit trails
    const trailMat = new THREE.LineBasicMaterial({ color: 0x125DFF, transparent: true, opacity: 0.7 });
    const trailGeom = new THREE.BufferGeometry();
    trailGeom.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
    orbitTrail = new THREE.Line(trailGeom, trailMat);
    scene.add(orbitTrail);
    
    const targetTrailMat = new THREE.LineBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.4 });
    const targetTrailGeom = new THREE.BufferGeometry();
    targetTrailGeom.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
    targetTrail = new THREE.Line(targetTrailGeom, targetTrailMat);
    scene.add(targetTrail);
    
    // Atmosphere glow (orbital view)
    const atmosGeom = new THREE.SphereGeometry(RADIUS_EARTH * VIEW_SCALE * 1.02, 64, 64);
    const atmosMaterial = new THREE.MeshBasicMaterial({
        color: 0x4488ff, transparent: true, opacity: 0.08, side: THREE.BackSide
    });
    atmosMesh = new THREE.Mesh(atmosGeom, atmosMaterial);
    scene.add(atmosMesh);
    
    // Predicted trajectory line
    const predMat = new THREE.LineDashedMaterial({
        color: 0x44ff88, transparent: true, opacity: 0.5,
        dashSize: 2, gapSize: 1
    });
    const predGeom = new THREE.BufferGeometry();
    predGeom.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
    predictedTrail = new THREE.Line(predGeom, predMat);
    predictedTrail.computeLineDistances();
    scene.add(predictedTrail);
    
    // Resize handler
    window.addEventListener("resize", () => {
        const w = container.clientWidth, h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}

function buildEarth() {
    const radius = RADIUS_EARTH * VIEW_SCALE;
    const geom = new THREE.SphereGeometry(radius, 64, 64);
    
    // Procedural Earth texture
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    
    // Deep ocean base
    ctx.fillStyle = "#0a1628";
    ctx.fillRect(0, 0, 512, 256);
    
    // Continents (simplified)
    ctx.fillStyle = "#1a3a2a";
    // Africa
    ctx.beginPath();
    ctx.ellipse(280, 128, 30, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eurasia
    ctx.beginPath();
    ctx.ellipse(310, 80, 80, 25, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Americas
    ctx.beginPath();
    ctx.ellipse(130, 90, 20, 45, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(140, 150, 25, 35, -0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Grid lines (longitude/latitude)
    ctx.strokeStyle = "rgba(18, 93, 255, 0.12)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 512; i += 32) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
    }
    for (let i = 0; i < 256; i += 32) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }
    
    // City lights glow
    ctx.fillStyle = "rgba(255, 200, 80, 0.3)";
    const cities = [[280, 110], [300, 85], [350, 75], [130, 95], [145, 135], [380, 100], [420, 90]];
    cities.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshPhongMaterial({ map: texture, shininess: 15 });
    earthMesh = new THREE.Mesh(geom, mat);
    scene.add(earthMesh);
}

function buildSpacecraft() {
    // Rocket body (cone + cylinder)
    const group = new THREE.Group();
    
    const noseCone = new THREE.ConeGeometry(1.5, 4, 8);
    const noseMat = new THREE.MeshPhongMaterial({ color: 0xdddddd, emissive: 0x222222 });
    const noseMesh = new THREE.Mesh(noseCone, noseMat);
    noseMesh.position.y = 3;
    group.add(noseMesh);
    
    const bodyGeom = new THREE.CylinderGeometry(1.5, 1.8, 5, 8);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, emissive: 0x111111 });
    const bodyMeshPart = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMeshPart.position.y = -0.5;
    group.add(bodyMeshPart);
    
    // Engine nozzle
    const nozzleGeom = new THREE.ConeGeometry(2, 2, 8, 1, true);
    const nozzleMat = new THREE.MeshPhongMaterial({ color: 0x666666, side: THREE.DoubleSide });
    const nozzleMesh = new THREE.Mesh(nozzleGeom, nozzleMat);
    nozzleMesh.position.y = -4;
    group.add(nozzleMesh);
    
    // Scale up for visibility
    group.scale.set(0.5, 0.5, 0.5);
    
    shipMesh = group;
    scene.add(shipMesh);
    
    // Engine glow (point light)
    shipGlow = new THREE.PointLight(0xff6622, 0, 20);
    shipMesh.add(shipGlow);
}

function buildLaunchEnvironment() {
    launchGroup = new THREE.Group();
    
    // --- Ground Plane ---
    const groundGeom = new THREE.PlaneGeometry(400, 400, 40, 40);
    const groundMat = new THREE.MeshPhongMaterial({
        color: 0x0d1a0d, emissive: 0x050a05,
        flatShading: true
    });
    // Subtle terrain variation
    const posAttr = groundGeom.getAttribute('position');
    for (let i = 0; i < posAttr.count; i++) {
        posAttr.setZ(i, (Math.random() - 0.5) * 0.3);
    }
    posAttr.needsUpdate = true;
    groundGeom.computeVertexNormals();
    groundPlane = new THREE.Mesh(groundGeom, groundMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.05;
    launchGroup.add(groundPlane);
    
    // --- Grid overlay on ground ---
    const gridHelper = new THREE.GridHelper(400, 80, 0x125DFF, 0x0a1830);
    gridHelper.position.y = 0;
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    launchGroup.add(gridHelper);
    
    // --- Launch Pad ---
    const padGeom = new THREE.CylinderGeometry(0.3, 0.4, 0.05, 16);
    const padMat = new THREE.MeshPhongMaterial({ color: 0x444444, emissive: 0x111111 });
    const pad = new THREE.Mesh(padGeom, padMat);
    pad.position.y = 0.025;
    launchGroup.add(pad);
    
    // --- Launch Tower ---
    const towerGeom = new THREE.BoxGeometry(0.06, 1.6, 0.06);
    const towerMat = new THREE.MeshPhongMaterial({ color: 0x888888, emissive: 0x222222 });
    const tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(-0.4, 0.8, 0);
    launchGroup.add(tower);
    // Tower arm
    const armGeom = new THREE.BoxGeometry(0.3, 0.03, 0.03);
    const arm = new THREE.Mesh(armGeom, towerMat);
    arm.position.set(-0.25, 1.2, 0);
    launchGroup.add(arm);
    
    // --- Altitude Markers (horizontal lines at key altitudes) ---
    const markerAlts = [10, 25, 50, 100]; // km
    const markerMat = new THREE.LineBasicMaterial({ color: 0x125DFF, transparent: true, opacity: 0.25 });
    markerAlts.forEach(altKm => {
        const y = altKm * LAUNCH_SCALE;
        const points = [
            new THREE.Vector3(-100, y, 0),
            new THREE.Vector3(100, y, 0)
        ];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeom, markerMat);
        launchGroup.add(line);
    });
    
    // --- Exhaust Flame (attached to rocket, only visible in launch view) ---
    const flameGeom = new THREE.ConeGeometry(1.2, 5, 8);
    const flameMat = new THREE.MeshBasicMaterial({
        color: 0xff6622, transparent: true, opacity: 0.8
    });
    exhaustFlame = new THREE.Mesh(flameGeom, flameMat);
    exhaustFlame.rotation.x = Math.PI; // Point downward
    exhaustFlame.visible = false;
    // Will be positioned relative to shipMesh each frame
    launchGroup.add(exhaustFlame);
    
    // --- Atmosphere color gradient (vertical fog-like planes) ---
    const skyGeom = new THREE.PlaneGeometry(400, 200);
    const skyMat = new THREE.MeshBasicMaterial({
        color: 0x0a1628,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const skyPlane = new THREE.Mesh(skyGeom, skyMat);
    skyPlane.position.set(0, 100, -50);
    launchGroup.add(skyPlane);
    
    scene.add(launchGroup);
}

function buildTarget() {
    // Simple station representation
    const group = new THREE.Group();
    
    const coreGeom = new THREE.CylinderGeometry(0.8, 0.8, 4, 8);
    const coreMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, emissive: 0x333333 });
    group.add(new THREE.Mesh(coreGeom, coreMat));
    
    // Solar panels
    const panelGeom = new THREE.BoxGeometry(8, 0.1, 2);
    const panelMat = new THREE.MeshPhongMaterial({ color: 0x2244aa, emissive: 0x112244 });
    group.add(new THREE.Mesh(panelGeom, panelMat));
    
    group.scale.set(0.4, 0.4, 0.4);
    group.visible = false;
    
    targetMesh = group;
    scene.add(targetMesh);
}

// ==========================================================================
//  SECTION 7: NAVBALL RENDERER
// ==========================================================================
let navballCtx;

function initNavball() {
    const canvas = document.getElementById("navCanvas");
    if (!canvas) return;
    navballCtx = canvas.getContext("2d");
}

function drawNavball() {
    if (!navballCtx) return;
    const ctx = navballCtx;
    const w = 130, h = 130, cx = w / 2, cy = h / 2, r = 58;
    
    ctx.clearRect(0, 0, w, h);
    
    // Background circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#0a1628";
    ctx.fill();
    ctx.strokeStyle = "rgba(18, 93, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Horizon line (based on pitch)
    const alt = sim.pos.length() - RADIUS_EARTH;
    const speed = sim.vel.length();
    const up = sim.pos.clone().normalize();
    const velNorm = speed > 1 ? sim.vel.clone().normalize() : up.clone();
    const pitchAngle = Math.asin(Math.max(-1, Math.min(1, up.dot(velNorm))));
    
    // Sky (blue) / ground (brown) split
    const horizonY = cy - Math.sin(pitchAngle) * r * 0.8;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctx.clip();
    
    // Sky
    ctx.fillStyle = "#0b1e3d";
    ctx.fillRect(0, 0, w, horizonY);
    // Ground
    ctx.fillStyle = "#2a1a0a";
    ctx.fillRect(0, horizonY, w, h);
    
    // Horizon line
    ctx.strokeStyle = "#00d4ff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - r, horizonY);
    ctx.lineTo(cx + r, horizonY);
    ctx.stroke();
    
    // Pitch ladder
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 0.5;
    for (let deg = -60; deg <= 60; deg += 15) {
        if (deg === 0) continue;
        const py = horizonY - deg * r / 90;
        if (py > cy - r + 5 && py < cy + r - 5) {
            ctx.beginPath();
            ctx.moveTo(cx - 15, py);
            ctx.lineTo(cx + 15, py);
            ctx.stroke();
        }
    }
    
    ctx.restore();
    
    // Center reticle
    ctx.strokeStyle = "#ffaa00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy);
    ctx.lineTo(cx - 4, cy);
    ctx.moveTo(cx + 4, cy);
    ctx.lineTo(cx + 12, cy);
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx, cy + 10);
    ctx.stroke();
    
    // Prograde marker (if moving)
    if (speed > 10) {
        const proY = cy - pitchAngle * r / (Math.PI / 2) * 0.8;
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, Math.max(cy - r + 8, Math.min(cy + r - 8, proY)), 6, 0, Math.PI * 2);
        ctx.stroke();
        // Cross hair
        ctx.beginPath();
        ctx.moveTo(cx, proY - 9);
        ctx.lineTo(cx, proY - 6);
        ctx.moveTo(cx - 9, proY);
        ctx.lineTo(cx - 6, proY);
        ctx.moveTo(cx + 6, proY);
        ctx.lineTo(cx + 9, proY);
        ctx.stroke();
    }
}

// ==========================================================================
//  SECTION 8: CHART.JS TELEMETRY
// ==========================================================================
let telemetryChart;

function initChart() {
    const ctx = document.getElementById("telemetryChart");
    if (!ctx) return;
    
    telemetryChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Altitude (km)",
                    data: [],
                    borderColor: "#125DFF",
                    backgroundColor: "rgba(18, 93, 255, 0.1)",
                    borderWidth: 1.5,
                    pointRadius: 0,
                    fill: true,
                    yAxisID: "y"
                },
                {
                    label: "Velocity (m/s)",
                    data: [],
                    borderColor: "#00d4ff",
                    borderWidth: 1.5,
                    pointRadius: 0,
                    fill: false,
                    yAxisID: "y1"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: {
                    labels: { color: "#C4C4C4", font: { size: 10, family: "Space Grotesk" } }
                }
            },
            scales: {
                x: {
                    display: true,
                    ticks: { color: "#666", maxTicksLimit: 6, font: { size: 9 } },
                    grid: { color: "rgba(255,255,255,0.04)" },
                    title: { display: true, text: "MET (s)", color: "#888", font: { size: 9 } }
                },
                y: {
                    type: "linear",
                    position: "left",
                    ticks: { color: "#125DFF", font: { size: 9 } },
                    grid: { color: "rgba(18,93,255,0.06)" },
                    title: { display: true, text: "Alt (km)", color: "#125DFF", font: { size: 9 } }
                },
                y1: {
                    type: "linear",
                    position: "right",
                    ticks: { color: "#00d4ff", font: { size: 9 } },
                    grid: { display: false },
                    title: { display: true, text: "Vel (m/s)", color: "#00d4ff", font: { size: 9 } }
                }
            }
        }
    });
}

function updateChart(alt, speed) {
    if (!telemetryChart) return;
    const t = Math.round(sim.met);
    
    // Throttle data points to prevent performance issues
    const data = telemetryChart.data;
    if (data.labels.length > 0 && t - data.labels[data.labels.length - 1] < 2) return;
    
    data.labels.push(t);
    data.datasets[0].data.push((alt / 1000).toFixed(1));
    data.datasets[1].data.push(Math.round(speed));
    
    // Keep max 300 data points
    if (data.labels.length > 300) {
        data.labels.shift();
        data.datasets[0].data.shift();
        data.datasets[1].data.shift();
    }
    
    telemetryChart.update("none");
}

// ==========================================================================
//  SECTION 9: KEPLERIAN ELEMENT COMPUTATION (Full GMAT StateConversionUtil method)
// ==========================================================================

function computeKeplerianElements(pos, vel) {
    const r = pos.length();
    const v = vel.length();
    
    if (r < 100) return { sma: 0, ecc: 0, inc: 0, ap: 0, pe: 0 };
    
    // Specific orbital energy: ε = v²/2 - μ/r
    const energy = 0.5 * v * v - MU_EARTH / r;
    
    // Semi-major axis: a = -μ/(2ε)
    const sma = energy < 0 ? -MU_EARTH / (2 * energy) : Infinity;
    
    // Angular momentum: h = r × v
    const h = new THREE.Vector3().crossVectors(pos, vel);
    const hMag = h.length();
    
    // Eccentricity vector: e = (v × h)/μ - r̂
    const eVec = new THREE.Vector3().crossVectors(vel, h).divideScalar(MU_EARTH).sub(pos.clone().divideScalar(r));
    const ecc = eVec.length();
    
    // Inclination: i = acos(h_z / |h|)
    const inc = Math.acos(Math.max(-1, Math.min(1, h.z / hMag))) * 180 / Math.PI;
    
    // Apoapsis and Periapsis altitudes
    let ap, pe;
    if (sma === Infinity || ecc >= 1) {
        ap = Infinity;
        pe = (hMag * hMag / MU_EARTH) / (1 + ecc) - RADIUS_EARTH;
    } else {
        ap = sma * (1 + ecc) - RADIUS_EARTH;
        pe = sma * (1 - ecc) - RADIUS_EARTH;
    }
    
    return { sma, ecc, inc, ap, pe, hMag };
}

// ==========================================================================
//  SECTION 10: HUD & TELEMETRY DISPLAY
// ==========================================================================

function updateHUD(alt, speed) {
    const setEl = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };
    
    setEl("hud-time", "T+ " + formatMET(sim.met));
    setEl("hud-alt", (alt / 1000).toFixed(2) + " km");
    setEl("hud-vel", Math.round(speed).toLocaleString() + " m/s");
    setEl("hud-downrange", (sim.downrange / 1000).toFixed(1) + " km");
    
    // Dynamic pressure: q = ½ρv²
    const rho = alt < 300000 ? RHO0 * Math.exp(-alt / ATM_SCALE_H) : 0;
    const vRel = sim.vel.clone();
    vRel.x += OMEGA_EARTH * sim.pos.y;
    vRel.y -= OMEGA_EARTH * sim.pos.x;
    const q = 0.5 * rho * vRel.lengthSq() / 1000; // kPa
    setEl("hud-dynpres", q.toFixed(2) + " kPa");
}

function updateTelemetry(elements, alt, speed) {
    const setEl = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };
    
    setEl("tel-alt", (alt / 1000).toFixed(2) + " km");
    setEl("tel-vel", Math.round(speed).toLocaleString() + " m/s");
    
    if (elements.sma !== Infinity && elements.ecc < 1) {
        setEl("tel-ap", Math.max(0, Math.round(elements.ap / 1000)).toLocaleString() + " km");
        setEl("tel-pe", Math.round(elements.pe / 1000).toLocaleString() + " km");
        setEl("tel-ecc", elements.ecc.toFixed(5));
        setEl("tel-inc", elements.inc.toFixed(2) + "°");
    } else if (elements.ecc >= 1) {
        setEl("tel-ap", "ESCAPE");
        setEl("tel-pe", Math.round(elements.pe / 1000).toLocaleString() + " km");
        setEl("tel-ecc", elements.ecc.toFixed(5));
        setEl("tel-inc", elements.inc.toFixed(2) + "°");
    } else {
        setEl("tel-ap", "-- km");
        setEl("tel-pe", "-- km");
        setEl("tel-ecc", "--");
        setEl("tel-inc", "--°");
    }
    
    // Propulsion
    const spec = STAGES[sim.stage];
    const fuelPct = (sim.fuel / spec.fuelMass) * 100;
    setEl("lbl-fuel-pct", fuelPct.toFixed(1) + "%");
    setEl("txt-thrust", sim.isIgnited ? ((spec.thrust * sim.throttle / 100) / 1000).toFixed(1) + " kN" : "0 kN");
    setEl("txt-isp", spec.isp + " s");
    setEl("txt-mass", Math.round(getTotalMass()).toLocaleString() + " kg");
    
    // Fuel bar
    const fuelFill = document.getElementById("fuel-bar-fill");
    if (fuelFill) {
        fuelFill.style.width = fuelPct + "%";
        fuelFill.classList.remove("warning", "critical");
        if (fuelPct < 10) fuelFill.classList.add("critical");
        else if (fuelPct < 25) fuelFill.classList.add("warning");
    }
    
    // Rendezvous panel
    const rvPanel = document.getElementById("rendezvous-panel");
    if (rvPanel) {
        if (sim.phase === "rendezvous") {
            rvPanel.style.display = "block";
            const dist = sim.targetPos.clone().sub(sim.pos).length();
            const relVel = sim.targetVel.clone().sub(sim.vel).length();
            setEl("tel-rel-dist", (dist / 1000).toFixed(2) + " km");
            setEl("tel-rel-vel", relVel.toFixed(1) + " m/s");
        } else {
            rvPanel.style.display = "none";
        }
    }
}

// ==========================================================================
//  SECTION 11: FLIGHT DIRECTOR / GUIDANCE STATE MACHINE
// ==========================================================================

function updateFlightDirector(alt, speed, elements) {
    let title = "";
    let instruction = "";
    let progress = 0;
    let statusText = "ACTIVE";
    let statusClass = "status-active";
    
    const { ap, pe, ecc, inc } = elements;
    
    if (sim.phase === "launch") {
        if (!sim.isIgnited) {
            title = "1. Initiate Launch Sequence";
            instruction = "Slide Throttle to 100% and press STAGE IGNITION to begin the countdown.";
            progress = 0;
            statusText = "PRE-FLIGHT";
            statusClass = "status-preflight";
        } else if (alt < 15000) {
            title = "2. Clear the Lower Atmosphere";
            instruction = "Ascend straight up. Maintain full throttle until altitude exceeds 15 km.";
            progress = 15;
        } else if (alt < 80000 && sim.steeringAngle > 45) {
            title = "3. Begin Gravity Turn";
            instruction = "Slowly reduce the Pitch slider toward 45° to build horizontal velocity. This is your gravity turn!";
            progress = 30;
        } else if (sim.stage === 1 && sim.fuel < 200) {
            title = "4. Stage Separation";
            instruction = "Booster fuel is critical! Press STAGE IGNITION to decouple the booster and ignite Stage 2.";
            progress = 50;
        } else if (ap < 200000) {
            title = "5. Raise Apoapsis";
            instruction = "Continue burning Stage 2 to raise your Apoapsis (Ap) above 200 km. Current: " + Math.round(ap / 1000) + " km.";
            progress = 65;
        } else if (ap >= 200000 && pe < 180000) {
            title = "6. Circularize Orbit";
            instruction = "Cut throttle and coast to Apoapsis. Then steer PROGRADE (use autopilot) and burn to raise Periapsis above 180 km.";
            progress = 85;
        } else {
            title = "7. Stable Orbit Achieved ✓";
            instruction = "Congratulations! You are in a stable Low Earth Orbit. Pe: " + Math.round(pe / 1000) + " km, Ap: " + Math.round(ap / 1000) + " km.";
            progress = 100;
            statusText = "MISSION COMPLETE";
        }
        
        if (progress === 100 && !sim.successTriggered) {
            sim.successTriggered = true;
            triggerSuccess("Launch Complete", "You have successfully launched the spacecraft into a stable Low Earth Orbit!");
        }
        
    } else if (sim.phase === "hohmann") {
        const targetAp = 500; // km
        const apKm = ap / 1000;
        const peKm = pe / 1000;
        
        if (apKm < targetAp - 20) {
            title = "1. First Transfer Burn (Raise Apoapsis)";
            instruction = "Steer PROGRADE and burn to raise Apoapsis to ~" + targetAp + " km. Current Ap: " + Math.round(apKm) + " km.";
            progress = 10;
        } else if (apKm >= targetAp - 20 && peKm < targetAp - 20) {
            title = "2. Coast to Apoapsis";
            instruction = "Cut throttle! Use TIME WARP to coast to Apoapsis. Then steer PROGRADE and burn to raise Periapsis to " + targetAp + " km.";
            progress = 50;
        } else {
            title = "3. Target Orbit Achieved ✓";
            instruction = "Hohmann transfer complete! Orbit: " + Math.round(peKm) + " × " + Math.round(apKm) + " km, e = " + ecc.toFixed(4);
            progress = 100;
            statusText = "MISSION COMPLETE";
        }
        
        if (progress === 100 && !sim.successTriggered) {
            sim.successTriggered = true;
            triggerSuccess("Transfer Successful", "You have executed a 2-burn Hohmann transfer to raise your orbit from 200 km to 500 km!");
        }
        
    } else if (sim.phase === "rendezvous") {
        const dist = sim.targetPos.clone().sub(sim.pos).length();
        const relVel = sim.targetVel.clone().sub(sim.vel).length();
        
        if (dist > 20000) {
            title = "1. Intercept Phase";
            instruction = "You are in a lower, faster orbit catching up to the station. Use TIME WARP and wait until distance < 20 km.";
            progress = 10;
        } else if (relVel > 15.0) {
            title = "2. Match Velocities";
            instruction = "Steer RETROGRADE and burn to kill relative velocity. Target: < 15 m/s. Current: " + relVel.toFixed(1) + " m/s.";
            progress = 40;
        } else if (dist > 200 || relVel > 2.0) {
            title = "3. Proximity Approach";
            instruction = "Use TARGET autopilot. Tap throttle gently to close distance to < 200m at < 2 m/s. Distance: " + (dist / 1000).toFixed(2) + " km.";
            progress = 70;
        } else if (dist > 50 || relVel > 0.5) {
            title = "4. Final Docking Approach";
            instruction = "Almost there! Close to < 50m at < 0.5 m/s for successful docking. Distance: " + dist.toFixed(0) + " m.";
            progress = 90;
        } else {
            title = "5. Docking Complete ✓";
            instruction = "Crew has entered the ESSS Space Station. Outstanding piloting!";
            progress = 100;
            statusText = "MISSION COMPLETE";
        }
        
        if (progress === 100 && !sim.successTriggered) {
            sim.successTriggered = true;
            triggerSuccess("Rendezvous Achieved", "Incredible piloting! You matched orbits and docked successfully with the Space Station!");
        }
    }
    
    // Update DOM
    const setEl = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };
    setEl("director-title", title);
    setEl("director-instruction", instruction);
    
    const progressFill = document.getElementById("director-progress-fill");
    if (progressFill) progressFill.style.width = progress + "%";
    
    const statusEl = document.getElementById("mission-status");
    if (statusEl) {
        statusEl.innerText = statusText;
        statusEl.className = "status-indicator " + statusClass;
    }
}

// ==========================================================================
//  SECTION 12: MISSION RESET & PHASE TRANSITIONS
// ==========================================================================

function resetSimulation(phase) {
    sim.phase = phase || "launch";
    sim.met = 0;
    sim.isPaused = true;
    sim.isIgnited = false;
    sim.throttle = 0;
    sim.steeringAngle = 90;
    sim.autopilot = "manual";
    sim.successTriggered = false;
    sim.successTriggered = false;
    sim.crashTriggered = false;
    sim.timeWarp = 1;
    sim.trailPoints = [];
    sim.targetTrailPoints = [];
    sim.downrange = 0;
    sim.chartData = { alt: [], vel: [], time: [] };
    
    // Reset chart
    if (telemetryChart) {
        telemetryChart.data.labels = [];
        telemetryChart.data.datasets[0].data = [];
        telemetryChart.data.datasets[1].data = [];
        telemetryChart.update("none");
    }
    
    // Reset trail geometries
    if (orbitTrail) {
        orbitTrail.geometry.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
    }
    if (targetTrail) {
        targetTrail.geometry.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
    }
    
    // Hide modals
    hideEl("mission-complete-overlay");
    hideEl("crash-overlay");
    
    if (phase === "launch") {
        sim.stage = 1;
        sim.fuel = STAGES[1].fuelMass;
        
        // Spawn on pad at Addis Ababa
        const lat = sim.launchLat;
        const lon = sim.launchLon;
        const r = RADIUS_EARTH + 10;
        sim.pos.set(
            r * Math.cos(lat) * Math.cos(lon),
            r * Math.cos(lat) * Math.sin(lon),
            r * Math.sin(lat)
        );
        // Surface velocity from Earth rotation
        sim.vel.set(-OMEGA_EARTH * sim.pos.y, OMEGA_EARTH * sim.pos.x, 0);
        
        // Launch starts in ground view
        setViewMode("launch");
        
    } else if (phase === "hohmann") {
        sim.stage = 2;
        sim.fuel = STAGES[2].fuelMass;
        
        // Start in 200 km circular orbit
        const orbR = RADIUS_EARTH + 200000;
        const orbV = Math.sqrt(MU_EARTH / orbR);
        sim.pos.set(orbR, 0, 0);
        sim.vel.set(0, orbV, 0);
        
        // Orbital phases start in orbital view
        setViewMode("orbital");
        
    } else if (phase === "rendezvous") {
        sim.stage = 2;
        sim.fuel = STAGES[2].fuelMass * 0.8;
        
        // Spacecraft in 350 km orbit
        const scR = RADIUS_EARTH + 350000;
        const scV = Math.sqrt(MU_EARTH / scR);
        sim.pos.set(scR, 0, 0);
        sim.vel.set(0, scV, 0);
        
        // Target station in 400 km orbit, ~80 km ahead
        const tgR = RADIUS_EARTH + 400000;
        const tgV = Math.sqrt(MU_EARTH / tgR);
        const tgAngle = 0.1; // radians ahead
        sim.targetPos.set(tgR * Math.cos(tgAngle), tgR * Math.sin(tgAngle), 0);
        sim.targetVel.set(-tgV * Math.sin(tgAngle), tgV * Math.cos(tgAngle), 0);
        
        // Orbital phases start in orbital view
        setViewMode("orbital");
    }
    
    // Reset UI controls
    const resetSlider = (id, val, lblId, lblText) => {
        const s = document.getElementById(id);
        if (s) s.value = val;
        const l = document.getElementById(lblId);
        if (l) l.innerText = lblText;
    };
    
    resetSlider("slider-throttle", 0, "lbl-throttle", "0%");
    resetSlider("slider-pitch", 90, "lbl-pitch", "90.0°");
    resetSlider("slider-warp", 1, "lbl-warp", "1x");
    
    const pauseBtn = document.getElementById("btn-pause");
    if (pauseBtn) pauseBtn.innerHTML = "▶ RESUME";
    
    const pitchSlider = document.getElementById("slider-pitch");
    if (pitchSlider) pitchSlider.disabled = false;
    
    // Reset autopilot buttons
    document.querySelectorAll(".ap-btn").forEach(b => b.classList.remove("active"));
    const manBtn = document.getElementById("ap-manual");
    if (manBtn) manBtn.classList.add("active");
    
    // Reset camera for phase
    camState.mode = "track";
    updateCamModeButtons();
    if (camera && controls) {
        setCameraForPhase(phase);
    }
    
    // Update education card for phase
    updateEduCard();
}

function triggerCrash(message) {
    sim.crashTriggered = true;
    sim.isPaused = true;
    if (demoActive) stopDemo();
    const desc = document.getElementById("crash-desc");
    if (desc) desc.innerText = message || "The spacecraft has been destroyed.";
    showEl("crash-overlay");
}

function triggerSuccess(title, description) {
    const setEl = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };
    setEl("mc-title", title);
    setEl("mc-desc", description);
    showEl("mission-complete-overlay");
}

function showEl(id) { const el = document.getElementById(id); if (el) el.style.display = "flex"; }
function hideEl(id) { const el = document.getElementById(id); if (el) el.style.display = "none"; }

function updateEduCard() {
    const setEl = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };
    
    if (sim.phase === "launch") {
        setEl("edu-title", "🎓 Rocket Launch Physics");
        setEl("edu-text", "To reach orbit, a rocket must achieve ~7.8 km/s horizontal velocity at altitude. The gravity turn gradually pitches the trajectory from vertical to horizontal, converting thrust into orbital velocity while minimizing atmospheric drag losses. This simulator uses a Runge-Kutta 4 integrator with J2 perturbation from NASA's GMAT.");
    } else if (sim.phase === "hohmann") {
        setEl("edu-title", "🎓 Hohmann Transfer Orbit");
        setEl("edu-text", "A Hohmann transfer is the most fuel-efficient two-impulse maneuver to move between circular orbits. The first burn at periapsis raises the apoapsis to the target altitude. After coasting half an orbit, a second burn at apoapsis circularizes the orbit. Total Δv ≈ √(μ/r₁)(√(2r₂/(r₁+r₂)) - 1) + √(μ/r₂)(1 - √(2r₁/(r₁+r₂))).");
    } else if (sim.phase === "rendezvous") {
        setEl("edu-title", "🎓 Orbital Rendezvous");
        setEl("edu-text", "Orbital rendezvous requires matching both position and velocity with a target. A spacecraft in a lower orbit moves faster (Kepler's 3rd law), allowing it to 'catch up' to a target in a higher orbit. The approach involves: phasing orbit → intercept burn → velocity matching → proximity operations → docking.");
    }
}

// ==========================================================================
//  SECTION 12B: VIEW MODE SYSTEM
// ==========================================================================

/**
 * Switch between launch view and orbital view.
 * Launch view: local frame with ground plane, rocket clearly visible.
 * Orbital view: Earth sphere with orbital paths.
 */
function setViewMode(mode) {
    viewMode = mode;
    
    const isLaunch = (mode === "launch");
    const isOrbital = (mode === "orbital");
    
    // Toggle scene objects
    if (earthMesh) earthMesh.visible = isOrbital;
    if (atmosMesh) atmosMesh.visible = isOrbital;
    if (launchGroup) launchGroup.visible = isLaunch;
    if (orbitTrail) orbitTrail.visible = isOrbital;
    if (targetTrail) targetTrail.visible = isOrbital;
    if (predictedTrail) predictedTrail.visible = isOrbital;
    if (targetMesh) targetMesh.visible = isOrbital && sim.phase === "rendezvous";
    
    // Ship scale
    if (shipMesh) {
        const s = isLaunch ? SHIP_SCALE_LAUNCH : SHIP_SCALE_ORBITAL;
        shipMesh.scale.set(s, s, s);
    }
    
    // Reset trail data on switch
    sim.trailPoints = [];
    if (orbitTrail) {
        orbitTrail.geometry.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
    }
}

/**
 * Set camera for the current view mode.
 */
function setCameraForPhase(phase) {
    if (viewMode === "launch") {
        // Side view of the rocket on the pad, closer in since the rocket is smaller
        camera.position.set(6, 1, 4.5);
        camera.fov = 50;
        camera.updateProjectionMatrix();
        controls.target.set(0, 1, 0);
        controls.update();
    } else {
        // Orbital view
        const shipPos3D = sim.pos.clone().multiplyScalar(VIEW_SCALE);
        camera.position.copy(shipPos3D).add(new THREE.Vector3(40, -80, 50));
        camera.fov = 50;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.update();
    }
}

/**
 * Per-frame camera update for the active view mode.
 */
function updateCinematicCamera(alt, dt) {
    if (!controls || !shipMesh || !camera) return;
    
    // In FREE mode, just update controls (no camera manipulation)
    if (camState.mode === "free") {
        controls.update();
        return;
    }
    
    const shipPos3D = shipMesh.position.clone();
    
    if (viewMode === "launch") {
        // ---- LAUNCH VIEW: side-tracking camera ----
        const altKm = alt / 1000;
        const rocketY = altKm * LAUNCH_SCALE;
        
        // Camera sits to the side, tracks upward with the rocket
        // Gradually pull out as altitude grows
        const pullback = Math.min(15, 6 + altKm * 0.05);
        const camHeight = Math.max(1, rocketY * 0.5);
        
        const desiredPos = new THREE.Vector3(pullback, camHeight, pullback * 0.6);
        const desiredTarget = new THREE.Vector3(0, rocketY, 0);
        
        camera.position.lerp(desiredPos, 0.04);
        controls.target.lerp(desiredTarget, 0.08);
        controls.update();
        
    } else {
        // ---- ORBITAL VIEW: rocket-centered camera ----
        const altKm = alt / 1000;
        // Camera stays close to the rocket, not Earth center
        const dist = Math.max(15, Math.min(60, 15 + altKm * 0.02));
        const viewDir = new THREE.Vector3(0.5, 0.3, 0.4).normalize();
        const desiredPos = shipPos3D.clone().addScaledVector(viewDir, dist);
        // Look at the rocket, not blended toward Earth
        const desiredTarget = shipPos3D.clone();
        
        camera.position.lerp(desiredPos, 0.03);
        controls.target.lerp(desiredTarget, 0.06);
        controls.update();
    }
}

// ==========================================================================
//  SECTION 12C: CAMERA MODE HELPERS
// ==========================================================================

function setCameraMode(mode) {
    camState.mode = mode;
    updateCamModeButtons();
    if (mode === "track") {
        setCameraForPhase(sim.phase);
    }
}

function updateCamModeButtons() {
    const trackBtn = document.getElementById("btn-cam-track");
    const freeBtn = document.getElementById("btn-cam-free");
    if (trackBtn) trackBtn.classList.toggle("active", camState.mode === "track");
    if (freeBtn) freeBtn.classList.toggle("active", camState.mode === "free");
}

// ==========================================================================
//  SECTION 12D: PREDICTED TRAJECTORY
// ==========================================================================

let predictionFrameCounter = 0;

/**
 * Propagate current state forward (coast only, no thrust) to draw predicted orbit.
 * Uses simplified 2-body + J2 with RK4 for efficiency.
 */
function computePredictedTrajectory() {
    if (!predictedTrail || viewMode === "launch") {
        if (predictedTrail) predictedTrail.visible = false;
        return;
    }
    
    predictedTrail.visible = true;
    
    // Clone current state
    let pos = sim.pos.clone();
    let vel = sim.vel.clone();
    
    const points = [];
    const steps = 400;
    const h = 20; // 20-second steps → ~2 hours of prediction
    
    for (let i = 0; i < steps; i++) {
        // RK4 step (gravity + J2 only, no thrust/drag)
        const k1v = pointMassGravity(pos).add(j2Perturbation(pos));
        const k1r = vel.clone();
        
        const p2 = pos.clone().addScaledVector(k1r, h/2);
        const v2 = vel.clone().addScaledVector(k1v, h/2);
        const k2v = pointMassGravity(p2).add(j2Perturbation(p2));
        const k2r = v2.clone();
        
        const p3 = pos.clone().addScaledVector(k2r, h/2);
        const v3 = vel.clone().addScaledVector(k2v, h/2);
        const k3v = pointMassGravity(p3).add(j2Perturbation(p3));
        const k3r = v3.clone();
        
        const p4 = pos.clone().addScaledVector(k3r, h);
        const v4 = vel.clone().addScaledVector(k3v, h);
        const k4v = pointMassGravity(p4).add(j2Perturbation(p4));
        const k4r = v4.clone();
        
        pos.addScaledVector(k1r, h/6).addScaledVector(k2r, h/3).addScaledVector(k3r, h/3).addScaledVector(k4r, h/6);
        vel.addScaledVector(k1v, h/6).addScaledVector(k2v, h/3).addScaledVector(k3v, h/3).addScaledVector(k4v, h/6);
        
        // Stop if impacted Earth
        if (pos.length() < RADIUS_EARTH) break;
        
        const p3d = pos.clone().multiplyScalar(VIEW_SCALE);
        points.push(p3d.x, p3d.y, p3d.z);
    }
    
    predictedTrail.geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    predictedTrail.geometry.attributes.position.needsUpdate = true;
    predictedTrail.computeLineDistances();
}

// ==========================================================================
//  SECTION 12E: CREW DRAGON DEMO MISSION
// ==========================================================================


let demoPhase = "launch"; // "launch", "circularizing", "hohmann", "rendezvous", "complete"
let demoStateFlags = {};

function runDemoMission() {
    // Stop any existing demo
    stopDemo();
    
    demoActive = true;
    demoPhase = "launch";
    demoStateFlags = {};
    
    // Show demo indicator
    showEl("demo-indicator");
    
    // Reset to launch
    resetSimulation("launch");
    sim.isPaused = false; // Must be unpaused so sim.met advances
    
    document.querySelectorAll(".mission-tab").forEach(t => t.classList.remove("active"));
    const launchBtn = document.getElementById("btn-mission-launch");
    if (launchBtn) launchBtn.classList.add("active");
    
    setCameraMode("track");
    
    // Start the dynamic monitoring loop attached to simulation elapsed time
    demoTimers.push(setInterval(() => {
        if (!demoActive) return;
        demoMonitor();
    }, 200)); // Check 5 times a second
}

function setSlider(id, val, lblId, lblText) {
    const sl = document.getElementById(id);
    if (sl && sl.value != val) { sl.value = val; sl.dispatchEvent(new Event("input")); }
    if (lblId) { const l = document.getElementById(lblId); if (l) l.innerText = lblText; }
}

function demoMonitor() {
    if (!demoActive) return;
    
    const alt = sim.pos.length() - RADIUS_EARTH;
    const elements = computeKeplerianElements(sim.pos, sim.vel);
    // Use the pre-computed ap/pe from elements (handles Infinity/suborbital correctly)
    const ap = isFinite(elements.ap) ? elements.ap : alt;
    const pe = isFinite(elements.pe) ? elements.pe : -RADIUS_EARTH;
    const stepEl = document.getElementById("demo-step");
    const t = sim.met; // Mission Elapsed Time drives the demo sequence
    
    if (demoPhase === "launch") {
        if (t < 2) {
            if (stepEl) stepEl.textContent = "Pre-flight: Initializing launch sequence...";
        } else if (t < 4) {
            if (stepEl) stepEl.textContent = "T-0: Main engine ignition — full throttle!";
            if (!demoStateFlags.throttled) {
                setSlider("slider-throttle", 100, "lbl-throttle", "100%");
                sim.throttle = 100;
                demoStateFlags.throttled = true;
            }
        } else if (t >= 4 && !demoStateFlags.liftoff) {
            demoStateFlags.liftoff = true;
            sim.isIgnited = true;
            sim.isPaused = false;
            const pauseBtn = document.getElementById("btn-pause");
            if (pauseBtn) pauseBtn.innerHTML = "⏸ PAUSE";
            const ignBtn = document.getElementById("btn-ignition");
            if (ignBtn) ignBtn.innerHTML = "🔥 STAGE " + sim.stage;
            updateEngineSound();
            if (stepEl) stepEl.textContent = "Liftoff! Crew Dragon is climbing...";
        }
        
        // Pitch program (gravity turn)
        if (t >= 8 && t < 15 && !demoStateFlags.p80) {
            demoStateFlags.p80 = true;
            sim.steeringAngle = 80;
            setSlider("slider-pitch", 80, "lbl-pitch", "80.0°");
            if (stepEl) stepEl.textContent = "Pitching to 80° — beginning gravity turn";
        } else if (t >= 15 && t < 25 && !demoStateFlags.p60) {
            demoStateFlags.p60 = true;
            sim.steeringAngle = 60;
            setSlider("slider-pitch", 60, "lbl-pitch", "60.0°");
            if (stepEl) stepEl.textContent = "Pitch 60° — clearing the dense atmosphere";
        } else if (t >= 25 && t < 40 && !demoStateFlags.p45) {
            demoStateFlags.p45 = true;
            sim.steeringAngle = 45;
            setSlider("slider-pitch", 45, "lbl-pitch", "45.0°");
            if (stepEl) stepEl.textContent = "Pitch 45° — gravity turn at Max-Q";
        } else if (t >= 40 && t < 60 && !demoStateFlags.p20) {
            demoStateFlags.p20 = true;
            sim.steeringAngle = 20;
            setSlider("slider-pitch", 20, "lbl-pitch", "20.0°");
            if (stepEl) stepEl.textContent = "Pitch 20° — building orbital velocity";
        } else if (t >= 60 && t < 80 && !demoStateFlags.p10) {
            demoStateFlags.p10 = true;
            sim.steeringAngle = 10;
            setSlider("slider-pitch", 10, "lbl-pitch", "10.0°");
            if (stepEl) stepEl.textContent = "Pitch 10° — orbital insertion burn";
        }
        
        // Stage separation when stage 1 fuel runs out
        if (sim.stage === 2 && !demoStateFlags.stage_sep) {
            demoStateFlags.stage_sep = true;
            const ign = document.getElementById("btn-ignition");
            if (ign) ign.innerHTML = "🔥 STAGE 2";
            if (stepEl) stepEl.textContent = "MECO! Stage separation — Stage 2 ignition";
        }
        
        // Wait for apoapsis > 180 km
        if (ap > 180000 && alt > 100000 && t > 10) {
            demoPhase = "circularizing";
            // Cut throttle, set prograde autopilot, coast to apoapsis
            sim.throttle = 0;
            sim.autopilot = "prograde";
            sim.timeWarp = 50;
            setSlider("slider-throttle", 0, "lbl-throttle", "0%");
            setSlider("slider-warp", 50, "lbl-warp", "50x");
            if (stepEl) stepEl.textContent = "Coasting to apoapsis for circularization...";
            
            // Disable manual pitch
            document.querySelectorAll(".ap-btn").forEach(b => b.classList.remove("active"));
            const proBtn = document.getElementById("ap-prograde");
            if (proBtn) proBtn.classList.add("active");
        }
    }
    
    if (demoPhase === "circularizing") {
        // Detect near-apoapsis by checking if altitude is close to apoapsis
        const radialVel = sim.vel.dot(sim.pos.clone().normalize());
        const nearApoapsis = Math.abs(radialVel) < 100; // radial velocity near zero = at apoapsis
        
        if (pe > 170000) {
            // Orbit is circular enough — move to Hohmann
            demoPhase = "hohmann_prep";
            sim.throttle = 0;
            sim.timeWarp = 1;
            setSlider("slider-throttle", 0, "lbl-throttle", "0%");
            setSlider("slider-warp", 1, "lbl-warp", "1x");
            if (stepEl) stepEl.textContent = "Stable orbit achieved! Transitioning to transfer...";
            
            demoTimers.push(setTimeout(() => {
                if (!demoActive) return;
                demoStartHohmann();
            }, 3000)); // 3 seconds real-time for UI reading
            
        } else if (nearApoapsis && sim.throttle < 50) {
            // Burn at apoapsis
            sim.throttle = 100;
            sim.timeWarp = 5;
            setSlider("slider-throttle", 100, "lbl-throttle", "100%");
            setSlider("slider-warp", 5, "lbl-warp", "5x");
            if (stepEl) stepEl.textContent = "Circularization burn at apoapsis...";
        } else if (!nearApoapsis && sim.throttle > 50) {
            // Cut off if we passed apoapsis and still haven't circularized
            sim.throttle = 0;
            sim.timeWarp = 50;
            setSlider("slider-throttle", 0, "lbl-throttle", "0%");
            setSlider("slider-warp", 50, "lbl-warp", "50x");
        }
    }
    
    if (demoPhase === "hohmann") {
        // Monitor Hohmann transfer
        if (ap > 390000 && pe > 190000) {
            // Transfer orbit achieved
            demoPhase = "rendezvous_prep";
            sim.throttle = 0;
            sim.timeWarp = 1;
            setSlider("slider-throttle", 0, "lbl-throttle", "0%");
            setSlider("slider-warp", 1, "lbl-warp", "1x");
            if (stepEl) stepEl.textContent = "Transfer orbit achieved! Preparing rendezvous...";
            
            demoTimers.push(setTimeout(() => {
                if (!demoActive) return;
                demoStartRendezvous();
            }, 3000));
            
        } else if (ap <= 390000 && sim.throttle < 50 && sim.met > 5) {
            // Burn prograde at Hohmann start
            sim.throttle = 100;
            sim.timeWarp = 5;
            setSlider("slider-throttle", 100, "lbl-throttle", "100%");
            setSlider("slider-warp", 5, "lbl-warp", "5x");
        }
    }
    
    if (demoPhase === "rendezvous") {
        // Monitor relative distance
        const dx = sim.pos.x - sim.targetPos.x;
        const dy = sim.pos.y - sim.targetPos.y;
        const dz = sim.pos.z - sim.targetPos.z;
        const relDist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (relDist < 100) {
            demoPhase = "complete";
            sim.throttle = 0;
            sim.timeWarp = 1;
            setSlider("slider-throttle", 0, "lbl-throttle", "0%");
            setSlider("slider-warp", 1, "lbl-warp", "1x");
            if (stepEl) stepEl.textContent = "Docking complete! Mission Success.";
            
            demoTimers.push(setTimeout(() => {
                stopDemo();
            }, 5000));
            
        } else if (relDist < 50000) {
            sim.autopilot = "target";
            sim.throttle = Math.min(100, relDist / 500);
            sim.timeWarp = 1;
            setSlider("slider-throttle", sim.throttle, "lbl-throttle", sim.throttle.toFixed(0) + "%");
            setSlider("slider-warp", 1, "lbl-warp", "1x");
            if (stepEl) stepEl.textContent = "Final approach — " + (relDist / 1000).toFixed(1) + " km to target";
        } else {
            sim.autopilot = "target";
            sim.throttle = 80;
            sim.timeWarp = 10;
            setSlider("slider-throttle", 80, "lbl-throttle", "80%");
            setSlider("slider-warp", 10, "lbl-warp", "10x");
            if (stepEl) stepEl.textContent = "Approaching target — " + (relDist / 1000).toFixed(1) + " km";
        }
    }
}

function demoStartHohmann() {
    if (!demoActive) return;
    
    // Switch to Hohmann phase
    resetSimulation("hohmann");
    demoPhase = "hohmann";
    sim.isPaused = false;
    sim.isIgnited = true;
    sim.autopilot = "prograde";
    
    document.querySelectorAll(".mission-tab").forEach(t => t.classList.remove("active"));
    const hohBtn = document.getElementById("btn-mission-hohmann");
    if (hohBtn) hohBtn.classList.add("active");
    
    const pauseBtn = document.getElementById("btn-pause");
    if (pauseBtn) pauseBtn.innerHTML = "⏸ PAUSE";
    
    const stepEl = document.getElementById("demo-step");
    if (stepEl) stepEl.textContent = "Hohmann Transfer: Burning prograde to raise orbit...";
    
    setCameraMode("track");
}

function demoStartRendezvous() {
    if (!demoActive) return;
    
    // Switch to rendezvous phase
    resetSimulation("rendezvous");
    demoPhase = "rendezvous";
    sim.isPaused = false;
    sim.isIgnited = true;
    sim.autopilot = "target";
    sim.throttle = 80;
    sim.timeWarp = 10;
    
    document.querySelectorAll(".mission-tab").forEach(t => t.classList.remove("active"));
    const rvBtn = document.getElementById("btn-mission-rendezvous");
    if (rvBtn) rvBtn.classList.add("active");
    
    const pauseBtn = document.getElementById("btn-pause");
    if (pauseBtn) pauseBtn.innerHTML = "⏸ PAUSE";
    
    const stepEl = document.getElementById("demo-step");
    if (stepEl) stepEl.textContent = "Rendezvous: Approaching target station...";
    
    setCameraMode("track");
}

function stopDemo() {
    demoActive = false;
    demoPhase = "launch";
    demoTimers.forEach(t => clearTimeout(t));
    demoTimers.forEach(t => clearInterval(t));
    demoTimers = [];
    hideEl("demo-indicator");
}

//  SECTION 13: ANIMATION LOOP
// ==========================================================================

let lastFrameTime = 0;

function animate(timestamp) {
    requestAnimationFrame(animate);
    
    const dt = Math.min((timestamp - lastFrameTime) / 1000, 0.1); // cap at 100ms
    lastFrameTime = timestamp;
    
    // Physics
    if (!sim.isPaused && !sim.crashTriggered) {
        stepPhysics(dt);
    }
    
    // Compute orbital state
    const alt = sim.pos.length() - RADIUS_EARTH;
    const speed = sim.vel.length();
    const elements = computeKeplerianElements(sim.pos, sim.vel);
    
    // Update displays (throttle to ~15fps for DOM updates)
    if (timestamp % 4 < 2) {
        updateHUD(alt, speed);
        updateTelemetry(elements, alt, speed);
        updateFlightDirector(alt, speed, elements);
        updateChart(alt, speed);
    }
    
    // Draw navball
    drawNavball();
    
    // ================================================================
    //  VIEW MODE AUTO-SWITCH
    // ================================================================
    if (sim.phase === "launch" && viewMode === "launch" && alt > VIEW_TRANSITION_ALT) {
        // Crossed Kármán line — switch to orbital view
        setViewMode("orbital");
        setCameraForPhase("launch");
    }
    
    // ================================================================
    //  UPDATE 3D SCENE BASED ON VIEW MODE
    // ================================================================
    if (viewMode === "launch") {
        // --- LAUNCH VIEW: local-frame rendering ---
        if (earthMesh) earthMesh.rotation.y += OMEGA_EARTH * dt * sim.timeWarp * 0.001;
        
        if (shipMesh) {
            // Position in local frame: Y = altitude, X = downrange
            const altKm = alt / 1000;
            const downrangeKm = sim.downrange / 1000;
            const localY = altKm * LAUNCH_SCALE;
            const localX = downrangeKm * LAUNCH_SCALE * 0.3;
            // Nozzle bottom is at y=-5 inside group, scaled by 0.15 = -0.75. Pad top is 0.05. Offset = 0.8
            shipMesh.position.set(localX, localY + 0.8, 0);
            
            // Orient based on STEERING ANGLE (not velocity!)
            // This avoids the bug where Earth's rotational velocity makes it sideways.
            // 90° = straight up, 0° = horizontal (downrange)
            const pitchRad = sim.steeringAngle * Math.PI / 180;
            const rocketDir = new THREE.Vector3(
                Math.cos(pitchRad),  // horizontal component
                Math.sin(pitchRad),  // vertical component
                0
            ).normalize();
            shipMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), rocketDir);
            
            // Exhaust flame
            if (exhaustFlame) {
                if (sim.isIgnited && sim.throttle > 0 && sim.fuel > 0) {
                    exhaustFlame.visible = true;
                    const flameScale = 0.12; // proportional to ship
                    exhaustFlame.scale.set(flameScale, flameScale * (sim.throttle / 100 * 1.5 + 0.5), flameScale);
                    exhaustFlame.position.copy(shipMesh.position);
                    const rocketDown = new THREE.Vector3(0, -1, 0).applyQuaternion(shipMesh.quaternion);
                    exhaustFlame.position.addScaledVector(rocketDown, 0.8);
                    exhaustFlame.quaternion.copy(shipMesh.quaternion);
                    exhaustFlame.material.opacity = 0.6 + Math.random() * 0.3;
                    exhaustFlame.material.color.setHex(
                        Math.random() > 0.5 ? 0xff6622 : 0xff8844
                    );
                } else {
                    exhaustFlame.visible = false;
                }
            }
            
            // Engine glow
            if (shipGlow) {
                shipGlow.intensity = sim.isIgnited && sim.throttle > 0 ? sim.throttle / 100 * 5 : 0;
            }
        }
        
    } else {
        // --- ORBITAL VIEW: ECI-frame rendering ---
        if (earthMesh) earthMesh.rotation.y += OMEGA_EARTH * dt * sim.timeWarp * 0.001;
        
        if (shipMesh) {
            const shipPos3D = sim.pos.clone().multiplyScalar(VIEW_SCALE);
            shipMesh.position.copy(shipPos3D);
            
            // Orient along velocity
            if (speed > 100) {
                const velDir = sim.vel.clone().normalize();
                shipMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), velDir);
            }
            
            // Engine glow
            if (shipGlow) {
                shipGlow.intensity = sim.isIgnited && sim.throttle > 0 ? sim.throttle / 100 * 3 : 0;
            }
            
            // Exhaust flame hidden in orbital view
            if (exhaustFlame) exhaustFlame.visible = false;
            
            // Trail (orbital only)
            if (!sim.isPaused && sim.isIgnited) {
                sim.trailPoints.push(shipPos3D.x, shipPos3D.y, shipPos3D.z);
                if (sim.trailPoints.length > 30000) {
                    sim.trailPoints.splice(0, 3);
                }
                if (orbitTrail) {
                    orbitTrail.geometry.setAttribute("position", new THREE.Float32BufferAttribute(sim.trailPoints, 3));
                    orbitTrail.geometry.attributes.position.needsUpdate = true;
                }
            }
        }
        
        // Target (rendezvous)
        if (targetMesh && sim.phase === "rendezvous") {
            const tPos3D = sim.targetPos.clone().multiplyScalar(VIEW_SCALE);
            targetMesh.position.copy(tPos3D);
            targetMesh.rotation.y += 0.005;
            
            if (!sim.isPaused) {
                sim.targetTrailPoints.push(tPos3D.x, tPos3D.y, tPos3D.z);
                if (sim.targetTrailPoints.length > 15000) {
                    sim.targetTrailPoints.splice(0, 3);
                }
                if (targetTrail) {
                    targetTrail.geometry.setAttribute("position", new THREE.Float32BufferAttribute(sim.targetTrailPoints, 3));
                    targetTrail.geometry.attributes.position.needsUpdate = true;
                }
            }
        }
    }
    
    // Predicted trajectory (throttled to every 30 frames for performance)
    predictionFrameCounter++;
    if (predictionFrameCounter >= 30) {
        predictionFrameCounter = 0;
        computePredictedTrajectory();
    }
    
    // Camera
    updateCinematicCamera(alt, dt);
    
    // Render
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// ==========================================================================
//  SECTION 14: AUDIO SYNTHESIS (Web Audio API)
// ==========================================================================
let audioCtx, engineGainNode, engineOsc;

function initAudioContext() {
    if (sim.audioInitialized) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Engine rumble oscillator
        engineOsc = audioCtx.createOscillator();
        engineOsc.type = "sawtooth";
        engineOsc.frequency.value = 55;
        
        engineGainNode = audioCtx.createGain();
        engineGainNode.gain.value = 0;
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 200;
        
        engineOsc.connect(filter);
        filter.connect(engineGainNode);
        engineGainNode.connect(audioCtx.destination);
        engineOsc.start();
        
        sim.audioInitialized = true;
    } catch (e) {
        console.warn("Audio init failed:", e);
    }
}

function updateEngineSound() {
    if (!engineGainNode || !engineOsc) return;
    
    if (sim.isIgnited && sim.throttle > 0 && !sim.isPaused) {
        const targetGain = (sim.throttle / 100) * 0.08;
        engineGainNode.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + 0.1);
        engineOsc.frequency.linearRampToValueAtTime(45 + sim.throttle * 0.5, audioCtx.currentTime + 0.1);
    } else {
        engineGainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
    }
}

function playBeep(freq, dur) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
}

// ==========================================================================
//  SECTION 15: EVENT LISTENERS (null-safe, verified IDs)
// ==========================================================================

function setupEventListeners() {
    // --- Throttle ---
    const throttleSlider = document.getElementById("slider-throttle");
    if (throttleSlider) {
        throttleSlider.addEventListener("input", (e) => {
            if (!sim.audioInitialized) initAudioContext();
            sim.throttle = parseInt(e.target.value);
            const lbl = document.getElementById("lbl-throttle");
            if (lbl) lbl.innerText = sim.throttle + "%";
            updateEngineSound();
        });
    }
    
    // --- Keyboard shortcuts (scoped) ---
    window.addEventListener("keydown", (e) => {
        // Don't intercept if user is in an input field
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
        
        if (e.key === "Shift") {
            // Increase throttle by 5
            sim.throttle = Math.min(100, sim.throttle + 5);
            if (throttleSlider) throttleSlider.value = sim.throttle;
            const lbl = document.getElementById("lbl-throttle");
            if (lbl) lbl.innerText = sim.throttle + "%";
            updateEngineSound();
        } else if (e.key === "Control") {
            // Decrease throttle by 5
            sim.throttle = Math.max(0, sim.throttle - 5);
            if (throttleSlider) throttleSlider.value = sim.throttle;
            const lbl = document.getElementById("lbl-throttle");
            if (lbl) lbl.innerText = sim.throttle + "%";
            updateEngineSound();
        } else if (e.key === "z" || e.key === "Z") {
            sim.throttle = 100;
            if (throttleSlider) throttleSlider.value = 100;
            const lbl = document.getElementById("lbl-throttle");
            if (lbl) lbl.innerText = "100%";
            updateEngineSound();
        } else if (e.key === "x" || e.key === "X") {
            sim.throttle = 0;
            if (throttleSlider) throttleSlider.value = 0;
            const lbl = document.getElementById("lbl-throttle");
            if (lbl) lbl.innerText = "0%";
            updateEngineSound();
        } else if (e.key === " ") {
            e.preventDefault();
            const ignBtn = document.getElementById("btn-ignition");
            if (ignBtn) ignBtn.click();
        }
    });
    
    // --- Pitch ---
    const pitchSlider = document.getElementById("slider-pitch");
    if (pitchSlider) {
        pitchSlider.addEventListener("input", (e) => {
            sim.steeringAngle = parseFloat(e.target.value);
            const deg = sim.steeringAngle.toFixed(1);
            const dir = sim.steeringAngle >= 85 ? " (Vertical)" : sim.steeringAngle <= 5 ? " (Horizontal)" : "";
            const lbl = document.getElementById("lbl-pitch");
            if (lbl) lbl.innerHTML = deg + "&#176;" + dir;
            
            // Force manual mode when user touches pitch
            sim.autopilot = "manual";
            document.querySelectorAll(".ap-btn").forEach(b => b.classList.remove("active"));
            const manBtn = document.getElementById("ap-manual");
            if (manBtn) manBtn.classList.add("active");
        });
    }
    
    // --- Time Warp ---
    const warpSlider = document.getElementById("slider-warp");
    if (warpSlider) {
        warpSlider.addEventListener("input", (e) => {
            sim.timeWarp = parseInt(e.target.value);
            const lbl = document.getElementById("lbl-warp");
            if (lbl) lbl.innerText = sim.timeWarp + "x";
        });
    }
    
    // --- Ignition ---
    const ignitionBtn = document.getElementById("btn-ignition");
    if (ignitionBtn) {
        ignitionBtn.addEventListener("click", () => {
            if (!sim.audioInitialized) initAudioContext();
            
            if (!sim.isIgnited) {
                // First ignition
                sim.isIgnited = true;
                sim.isPaused = false;
                ignitionBtn.innerHTML = "🔥 STAGE " + sim.stage;
                const pauseBtn = document.getElementById("btn-pause");
                if (pauseBtn) pauseBtn.innerHTML = "⏸ PAUSE";
                playBeep(800, 0.3);
                updateEngineSound();
            } else if (sim.stage === 1 && sim.fuel < 200) {
                // Stage separation
                sim.stage = 2;
                sim.fuel = STAGES[2].fuelMass;
                ignitionBtn.innerHTML = "🔥 STAGE 2";
                playBeep(600, 0.2);
                playBeep(1000, 0.3);
            }
        });
    }
    
    // --- Autopilot buttons ---
    const apModes = {
        "ap-prograde": "prograde",
        "ap-retrograde": "retrograde",
        "ap-target": "target",
        "ap-manual": "manual"
    };
    
    Object.entries(apModes).forEach(([btnId, mode]) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener("click", () => {
                if (!sim.audioInitialized) initAudioContext();
                sim.autopilot = mode;
                document.querySelectorAll(".ap-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                
                // Disable pitch slider when not manual
                const ps = document.getElementById("slider-pitch");
                if (ps) ps.disabled = (mode !== "manual");
                
                playBeep(400, 0.1);
            });
        }
    });
    
    // --- Pause ---
    const pauseBtn = document.getElementById("btn-pause");
    if (pauseBtn) {
        pauseBtn.addEventListener("click", () => {
            sim.isPaused = !sim.isPaused;
            pauseBtn.innerHTML = sim.isPaused ? "▶ RESUME" : "⏸ PAUSE";
            updateEngineSound();
        });
    }
    
    // --- Reset ---
    const resetBtn = document.getElementById("btn-reset");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            resetSimulation(sim.phase);
            playBeep(300, 0.2);
        });
    }
    
    // --- Mission phase tabs ---
    const missionTabs = {
        "btn-mission-launch": "launch",
        "btn-mission-hohmann": "hohmann",
        "btn-mission-rendezvous": "rendezvous"
    };
    
    Object.entries(missionTabs).forEach(([tabId, phase]) => {
        const btn = document.getElementById(tabId);
        if (btn) {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".mission-tab").forEach(t => t.classList.remove("active"));
                btn.classList.add("active");
                resetSimulation(phase);
                playBeep(500, 0.15);
            });
        }
    });
    
    // --- Next Mission button ---
    const nextBtn = document.getElementById("btn-next-mission");
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            hideEl("mission-complete-overlay");
            if (sim.phase === "launch") {
                const hohBtn = document.getElementById("btn-mission-hohmann");
                if (hohBtn) hohBtn.click();
            } else if (sim.phase === "hohmann") {
                const rvBtn = document.getElementById("btn-mission-rendezvous");
                if (rvBtn) rvBtn.click();
            } else {
                const launchBtn = document.getElementById("btn-mission-launch");
                if (launchBtn) launchBtn.click();
            }
        });
    }
    
    // --- Continue Flying button ---
    const continueBtn = document.getElementById("btn-continue-fly");
    if (continueBtn) {
        continueBtn.addEventListener("click", () => {
            hideEl("mission-complete-overlay");
        });
    }
    
    // --- Crash Reset button ---
    const crashResetBtn = document.getElementById("btn-crash-reset");
    if (crashResetBtn) {
        crashResetBtn.addEventListener("click", () => {
            resetSimulation(sim.phase);
        });
    }
    
    // --- Camera mode toggle ---
    const trackBtn = document.getElementById("btn-cam-track");
    if (trackBtn) {
        trackBtn.addEventListener("click", () => {
            setCameraMode("track");
            playBeep(500, 0.1);
        });
    }
    const freeBtn = document.getElementById("btn-cam-free");
    if (freeBtn) {
        freeBtn.addEventListener("click", () => {
            setCameraMode("free");
            playBeep(400, 0.1);
        });
    }
    
    // --- Demo mission ---
    const demoBtn = document.getElementById("btn-demo");
    if (demoBtn) {
        demoBtn.addEventListener("click", () => {
            runDemoMission();
            playBeep(600, 0.15);
        });
    }
    
    const stopDemoBtn = document.getElementById("btn-stop-demo");
    if (stopDemoBtn) {
        stopDemoBtn.addEventListener("click", () => {
            stopDemo();
            playBeep(300, 0.1);
        });
    }
}

// ==========================================================================
//  SECTION 16: UTILITIES
// ==========================================================================

function formatMET(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

// ==========================================================================
//  SECTION 17: INITIALIZATION
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    initThreeJS();
    initNavball();
    initChart();
    setupEventListeners();
    resetSimulation("launch");
    requestAnimationFrame(animate);
});
