document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const canvas = document.getElementById('simCanvas');
    const presetSelect = document.getElementById('mission-preset');
    
    const angleInput = document.getElementById('probe-angle');
    const verticalInput = document.getElementById('probe-vertical');
    const velocityInput = document.getElementById('probe-velocity');
    const massInput = document.getElementById('planet-mass');
    const speedInput = document.getElementById('planet-speed');
    
    const angleVal = document.getElementById('angle-val');
    const verticalVal = document.getElementById('vertical-val');
    const velocityVal = document.getElementById('velocity-val');
    const massVal = document.getElementById('mass-val');
    const speedVal = document.getElementById('planet-speed-val');
    
    const tLiveV = document.getElementById('t-live-v');
    const tDeltaV = document.getElementById('t-delta-v');
    const tPlanetV = document.getElementById('t-planet-v');
    const tPeriapsis = document.getElementById('t-periapsis');
    
    const btnLaunch = document.getElementById('btn-launch');
    const audioToggle = document.getElementById('audio-toggle');

    // Dynamic Labels and Sandbox Controls
    const lblPlanetMass = document.getElementById('lbl-planet-mass');
    const lblPlanetSpeed = document.getElementById('lbl-planet-speed');
    
    const simSpeedInput = document.getElementById('sim-speed');
    const simSpeedVal = document.getElementById('sim-speed-val');
    
    const moonAngleInput = document.getElementById('moon-angle');
    const moonAngleVal = document.getElementById('moon-angle-val');
    const controlMoonAngle = document.getElementById('control-moon-angle');
    
    const launchAltInput = document.getElementById('launch-altitude');
    const launchAltVal = document.getElementById('launch-alt-val');
    const controlLaunchAlt = document.getElementById('control-launch-alt');
    const btnResetView = document.getElementById('btn-reset-view');

    // WebGL Setup
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 1, 3000);
    // Center the camera over the action (x=400, z=0 is approx center)
    camera.position.set(400, 600, 600);

    // OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(400, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1.5, 2000);
    pointLight.position.set(400, 500, 200);
    scene.add(pointLight);

    // 3D Objects
    const planetMaterial = new THREE.MeshPhongMaterial({ color: 0x125DFF, shininess: 100, emissive: 0x021034 });
    const planetMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), planetMaterial);
    scene.add(planetMesh);

    const probeMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF, emissiveIntensity: 0.5 });
    const probeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), probeMaterial);
    scene.add(probeMesh);

    const primaryMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22, shininess: 50, emissive: 0x004d00 });
    const primaryMesh = new THREE.Mesh(new THREE.SphereGeometry(6.371, 32, 32), primaryMaterial); // Earth size roughly 6.37 scaled
    primaryMesh.visible = false;
    scene.add(primaryMesh);

    // Orbital Plane Grid
    const gridHelper = new THREE.GridHelper(1200, 24, 0xDEEBFF, 0xDEEBFF);
    gridHelper.position.set(400, -20, 0);
    gridHelper.material.opacity = 0.1;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Planet Orbital Path (straight line along X)
    const planetPathGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-200, 0, 0),
        new THREE.Vector3(1000, 0, 0)
    ]);
    const planetPathMat = new THREE.LineBasicMaterial({ color: 0x125DFF, transparent: true, opacity: 0.4 });
    const planetPathLine = new THREE.Line(planetPathGeo, planetPathMat);
    scene.add(planetPathLine);

    // Circular Orbit Path (for 3-Body Mode)
    const curve = new THREE.EllipseCurve(0, 0, 384.4, 384.4, 0, 2 * Math.PI, false, 0);
    const circularPathGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(100));
    const circularPathLine = new THREE.Line(circularPathGeo, planetPathMat);
    circularPathLine.rotation.x = Math.PI / 2; // Lie flat on XZ
    circularPathLine.visible = false;
    scene.add(circularPathLine);

    // Probe Trails
    const trailMaterial = new THREE.LineBasicMaterial({ color: 0xDEEBFF });
    let trailGeo = new THREE.BufferGeometry();
    trailGeo.setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)]); // Prevent crash
    let trailLine = new THREE.Line(trailGeo, trailMaterial);
    trailLine.visible = false;
    scene.add(trailLine);

    const previewTrailMat = new THREE.LineDashedMaterial({ color: 0xDEEBFF, dashSize: 20, gapSize: 20, transparent: true, opacity: 0.5 });
    let previewTrailGeo = new THREE.BufferGeometry();
    let previewTrailLine = new THREE.Line(previewTrailGeo, previewTrailMat);
    scene.add(previewTrailLine);

    // Realistic Physics Constants
    const G = 6.67430e-11; // m^3 / (kg s^2)
    let dt = 3600; // 1 frame = 1 hour (Time Warp, adjustable via slider)
    const VISUAL_SCALE = 1e-6; // 1 visual unit = 1,000 km = 1,000,000 m

    // Audio Context
    let audioCtx = null;
    let oscillator = null;
    let gainNode = null;
    let isAudioEnabled = false;

    function initAudio() {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.value = 220;
        gainNode.gain.value = 0;
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
    }

    audioToggle.addEventListener('click', () => {
        if (!isAudioEnabled) {
            if (!audioCtx) initAudio();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            isAudioEnabled = true;
            audioToggle.classList.add('active');
            if (simState.running) {
                gainNode.gain.setTargetAtTime(0.05, audioCtx.currentTime, 0.1);
            }
        } else {
            gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
            isAudioEnabled = false;
            audioToggle.classList.remove('active');
        }
    });

    // Simulation State
    let simState = {
        running: false,
        showFinalState: false,
        mode: 'single',
        planet: { x: 0, y: 0, z: 0, vx: parseFloat(speedInput.value) * 1e3 || 0, vy: 0, vz: 0, mass: 5.97e24, radius: 6.371e6 },
        probe: { x: 700e6, y: 0, z: 100e6, vx: -10e3, vy: 0, vz: 0, trail: [] },
        initialProbeV: 10e3,
        minDist: Infinity
    };

    function resetSimulation() {
        const mode = Array.from(document.getElementsByName('sim-mode')).find(r => r.checked).value;

        const approachOffset = parseFloat(angleInput.value) * 1e6; // km to meters
        const verticalOffset = parseFloat(verticalInput.value) * 1e6; // km to meters
        const vIn = parseFloat(velocityInput.value) * 1e3; // km/s to m/s
        const pMassExp = parseFloat(massInput.value);
        const pMass = Math.pow(10, pMassExp) * 1e24; // Real kg
        const pSpeed = parseFloat(speedInput.value) * 1e3; // km/s to m/s
        
        // Approximate planetary radius from mass assuming rocky density
        const radius = Math.pow(pMass / (3000 * (4/3) * Math.PI), 1/3);
        
        if (mode === 'single') {
            simState = {
                running: false,
                showFinalState: false,
                mode: 'single',
                planet: { x: 0, y: 0, z: 0, vx: pSpeed, vy: 0, vz: 0, mass: pMass, radius: radius },
                probe: { x: 700e6, y: verticalOffset, z: approachOffset, vx: -vIn, vy: 0, vz: 0, trail: [] },
                initialProbeV: vIn,
                minDist: Infinity
            };
            btnLaunch.innerText = "LAUNCH PROBE";
            tPeriapsis.innerHTML = `-- <span class="unit">km</span>`;
            tPlanetV.innerHTML = `${(pSpeed / 1000).toFixed(2)} <span class="unit">km/s</span>`;
            controls.target.set(400, 0, 0);
        } else {
            // Earth-Moon 3-Body Mode
            const eMass = 5.972e24;
            const eRadius = 6.371e6;
            
            // Allow sliders to control Moon's mass and speed dynamically
            const mMass = pMass;
            const mSpeed = pSpeed;
            // Scale radius based on mass relative to the Moon's real parameters
            const mRadius = 1.737e6 * Math.pow(mMass / 7.342e22, 1/3);
            const mDist = 384400e3;
            
            const mStartAngle = parseFloat(moonAngleInput.value) * Math.PI / 180;
            const launchAlt = parseFloat(launchAltInput.value) * 1e3;
            
            const isArtemis = presetSelect.value === 'artemis';

            simState = {
                running: false,
                showFinalState: false,
                mode: '3body',
                time: 0,
                isArtemis: isArtemis,
                primary: { mass: eMass, radius: eRadius, x: 0, y: 0, z: 0 },
                planet: { 
                    mass: mMass, radius: mRadius, orbitRadius: mDist, 
                    angle: mStartAngle, speed: mSpeed, 
                    x: mDist * Math.cos(mStartAngle), y: 0, z: mDist * Math.sin(mStartAngle), 
                    vx: 0, vy: 0, vz: 0 
                },
                // Tangential LEO launch (Prograde) with adjustable altitude
                probe: { x: 0, y: verticalOffset, z: -(eRadius + launchAlt) + approachOffset, vx: vIn, vy: 0, vz: 0, trail: [] },
                initialProbeV: vIn,
                minDist: Infinity
            };
            btnLaunch.innerText = "LAUNCH TLI BURN";
            tPeriapsis.innerHTML = `-- <span class="unit">km</span>`;
            tPlanetV.innerHTML = `${(mSpeed / 1000).toFixed(2)} <span class="unit">km/s</span>`;
            controls.target.set(0, 0, 0);
        }
        controls.update();

        trailGeo.setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)]);
        if (isAudioEnabled && oscillator) gainNode.gain.setTargetAtTime(0.05, audioCtx.currentTime, 0.1);
    }


    // Event Listeners
    btnLaunch.addEventListener('click', () => {
        if (simState.running) {
            simState.running = false;
            simState.showFinalState = true;
            btnLaunch.innerText = simState.mode === '3body' ? "LAUNCH TLI BURN" : "LAUNCH PROBE";
            if (isAudioEnabled && oscillator) {
                gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
            }
        } else {
            resetSimulation();
            simState.running = true;
            btnLaunch.innerText = "ABORT";
            if (isAudioEnabled && oscillator) gainNode.gain.setTargetAtTime(0.05, audioCtx.currentTime, 0.1);
        }
    });

    // Presets Logic
    // Presets with default speed multipliers (Voyager and Ulysses run slower so user can inspect closely)
    const presets = {
        voyager: { angle: -468, vertical: 0, velocity: 10.0, massExp: 3.28, speed: 13.0, dtHours: 0.05, moonAngle: 44, launchAlt: 400 },
        artemis: { angle: 0, vertical: 0, velocity: 10.80, massExp: -1.13, speed: 1.022, dtHours: 1.0, moonAngle: 44.4, launchAlt: 400 },
        ulysses: { angle: 100, vertical: 400, velocity: 10.0, massExp: 3.28, speed: 13.0, dtHours: 0.05, moonAngle: 44, launchAlt: 400 }
    };

    function updateUIControls() {
        const mode = Array.from(document.getElementsByName('sim-mode')).find(r => r.checked).value;
        if (mode === '3body') {
            lblPlanetMass.innerHTML = `Moon Mass (10<sup>24</sup> kg)`;
            lblPlanetSpeed.innerHTML = `Moon Speed (km/s)`;
            controlMoonAngle.style.display = 'block';
            controlLaunchAlt.style.display = 'block';
        } else {
            lblPlanetMass.innerHTML = `Planet Mass (10<sup>24</sup> kg)`;
            lblPlanetSpeed.innerHTML = `Planet Speed (km/s)`;
            controlMoonAngle.style.display = 'none';
            controlLaunchAlt.style.display = 'none';
        }
    }

    presetSelect.addEventListener('change', () => {
        const val = presetSelect.value;
        
        const modeRadios = document.getElementsByName('sim-mode');
        if (val === 'artemis') {
            modeRadios[1].checked = true; // Switch to 3-body
        } else if (val === 'voyager' || val === 'ulysses') {
            modeRadios[0].checked = true; // Switch to Single
        }

        updateUIControls();

        if (presets[val]) {
            angleInput.value = presets[val].angle;
            verticalInput.value = presets[val].vertical;
            velocityInput.value = presets[val].velocity;
            massInput.value = presets[val].massExp;
            speedInput.value = presets[val].speed;
            
            if (presets[val].dtHours !== undefined) {
                simSpeedInput.value = presets[val].dtHours;
                simSpeedVal.innerText = `${presets[val].dtHours.toFixed(2)} hr/s`;
                dt = presets[val].dtHours * 3600;
            }
            if (presets[val].moonAngle !== undefined) {
                moonAngleInput.value = presets[val].moonAngle;
                moonAngleVal.innerText = `${presets[val].moonAngle}°`;
            }
            if (presets[val].launchAlt !== undefined) {
                launchAltInput.value = presets[val].launchAlt;
                launchAltVal.innerText = `${presets[val].launchAlt} km`;
            }
            
            [angleInput, verticalInput, velocityInput, massInput, speedInput].forEach(inp => {
                inp.dispatchEvent(new Event('input'));
            });
            resetSimulation(); // Update internal state for idle preview
            resetView();
        }
    });

    document.getElementsByName('sim-mode').forEach(r => {
        r.addEventListener('change', () => {
            updateUIControls();
            resetSimulation();
            resetView();
        });
    });

    [angleInput, verticalInput, velocityInput, massInput, speedInput].forEach(input => {
        input.addEventListener('input', (e) => {
            if (e && e.isTrusted) presetSelect.value = 'custom';
            
            angleVal.innerText = `${angleInput.value}x10³ km`;
            verticalVal.innerText = `${verticalInput.value}x10³ km`;
            velocityVal.innerText = `${velocityInput.value} km/s`;
            speedVal.innerText = `${parseFloat(speedInput.value).toFixed(2)} km/s`;
            
            const massExp = parseFloat(massInput.value);
            const realMass = Math.pow(10, massExp);
            massVal.innerHTML = `${realMass.toFixed(2)}x10<sup>24</sup> kg`;
            
            simState.showFinalState = false;

            if (simState.running) {
                simState.running = false;
                btnLaunch.innerText = simState.mode === '3body' ? "LAUNCH TLI BURN" : "LAUNCH PROBE";
                if (isAudioEnabled && oscillator) {
                    gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
                }
            }
        });
    });

    simSpeedInput.addEventListener('input', () => {
        const val = parseFloat(simSpeedInput.value);
        dt = val * 3600;
        simSpeedVal.innerText = `${val.toFixed(2)} hr/s`;
    });

    moonAngleInput.addEventListener('input', (e) => {
        if (e && e.isTrusted) presetSelect.value = 'custom';
        moonAngleVal.innerText = `${moonAngleInput.value}°`;
        resetSimulation();
    });

    launchAltInput.addEventListener('input', (e) => {
        if (e && e.isTrusted) presetSelect.value = 'custom';
        launchAltVal.innerText = `${launchAltInput.value} km`;
        resetSimulation();
    });

    function updatePhysics() {
        if (!simState.running) return;

        // Sub-stepping for higher precision over massive time warps
        let subSteps = 10;
        
        // Decelerate integration steps when near celestial bodies for high precision collision/entry
        const px_cur = simState.probe.x;
        const py_cur = simState.probe.y;
        const pz_cur = simState.probe.z;
        const distToMoon = Math.sqrt((simState.planet.x - px_cur)**2 + (simState.planet.y - py_cur)**2 + (simState.planet.z - pz_cur)**2);
        
        let closeToBody = distToMoon < 30000e3; // 30,000 km from Moon
        if (simState.mode === '3body') {
            const distToEarth = Math.sqrt(px_cur**2 + py_cur**2 + pz_cur**2);
            if (distToEarth < 40000e3 && simState.time > 86400) {
                closeToBody = true; // 40,000 km from Earth on return
            }
        }
        
        if (closeToBody) {
            // Target subDt of 5 seconds near celestial bodies for sub-kilometer impact resolution
            subSteps = Math.ceil(dt / 5);
        } else {
            // Target subDt of 300 seconds far from bodies to maintain perfect RK4 integration at any warp speed
            subSteps = Math.ceil(dt / 300);
        }
        
        if (subSteps < 10) subSteps = 10;

        const subDt = dt / subSteps;

        function computeAcceleration(px, py, pz, planX, planY, planZ) {
            const dx = planX - px;
            const dy = planY - py;
            const dz = planZ - pz;
            const distSq = dx*dx + dy*dy + dz*dz;
            const dist = Math.sqrt(distSq);
            if (dist === 0) return { ax: 0, ay: 0, az: 0 };
            
            const force = (G * simState.planet.mass) / distSq;
            let acc = {
                ax: force * (dx / dist),
                ay: force * (dy / dist),
                az: force * (dz / dist)
            };

            if (simState.mode === '3body') {
                const edx = simState.primary.x - px;
                const edy = simState.primary.y - py;
                const edz = simState.primary.z - pz;
                const edistSq = edx*edx + edy*edy + edz*edz;
                const edist = Math.sqrt(edistSq);
                if (edist > 0) {
                    const eForce = (G * simState.primary.mass) / edistSq;
                    acc.ax += eForce * (edx / edist);
                    acc.ay += eForce * (edy / edist);
                    acc.az += eForce * (edz / edist);
                }
            }

            return acc;
        }

        for (let i = 0; i < subSteps; i++) {
            // Current probe state
            const x0 = simState.probe.x;
            const y0 = simState.probe.y;
            const z0 = simState.probe.z;
            const vx0 = simState.probe.vx;
            const vy0 = simState.probe.vy;
            const vz0 = simState.probe.vz;

            let planX0 = simState.planet.x;
            let planY0 = simState.planet.y;
            let planZ0 = simState.planet.z;
            
            let planX_mid, planY_mid, planZ_mid;
            let planX_end, planY_end, planZ_end;

            if (simState.mode === 'single') {
                planX_mid = planX0 + simState.planet.vx * (subDt / 2);
                planY_mid = planY0 + simState.planet.vy * (subDt / 2);
                planZ_mid = planZ0 + simState.planet.vz * (subDt / 2);
                planX_end = planX0 + simState.planet.vx * subDt;
                planY_end = planY0 + simState.planet.vy * subDt;
                planZ_end = planZ0 + simState.planet.vz * subDt;
            } else {
                // Circular Orbit for 3-Body
                const angularSpeed = simState.planet.speed / simState.planet.orbitRadius;
                
                const angle_mid = simState.planet.angle + angularSpeed * (subDt / 2);
                planX_mid = simState.planet.orbitRadius * Math.cos(angle_mid);
                planY_mid = 0;
                planZ_mid = simState.planet.orbitRadius * Math.sin(angle_mid);

                const angle_end = simState.planet.angle + angularSpeed * subDt;
                planX_end = simState.planet.orbitRadius * Math.cos(angle_end);
                planY_end = 0;
                planZ_end = simState.planet.orbitRadius * Math.sin(angle_end);
            }

            // Collision check at the start of step
            const dx = planX0 - x0;
            const dy = planY0 - y0;
            const dz = planZ0 - z0;
            const distSq = dx*dx + dy*dy + dz*dz;
            const dist = Math.sqrt(distSq);
            
            if (dist < simState.minDist) {
                simState.minDist = dist;
                tPeriapsis.innerHTML = `${(dist / 1000).toLocaleString(undefined, {maximumFractionDigits: 0})} <span class="unit">km</span>`;
            }

            if (dist <= simState.planet.radius) {
                // Scale probe position relative to the planet's center so that it lies exactly on the surface
                const scale = simState.planet.radius / dist;
                simState.probe.x = planX0 - dx * scale;
                simState.probe.y = planY0 - dy * scale;
                simState.probe.z = planZ0 - dz * scale;

                simState.running = false;
                simState.showFinalState = true;
                btnLaunch.innerText = simState.mode === '3body' ? "LAUNCH TLI BURN" : "LAUNCH PROBE";
                tPeriapsis.innerHTML = `<span style="color: #FFA500;">IMPACT!</span>`;
                if (isAudioEnabled && oscillator) gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
                break;
            }

            // Earth entry/collision check (for 3-body mode)
            if (simState.mode === '3body') {
                const eDist = Math.sqrt(x0*x0 + y0*y0 + z0*z0);
                if (eDist <= simState.primary.radius + 120e3 && simState.time > 86400) {
                    // Scale probe position relative to Earth (0,0,0) so it lies exactly at the entry interface
                    const scale = (simState.primary.radius + 120e3) / eDist;
                    simState.probe.x = x0 * scale;
                    simState.probe.y = y0 * scale;
                    simState.probe.z = z0 * scale;

                    simState.running = false;
                    simState.showFinalState = true;
                    btnLaunch.innerText = "LAUNCH TLI BURN";
                    tPeriapsis.innerHTML = `<span style="color: #00FF00;">MISSION COMPLETE</span>`;
                    if (isAudioEnabled && oscillator) gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
                    break;
                }
            }

            // --- RK4 Integration ---
            // k1
            const a1 = computeAcceleration(x0, y0, z0, planX0, planY0, planZ0);
            const k1x = vx0 * subDt;
            const k1y = vy0 * subDt;
            const k1z = vz0 * subDt;
            const k1vx = a1.ax * subDt;
            const k1vy = a1.ay * subDt;
            const k1vz = a1.az * subDt;

            // k2 (midpoint)
            // (planX_mid is already calculated above for both modes)
            
            const a2 = computeAcceleration(
                x0 + k1x / 2, y0 + k1y / 2, z0 + k1z / 2,
                planX_mid, planY_mid, planZ_mid
            );
            const k2x = (vx0 + k1vx / 2) * subDt;
            const k2y = (vy0 + k1vy / 2) * subDt;
            const k2z = (vz0 + k1vz / 2) * subDt;
            const k2vx = a2.ax * subDt;
            const k2vy = a2.ay * subDt;
            const k2vz = a2.az * subDt;

            // k3 (midpoint)
            const a3 = computeAcceleration(
                x0 + k2x / 2, y0 + k2y / 2, z0 + k2z / 2,
                planX_mid, planY_mid, planZ_mid
            );
            const k3x = (vx0 + k2vx / 2) * subDt;
            const k3y = (vy0 + k2vy / 2) * subDt;
            const k3z = (vz0 + k2vz / 2) * subDt;
            const k3vx = a3.ax * subDt;
            const k3vy = a3.ay * subDt;
            const k3vz = a3.az * subDt;

            // k4 (end point)
            const a4 = computeAcceleration(
                x0 + k3x, y0 + k3y, z0 + k3z,
                planX_end, planY_end, planZ_end
            );
            const k4x = (vx0 + k3vx) * subDt;
            const k4y = (vy0 + k3vy) * subDt;
            const k4z = (vz0 + k3vz) * subDt;
            const k4vx = a4.ax * subDt;
            const k4vy = a4.ay * subDt;
            const k4vz = a4.az * subDt;

            // Update probe state
            simState.probe.x += (k1x + 2*k2x + 2*k3x + k4x) / 6;
            simState.probe.y += (k1y + 2*k2y + 2*k3y + k4y) / 6;
            simState.probe.z += (k1z + 2*k2z + 2*k3z + k4z) / 6;
            
            simState.probe.vx += (k1vx + 2*k2vx + 2*k3vx + k4vx) / 6;
            simState.probe.vy += (k1vy + 2*k2vy + 2*k3vy + k4vy) / 6;
            simState.probe.vz += (k1vz + 2*k2vz + 2*k3vz + k4vz) / 6;

            // Update planet state
            simState.planet.x = planX_end;
            simState.planet.y = planY_end;
            simState.planet.z = planZ_end;
            if (simState.mode === '3body') {
                const angularSpeed = simState.planet.speed / simState.planet.orbitRadius;
                simState.planet.angle += angularSpeed * subDt;
            }
            
            simState.time += subDt;
        }

        // Earth Collision check is now performed inside the sub-stepping loop for precision.

        // Record visual trail
        let refX = simState.planet.x;
        let refY = simState.planet.y;
        let refZ = simState.planet.z;
        if (simState.mode === '3body') {
            refX = simState.primary.x;
            refY = simState.primary.y;
            refZ = simState.primary.z;
        }

        simState.probe.trail.push(new THREE.Vector3(
            (simState.probe.x - refX) * VISUAL_SCALE, 
            (simState.probe.y - refY) * VISUAL_SCALE, 
            (simState.probe.z - refZ) * VISUAL_SCALE
        ));
        if (simState.probe.trail.length > 500) simState.probe.trail.shift();

        const currentSpeed = Math.sqrt(simState.probe.vx**2 + simState.probe.vy**2 + simState.probe.vz**2);
        tLiveV.innerHTML = `${(currentSpeed / 1000).toFixed(2)} <span class="unit">km/s</span>`;
        
        const deltaV = currentSpeed - simState.initialProbeV;
        tDeltaV.innerHTML = `${deltaV > 0 ? '+' : ''}${(deltaV / 1000).toFixed(2)} <span class="unit">km/s</span>`;

        if (isAudioEnabled && oscillator) {
            oscillator.frequency.setTargetAtTime(200 + (currentSpeed / 1000) * 15, audioCtx.currentTime, 0.1);
        }
        
        // Auto-stop if out of bounds relative to planet
        const relDist = Math.sqrt((simState.planet.x - simState.probe.x)**2 + (simState.planet.y - simState.probe.y)**2 + (simState.planet.z - simState.probe.z)**2);
        if (relDist > 1.5e9) {
            simState.running = false;
            btnLaunch.innerText = "LAUNCH PROBE";
            if (isAudioEnabled && oscillator) gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        }
    }

    function renderScene() {
        controls.update();

        if (simState.running || simState.showFinalState) {
            // Live Simulation Mode / Final State View
            if (simState.mode === 'single') {
                planetMesh.position.set(0, 0, 0);
                probeMesh.position.set(
                    (simState.probe.x - simState.planet.x) * VISUAL_SCALE, 
                    (simState.probe.y - simState.planet.y) * VISUAL_SCALE, 
                    (simState.probe.z - simState.planet.z) * VISUAL_SCALE
                );
                primaryMesh.visible = false;
                planetPathLine.visible = true;
                circularPathLine.visible = false;
                gridHelper.position.set(400, -20, 0);
            } else {
                primaryMesh.position.set(0, 0, 0);
                primaryMesh.visible = true;
                planetPathLine.visible = false;
                circularPathLine.visible = true;
                gridHelper.position.set(0, -20, 0);

                planetMesh.position.set(
                    simState.planet.x * VISUAL_SCALE,
                    simState.planet.y * VISUAL_SCALE,
                    simState.planet.z * VISUAL_SCALE
                );
                
                probeMesh.position.set(
                    simState.probe.x * VISUAL_SCALE, 
                    simState.probe.y * VISUAL_SCALE, 
                    simState.probe.z * VISUAL_SCALE
                );
            }

            planetMesh.material.opacity = 1.0;
            probeMesh.material.opacity = 1.0;
            primaryMesh.material.opacity = 1.0;
            planetMesh.material.transparent = false;
            probeMesh.material.transparent = false;
            primaryMesh.material.transparent = false;

            previewTrailLine.visible = false;
            
            if (simState.probe.trail.length > 1) {
                trailGeo.setFromPoints(simState.probe.trail);
                trailLine.visible = true;
            } else {
                trailLine.visible = false;
            }
        } else {
            // Idle State Preview
            const approachOffset = parseFloat(angleInput.value) * 1e6; // to meters
            const verticalOffset = parseFloat(verticalInput.value) * 1e6;
            
            if (simState.mode === 'single') {
                const pMassExp = parseFloat(massInput.value);
                const pMass = Math.pow(10, pMassExp) * 1e24; // Real kg
                const radius = Math.pow(pMass / (3000 * (4/3) * Math.PI), 1/3);
                
                planetMesh.position.set(0, 0, 0);
                if (!planetMesh.userData.currentRadius || Math.abs(planetMesh.userData.currentRadius - radius) > 1000) {
                    if (planetMesh.geometry) planetMesh.geometry.dispose();
                    planetMesh.geometry = new THREE.SphereGeometry(radius * VISUAL_SCALE, 32, 32);
                    planetMesh.userData.currentRadius = radius;
                }
                
                probeMesh.position.set(700e6 * VISUAL_SCALE, verticalOffset * VISUAL_SCALE, approachOffset * VISUAL_SCALE);
                
                primaryMesh.visible = false;
                planetPathLine.visible = true;
                circularPathLine.visible = false;
                gridHelper.position.set(400, -20, 0);

                previewTrailGeo.setFromPoints([
                    new THREE.Vector3(700e6 * VISUAL_SCALE, verticalOffset * VISUAL_SCALE, approachOffset * VISUAL_SCALE),
                    new THREE.Vector3(0, verticalOffset * VISUAL_SCALE, approachOffset * VISUAL_SCALE)
                ]);
            } else {
                // Earth-Moon Idle Preview
                const eRadius = simState.primary.radius;
                const mDist = simState.planet.orbitRadius;
                
                primaryMesh.position.set(0, 0, 0);
                primaryMesh.visible = true;
                planetPathLine.visible = false;
                circularPathLine.visible = true;
                gridHelper.position.set(0, -20, 0);

                const pX = mDist * Math.cos(simState.planet.angle);
                const pZ = mDist * Math.sin(simState.planet.angle);
                planetMesh.position.set(pX * VISUAL_SCALE, 0, pZ * VISUAL_SCALE);
                if (!planetMesh.userData.currentRadius || Math.abs(planetMesh.userData.currentRadius - simState.planet.radius) > 1000) {
                    if (planetMesh.geometry) planetMesh.geometry.dispose();
                    planetMesh.geometry = new THREE.SphereGeometry(simState.planet.radius * VISUAL_SCALE, 32, 32);
                    planetMesh.userData.currentRadius = simState.planet.radius;
                }
                
                const launchAlt = parseFloat(launchAltInput.value) * 1e3;
                probeMesh.position.set(0, verticalOffset * VISUAL_SCALE, (-(eRadius + launchAlt) + approachOffset) * VISUAL_SCALE);

                previewTrailGeo.setFromPoints([
                    new THREE.Vector3(0, verticalOffset * VISUAL_SCALE, (-(eRadius + launchAlt) + approachOffset) * VISUAL_SCALE),
                    new THREE.Vector3(mDist * VISUAL_SCALE, verticalOffset * VISUAL_SCALE, 0)
                ]);
            }
            
            planetMesh.material.transparent = true;
            planetMesh.material.opacity = 0.5;
            probeMesh.material.transparent = true;
            probeMesh.material.opacity = 0.5;
            primaryMesh.material.transparent = true;
            primaryMesh.material.opacity = 0.5;

            trailLine.visible = false;
            previewTrailLine.visible = true;
            previewTrailLine.computeLineDistances();
        }

        renderer.render(scene, camera);
    }

    function loop() {
        updatePhysics();
        renderScene();
        requestAnimationFrame(loop);
    }

    // Init values
    angleVal.innerText = `${angleInput.value}x10³ km`;
    velocityVal.innerText = `${velocityInput.value} km/s`;
    speedVal.innerText = `${parseFloat(speedInput.value).toFixed(2)} km/s`;
    
    const initialMassExp = parseFloat(massInput.value);
    const initialRealMass = Math.pow(10, initialMassExp);
    massVal.innerHTML = `${initialRealMass.toFixed(2)}x10<sup>24</sup> kg`;
    tPlanetV.innerHTML = `${parseFloat(speedInput.value).toFixed(2)} <span class="unit">km/s</span>`;

    // Initialize sandbox controls
    simSpeedVal.innerText = `${parseFloat(simSpeedInput.value).toFixed(2)} hr/s`;
    moonAngleVal.innerText = `${moonAngleInput.value}°`;
    launchAltVal.innerText = `${launchAltInput.value} km`;
    updateUIControls();

    // Reset View Centering
    function resetView() {
        const mode = Array.from(document.getElementsByName('sim-mode')).find(r => r.checked).value;
        if (mode === 'single') {
            camera.position.set(400, 600, 600);
            controls.target.set(400, 0, 0);
        } else {
            camera.position.set(0, 600, 600);
            controls.target.set(0, 0, 0);
        }
        controls.update();
    }
    btnResetView.addEventListener('click', resetView);
    
    // Handle Window Resize
    function resize() {
        const width = canvas.parentElement.clientWidth;
        const height = canvas.parentElement.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize(); // Trigger immediately after setup to ensure visual fit

    loop();
});
