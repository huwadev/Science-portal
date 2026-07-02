document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d');
    const radiusInput = document.getElementById('planet-radius');
    const speedInput = document.getElementById('orbital-speed');
    const noiseInput = document.getElementById('noise-level');
    
    const radiusVal = document.getElementById('radius-val');
    const speedVal = document.getElementById('speed-val');
    const noiseVal = document.getElementById('noise-val');
    
    const tFlux = document.getElementById('t-flux');
    const tDepth = document.getElementById('t-depth');
    const tEstRadius = document.getElementById('t-est-radius');
    
    const audioToggle = document.getElementById('audio-toggle');
    const resetChartBtn = document.getElementById('reset-chart');

    // Chart Setup
    const chartCanvas = document.getElementById('lightCurveChart').getContext('2d');
    const maxDataPoints = 300;
    
    // Create gradient for chart line (Cosmic Blue theme)
    const gradient = chartCanvas.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(222, 235, 255, 0.5)'); // Secondary
    gradient.addColorStop(1, 'rgba(18, 93, 255, 0.05)'); // Primary

    const lightCurveChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Relative Flux',
                data: [],
                borderColor: '#125DFF',
                backgroundColor: gradient,
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: {
                    display: false // hide time axis ticks
                },
                y: {
                    min: 0.6,
                    max: 1.05,
                    grid: {
                        color: 'rgba(222, 235, 255, 0.1)'
                    },
                    ticks: {
                        color: '#C4C4C4'
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Audio Context (Web Audio API for Sonification)
    let audioCtx = null;
    let oscillator = null;
    let gainNode = null;
    let isAudioEnabled = false;

    function initAudio() {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 440; // Base freq A4
        
        gainNode.gain.value = 0.1; // Keep it quiet
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
    }

    audioToggle.addEventListener('click', () => {
        if (!isAudioEnabled) {
            if (!audioCtx) initAudio();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            gainNode.gain.setTargetAtTime(0.1, audioCtx.currentTime, 0.1);
            isAudioEnabled = true;
            audioToggle.classList.add('active');
        } else {
            gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
            isAudioEnabled = false;
            audioToggle.classList.remove('active');
        }
    });

    // Simulation State
    const simState = {
        starRadius: 100, // Pixels
        orbitRadiusX: 220,
        orbitRadiusY: 50,
        angle: 0, // Current position
        time: 0
    };

    // Math: Circle intersection area
    function getIntersectionArea(d, r, R) {
        if (d >= R + r) return 0; // No overlap
        if (d <= R - r) return Math.PI * r * r; // Complete transit
        
        // Partial transit
        const p1 = r * r * Math.acos((d * d + r * r - R * R) / (2 * d * r));
        const p2 = R * R * Math.acos((d * d + R * R - r * r) / (2 * d * R));
        const p3 = 0.5 * Math.sqrt((-d + r + R) * (d + r - R) * (d - r + R) * (d + r + R));
        return p1 + p2 - p3;
    }

    // Main Loop
    function animate() {
        const pRadiusRatio = parseFloat(radiusInput.value);
        const pRadiusPx = simState.starRadius * pRadiusRatio;
        const speed = parseFloat(speedInput.value) * 0.02;
        const noiseBase = parseFloat(noiseInput.value);

        // Update values UI
        radiusVal.innerHTML = `${pRadiusRatio.toFixed(2)} R<sub>s</sub>`;
        speedVal.innerText = `${speedInput.value}x`;
        noiseVal.innerText = `${(noiseBase * 100).toFixed(1)}%`;

        // Update position
        simState.angle -= speed;
        if (simState.angle < -Math.PI * 2) simState.angle += Math.PI * 2;

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        
        const px = cx + Math.cos(simState.angle) * simState.orbitRadiusX;
        const py = cy + Math.sin(simState.angle) * simState.orbitRadiusY;
        
        // Add visual noise to the star's glowing gradient
        const noise = (Math.random() * 2 - 1) * noiseBase;
        const visualFlicker = 1 + noise;

        // Z-index logic: planet is in front when it's in the lower half of the orbit (Y > center Y)
        const isFront = Math.sin(simState.angle) > 0;
        
        // 3D Perspective scaling based on depth
        const zScale = 1 + Math.sin(simState.angle) * 0.3;
        const scaledRadiusPx = pRadiusPx * zScale;

        // Draw Canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Star Shadow/Glow with noise flicker
        const gradientStar = ctx.createRadialGradient(cx, cy, 0, cx, cy, simState.starRadius * 1.5 * visualFlicker);
        gradientStar.addColorStop(0, '#FFFFFF');
        gradientStar.addColorStop(0.2, '#DEEBFF');
        gradientStar.addColorStop(0.8, `rgba(18, 93, 255, ${0.2 * visualFlicker})`);
        gradientStar.addColorStop(1, 'transparent');

        // Draw Planet Behind (if needed)
        if (!isFront) {
            ctx.beginPath();
            ctx.arc(px, py, scaledRadiusPx, 0, Math.PI * 2);
            ctx.fillStyle = '#125DFF'; // Bright cosmic blue so it's visible in the distance
            ctx.fill();
            ctx.strokeStyle = '#DEEBFF';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw Star
        ctx.beginPath();
        ctx.arc(cx, cy, simState.starRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradientStar;
        ctx.fill();

        // Draw Planet In Front
        let intersectionArea = 0;
        if (isFront) {
            ctx.beginPath();
            ctx.arc(px, py, scaledRadiusPx, 0, Math.PI * 2);
            ctx.fillStyle = '#021034'; // Dark silhouette
            ctx.fill();
            ctx.strokeStyle = '#125DFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Calculate overlap (using unscaled radius so math matches the physical properties)
            const dist = Math.sqrt(Math.pow(px - cx, 2) + Math.pow(py - cy, 2));
            intersectionArea = getIntersectionArea(dist, pRadiusPx, simState.starRadius);
        }

        // Calculate Flux
        const starArea = Math.PI * simState.starRadius * simState.starRadius;
        let theoreticalFlux = 1.0 - (intersectionArea / starArea);
        
        // Apply Noise calculated earlier
        const finalFlux = theoreticalFlux + noise;

        // Update Telemetry UI
        tFlux.innerText = finalFlux.toFixed(4);
        
        const currentDepth = (1.0 - theoreticalFlux) * 100;
        
        // Hold the maximum depth for readability
        if (currentDepth > 0.01) {
            if (!simState.inTransit) {
                simState.maxDepth = 0; // Reset for new transit
                simState.inTransit = true;
            }
            if (currentDepth > simState.maxDepth) {
                simState.maxDepth = currentDepth;
            }
        } else {
            simState.inTransit = false;
        }

        // Display the peak depth achieved in the current/last transit
        const displayDepth = simState.maxDepth || 0;
        tDepth.innerText = `${displayDepth.toFixed(2)}%`;
        
        // Estimate radius from the peak depth: sqrt(depth) = Rp/Rs
        const estRadiusRatio = Math.sqrt(displayDepth / 100);
        tEstRadius.innerHTML = `${estRadiusRatio.toFixed(2)} R<sub>s</sub>`;

        // Update Chart
        simState.time++;
        lightCurveChart.data.labels.push(simState.time);
        lightCurveChart.data.datasets[0].data.push(finalFlux);

        if (lightCurveChart.data.labels.length > maxDataPoints) {
            lightCurveChart.data.labels.shift();
            lightCurveChart.data.datasets[0].data.shift();
        }
        lightCurveChart.update();

        // Sonification
        if (isAudioEnabled && oscillator) {
            // Map flux (0.6 - 1.05) to frequency (e.g. 200Hz - 600Hz)
            const minFreq = 220;
            const maxFreq = 660;
            const normalizedFlux = (finalFlux - 0.6) / (1.05 - 0.6);
            const targetFreq = minFreq + normalizedFlux * (maxFreq - minFreq);
            oscillator.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.05);
        }

        requestAnimationFrame(animate);
    }

    resetChartBtn.addEventListener('click', () => {
        lightCurveChart.data.labels = [];
        lightCurveChart.data.datasets[0].data = [];
        lightCurveChart.update();
        simState.time = 0;
    });

    // Start Simulation
    animate();
});
