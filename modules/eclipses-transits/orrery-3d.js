/**
 * Orrery 3D – Extracted Sun-Earth-Moon orbital geometry scene.
 * This file is preserved for the future "Eclipse & Transit Physics Lab" module.
 * It contains the original Three.js orrery that shows:
 *   - Wireframe Earth
 *   - Moon orbit plane (5.14° tilt)
 *   - Moon sphere on its orbit ring
 *   - Line of nodes
 *   - Ecliptic grid
 *   - Shadow disc (globe mode)
 *
 * Usage: Include Three.js + OrbitControls before this script, then call initOrreryScene(containerEl)
 */

// Orrery scene state
const orreryScene = {
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

/**
 * Initialise the 3D Orrery scene inside the given container element.
 * @param {HTMLElement} container – the DOM element to attach the renderer to.
 */
function initOrreryScene(container) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    orreryScene.scene = new THREE.Scene();
    orreryScene.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    orreryScene.camera.position.set(0, 15, 20);

    orreryScene.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    orreryScene.renderer.setSize(width, height);
    orreryScene.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(orreryScene.renderer.domElement);

    orreryScene.controls = new THREE.OrbitControls(orreryScene.camera, orreryScene.renderer.domElement);
    orreryScene.controls.enableDamping = true;
    orreryScene.controls.dampingFactor = 0.05;

    // Ambient light
    const ambient = new THREE.AmbientLight(0x222233);
    orreryScene.scene.add(ambient);

    // Directional Sun Light (glowing gold)
    orreryScene.sunLight = new THREE.DirectionalLight(0xfff6e0, 1.5);
    orreryScene.sunLight.position.set(20, 0, 0);
    orreryScene.scene.add(orreryScene.sunLight);

    // Add Earth (Sphere – wireframe telemetry style)
    const earthGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const earthMat = new THREE.MeshPhongMaterial({
        color: 0x052a6b,
        emissive: 0x021034,
        specular: 0x111111,
        shininess: 10,
        wireframe: true
    });
    orreryScene.earth = new THREE.Mesh(earthGeo, earthMat);
    orreryScene.scene.add(orreryScene.earth);

    // Add Ecliptic plane grid decoration
    const eclipticGrid = new THREE.GridHelper(30, 30, 0x125dff, 0x223355);
    eclipticGrid.position.y = 0;
    orreryScene.scene.add(eclipticGrid);

    // Moon Orbit plane & path (Tilted 5.14 degrees relative to Earth/ecliptic plane)
    orreryScene.orbitPlane = new THREE.Group();
    orreryScene.orbitPlane.rotation.z = 5.14 * Math.PI / 180;
    orreryScene.scene.add(orreryScene.orbitPlane);

    // Draw the orbit ring line
    const orbitRingGeo = new THREE.RingGeometry(8, 8.05, 64);
    const orbitRingMat = new THREE.MeshBasicMaterial({ color: 0x125dff, side: THREE.DoubleSide });
    orreryScene.moonOrbit = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orreryScene.moonOrbit.rotation.x = Math.PI / 2;
    orreryScene.orbitPlane.add(orreryScene.moonOrbit);

    // Add Moon (Sphere)
    const moonGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const moonMat = new THREE.MeshPhongMaterial({ color: 0x888888, emissive: 0x111111 });
    orreryScene.moon = new THREE.Mesh(moonGeo, moonMat);
    orreryScene.orbitPlane.add(orreryScene.moon);

    // Draw Line of Nodes
    const nodesLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-12, 0, 0),
        new THREE.Vector3(12, 0, 0)
    ]);
    const nodesLineMat = new THREE.LineBasicMaterial({ color: 0x28a745, linewidth: 2 });
    orreryScene.nodesLine = new THREE.Line(nodesLineGeo, nodesLineMat);
    orreryScene.scene.add(orreryScene.nodesLine);

    // Create Globe mode shadow projected disc
    const shadowDiscGeo = new THREE.RingGeometry(0.1, 0.4, 32);
    const shadowDiscMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, opacity: 0.9, transparent: true });
    orreryScene.globeShadowDisc = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
    orreryScene.globeShadowDisc.visible = false;
    orreryScene.scene.add(orreryScene.globeShadowDisc);

    // Resize event
    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        orreryScene.camera.aspect = w / h;
        orreryScene.camera.updateProjectionMatrix();
        orreryScene.renderer.setSize(w, h);
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        orreryScene.controls.update();
        if (orreryScene.earth) {
            orreryScene.earth.rotation.y += 0.001;
        }
        orreryScene.renderer.render(orreryScene.scene, orreryScene.camera);
    }
    animate();
}

/**
 * Update the orrery Moon position based on a slider value (0–100).
 * @param {number} sliderVal – the timeline percentage [0, 100].
 * @param {Date} date – current simulation date for globe-mode shadow projection.
 * @param {Object} currentEvent – the currently selected eclipse event object.
 */
function updateOrreryOrbits(sliderVal, date, currentEvent) {
    const angle = (sliderVal / 100) * 2 * Math.PI;

    if (orreryScene.isGlobeMode) {
        // Globe Mode: project shadow onto rotating 3D Earth
        if (currentEvent && currentEvent.type === 'solar') {
            const shadow = AstronomyHelper.calculateShadowCenter(date);
            if (shadow) {
                const latRad = shadow.lat * Math.PI / 180;
                const lonRad = shadow.lon * Math.PI / 180;
                const R = 3.02;
                const x = R * Math.cos(latRad) * Math.cos(lonRad);
                const y = R * Math.sin(latRad);
                const z = -R * Math.cos(latRad) * Math.sin(lonRad);
                orreryScene.globeShadowDisc.position.set(x, y, z);
                orreryScene.globeShadowDisc.lookAt(new THREE.Vector3(0, 0, 0));
                orreryScene.globeShadowDisc.visible = true;
            } else {
                orreryScene.globeShadowDisc.visible = false;
            }
        }
    } else {
        // Orrery Mode: place Moon on its orbit
        const radius = 8.0;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        orreryScene.moon.position.set(x, 0, z);
    }
}

/**
 * Toggle between Orrery and Globe modes.
 */
function toggleOrreryMode() {
    orreryScene.isGlobeMode = !orreryScene.isGlobeMode;
    if (orreryScene.isGlobeMode) {
        orreryScene.earth.position.set(0, 0, 0);
        orreryScene.earth.scale.set(3, 3, 3);
        orreryScene.moon.visible = false;
        orreryScene.moonOrbit.visible = false;
        orreryScene.orbitPlane.visible = false;
        if (orreryScene.nodesLine) orreryScene.nodesLine.visible = false;
        if (orreryScene.globeShadowDisc) orreryScene.globeShadowDisc.visible = true;
    } else {
        orreryScene.earth.position.set(0, 0, 0);
        orreryScene.earth.scale.set(1.5, 1.5, 1.5);
        orreryScene.moon.visible = true;
        orreryScene.moonOrbit.visible = true;
        orreryScene.orbitPlane.visible = true;
        if (orreryScene.nodesLine) orreryScene.nodesLine.visible = true;
        if (orreryScene.globeShadowDisc) orreryScene.globeShadowDisc.visible = false;
    }
}
