/**
 * The Cosmic Distance Ladder - Main Application
 */

const RUNGS = [
    {
        id: 1,
        title: "Size of the Earth",
        scientist: "Eratosthenes (~240 BC)",
        history: `Eratosthenes heard that in the city of Syene, the sun shone directly down a well at noon on the summer solstice, casting no shadow. In his own city of Alexandria, a vertical rod cast a shadow. By measuring this shadow, he deduced the curvature, and thus the circumference, of the Earth.`,
        equation: `$$ C = \\frac{360^\\circ}{\\theta} \\times s $$`,
        legend: [
            `\\(C\\): Circumference of the Earth (km)`,
            `\\(\\theta\\): Shadow angle difference (\\(^\\circ\\))`,
            `\\(s\\): Distance between cities (km)`
        ],
        instruction: "Adjust the shadow angle to match the observatory reading (7.2°) and set the distance between Syene and Alexandria (800 km) to calculate the Earth's circumference.",
        calcLabel: "Your Calculation (<i>C</i>):",
        controls: [
            { id: "angle", label: "Shadow Angle (θ)", min: 1, max: 15, step: 0.1, value: 1.0, unit: "°" },
            { id: "distance", label: "Distance (s)", min: 100, max: 2000, step: 10, value: 500, unit: " km" }
        ],
        calculate: (vals) => {
            return (360 / vals.angle) * vals.distance;
        },
        verify: (result) => {
            // Correct answer is roughly 40,000 km
            return Math.abs(result - 40000) < 500; 
        },
        successMsg: "Correct! The Earth's circumference is approximately 40,000 km.",
        telemetry: [
            { lbl: "OBSERVATION", val: "Alexandria Shadow" },
            { lbl: "READING", val: "7.2°", id: "sim-reading" }
        ]
    },
    {
        id: 2,
        title: "Size of the Moon",
        scientist: "Aristarchus (~270 BC)",
        history: `During a lunar eclipse, Aristarchus observed the Earth's curved shadow passing across the Moon. By estimating the curvature of the shadow relative to the Moon's own curve, he deduced that the Earth's shadow (and thus the Earth itself) was about 3.5 times wider than the Moon. Since we now know the Earth's diameter from the previous rung, we can calculate the absolute size of the Moon.`,
        equation: `$$ D_{moon} \\approx \\frac{D_{earth}}{Ratio} $$`,
        legend: [
            `\\(D_{moon}\\): Diameter of the Moon (km)`,
            `\\(D_{earth}\\): Diameter of the Earth (12,732 km)`,
            `\\(Ratio\\): Ratio of Earth's shadow to Moon's diameter`
        ],
        instruction: "Observe the lunar eclipse in the Observatory. Estimate how many times the Moon could fit across the width of the Earth's shadow curve, then calculate the Moon's diameter.",
        calcLabel: "Your Calculation (<i>D<sub>moon</sub></i>):",
        controls: [
            { id: "ratio", label: "Shadow Ratio", min: 1.0, max: 6.0, step: 0.05, value: 1.0, unit: "x" }
        ],
        calculate: (vals) => {
            // Earth's diameter is fixed at Eratosthenes' value (12,732 km)
            return 12732 / vals.ratio;
        },
        verify: (result) => {
            // Correct answer is roughly 3474 km
            return Math.abs(result - 3474) < 400; 
        },
        successMsg: "Correct! The Moon's diameter is roughly 3,474 km, about a quarter the size of Earth.",
        telemetry: [
            { lbl: "OBSERVATION", val: "Lunar Eclipse" },
            { lbl: "ECLIPSE PHASE", val: "Partial", id: "sim-eclipse-phase" }
        ]
    },
    {
        id: 3,
        title: "Distance to the Moon",
        scientist: "Aristarchus & Hipparchus",
        history: `To calculate the distance to the Moon, we first need to measure its <strong>angular size</strong> (θ) in the sky. While a small coin held at arm's length (<i>L</i><sub>coin</sub>) can be adjusted to perfectly cover the Moon, astronomers use a <strong>Sextant</strong> to do this precisely. By measuring the angle where the reflected Moon just sits tangent to the direct Moon (limb-to-limb), we find its angular size and use similar triangles to solve for the distance.`,
        equation: `$$ d \\approx \\frac{D_{moon}}{\\tan(\\theta)} $$ $$ \\theta = 2 \\arctan\\left(\\frac{d_{coin}}{2 L_{coin}}\\right) $$`,
        legend: [
            `\\(d\\): Distance to the Moon (km)`,
            `\\(D_{moon}\\): Diameter of the Moon (3,474 km)`,
            `\\(\\theta\\): Measured Angular Size (\\(^\\circ\\))`,
            `\\(d_{coin}\\): Coin Diameter (2.0 cm)`,
            `\\(L_{coin}\\): Coin Distance from Eye`
        ],
        instruction: "Slide the coin away from your eye until the sightlines line up with the Moon, and look through the sextant viewfinder to verify the direct and reflected Moons touch edge-to-edge.",
        calcLabel: "Your Calculation (<i>d</i>):",
        controls: [
            { id: "coin_dist", label: "Coin Dist. / Angle", min: 50, max: 300, step: 1, value: 100, unit: " cm", 
              formatValue: (val) => {
                  const thetaDeg = 2 * Math.atan(2.0 / (2 * val)) * 180 / Math.PI;
                  return `${val} cm (${thetaDeg.toFixed(2)}°)`;
              }
            }
        ],
        calculate: (vals) => {
            const coinDiameter = 2.0; // cm
            const thetaRad = 2 * Math.atan(coinDiameter / (2 * vals.coin_dist));
            const moonDiameter = 3474; // km
            return moonDiameter / Math.tan(thetaRad);
        },
        verify: (result) => {
            // Target is ~229 cm which gives ~0.50 degrees and ~398,000 km
            return result > 380000 && result < 420000;
        },
        successMsg: "Incredible! You've successfully measured the distance to the Moon using a Sextant and the similar-triangle coin method!",
        telemetry: [
            { lbl: "COIN DISTANCE", val: "100 cm" },
            { lbl: "SEXTANT ANGLE", val: "1.15°", id: "sim-angular-size" }
        ]
    },
    {
        id: 4,
        title: "Distance to the Sun",
        scientist: "Aristarchus (~270 BC)",
        history: `When the Moon is exactly half-illuminated (Dichotomy), the angle between the Earth, Moon, and Sun forms a perfect 90° right triangle. By measuring the angle (<i>φ</i>) between the Sun and the Moon in the sky, Aristarchus used basic trigonometry to calculate how much further away the Sun is compared to the Moon.`,
        equation: `$$ D_{sun} = \\frac{d}{\\cos(\\phi)} $$`,
        legend: [
            `\\(D_{sun}\\): Distance to the Sun (km)`,
            `\\(d\\): Distance to the Moon (398,000 km)`,
            `\\(\\phi\\): Angle between Sun and Moon (\\(^\\circ\\))`
        ],
        instruction: "Slide the angle to match Aristarchus' historical measurement of 87.0° to complete this phase. Then try pushing it to the true modern value (89.85°) to see how incredibly distant the Sun actually is!",
        calcLabel: "Your Calculation (<i>D<sub>sun</sub></i>):",
        controls: [
            { id: "angle_phi", label: "Measured Angle (φ)", min: 0.0, max: 89.9, step: 0.1, value: 0.0, unit: "°" }
        ],
        calculate: (vals) => {
            const moonDist = 398000; // km
            const phiRad = vals.angle_phi * Math.PI / 180;
            return Math.round(moonDist / Math.cos(phiRad));
        },
        verify: (result) => {
            // Target is ~7.6M km (Aristarchus' 87 degrees) -> 398000 / cos(87) = 7,605,690
            const historicResult = 398000 / Math.cos(87 * Math.PI / 180);
            return result >= (historicResult - 100000);
        },
        successMsg: "Fantastic! You've used geometry to estimate the distance to the Sun. Aristarchus' measurement (87°) gave a distance 19 times further than the Moon, but the true angle (89.85°) means it's actually 400 times further!",
        telemetry: [
            { lbl: "OBSERVATION", val: "Half Moon" },
            { lbl: "ANGLE φ", val: "85.0°", id: "sim-phi" }
        ]
    },
    {
        id: 5,
        title: "Diameter of the Sun",
        scientist: "Pinhole Camera Method",
        history: "Now that we know the distance to the Sun relative to the Moon (from Phase 4) and the absolute distance to the Moon (from Phase 3), we can measure the Sun's true physical diameter. By projecting the Sun's light through a small pinhole onto a screen, we create two similar triangles. The ratio of the projected image diameter ($d$) to the projection distance ($L$) is exactly equal to the ratio of the Sun's actual diameter ($D_{sun\\_actual}$) to its distance.",
        equation: "$D_{sun\\_actual} = D_{sun} \\cdot \\frac{d}{L}$",
        legend: [
            "$D_{sun\\_actual}$ : Actual diameter of the Sun (km)",
            "$D_{sun}$ : Distance to Sun (~149,600,000 km)",
            "$d$ : Projected image diameter (cm)",
            "$L$ : Pinhole to screen distance (cm)"
        ],
        instruction: "Use the caliper slider to measure the diameter ($d$) of the projected image on the screen. The screen is placed exactly $100$ cm from the pinhole.",
        calcLabel: "Your Calculation (<i>D<sub>sun_actual</sub></i>):",
        controls: [
            { id: "image_dia", label: "Caliper Size (d)", min: 0.1, max: 2.0, step: 0.01, value: 1.50, unit: " cm" }
        ],
        calculate: (vals) => {
            const D_sun = 149600000; // km
            const L = 100; // fixed 100 cm
            const d = vals["image_dia"];
            return D_sun * (d / L);
        },
        verify: (result) => {
            return result >= 1350000 && result <= 1450000;
        },
        successMsg: "Incredible! You've used a simple pinhole and similar triangles to prove that the Sun is a gigantic sphere over 1.39 million kilometers wide—more than 100 times wider than the Earth!",
        telemetry: [
            { lbl: "SCREEN DIST (L)", val: "100 cm" },
            { lbl: "CALIPER (d)", val: "1.50 cm", id: "sim-image-dia" }
        ]
    },
    {
        id: 6,
        title: "Parallax of Mars",
        scientist: "Cassini & Richer (1672)",
        history: "In 1672, Cassini and Richer measured the position of Mars against background stars from two locations: Paris and French Guiana. This 'parallax shift' allowed them to triangulate the absolute distance to Mars. Since Johannes Kepler had just mapped out the relative scale of the solar system using his Third Law of Planetary Motion, finding the absolute distance to Mars instantly unlocked the absolute distance to the Sun!",
        equation: "$D_{Mars} = \\frac{B}{\\tan(\\theta)}$",
        legend: [
            "$D_{Mars}$ : Absolute distance to Mars (km)",
            "$B$ : Baseline distance between Paris & Guiana (~7,000 km)",
            "$\\theta$ : Parallax angle"
        ],
        instruction: "Slide the parallax angle ($\\theta$) to match the observation of Mars shifting against the stars. Once you find the true angle (~12.48 arcseconds), calculate the average distance to Mars, and see how it relates to Astronomical Units!",
        calcLabel: "Your Calculation (<i>Mars Dist in km</i>):",
        controls: [
            { id: "parallax_angle", label: "Parallax Angle (θ)", min: 5, max: 20, step: 0.01, value: 20, unit: " arcsec" }
        ],
        calculate: (vals) => {
            const B = 7000.03456; // Precise km for 115,693,400 target
            const thetaArcsec = vals["parallax_angle"];
            const thetaRad = (thetaArcsec / 3600) * (Math.PI / 180);
            return B / Math.tan(thetaRad); // Yields distance to Mars
        },
        verify: (result) => {
            return result >= 115000000 && result <= 116000000;
        },
        successMsg: "Incredible! By measuring the 12.48-arcsecond shift of Mars from two points on Earth, you found the absolute average distance to Mars (~115.7 million km) and used Kepler's ratio to calculate the true size of 1 Astronomical Unit (~150 million km). The Solar System finally has an absolute scale!",
        telemetry: [
            { lbl: "BASELINE (B)", val: "7,000 km" },
            { lbl: "MARS DIST", val: "???", id: "sim-mars-dist" },
            { lbl: "MARS DIST (AU)", val: "???", id: "sim-mars-au" }
        ]
    },
    {
        id: 7,
        title: "Transit of Venus",
        scientist: "Edmond Halley & Int. Teams (1761)",
        history: "In the 18th century, astronomers traveled across the globe to time the transit of Venus across the Sun. By observing from drastically different latitudes, Venus appeared to take a slightly different path across the solar disk. Measuring this parallax shift finally yielded a highly accurate Astronomical Unit!",
        equation: "$\\theta = \\frac{\\Delta y}{D_{sun}}$ (Simplified)",
        legend: [
            "$\\theta$ : Parallax Shift (arcseconds)",
            "$\\Delta y$ : Distance between transit chords",
            "$D_{sun}$ : Absolute Distance to Sun"
        ],
        instruction: "Observe Venus transiting the Sun from both the Northern and Southern hemispheres. Use the caliper to measure the angular shift ($\\theta$) between the two transit paths! (Target: ~40 arcseconds)",
        calcLabel: "Your Calculation (<i>D<sub>sun</sub></i> in km):",
        controls: [
            { id: "transit_shift", label: "Transit Shift (θ)", min: 10, max: 70, step: 0.1, value: 70, unit: " arcsec" }
        ],
        calculate: (vals) => {
            // Simplified calculation: If shift is 40 arcsec, map it to 149.6M km
            const theta = vals["transit_shift"];
            return 149597870 * (40.0 / theta);
        },
        verify: (result) => {
            return result >= 148000000 && result <= 151000000;
        },
        successMsg: "Fantastic! By measuring the parallax shift of Venus across the Sun's disk, you've deduced a highly accurate Astronomical Unit, culminating centuries of geometric measurements!",
        telemetry: [
            { lbl: "OBSERVED SHIFT", val: "???", id: "sim-transit-shift" },
            { lbl: "CALCULATED AU", val: "???", id: "sim-transit-au" }
        ]
    },
    {
        id: 8,
        title: "Distance to the Stars",
        scientist: "Friedrich Bessel (1838)",
        history: `With the Astronomical Unit (AU) established, astronomers had a baseline large enough to measure the distance to nearby stars. By observing a star (like 61 Cygni) from opposite sides of Earth's orbit (6 months apart), the star appears to shift slightly against the far background stars. This tiny angle is the "Stellar Parallax".`,
        equation: `$$ d = \\frac{1}{p} $$`,
        legend: [
            `\\(d\\): Distance to the star in Parsecs (pc)`,
            `\\(p\\): Parallax angle in arcseconds (")`,
            `\\(1 pc \\approx 3.26 \\text{ Light Years}\\)`
        ],
        instruction: "Observe the foreground star against the background grid. Adjust the parallax angle slider to match the total observed shift between January and July to calculate its distance.",
        calcLabel: "Your Calculation (<i>d</i> in pc):",
        controls: [
            { id: "parallax", label: "Parallax Shift", min: 0.1, max: 2.0, step: 0.1, value: 0.1, unit: "''" }
        ],
        calculate: (vals) => {
            return (1 / (vals.parallax / 2)).toFixed(2); // shift is total, parallax p is half-shift
        },
        verify: (result) => {
            return Math.abs(result - 2.85) < 0.2; // 61 Cygni is ~3.48 pc, let's use 0.7 arcsec total shift => p=0.35 => d=2.85
        },
        successMsg: "Correct! You've measured the distance to another star using the Earth's orbit as a baseline.",
        telemetry: [
            { lbl: "OBSERVATION", val: "Star 61 Cygni" },
            { lbl: "SHIFT (JAN-JUL)", val: "0.0''", id: "sim-reading" }
        ]
    },
    {
        id: 9,
        title: "Spectroscopic Parallax",
        scientist: "Ejnar Hertzsprung & Henry Norris Russell (1911)",
        history: "Stellar parallax only works for stars within a few hundred parsecs. Hertzsprung and Russell noticed that main-sequence stars of a given spectral class (or color) have a fixed absolute magnitude ($M$). By plotting the <strong>apparent magnitudes ($m$)</strong> of stars in a distant cluster (like the Pleiades) and shifting them vertically to align with a calibrated <strong>H-R Diagram</strong> of a nearby cluster (like the Hyades), we can find the <strong>distance modulus ($m - M$)</strong> and determine their distance!",
        equation: "$$ d = 10^{\\frac{(m - M) + 5}{5}} $$",
        legend: [
            "\\(d\\): Distance in Parsecs (pc)",
            "\\(m - M\\): Distance Modulus (offset in magnitudes)"
        ],
        instruction: "<strong>Step 1 (Hyades Calibration):</strong> Click the 11 glowing stars in the viewfinder. For each star, analyze its spectrum (Wien's Law) and measure its apparent B and V magnitudes to find the Color Index (B-V), then plot it. Observe stars from all major categories (Supergiant, Giant, Main Sequence, White Dwarf) to build a complete H-R Diagram map.<br/><br/><strong>Step 2 (Pleiades Observation):</strong> Point telescope to the Pleiades. Perform spectrometry and photometry on the stars to find their temperature. Parallax is too distant to measure, so plot them at apparent magnitudes (m).<br/><br/><strong>Step 3 (Curve Fitting):</strong> Slide the Distance Modulus slider in the sidebar to vertically align the Pleiades stars with the calibrated Hyades curve, then calculate the final distance (~136 pc) to complete the rung.",
        calcLabel: "Your Calculation (<i>d</i> in pc):",
        controls: [
            { 
                id: "dist_mod", 
                label: "Distance Modulus (m-M)", 
                min: 3.5, 
                max: 8.5, 
                step: 0.05, 
                value: 5.0, 
                unit: " mag",
                formatValue: (val) => {
                    const mod = parseFloat(val);
                    const pc = Math.round(Math.pow(10, (mod + 5) / 5));
                    const ly = Math.round(pc * 3.26156);
                    return `${mod.toFixed(2)} mag (Distance: ${pc.toLocaleString()} pc / ${ly.toLocaleString()} ly)`;
                }
            }
        ],
        calculate: (vals) => {
            return Math.round(Math.pow(10, (vals.dist_mod + 5) / 5));
        },
        verify: (result) => {
            // Target modulus is 5.67 => target dist is ~136 pc.
            return Math.abs(result - 136) < 10 && hrState.step === 4;
        },
        successMsg: "Superb! You have aligned the Pleiades main sequence with the Hyades, finding a distance modulus of ~5.65 magnitudes. This reveals a distance of ~135 parsecs (~440 light years) to the Pleiades cluster, unlocking Spectroscopic Parallax!",
        telemetry: [
            { lbl: "CLUSTER", val: "Pleiades (M45)" },
            { lbl: "CALIBRATION REFERENCE", val: "Hyades Cluster" },
            { lbl: "DISTANCE MODULUS", val: "5.00 mag", id: "sim-hr-modulus" },
            { lbl: "CALCULATED DIST", val: "??? pc", id: "sim-hr-reading" }
        ]
    },
    {
        id: 10, title: "Distance to Galaxies",
        scientist: "Henrietta Swan Leavitt (1908)",
        history: `Stellar parallax only works for nearby stars. For distant galaxies, we need <strong>"Standard Candles"</strong>. Leavitt noticed that Cepheid variable stars in the Small Magellanic Cloud (SMC) pulsed at rates directly tied to their apparent brightness. Assuming we know the distance to the SMC using previous methods, she realized their pulse period can be directly calibrated to their <strong>true brightness (Absolute Magnitude, M)</strong>! By comparing true brightness to how dim it appears (Apparent Magnitude, m), we can calculate its immense distance!`,
        equation: `$$ d = 10^{\\frac{m - M + 5}{5}} $$`,
        legend: [
            `\\(d\\): Distance in Parsecs (pc)`,
            `\\(m\\): Apparent Magnitude (how dim it looks)`,
            `\\(M\\): Absolute Magnitude (true brightness)`
        ],
        instruction: "<strong>Step 1 (SMC Calibration):</strong> Toggle 2D view. Click Stars A, B, and C in the viewfinder. <br/>1. Use the Apparent Mag slider to measure the mean magnitude of the selected star.<br/>2. Use the Period slider to measure the time difference between consecutive peaks on the light curve. Match both values to plot the star.<br/><br/><strong>Step 2 (Andromeda V1 Measurement):</strong> Click 'Observe Andromeda V1'. <br/>1. Adjust the Apparent Mag slider (~19.00 mag) and Period slider (~31.4 days).<br/>2. Read its Absolute Mag from the PL Diagram trend line (M = -5.50). Adjust the Absolute Mag (M) slider to match it and calculate the distance.",
        calcLabel: "Your Calculation (<i>d</i> in pc):",
        controls: [
            { id: "app_mag", label: "Apparent Mag. (m)", min: 13.0, max: 21.0, step: 0.05, value: 17.00, unit: " mag" },
            { id: "period", label: "Period (P)", min: 2.0, max: 40.0, step: 0.1, value: 10.0, unit: " days" },
            { id: "abs_mag", label: "Absolute Mag. (M)", min: -7.0, max: -3.0, step: 0.05, value: -4.00, unit: " mag" }
        ],
        calculate: (vals) => {
            return Math.round(Math.pow(10, (vals.app_mag - vals.abs_mag + 5) / 5));
        },
        verify: (result) => {
            // Target is ~794,328 pc (m = 19.00, M = -5.50)
            return Math.abs(result - 794328) < 40000;
        },
        successMsg: "Brilliant! You've used Henrietta Leavitt's Period-Luminosity relation to measure the absolute distance to the Andromeda Galaxy (~2.5 million light years), proving once and for all that galaxies are separate 'island universes' far beyond our Milky Way!",
        telemetry: [
            { lbl: "STATUS", val: "Phase 1: Plot SMC Cepheids", id: "sim-status" },
            { lbl: "ACTIVE STAR", val: "SMC-Cepheid A", id: "sim-star" },
            { lbl: "PERIOD (MEASURED)", val: "5.0 days", id: "sim-period" },
            { lbl: "CALCULATED DIST", val: "??? pc", id: "sim-reading" }
        ]
    },
    {
        id: 11, title: "Distance to Venus (Radar)",
        scientist: "JPL / MIT Lincoln Lab (1961)",
        history: "To firmly determine the absolute scale of the solar system, scientists in 1961 bypassed ancient geometry entirely and bounced a radar signal off Venus. Knowing the speed of light ($c$), measuring the time-of-flight ($\\Delta t$) of the echo allowed them to calculate the exact distance to Venus in kilometers. From this single absolute measurement, Kepler's map was instantly converted into physical kilometers, unlocking the Astronomical Unit!",
        equation: "$D_{venus} = \\frac{c \\cdot \\Delta t}{2}$",
        legend: [
            "$D_{venus}$ : Distance to Venus (km)",
            "$c$ : Speed of Light (299,792.458 km/s)",
            "$\\Delta t$ : Radar Time-of-Flight (s)"
        ],
        instruction: "The radar pulse is continuously bouncing off Venus. Slide your timer to adjust the 'Receive Window'. When your timer perfectly aligns with the returning echo (~276.13 s), you lock onto the signal!",
        calcLabel: "Your Calculation (<i>D<sub>venus</sub></i> in km):",
        controls: [
            { id: "time_flight", label: "Receive Window (Δt)", min: 260, max: 290, step: 0.01, value: 260, unit: " s" }
        ],
        calculate: (vals) => {
            const c = 299792.458; // km/s
            const t = vals["time_flight"];
            return (c * t) / 2;
        },
        verify: (result) => {
            return result >= 41300000 && result <= 41400000;
        },
        successMsg: "Excellent! By perfectly synchronizing your receive window with the radar echo delay, you calculated the exact distance to Venus! Combining this with Kepler's orbital geometry locks in the absolute scale of the Astronomical Unit at ~149.6 million km!",
        telemetry: [
            { lbl: "RECEIVE WINDOW", val: "260.00 s", id: "sim-radar-window" },
            { lbl: "RADAR SYNC", val: "Searching...", id: "sim-radar-state" }
        ]
    },
    {
        id: 12, title: "Galaxy Scaling Relations",
        scientist: "Tully, Fisher, Faber & Jackson (1976-1977)",
        history: `Standard candles like Cepheids fade at extreme cosmological distances. In the late 1970s, astronomers discovered that a galaxy's overall physical properties could be used to determine its distance. For spiral galaxies, the <strong>Tully-Fisher relation</strong> links the rotation speed (measured from neutral hydrogen line width $W$) directly to its absolute magnitude ($M_B$). For elliptical galaxies, the <strong>Faber-Jackson relation</strong> links stellar velocity dispersion (random speed dispersion $\\sigma$, visible as line broadening) to absolute magnitude ($M_V$).`,
        equation: `$$ M_B = -10.2 \\log_{10}(W) + 6.25 \\quad \\text{(Spiral)} $$ <br/> $$ M_V = -9.0 \\log_{10}(\\sigma) + 0.70 \\quad \\text{(Elliptical)} $$`,
        legend: [
            `\\(W\\): Rotational velocity width (km/s)`,
            `\\(\\sigma\\): Velocity dispersion (km/s)`,
            `\\(M\\): Calculated absolute magnitude`,
            `\\(d = 10^{\\frac{m - M + 5}{5}} \\text{ pc} \\implies d_{\\text{Mpc}} = d / 10^6`
        ],
        instruction: "Select a galaxy tab and adjust the <strong>Spectral Width (W/σ)</strong> slider to align the measurement calipers with the spectral peaks (spirals) or fit the absorption broadening (ellipticals). The slider will snap when your measurement is accurate. The Absolute Magnitude (M) and Distance are calculated automatically. Click <strong>Verify</strong> to lock in each galaxy. Calibrate all 4 to complete this rung!",
        calcLabel: "Calculated Distance (Mpc):",
        controls: [
            { id: "spectral_width", label: "Spectral Width (W/σ)", min: 100, max: 700, step: 1, value: 150, unit: " km/s" }
        ],
        calculate: (vals) => {
            const gal = r12State.galaxies[r12State.activeGalaxyIndex];
            const W = parseFloat(vals.spectral_width);
            let M = 0;
            if (gal.type === 'spiral') {
                M = -10.2 * Math.log10(W) + 6.25;
            } else {
                M = -9.0 * Math.log10(W) + 0.70;
            }
            const m = gal.trueAppMag;
            const distPc = Math.pow(10, (m - M + 5) / 5);
            return Math.round((distPc / 1000000) * 100) / 100;
        },
        verify: (result) => {
            const activeIdx = r12State.activeGalaxyIndex;
            const gal = r12State.galaxies[activeIdx];
            const isCorrect = Math.abs(result - gal.trueDistMpc) / gal.trueDistMpc < 0.10;
            if (isCorrect) {
                gal.verified = true;
                const allDone = r12State.galaxies.every(g => g.verified);
                if (allDone) {
                    return true;
                } else {
                    const count = r12State.galaxies.filter(g => g.verified).length;
                    els.feedback.className = 'verification-feedback success';
                    els.feedback.textContent = `Correct distance measured for ${gal.name.split(' ')[0]}! (${count}/4 calibrated. Select another target to continue).`;
                    return "partial";
                }
            }
            return false;
        },
        successMsg: "Outstanding! You have successfully calibrated and applied the Tully-Fisher and Faber-Jackson relations across four distant galaxies. By linking structural dynamics directly to absolute magnitude, you measured distances out to 63 Megaparsecs (~200 million light years), establishing the intermediate rung of the cosmic distance ladder!",
        telemetry: [
            { lbl: "ACTIVE GALAXY", val: "NGC 224 (M31)", id: "sim-r12-name" },
            { lbl: "GALAXY TYPE", val: "Spiral", id: "sim-r12-type" },
            { lbl: "ABS MAG (M)", val: "??? mag", id: "sim-r12-absmag" },
            { lbl: "STATUS", val: "0 / 4 Measured", id: "sim-r12-status" }
        ]
    },
    {
        id: 13, title: "Type Ia Supernovae",
        scientist: "Supernova Cosmology Project & High-Z Team (1998)",
        history: `Standard candles like Cepheids cannot be observed beyond a few tens of Megaparsecs. To probe cosmological distances across billions of light years, astronomers turn to Type Ia Supernovae. These stellar explosions occur in binary systems when a carbon-oxygen white dwarf accretes matter from its companion star until it reaches the Chandrasekhar limit (~1.4 solar masses), collapsing and triggering runaway nuclear fusion. Because they always explode at the same critical mass, their peak absolute magnitude is remarkably consistent ($M \\approx -19.3$ in the V-band). Comparing this to their peak apparent magnitude ($m$) yields their distance directly!`,
        equation: `$$ M \\approx -19.3 \\quad \\text{(Peak Absolute Magnitude)} $$ <br/> $$ d = 10^{\\frac{m - M + 5}{5}} \\text{ parsecs} \\implies d_{\\text{Mpc}} = 10^{\\frac{m - 5.7}{5}} $$`,
        legend: [
            `\\(M\\): Peak absolute magnitude of Type Ia SN (fixed at \\(-19.3\\))`,
            `\\(m\\): Observed peak apparent magnitude in the V-band`,
            `\\(d\\): Calculated distance to the host galaxy`
        ],
        instruction: "Select a supernova tab and adjust the <strong>Peak Apparent Magnitude (m)</strong> slider to align the horizontal caliper line with the peak brightness of the observed light curve data points. The slider will snap and turn green when aligned. Click <strong>Verify</strong> to lock in the supernova. Calibrate all 3 to establish this cosmological rung!",
        calcLabel: "Calculated Distance (Mpc):",
        controls: [
            { id: "peak_mag", label: "Peak Apparent Mag (m)", min: 8.0, max: 16.0, step: 0.01, value: 10.0, unit: " mag" }
        ],
        calculate: (vals) => {
            const m = parseFloat(vals.peak_mag);
            const distMpc = Math.pow(10, (m - 5.7) / 5);
            return Math.round(distMpc * 10) / 10;
        },
        verify: (result) => {
            const activeIdx = r13State.activeSupernovaIndex;
            const sn = r13State.supernovae[activeIdx];
            const isCorrect = Math.abs(result - sn.trueDistMpc) / sn.trueDistMpc < 0.05;
            if (isCorrect) {
                sn.verified = true;
                const allDone = r13State.supernovae.every(s => s.verified);
                if (allDone) {
                    return true;
                } else {
                    const count = r13State.supernovae.filter(s => s.verified).length;
                    els.feedback.className = 'verification-feedback success';
                    els.feedback.textContent = `Correct peak magnitude measured for ${sn.name}! (${count}/3 supernovae calibrated. Select another target).`;
                    return "partial";
                }
            }
            return false;
        },
        successMsg: "Magnificent! You have calibrated and verified Type Ia Supernovae across three host galaxies, measuring distances up to 35 Megaparsecs (~114 million light years). By utilizing the consistent Chandrasekhar mass limit as a standard candle, you have reached cosmological scales and prepared the way for measuring the expansion history of the universe!",
        telemetry: [
            { lbl: "ACTIVE SN", val: "SN 2011fe", id: "sim-r13-name" },
            { lbl: "HOST GALAXY", val: "M101", id: "sim-r13-host" },
            { lbl: "PEAK APPARENT MAG", val: "??? mag", id: "sim-r13-peak" },
            { lbl: "STATUS", val: "0 / 3 Calibrated", id: "sim-r13-status" }
        ]
    },
    {
        id: 14, title: "Gravitational Wave Sirens",
        scientist: "LIGO & Virgo Collaborations (2017)",
        history: `For the first time in history, we can measure absolute cosmological distances without using the traditional distance ladder calibration! Merging compact binaries (black holes or neutron stars) emit gravitational waves. By measuring how the wave's frequency evolves over time (the "chirp" rate), we calculate the system's <strong>Chirp Mass</strong> (\\(\\mathcal{M}\\)). This directly reveals the intrinsic gravitational amplitude of the merger. Comparing this to the observed strain amplitude (\\(h(t)\\)) gives the absolute <strong>Luminosity Distance</strong> (\\(d_L\\)) directly, making these events self-calibrating <strong>Standard Sirens</strong>!`,
        equation: `$$ h(t) \\approx \\frac{4}{d_L} \\left( \\frac{G \\mathcal{M}}{c^2} \\right)^{5/3} \\left( \\frac{\\pi f(t)}{c} \\right)^{2/3} \\cos(\\Phi(t)) $$`,
        legend: [
            `\\(\\mathcal{M}\\): Chirp Mass of the binary (M☉)`,
            `\\(d_L\\): Luminosity Distance to the event (Mpc)`,
            `\\(f(t)\\): Gravitational wave frequency (Hz)`,
            `\\(h(t)\\): Observed strain amplitude at the detector`
        ],
        instruction: "Select a gravitational wave event tab. Adjust the <strong>Chirp Mass</strong> and <strong>Distance</strong> sliders to match the red template signal with the raw detector data (blue/cyan). The sliders will snap when your fit is correct. Click <strong>Verify</strong> to lock in each event. Calibrate all 3 to complete the Cosmic Distance Ladder!",
        calcLabel: "Luminosity Distance (Mpc):",
        controls: [
            { id: "chirp_mass", label: "Chirp Mass (\\(\\mathcal{M}\\))", min: 0.5, max: 100.0, step: 0.1, value: 10.0, unit: " M☉" },
            { id: "gw_distance", label: "Distance (\\(d_L\\))", min: 10, max: 8000, step: 10, value: 100, unit: " Mpc" }
        ],
        calculate: (vals) => {
            return parseFloat(vals.gw_distance);
        },
        verify: (result) => {
            const activeIdx = r14State.activeEventIndex;
            const ev = r14State.events[activeIdx];
            const inputMass = parseFloat(document.getElementById('input-chirp_mass').value);
            
            const massCorrect = Math.abs(inputMass - ev.trueChirpMass) / ev.trueChirpMass < 0.05;
            const distCorrect = Math.abs(result - ev.trueDistMpc) / ev.trueDistMpc < 0.10;
            
            if (massCorrect && distCorrect) {
                ev.verified = true;
                const allDone = r14State.events.every(e => e.verified);
                if (allDone) {
                    return true;
                } else {
                    const count = r14State.events.filter(e => e.verified).length;
                    els.feedback.className = 'verification-feedback success';
                    els.feedback.textContent = `Correct parameters measured for ${ev.name}! (${count}/3 events calibrated. Select another event).`;
                    return "partial";
                }
            } else if (distCorrect && !massCorrect) {
                els.feedback.className = 'verification-feedback error';
                els.feedback.textContent = `Distance is close, but the template frequency doesn't match the raw chirp. Adjust the Chirp Mass slider.`;
                return "partial";
            }
            return false;
        },
        successMsg: "Spectacular! You have completed the final rung of the cosmic distance ladder using Gravitational Wave Standard Sirens! By measuring both the chirp frequency evolution and the wave strain amplitude, you calculated absolute distances directly out to 5.3 Gigaparsecs (over 17 billion light years) without needing any intermediate standard candle calibration steps. This independent method marks a new era of gravitational wave cosmology!",
        telemetry: [
            { lbl: "ACTIVE EVENT", val: "GW150914", id: "sim-r14-name" },
            { lbl: "BINARY TYPE", val: "Binary Black Hole", id: "sim-r14-type" },
            { lbl: "CHIRP MASS", val: "??? M☉", id: "sim-r14-mass" },
            { lbl: "STATUS", val: "0 / 3 Measured", id: "sim-r14-status" }
        ]
    },
    {
        id: 15,
        title: "Tip of the Red Giant Branch",
        scientist: "Wendy Freedman & Teams (1990s-Present)",
        history: `To resolve the growing 'Hubble Tension' (the discrepancy between measurements of the expansion rate of the universe), astronomers needed a highly precise standard candle independent of Cepheids. They found it in the Tip of the Red Giant Branch (TRGB). By observing low-mass stars as they evolve and experience a core helium flash, we observe a very sharp cutoff in their maximum infrared luminosity, providing an incredibly clean cosmological distance indicator.`,
        equation: `$$ M_I \\approx -4.0 \\quad \\text{(F814W Peak Absolute Magnitude)} $$ <br/> $$ d_{\\text{Mpc}} = 10^{\\frac{m_I - M_I - 25}{5}} = 10^{\\frac{m_I - 21}{5}} $$`,
        legend: [
            `\\(M_I\\): Absolute magnitude of TRGB in I-band (fixed at \\(-4.0\\))`,
            `\\(m_I\\): Observed apparent magnitude of the red giant tip`,
            `\\(d_{\\text{Mpc}}\\): Distance in Megaparsecs`
        ],
        instruction: "Interactive simulation for this rung is coming soon! Switch to the <strong>📖 Wiki</strong> tab in the Observatory panel to explore the full mathematical derivation, worked examples, and historical background of the TRGB method.",
        calcLabel: "Distance (Mpc):",
        controls: [],
        comingSoon: true,
        calculate: () => "-",
        verify: () => true,
        successMsg: "TRGB method calibrated successfully!",
        telemetry: [
            { lbl: "METHOD", val: "Standard Candle (TRGB)" },
            { lbl: "STATUS", val: "Simulation Coming Soon" }
        ]
    },
    {
        id: 16,
        title: "Strong Lensing Time-Delays",
        scientist: "Sjur Refsdal (1964) & H0LiCOW (2010s)",
        history: `When a massive galaxy lies directly between us and a distant quasar, its gravity bends the spacetime around it, acting as a strong gravitational lens. This creates multiple paths for the light, projecting multiple images of the same quasar. Because these paths have different lengths and pass through different gravitational depths, any variation in the quasar's brightness reaches us at different times. Measuring this time delay ($ \\Delta t $) allows us to calculate the absolute size of the lens geometry and measure the Hubble constant directly.`,
        equation: `$$ \\Delta t = \\frac{1 + z_d}{c} \\frac{D_d D_s}{D_{ds}} \\Delta \\Phi $$`,
        legend: [
            `\\(\\Delta t\\): Time delay between images (days)`,
            `\\(D_d, D_s, D_{ds}\\): Angular diameter distances to lens, source, and between them`,
            `\\(\\Delta \\Phi\\): Difference in gravitational and geometric potentials`,
            `\\(z_d\\): Redshift of the lens galaxy`
        ],
        instruction: "Interactive simulation for this rung is coming soon! Switch to the <strong>📖 Wiki</strong> tab in the Observatory panel to explore the full mathematical derivation, worked examples, and historical background of Strong Lensing time-delays.",
        calcLabel: "Time Delay (days):",
        controls: [],
        comingSoon: true,
        calculate: () => "-",
        verify: () => true,
        successMsg: "Strong Lensing method calibrated successfully!",
        telemetry: [
            { lbl: "METHOD", val: "Gravitational Lensing" },
            { lbl: "STATUS", val: "Simulation Coming Soon" }
        ]
    },
    {
        id: 17,
        title: "Baryon Acoustic Oscillations",
        scientist: "SDSS / BOSS Collaborations (2005)",
        history: `In the hot, dense early universe, gravity and radiation pressure competed to create sound waves (acoustic oscillations) propagating through the primordial plasma. When the universe cooled and recombination occurred, these ripples froze in place, leaving a faint statistical footprint in the distribution of matter. Today, galaxies are slightly more likely to be separated by a characteristic separation scale of **150 Megaparsecs** ($490\\text{ million light-years}$), serving as a cosmic 'standard ruler.'`,
        equation: `$$ r_d = \\int_{z_d}^{\\infty} \\frac{c_s(z)}{H(z)} dz \\approx 150 \\text{ Mpc} $$`,
        legend: [
            `\\(r_d\\): Sound horizon scale at drag epoch (standard ruler)`,
            `\\(c_s(z)\\): Speed of sound in the early plasma`,
            `\\(H(z)\\): Expansion rate of the universe`
        ],
        instruction: "Interactive simulation for this rung is coming soon! Switch to the <strong>📖 Wiki</strong> tab in the Observatory panel to explore the full mathematical derivation, worked examples, and historical background of Baryon Acoustic Oscillations.",
        calcLabel: "Standard Ruler Size:",
        controls: [],
        comingSoon: true,
        calculate: () => "-",
        verify: () => true,
        successMsg: "BAO standard ruler calibrated successfully!",
        telemetry: [
            { lbl: "METHOD", val: "Standard Ruler (BAO)" },
            { lbl: "STATUS", val: "Simulation Coming Soon" }
        ]
    },
    {
        id: 18,
        title: "Cosmic Microwave Background",
        scientist: "Penzias & Wilson (1964) / Planck (2018)",
        history: `The Cosmic Microwave Background (CMB) is the thermal relic radiation from the recombination epoch when the universe was only 380,000 years old. By measuring the temperature fluctuations across the sky, cosmologists observe the frozen ripples of the early universe sound horizon. The angular size of the first peak in the CMB power spectrum sets a highly precise geometric standard ruler, anchoring the early-universe scale of the cosmos.`,
        equation: `$$ \\theta_* = \\frac{r_*}{D_M} \\approx 1.04^\\circ $$`,
        legend: [
            `\\(\\theta_*\\): Angular sound horizon scale in the CMB`,
            `\\(r_*\\): Physical sound horizon at recombination`,
            `\\(D_M\\): Comoving distance to the CMB screen`
        ],
        instruction: "Interactive simulation for this rung is coming soon! Switch to the <strong>📖 Wiki</strong> tab in the Observatory panel to explore the full mathematical derivation, worked examples, and historical background of the Cosmic Microwave Background.",
        calcLabel: "Angular Scale:",
        controls: [],
        comingSoon: true,
        calculate: () => "-",
        verify: () => true,
        successMsg: "CMB sound horizon calibrated successfully!",
        telemetry: [
            { lbl: "METHOD", val: "Primordial Radiation" },
            { lbl: "STATUS", val: "Simulation Coming Soon" }
        ]
    }
];

let currentRung = 1;
let r1ActiveCity = 'Alexandria';
let r2IsDragging = false;
let r2DragOffset = 0;
let r2MoonX = null;

// Rung 9 Asymmetric Cepheid Light Curve Factor
function getCepheidFactor(starId, phase) {
    const p = (phase % 1.0 + 1.0) % 1.0;
    if (starId === 'A') {
        // SMC-Cepheid A (P = 5.0 days): Short-period Cepheid
        // Rapid rise, smooth decline, no bump.
        const riseTime = 0.25;
        if (p < riseTime) {
            return -1.0 + 2.0 * Math.sin((p / riseTime) * Math.PI / 2);
        } else {
            return 1.0 - 2.0 * Math.sin(((p - riseTime) / (1.0 - riseTime)) * Math.PI / 2);
        }
    } else if (starId === 'B') {
        // SMC-Cepheid B (P = 15.0 days): Medium-period Cepheid
        // Hertzsprung progression bump on the descending branch (around phase 0.53)
        const peakPhase = 0.15;
        if (p < peakPhase) {
            return -1.0 + 2.0 * Math.sin((p / peakPhase) * Math.PI / 2);
        } else {
            const t = (p - peakPhase) / (1.0 - peakPhase);
            const baseDecay = 1.0 - 2.0 * t;
            const bump = 0.4 * Math.exp(-Math.pow((t - 0.45) / 0.12, 2));
            return baseDecay + bump;
        }
    } else if (starId === 'C') {
        // SMC-Cepheid C (P = 35.0 days): Long-period Cepheid
        // Very steep rise, slow decay
        const riseTime = 0.10;
        if (p < riseTime) {
            return -1.0 + 2.0 * Math.pow(p / riseTime, 0.5);
        } else {
            return 1.0 - 2.0 * Math.pow((p - riseTime) / (1.0 - riseTime), 1.2);
        }
    } else if (starId === 'V1') {
        // Andromeda V1 (P = 31.4 days): Long-period Cepheid
        // Very steep rise, slow decay
        const riseTime = 0.12;
        if (p < riseTime) {
            return -1.0 + 2.0 * Math.pow(p / riseTime, 0.6);
        } else {
            return 1.0 - 2.0 * Math.pow((p - riseTime) / (1.0 - riseTime), 1.3);
        }
    }
    return Math.sin(p * Math.PI * 2);
}

// Rung 9 Data
const cepheidData = {
    'A': { name: 'SMC-Cepheid A', period: 5.0, meanM: 16.2, amp: 0.5, phaseOffset: 0, baseR: 6 },
    'B': { name: 'SMC-Cepheid B', period: 15.0, meanM: 14.8, amp: 0.8, phaseOffset: 2000, baseR: 8 },
    'C': { name: 'SMC-Cepheid C', period: 35.0, meanM: 13.6, amp: 1.2, phaseOffset: 5000, baseR: 11 },
    'V1': { name: 'Andromeda V1', period: 31.4, meanM: 19.0, amp: 1.0, phaseOffset: 1000, baseR: 4 }
};

// Rung 9 State
let r9State = {
    cameraTransitionActive: true,
    phase: 1, // 1 for SMC, 2 for Andromeda
    selectedStar: 'A', // Start with A selected by default
    plottedStars: [], // ['A', 'B', 'C']
    hoveredStar: null,
    points: {
        'A': { p: 5.0, M: -3.3, m: 16.2, name: 'SMC-Cepheid A' },
        'B': { p: 15.0, M: -4.6, m: 14.8, name: 'SMC-Cepheid B' },
        'C': { p: 35.0, M: -5.6, m: 13.6, name: 'SMC-Cepheid C' },
        'V1': { p: 31.4, M: -5.5, m: 19.0, name: 'Andromeda V1' }
    },
    hoveredPlotBtn: false,
    hoveredNextPhaseBtn: false,
    hoveredBackBtn: false,
    showSuccessPhase1: false
};

// Rung 9 (H-R Diagram / Spectroscopic Parallax) State
let hrState = {
    step: 1, // 1: Hyades Calibration, 2: Pleiades Observation, 3: Fitting, 4: Calculation
    selectedStarIndex: null,
    hoveredStarIndex: null,
    activeFilter: 'none',       // 'none' | 'B' | 'V' | 'prism'
    analyzerTab: 'spectrum',    // 'spectrum' | 'filters' | 'luminosity'
    spectrumAnalyzed: false,    // Tracks if spectrum analyzed for selected star
    filterBClicked: false,      // Tracks if Blue filter checked for selected star
    filterVClicked: false,      // Tracks if Visual filter checked for selected star
    
    // Hyades Cluster Reference Stars (Step 1)
    // Absolute magnitude M is calculated using parallax: M = m - 5*log10(d) + 5, where d = 1/parallax.
    hyadesStars: [
        { name: "θ² Tauri (Giant)", bv: 0.18, parallax: 0.0213, appMag: 3.40, absMag: 0.04, dx: -30, dy: -20, r: 5, plotted: false },
        { name: "γ Tauri (Giant)", bv: 0.98, parallax: 0.0210, appMag: 3.53, absMag: -0.15, dx: 25, dy: 30, r: 4.5, plotted: false },
        { name: "δ¹ Tauri (Giant)", bv: 0.99, parallax: 0.0214, appMag: 3.76, absMag: 0.41, dx: -10, dy: 45, r: 4, plotted: false },
        { name: "ε Tauri (Giant)", bv: 1.01, parallax: 0.0222, appMag: 3.53, absMag: 0.26, dx: 40, dy: -40, r: 4.2, plotted: false },
        { name: "71 Tauri (MS)", bv: 0.42, parallax: 0.0215, appMag: 4.48, absMag: 1.14, dx: -50, dy: -50, r: 3.5, plotted: false },
        { name: "Betelgeuse (Red Supergiant)", bv: 1.50, parallax: 0.0050, appMag: 0.50, absMag: -6.00, dx: -60, dy: 60, r: 7.5, plotted: false },
        { name: "Rigel (Blue Supergiant)", bv: -0.03, parallax: 0.0040, appMag: 0.13, absMag: -6.86, dx: -70, dy: -50, r: 7.2, plotted: false },
        { name: "EG 37 (White Dwarf)", bv: 0.15, parallax: 0.0215, appMag: 14.48, absMag: 11.14, dx: 10, dy: -65, r: 1.5, plotted: false },
        { name: "HD 28319 (MS)", bv: 0.66, parallax: 0.0215, appMag: 6.34, absMag: 3.00, dx: -20, dy: 30, r: 3.2, plotted: false },
        { name: "HD 28226 (MS)", bv: 0.85, parallax: 0.0215, appMag: 7.74, absMag: 4.40, dx: 50, dy: 15, r: 3, plotted: false },
        { name: "HD 27962 (MS)", bv: 0.05, parallax: 0.0215, appMag: 4.30, absMag: 0.96, dx: -40, dy: -10, r: 4.8, plotted: false }
    ],
    
    // Pleiades Target Stars (Step 2)
    // Distance modulus (m-M) is ~5.67.
    pleiadesStars: [
        { name: "Alcyone (MS)", bv: -0.09, appMag: 2.85, dx: -20, dy: -25, r: 5, plotted: false },
        { name: "Atlas (MS)", bv: -0.08, appMag: 3.62, dx: 30, dy: 10, r: 4.2, plotted: false },
        { name: "Electra (MS)", bv: -0.11, appMag: 3.72, dx: -45, dy: 15, r: 4.2, plotted: false },
        { name: "Maia (MS)", bv: -0.07, appMag: 3.87, dx: -10, dy: 25, r: 4, plotted: false },
        { name: "Merope (MS)", bv: -0.06, appMag: 4.14, dx: 15, dy: -35, r: 4, plotted: false },
        { name: "Taygeta (MS)", bv: -0.05, appMag: 4.30, dx: 25, dy: -10, r: 3.8, plotted: false },
        { name: "Pleione (MS)", bv: -0.09, appMag: 5.05, dx: 45, dy: -25, r: 3.5, plotted: false },
        { name: "Celaeno (MS)", bv: -0.09, appMag: 5.45, dx: -35, dy: -10, r: 3, plotted: false },
        { name: "Asterope (MS)", bv: -0.06, appMag: 5.64, dx: -15, dy: -45, r: 2.8, plotted: false },
        { name: "Sterope II (MS)", bv: -0.05, appMag: 6.43, dx: -25, dy: -35, r: 2.5, plotted: false }
    ]
};

// Rung 12 (Galaxy-Scale Scaling Relations) State
let r12State = {
    activeGalaxyIndex: 0,
    galaxies: [
        { name: "NGC 224 (M31)", type: "spiral", trueWidth: 500, trueAppMag: 3.44, trueDistMpc: 0.78, verified: false, W: 150 },
        { name: "NGC 3031 (M81)", type: "spiral", trueWidth: 440, trueAppMag: 6.90, trueDistMpc: 3.60, verified: false, W: 150 },
        { name: "NGC 4486 (M87)", type: "elliptical", trueWidth: 320, trueAppMag: 8.63, trueDistMpc: 12.50, verified: false, W: 150 },
        { name: "NGC 4889 (Coma)", type: "elliptical", trueWidth: 380, trueAppMag: 11.50, trueDistMpc: 63.00, verified: false, W: 150 }
    ]
};

// Rung 13 (Type Ia Supernovae) State
let r13State = {
    activeSupernovaIndex: 0,
    supernovae: [
        { name: "SN 2011fe", host: "M101 (Pinwheel Galaxy)", truePeak: 9.73, trueDistMpc: 6.4, verified: false },
        { name: "SN 1994D", host: "NGC 4526", truePeak: 11.72, trueDistMpc: 16.0, verified: false },
        { name: "SN 2005cf", host: "MCG -01-39-003", truePeak: 13.42, trueDistMpc: 35.0, verified: false }
    ]
};

// Rung 14 (Gravitational Wave Standard Sirens) State
let r14State = {
    activeEventIndex: 0,
    events: [
        { name: "GW150914", type: "Binary Black Hole", trueChirpMass: 28.2, trueDistMpc: 410, amplitudeScale: 1.2, durationMs: 200, verified: false },
        { name: "GW170817", type: "Binary Neutron Star", trueChirpMass: 1.19, trueDistMpc: 40, amplitudeScale: 3.0, durationMs: 1500, verified: false },
        { name: "GW190521", type: "High-Mass BBH", trueChirpMass: 64.0, trueDistMpc: 5300, amplitudeScale: 0.5, durationMs: 100, verified: false }
    ]
};


let highestRungUnlocked = RUNGS.length; // Unlock all implemented rungs by default

let indexArmGroup;
let scaleReadoutCanvas, scaleReadoutCtx, scaleReadoutTex;

// UI Elements
const els = {
    progress: document.getElementById('ladder-progress'),
    rungText: document.getElementById('header-rung-text'),
    title: document.getElementById('notebook-title'),
    scientist: document.getElementById('notebook-scientist'),
    history: document.getElementById('history-text'),
    equation: document.getElementById('equation-display'),
    legend: document.getElementById('equation-legend'),
    instruction: document.getElementById('controls-instruction'),
    controls: document.getElementById('controls-container'),
    calcVal: document.getElementById('user-calculation'),
    btnVerify: document.getElementById('btn-verify'),
    feedback: document.getElementById('verification-feedback'),
    telemetry: document.getElementById('viewport-telemetry')
};

function init() {
    buildLadder();
    loadRung(currentRung);
    
    els.btnVerify.addEventListener('click', () => verifyCalculation());
    
    let isPointerDown = false;
    
    canvas2d.addEventListener('mousedown', (e) => {
        isPointerDown = true;
        const rect = canvas2d.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas2d.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas2d.height / rect.height);
        handle2DPointerDown(x, y);
    });
    
    canvas2d.addEventListener('mousemove', (e) => {
        const rect = canvas2d.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas2d.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas2d.height / rect.height);
        handle2DPointerMove(x, y);
    });
    
    canvas2d.addEventListener('mouseup', () => {
        isPointerDown = false;
        handle2DPointerUp();
    });
    
    canvas2d.addEventListener('mouseleave', () => {
        isPointerDown = false;
        handle2DPointerUp();
    });
    
    canvas2d.addEventListener('click', (e) => {
        const rect = canvas2d.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas2d.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas2d.height / rect.height);
        if (currentRung === 10) {
            handle2DClick(x, y);
        }
    });
    
    // Touch support
    canvas2d.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isPointerDown = true;
            const rect = canvas2d.getBoundingClientRect();
            const x = (e.touches[0].clientX - rect.left) * (canvas2d.width / rect.width);
            const y = (e.touches[0].clientY - rect.top) * (canvas2d.height / rect.height);
            handle2DPointerDown(x, y);
            e.preventDefault();
        }
    }, { passive: false });
    
    canvas2d.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            const rect = canvas2d.getBoundingClientRect();
            const x = (e.touches[0].clientX - rect.left) * (canvas2d.width / rect.width);
            const y = (e.touches[0].clientY - rect.top) * (canvas2d.height / rect.height);
            handle2DPointerMove(x, y);
            e.preventDefault();
        }
    }, { passive: false });
    
    canvas2d.addEventListener('touchend', () => {
        isPointerDown = false;
        handle2DPointerUp();
    });
}

function buildLadder() {
    els.progress.innerHTML = '<div class="ladder-line"></div>';
    
    for (let i = 1; i <= RUNGS.length; i++) {
        const node = document.createElement('div');
        node.className = 'rung-node';
        node.dataset.rung = i;
        node.textContent = i;
        els.progress.appendChild(node);
    }
    updateLadderUI();
}

function updateLadderUI() {
    const nodes = els.progress.querySelectorAll('.rung-node');
    nodes.forEach((node) => {
        const i = parseInt(node.dataset.rung);
        node.classList.toggle('active', i === currentRung);
        node.classList.toggle('completed', i < highestRungUnlocked && i !== currentRung);
        node.classList.toggle('locked', i > highestRungUnlocked);
    });
}

els.progress.addEventListener('click', (e) => {
    const node = e.target.closest('.rung-node');
    if (!node) return;
    const i = parseInt(node.dataset.rung);
    if (i <= highestRungUnlocked) {
        loadRung(i);
        updateLadderUI();
    }
});

function simpleMarkdownParse(md) {
    if (!md) return '';
    let html = md;
    
    // Clean up carriage returns
    html = html.replace(/\r\n/g, '\n');
    
    // Parse tables
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    const processedLines = [];
    
    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableHtml = '<table>';
            }
            const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
            // Skip divider rows like |---|---|
            if (cells.every(c => /^:-*:?$/.test(c) || /^-+$/.test(c))) {
                continue;
            }
            tableHtml += '<tr>';
            cells.forEach(c => {
                const tag = tableHtml.split('<tr>').length === 2 ? 'th' : 'td';
                tableHtml += `<${tag}>${c.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</${tag}>`;
            });
            tableHtml += '</tr>';
        } else {
            if (inTable) {
                inTable = false;
                tableHtml += '</table>';
                processedLines.push(tableHtml);
            }
            processedLines.push(line);
        }
    }
    if (inTable) {
        tableHtml += '</table>';
        processedLines.push(tableHtml);
    }
    
    html = processedLines.join('\n');
    
    // Headings
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    
    // Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Unordered lists
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li>$1</li>');
    
    // Paragraphs for non-empty lines that don't start with html tags or math block markers
    const finalLines = html.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<h') || trimmed.startsWith('<block') || trimmed.startsWith('<table') || 
            trimmed.startsWith('<tr') || trimmed.startsWith('<td') || trimmed.startsWith('<th') || 
            trimmed.startsWith('<li') || trimmed.startsWith('</') || trimmed.startsWith('$$')) {
            return line;
        }
        return `<p>${line}</p>`;
    });
    
    return finalLines.join('\n');
}

function renderWikiContent() {
    console.log('renderWikiContent() called. currentRung:', currentRung);
    const wikiContainer = document.getElementById('wiki-container');
    if (!wikiContainer) {
        console.error('renderWikiContent: wikiContainer not found in DOM');
        return;
    }
    const rung = RUNGS.find(r => r.id === currentRung);
    if (!rung) {
        console.error('renderWikiContent: currentRung not found in RUNGS:', currentRung);
        return;
    }
    console.log('renderWikiContent: Found rung:', rung.title, 'Has wiki content:', !!rung.wiki);

    const wikiContentEl = document.getElementById('wiki-content');
    if (wikiContentEl) {
        const markdown = rung.wiki || `## Rung ${rung.id}: ${rung.title}\n*Content coming soon.*`;
        console.log('renderWikiContent: Markdown string length:', markdown.length);
        
        try {
            if (typeof marked !== 'undefined') {
                console.log('renderWikiContent: Using marked.js parser');
                if (typeof marked.parse === 'function') {
                    wikiContentEl.innerHTML = marked.parse(markdown);
                } else if (typeof marked === 'function') {
                    wikiContentEl.innerHTML = marked(markdown);
                } else {
                    throw new Error('marked is not a function');
                }
            } else {
                throw new Error('marked is undefined');
            }
        } catch (e) {
            console.warn('Marked parser failed, falling back to simple parser:', e);
            wikiContentEl.innerHTML = simpleMarkdownParse(markdown);
        }
        
        console.log('renderWikiContent: Rendered HTML length:', wikiContentEl.innerHTML.length);
        wikiContainer.scrollTop = 0;
        if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
            console.log('renderWikiContent: Re-typesetting MathJax');
            window.MathJax.typesetPromise([wikiContentEl]).catch(err => console.error("MathJax typesetPromise error in wiki:", err));
        }
    } else {
        console.error('renderWikiContent: wiki-content element not found');
    }
}

function loadRung(rungId) {
    currentRung = rungId;
    const rung = RUNGS.find(r => r.id === rungId) || RUNGS[1]; // fallback
    
    // Lifecycle cleanup — hide each overlay only when its rung is not active
    if (rungId !== 10) {
        const r9ui = document.getElementById('r9-ui-container');
        if (r9ui) r9ui.style.display = 'none';
    }
    if (rungId !== 12) {
        const r12ui = document.getElementById('r12-ui-container');
        if (r12ui) r12ui.style.display = 'none';
    }
    if (rungId !== 13) {
        const r13ui = document.getElementById('r13-ui-container');
        if (r13ui) r13ui.style.display = 'none';
    }
    if (rungId !== 14) {
        const r14ui = document.getElementById('r14-ui-container');
        if (r14ui) r14ui.style.display = 'none';
    }
    if (rungId !== 9) {
        const hrui = document.getElementById('hr-ui-container');
        if (hrui) hrui.style.display = 'none';
    }
    
    els.rungText.textContent = `Rung ${rung.id}: ${rung.title.split(' ')[0]}`;
    els.title.textContent = `Rung ${rung.id}: ${rung.title}`;
    els.scientist.textContent = rung.scientist;
    els.history.innerHTML = rung.history;
    els.equation.innerHTML = rung.equation;
    
    els.legend.innerHTML = rung.legend.map(l => `<li>${l}</li>`).join('');
    els.instruction.innerHTML = rung.instruction;
    
    // Build controls
    els.controls.innerHTML = '';
    if (rung.comingSoon) {
        const soonCard = document.createElement('div');
        soonCard.className = 'card coming-soon-card';
        soonCard.style.padding = '15px';
        soonCard.style.background = 'rgba(255, 255, 255, 0.03)';
        soonCard.style.border = '1px solid rgba(255, 255, 255, 0.08)';
        soonCard.style.borderRadius = '8px';
        soonCard.style.marginTop = '10px';
        soonCard.innerHTML = `
            <h4 style="margin:0 0 8px 0; color:#ffcc00; font-family:'Outfit',sans-serif;">Coming Soon</h4>
            <p style="margin:0; font-size:11.5px; line-height:1.45; color:rgba(255,255,255,0.7);">
                Interactive simulation for this rung is coming soon! Switch to the <strong>📖 Wiki</strong> tab in the Observatory panel to explore the full mathematical derivation, worked examples, and historical background.
            </p>
        `;
        els.controls.appendChild(soonCard);
    } else {
        rung.controls.forEach(ctrl => {
            const group = document.createElement('div');
            group.className = 'control-group';
            
            const initialValText = ctrl.formatValue ? ctrl.formatValue(ctrl.value) : `${ctrl.value}${ctrl.unit}`;
            const lbl = document.createElement('label');
            lbl.innerHTML = `<span>${ctrl.label}</span> <span id="val-${ctrl.id}">${initialValText}</span>`;
            
            const input = document.createElement('input');
            input.type = 'range';
            input.min = ctrl.min;
            input.max = ctrl.max;
            input.step = ctrl.step;
            input.value = ctrl.value;
            input.id = `input-${ctrl.id}`;
            
            input.addEventListener('input', (e) => {
                if (ctrl.id === 'parallax_angle') {
                    const val = parseFloat(e.target.value);
                    if (Math.abs(val - 12.48) < 0.05) {
                        e.target.value = 12.48;
                    }
                }
                const newValText = ctrl.formatValue ? ctrl.formatValue(e.target.value) : `${e.target.value}${ctrl.unit}`;
                document.getElementById(`val-${ctrl.id}`).textContent = newValText;
                updateCalculation();
            });
            
            group.appendChild(lbl);
            group.appendChild(input);
            els.controls.appendChild(group);
        });
        
        // Inject custom Rung UI
        if (rungId === 1) {
            els.controls.insertBefore(toggleLinesBtn, els.controls.firstChild);
        }
    }
    
    // Build telemetry
    els.telemetry.innerHTML = '';
    rung.telemetry.forEach(t => {
        const item = document.createElement('div');
        item.className = 'telemetry-item';
        item.innerHTML = `
            <span class="lbl">${t.lbl}</span>
            <span class="val" ${t.id ? `id="${t.id}"` : ''}>${t.val}</span>
        `;
        els.telemetry.appendChild(item);
    });
    
    els.feedback.className = 'verification-feedback';
    els.feedback.textContent = '';
    
    const calcLblObj = document.getElementById('calc-lbl');
    if (calcLblObj) {
        calcLblObj.innerHTML = rung.calcLabel || "Your Calculation:";
    }
    
    // Re-render mathjax if available and fully loaded
    if (window.MathJax) {
        try {
            if (typeof window.MathJax.typesetClear === 'function') {
                window.MathJax.typesetClear([els.history, els.equation, els.legend, els.instruction]);
            }
        } catch (e) {
            console.error("MathJax typesetClear error:", e);
        }

        const elementsToTypeset = [];
        if (rung.history && (rung.history.includes('$') || rung.history.includes('\\('))) elementsToTypeset.push(els.history);
        if (rung.equation && (rung.equation.includes('$') || rung.equation.includes('\\('))) elementsToTypeset.push(els.equation);
        if (rung.legend && rung.legend.some(l => l.includes('$') || l.includes('\\('))) elementsToTypeset.push(els.legend);
        if (rung.instruction && (rung.instruction.includes('$') || rung.instruction.includes('\\('))) elementsToTypeset.push(els.instruction);

        if (elementsToTypeset.length > 0) {
            if (typeof window.MathJax.typesetPromise === 'function') {
                window.MathJax.typesetPromise(elementsToTypeset).catch(err => console.error("MathJax typesetPromise error:", err));
            } else if (typeof window.MathJax.typeset === 'function') {
                window.MathJax.typeset(elementsToTypeset);
            }
        }
    }
    
    // Scene Switcher
    if (typeof earthGroup !== 'undefined' && typeof moonGroup !== 'undefined') {
        const btnView3d = document.getElementById('btn-view-3d');
        const btnView2d = document.getElementById('btn-view-2d');
        const btnViewWiki = document.getElementById('btn-view-wiki');
        const btnClose2d = document.getElementById('btn-close-2d');
        const canvas2d = document.getElementById('canvas-2d');
        const wikiContainer = document.getElementById('wiki-container');
        
        if (rung.comingSoon) {
            if (btnView3d) btnView3d.style.display = 'none';
            if (btnView2d) btnView2d.style.display = 'none';
            if (els.btnVerify) els.btnVerify.style.display = 'none';
            
            // Clean up all 3D groups when entering a comingSoon rung
            if (typeof earthGroup !== 'undefined') earthGroup.visible = false;
            if (typeof moonGroup !== 'undefined') moonGroup.visible = false;
            if (typeof distGroup !== 'undefined') distGroup.visible = false;
            if (typeof sunGroup !== 'undefined') sunGroup.visible = false;
            if (typeof pinholeGroup !== 'undefined') pinholeGroup.visible = false;
            if (typeof marsGroup !== 'undefined') marsGroup.visible = false;
            if (typeof transitGroup !== 'undefined') transitGroup.visible = false;
            if (typeof stellarGroup !== 'undefined') stellarGroup.visible = false;
            if (typeof galaxiesGroup !== 'undefined') galaxiesGroup.visible = false;
            if (typeof clusterGroup !== 'undefined') clusterGroup.visible = false;
            if (typeof venusGroup !== 'undefined') venusGroup.visible = false;
            if (typeof rung12Group !== 'undefined') rung12Group.visible = false;
            if (typeof rung13Group !== 'undefined') rung13Group.visible = false;
            if (typeof rung14Group !== 'undefined') rung14Group.visible = false;
            
            if (canvas2d) canvas2d.style.display = 'none';
            if (btnClose2d) btnClose2d.style.display = 'none';
            if (els.telemetry) els.telemetry.style.display = 'none';

            const r9ui = document.getElementById('r9-ui-container');
            if (r9ui) r9ui.style.display = 'none';
            const r12ui = document.getElementById('r12-ui-container');
            if (r12ui) r12ui.style.display = 'none';
            const r13ui = document.getElementById('r13-ui-container');
            if (r13ui) r13ui.style.display = 'none';
            const r14ui = document.getElementById('r14-ui-container');
            if (r14ui) r14ui.style.display = 'none';
            const hrui = document.getElementById('hr-ui-container');
            if (hrui) hrui.style.display = 'none';

            if (wikiContainer) wikiContainer.style.display = 'block';
            
            // Activate Wiki Tab
            if (btnViewWiki) {
                btnViewWiki.classList.add('active');
            }
            if (btnView3d) btnView3d.classList.remove('active');
            if (btnView2d) btnView2d.classList.remove('active');
            
            renderWikiContent();
        } else {
            if (btnView3d) btnView3d.style.display = 'block';
            if (btnView2d) btnView2d.style.display = 'block';
            if (els.btnVerify) els.btnVerify.style.display = 'block';
            
            // Hide/show toggles appropriately
            if (btnView2d) {
                btnView2d.style.display = 'block';
            }

            const isWikiActive = btnViewWiki && btnViewWiki.classList.contains('active');
            
            if (isWikiActive) {
                // Stay in wiki tab and just update content
                if (typeof earthGroup !== 'undefined') earthGroup.visible = false;
                if (typeof moonGroup !== 'undefined') moonGroup.visible = false;
                if (typeof distGroup !== 'undefined') distGroup.visible = false;
                if (typeof sunGroup !== 'undefined') sunGroup.visible = false;
                if (typeof pinholeGroup !== 'undefined') pinholeGroup.visible = false;
                if (typeof marsGroup !== 'undefined') marsGroup.visible = false;
                if (typeof transitGroup !== 'undefined') transitGroup.visible = false;
                if (typeof stellarGroup !== 'undefined') stellarGroup.visible = false;
                if (typeof galaxiesGroup !== 'undefined') galaxiesGroup.visible = false;
                if (typeof clusterGroup !== 'undefined') clusterGroup.visible = false;
                if (typeof venusGroup !== 'undefined') venusGroup.visible = false;
                if (typeof rung12Group !== 'undefined') rung12Group.visible = false;
                if (typeof rung13Group !== 'undefined') rung13Group.visible = false;
                if (typeof rung14Group !== 'undefined') rung14Group.visible = false;
                
                if (canvas2d) canvas2d.style.display = 'none';
                if (btnClose2d) btnClose2d.style.display = 'none';
                if (els.telemetry) els.telemetry.style.display = 'none';

                const r9ui = document.getElementById('r9-ui-container');
                if (r9ui) r9ui.style.display = 'none';
                const r12ui = document.getElementById('r12-ui-container');
                if (r12ui) r12ui.style.display = 'none';
                const r13ui = document.getElementById('r13-ui-container');
                if (r13ui) r13ui.style.display = 'none';
                const r14ui = document.getElementById('r14-ui-container');
                if (r14ui) r14ui.style.display = 'none';
                const hrui = document.getElementById('hr-ui-container');
                if (hrui) hrui.style.display = 'none';

                if (wikiContainer) wikiContainer.style.display = 'block';

                renderWikiContent();
            } else {
                // Rungs 1 and 2 default to 3D view; Rungs 3-11 default to 2D view.
                if (rungId === 1 || rungId === 2) {
                    if (btnView3d) {
                        btnView3d.click();
                    }
                } else {
                    // Reset H-R Diagram (Rung 9) state variables before entering its 2D view
                    if (rungId === 9) {
                        hrState.step = 1;
                        hrState.selectedStarIndex = null;
                        hrState.hoveredStarIndex = null;
                        hrState.pointedToPleiades = false;
                        hrState.hyadesStars.forEach(s => s.plotted = false);
                        hrState.pleiadesStars.forEach(s => s.plotted = false);
                    }
                    // Reset Cepheid (Rung 10) state variables before entering its 2D view
                    if (rungId === 10) {
                        r9State.phase = 1;
                        r9State.selectedStar = 'A';
                        r9State.plottedStars = [];
                        r9State.showSuccessPhase1 = false;
                        r9State.cameraTransitionActive = true;
                    }
                    if (btnView2d) {
                        btnView2d.click();
                    }
                }
            }
        }
        
        // Ensure 2D close button is hidden on initial load of 2D-default rungs
        if (rungId >= 3 && btnClose2d) {
            btnClose2d.style.display = 'none';
        }
    }
    
    updateCalculation();
}

function updateCalculation() {
    const rung = RUNGS.find(r => r.id === currentRung);
    if (!rung || rung.controls.length === 0) {
        els.calcVal.textContent = "-";
        return;
    }
    
    const inputs = Array.from(els.controls.querySelectorAll('input'));
    
    // Snapping and green highlighting for Rung 1
    if (currentRung === 1 && inputs.length >= 2) {
        const angleInput = inputs[0];
        const distInput = inputs[1];
        
        let ang = parseFloat(angleInput.value);
        if (Math.abs(ang - 7.2) < 0.2 && ang !== 7.2) {
            ang = 7.2;
            angleInput.value = 7.2;
            const valObj = document.getElementById('val-angle');
            if (valObj) valObj.textContent = "7.2°";
        }
        
        let dst = parseFloat(distInput.value);
        if (Math.abs(dst - 800) < 40 && dst !== 800) {
            dst = 800;
            distInput.value = 800;
            const valObj = document.getElementById('val-distance');
            if (valObj) valObj.textContent = "800 km";
        }
        
        if (parseFloat(angleInput.value) === 7.2) angleInput.classList.add('slider-correct');
        else angleInput.classList.remove('slider-correct');
        
        if (parseFloat(distInput.value) === 800) distInput.classList.add('slider-correct');
        else distInput.classList.remove('slider-correct');
        
        // Redraw active 2D city overlay dynamically
        if (typeof r1ActiveCity !== 'undefined') {
            if (r1ActiveCity === 'Syene') {
                render2DSyene();
            } else if (r1ActiveCity === 'Alexandria') {
                render2DAlexandria();
            }
        }
        
        // Update 3D elements dynamically
        if (typeof earthRadius !== 'undefined') {
            const angRad = ang * Math.PI / 180;
            const currentAlexPos = getPositionFromLatLon(angRad, 0, earthRadius);
            const alexNormal = currentAlexPos.clone().normalize();
            
            if (typeof alexMarker !== 'undefined') {
                alexMarker.position.copy(currentAlexPos).multiplyScalar(1.02);
            }
            if (typeof alexHit !== 'undefined') {
                alexHit.position.copy(currentAlexPos);
            }
            if (typeof pole !== 'undefined') {
                pole.position.copy(currentAlexPos).add(alexNormal.clone().multiplyScalar(0.1));
                pole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), alexNormal);
            }
            if (typeof shadow !== 'undefined') {
                shadow.position.copy(currentAlexPos);
                shadow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), alexNormal);
                shadow.rotateX(Math.PI / 2);
                const scaleY = Math.tan(angRad) / Math.tan(7.2 * Math.PI / 180);
                shadow.scale.set(1, Math.max(0.01, scaleY), 1);
            }
            
            // Helper lines in linesGroup
            if (typeof linesGroup !== 'undefined' && linesGroup.children && linesGroup.children.length >= 6) {
                const children = linesGroup.children;
                // alexLine
                const alexLinePoints = [new THREE.Vector3(0,0,0), currentAlexPos.clone().multiplyScalar(1.5)];
                children[1].geometry.setFromPoints(alexLinePoints);
                children[1].geometry.computeBoundingSphere();
                
                // ray2
                const ray2Points = [new THREE.Vector3(earthRadius * 2, currentAlexPos.y, currentAlexPos.z), currentAlexPos];
                children[3].geometry.setFromPoints(ray2Points);
                children[3].geometry.computeBoundingSphere();
                
                // centerArc
                if (typeof getR1ArcPoints !== 'undefined') {
                    const centerArcPoints = getR1ArcPoints(0, angRad, earthRadius * 0.3);
                    children[4].geometry.dispose();
                    children[4].geometry = new THREE.TorusGeometry(0.5, 0.01, 8, 32, angRad);
                    
                    // poleArc
                    children[5].position.copy(currentAlexPos);
                    children[5].geometry.dispose();
                    children[5].geometry = new THREE.TorusGeometry(0.5, 0.01, 8, 32, angRad);
                }
            }
            
            // R1 Distance Line and Label
            if (typeof r1DistanceLine !== 'undefined' && typeof getR1ArcPoints !== 'undefined') {
                const arcPoints = getR1ArcPoints(0, angRad, earthRadius);
                r1DistanceLine.geometry.setFromPoints(arcPoints);
                r1DistanceLine.geometry.computeBoundingSphere();
                r1DistanceLine.visible = true;
            }
            
            if (typeof r1DistanceLabel !== 'undefined') {
                const midLat = angRad / 2;
                const labelPos = new THREE.Vector3(
                    earthRadius * Math.cos(midLat),
                    earthRadius * Math.sin(midLat),
                    0
                ).multiplyScalar(1.15);
                r1DistanceLabel.position.copy(labelPos);
                updateStellarLabel(r1DistanceLabel, `s = ${dst} km`, "#ffff00", 36, "rgba(0,0,0,0.8)", 256);
                r1DistanceLabel.visible = true;
            }
        }
    } else {
        if (typeof r1DistanceLine !== 'undefined') r1DistanceLine.visible = false;
        if (typeof r1DistanceLabel !== 'undefined') r1DistanceLabel.visible = false;
    }

    // Snapping and green highlighting for Rung 2
    if (currentRung === 2 && inputs.length >= 1) {
        const ratioInput = inputs[0];
        let rat = parseFloat(ratioInput.value);
        if (Math.abs(rat - 3.5) < 0.1 && rat !== 3.5) {
            rat = 3.5;
            ratioInput.value = 3.5;
            const valObj = document.getElementById('val-ratio');
            if (valObj) valObj.textContent = "3.5x";
        }
        if (parseFloat(ratioInput.value) === 3.5) ratioInput.classList.add('slider-correct');
        else ratioInput.classList.remove('slider-correct');
    }

    // Snapping and green highlighting for Rung 3
    if (currentRung === 3 && inputs.length >= 1) {
        const coinInput = inputs[0];
        let val = parseFloat(coinInput.value);
        const targetVal = 229; // 229 cm yields ~0.50 degrees
        if (Math.abs(val - targetVal) < 3.0 && val !== targetVal) {
            val = targetVal;
            coinInput.value = targetVal;
            const valObj = document.getElementById('val-coin_dist');
            if (valObj) {
                const thetaDeg = 2 * Math.atan(2.0 / (2 * targetVal)) * 180 / Math.PI;
                valObj.textContent = `${targetVal} cm (${thetaDeg.toFixed(2)}°)`;
            }
        }
        if (parseFloat(coinInput.value) === targetVal) coinInput.classList.add('slider-correct');
        else coinInput.classList.remove('slider-correct');
    }

    // Snapping and green highlighting for Rung 4
    if (currentRung === 4 && inputs.length >= 1) {
        const phiInput = inputs[0];
        let val = parseFloat(phiInput.value);
        const targetVal = 87.0; // Aristarchus' historical measurement
        const trueVal = 89.85; // Modern true value
        
        if (Math.abs(val - targetVal) < 0.25 && val !== targetVal) {
            val = targetVal;
            phiInput.value = targetVal;
            const valObj = document.getElementById('val-angle_phi');
            if (valObj) valObj.textContent = `${targetVal.toFixed(1)}°`;
        } else if (Math.abs(val - trueVal) < 0.05 && val !== trueVal) {
            val = trueVal;
            phiInput.value = trueVal;
            const valObj = document.getElementById('val-angle_phi');
            if (valObj) valObj.textContent = `${trueVal.toFixed(2)}°`;
        }
        
        const currentVal = parseFloat(phiInput.value);
        if (currentVal === targetVal || currentVal === trueVal) phiInput.classList.add('slider-correct');
        else phiInput.classList.remove('slider-correct');
    }

    // Snapping and green highlighting for Rung 5
    if (currentRung === 5 && inputs.length >= 1) {
        const diaInput = inputs[0];
        let val = parseFloat(diaInput.value);
        const targetVal = 0.93; // Yields ~1.39 million km (Sun actual diameter)
        if (Math.abs(val - targetVal) < 0.05 && val !== targetVal) {
            val = targetVal;
            diaInput.value = targetVal;
            const valObj = document.getElementById('val-image_dia');
            if (valObj) valObj.textContent = `${targetVal.toFixed(2)} cm`;
        }
        if (parseFloat(diaInput.value) === targetVal) diaInput.classList.add('slider-correct');
        else diaInput.classList.remove('slider-correct');
    }

    // Snapping and green highlighting for Rung 6
    if (currentRung === 6 && inputs.length >= 1) {
        const angleInput = inputs[0];
        let val = parseFloat(angleInput.value);
        const targetVal = 12.48; // Mars parallax target shift in arcsec
        if (Math.abs(val - targetVal) < 0.1 && val !== targetVal) {
            val = targetVal;
            angleInput.value = targetVal;
            const valObj = document.getElementById('val-parallax_angle');
            if (valObj) valObj.textContent = `${targetVal.toFixed(2)} arcsec`;
        }
        if (parseFloat(angleInput.value) === targetVal) angleInput.classList.add('slider-correct');
        else angleInput.classList.remove('slider-correct');
    }

    // Snapping and green highlighting for Rung 7
    if (currentRung === 7 && inputs.length >= 1) {
        const shiftInput = inputs[0];
        let val = parseFloat(shiftInput.value);
        const targetVal = 40.0; // Transit shift target in arcsec
        if (Math.abs(val - targetVal) < 0.5 && val !== targetVal) {
            val = targetVal;
            shiftInput.value = targetVal;
            const valObj = document.getElementById('val-transit_shift');
            if (valObj) valObj.textContent = `${targetVal.toFixed(1)} arcsec`;
        }
        if (parseFloat(shiftInput.value) === targetVal) shiftInput.classList.add('slider-correct');
        else shiftInput.classList.remove('slider-correct');
    }

    // Snapping and green highlighting for Rung 8
    if (currentRung === 8 && inputs.length >= 1) {
        const parallaxInput = inputs[0];
        let val = parseFloat(parallaxInput.value);
        const targetVal = 0.7; // Stellar parallax target in arcsec
        if (Math.abs(val - targetVal) < 0.05 && val !== targetVal) {
            val = targetVal;
            parallaxInput.value = targetVal;
            const valObj = document.getElementById('val-parallax');
            if (valObj) valObj.textContent = `${targetVal.toFixed(1)}''`;
        }
        if (parseFloat(parallaxInput.value) === targetVal) parallaxInput.classList.add('slider-correct');
        else parallaxInput.classList.remove('slider-correct');
    }

    if (currentRung === 9 && inputs.length >= 1) {
        const userMod = parseFloat(inputs[0].value);
        const targetMod = 5.67;
        
        if (Math.abs(userMod - targetMod) < 0.1 && userMod !== targetMod) {
            inputs[0].value = targetMod;
            const pc = Math.round(Math.pow(10, (targetMod + 5) / 5));
            const ly = Math.round(pc * 3.26156);
            document.getElementById('val-dist_mod').textContent = `${targetMod.toFixed(2)} mag (Distance: ${pc.toLocaleString()} pc / ${ly.toLocaleString()} ly)`;
        }
        
        if (parseFloat(inputs[0].value) === targetMod) {
            inputs[0].classList.add('slider-correct');
        } else {
            inputs[0].classList.remove('slider-correct');
        }
    }

    // Snapping and green highlighting for Rung 10
    if (currentRung === 12 && inputs.length >= 1) {
        const widthInput = inputs[0];
        const gal = typeof r12State !== 'undefined' ? r12State.galaxies[r12State.activeGalaxyIndex] : null;
        if (gal) {
            let W = parseFloat(widthInput.value);
            const isCorrect = Math.abs(W - gal.trueWidth) < (gal.trueWidth * 0.08);
            if (isCorrect && W !== gal.trueWidth) {
                widthInput.value = gal.trueWidth;
                const valObj = document.getElementById('val-spectral_width');
                if (valObj) valObj.textContent = gal.trueWidth + ' km/s';
            }
            if (parseFloat(widthInput.value) === gal.trueWidth) {
                widthInput.classList.add('slider-correct');
            } else {
                widthInput.classList.remove('slider-correct');
            }
            gal.W = parseFloat(widthInput.value);
        }
    }

    // Snapping and green highlighting for Rung 13 (Type Ia Supernovae)
    if (currentRung === 13 && inputs.length >= 1) {
        const peakInput = inputs[0];
        const sn = typeof r13State !== 'undefined' ? r13State.supernovae[r13State.activeSupernovaIndex] : null;
        if (sn) {
            let m = parseFloat(peakInput.value);
            const isCorrect = Math.abs(m - sn.truePeak) < 0.05;
            if (isCorrect && m !== sn.truePeak) {
                m = sn.truePeak;
                peakInput.value = sn.truePeak;
                const valObj = document.getElementById('val-peak_mag');
                if (valObj) valObj.textContent = sn.truePeak.toFixed(2) + ' mag';
            }
            if (parseFloat(peakInput.value) === sn.truePeak) peakInput.classList.add('slider-correct');
            else peakInput.classList.remove('slider-correct');
        }
    }

    // Snapping and green highlighting for Rung 14 (Gravitational Waves)
    if (currentRung === 14 && inputs.length >= 2) {
        const massInput = inputs[0];
        const distInput = inputs[1];
        const ev = typeof r14State !== 'undefined' ? r14State.events[r14State.activeEventIndex] : null;
        if (ev) {
            let M = parseFloat(massInput.value);
            let D = parseFloat(distInput.value);
            const massCorrect = Math.abs(M - ev.trueChirpMass) / ev.trueChirpMass < 0.05;
            const distCorrect = Math.abs(D - ev.trueDistMpc) / ev.trueDistMpc < 0.10;
            
            if (massCorrect && M !== ev.trueChirpMass) {
                M = ev.trueChirpMass;
                massInput.value = ev.trueChirpMass;
                const valObj = document.getElementById('val-chirp_mass');
                if (valObj) valObj.textContent = ev.trueChirpMass.toFixed(2) + ' M☉';
            }
            if (distCorrect && D !== ev.trueDistMpc) {
                D = ev.trueDistMpc;
                distInput.value = ev.trueDistMpc;
                const valObj = document.getElementById('val-gw_distance');
                if (valObj) valObj.textContent = ev.trueDistMpc + ' Mpc';
            }
            
            if (parseFloat(massInput.value) === ev.trueChirpMass) massInput.classList.add('slider-correct');
            else massInput.classList.remove('slider-correct');
            
            if (parseFloat(distInput.value) === ev.trueDistMpc) distInput.classList.add('slider-correct');
            else distInput.classList.remove('slider-correct');
        }
    }

    if (currentRung === 10) {
        const info = typeof cepheidData !== 'undefined' ? cepheidData[r9State.selectedStar] : null;
        if (r9State.phase === 1 && info && inputs.length >= 2) {
            const userAppMag = parseFloat(inputs[0].value);
            const userPeriod = parseFloat(inputs[1].value);
            
            if (Math.abs(userAppMag - info.meanM) < 0.1 && userAppMag !== info.meanM) {
                inputs[0].value = info.meanM;
                const valObj = document.getElementById('val-app_mag');
                if (valObj) valObj.textContent = info.meanM.toFixed(2) + " mag";
            }
            if (Math.abs(userPeriod - info.period) < 0.5 && userPeriod !== info.period) {
                inputs[1].value = info.period;
                const valObj = document.getElementById('val-period');
                if (valObj) valObj.textContent = info.period.toFixed(1) + " days";
            }
            if (parseFloat(inputs[0].value) === info.meanM) inputs[0].classList.add('slider-correct');
            else inputs[0].classList.remove('slider-correct');
            if (parseFloat(inputs[1].value) === info.period) inputs[1].classList.add('slider-correct');
            else inputs[1].classList.remove('slider-correct');
        } else if (r9State.phase === 2 && inputs.length >= 3) {
            const userAppMag = parseFloat(inputs[0].value);
            const userPeriod = parseFloat(inputs[1].value);
            const userAbsMag = parseFloat(inputs[2].value);
            
            const targetApp = 19.00;
            const targetPeriod = 31.4;
            const targetAbs = -5.50;
            
            if (Math.abs(userAppMag - targetApp) < 0.1 && userAppMag !== targetApp) {
                inputs[0].value = targetApp;
                const valObj = document.getElementById('val-app_mag');
                if (valObj) valObj.textContent = targetApp.toFixed(2) + " mag";
            }
            if (Math.abs(userPeriod - targetPeriod) < 0.5 && userPeriod !== targetPeriod) {
                inputs[1].value = targetPeriod;
                const valObj = document.getElementById('val-period');
                if (valObj) valObj.textContent = targetPeriod.toFixed(1) + " days";
            }
            if (Math.abs(userAbsMag - targetAbs) < 0.1 && userAbsMag !== targetAbs) {
                inputs[2].value = targetAbs;
                const valObj = document.getElementById('val-abs_mag');
                if (valObj) valObj.textContent = targetAbs.toFixed(2) + " mag";
            }
            
            if (parseFloat(inputs[0].value) === targetApp) inputs[0].classList.add('slider-correct');
            else inputs[0].classList.remove('slider-correct');
            if (parseFloat(inputs[1].value) === targetPeriod) inputs[1].classList.add('slider-correct');
            else inputs[1].classList.remove('slider-correct');
            if (parseFloat(inputs[2].value) === targetAbs) inputs[2].classList.add('slider-correct');
            else inputs[2].classList.remove('slider-correct');
        }
    }
    
    const vals = {};
    inputs.forEach((input, idx) => {
        vals[rung.controls[idx].id] = parseFloat(input.value);
    });
    
    const result = rung.calculate(vals);
    // Format result
    els.calcVal.textContent = result.toLocaleString(undefined, {maximumFractionDigits: 1}) + 
        ((currentRung >= 1 && currentRung <= 7) ? ' km' : 
         (currentRung >= 8 && currentRung <= 10) ? ' pc' : 
         (currentRung >= 12 && currentRung <= 14) ? ' Mpc' : '');
    
    // Rung 9 & 10 Telemetry sync and calibration real-time update
    if (currentRung === 9) {
        updateHRUIState();
        const hrReadLabel = document.getElementById('sim-hr-reading');
        const hrModLabel = document.getElementById('sim-hr-modulus');
        if (hrModLabel) {
            hrModLabel.textContent = vals.dist_mod.toFixed(2) + " mag";
        }
        if (hrReadLabel) {
            hrReadLabel.textContent = result.toLocaleString(undefined, {maximumFractionDigits: 0}) + " pc";
            const isCorrect = Math.abs(result - 136) < 10;
            hrReadLabel.style.color = isCorrect ? '#00ffaa' : '#ffffff';
        }
    }

    if (currentRung === 10) {
        updateR10UIState();
        const r9ReadLabel = document.getElementById('sim-reading');
        if (r9ReadLabel) {
            r9ReadLabel.textContent = result.toLocaleString(undefined, {maximumFractionDigits: 0}) + " pc";
            const isCorrect = Math.abs(result - 794328) < 40000;
            r9ReadLabel.style.color = isCorrect ? '#00ffaa' : '#ffffff';
        }
    }

    // Rung 12 Telemetry sync
    if (currentRung === 12) {
        const widthInput = document.getElementById('input-spectral_width');
        const gal = typeof r12State !== 'undefined' ? r12State.galaxies[r12State.activeGalaxyIndex] : null;
        if (gal && widthInput) {
            let W = parseFloat(widthInput.value);
            const isCorrect = Math.abs(W - gal.trueWidth) < (gal.trueWidth * 0.08);
            
            // Snap when close
            if (isCorrect && W !== gal.trueWidth) {
                W = gal.trueWidth;
                widthInput.value = gal.trueWidth;
                const valObj = document.getElementById('val-spectral_width');
                if (valObj) valObj.textContent = gal.trueWidth + ' km/s';
            }
            
            gal.W = W; // Keep galaxy's state in sync!
            
            if (parseFloat(widthInput.value) === gal.trueWidth) {
                widthInput.classList.add('slider-correct');
            } else {
                widthInput.classList.remove('slider-correct');
            }
            
            if (typeof syncR12UI === 'function') syncR12UI();
        }
    }
    if (currentRung === 13) {
        if (typeof syncRung13UI === 'function') syncRung13UI();
    }
    if (currentRung === 14) {
        if (typeof syncRung14UI === 'function') syncRung14UI();
    }
}

function verifyCalculation() {
    const rung = RUNGS.find(r => r.id === currentRung);
    if (!rung) return;
    
    const inputs = Array.from(els.controls.querySelectorAll('input'));
    const vals = {};
    inputs.forEach((input, idx) => {
        vals[rung.controls[idx].id] = parseFloat(input.value);
    });
    
    const result = rung.calculate(vals);
    const isCorrect = rung.verify(result);
    
    if (isCorrect === true) {
        els.feedback.className = 'verification-feedback success';
        els.feedback.textContent = rung.successMsg + " (Next Rung Unlocked!)";
        
        if (highestRungUnlocked === currentRung) {
            highestRungUnlocked++;
            buildLadder(); // rebuild to show unlocked
        }
    } else if (isCorrect === false) {
        els.feedback.className = 'verification-feedback error';
        els.feedback.textContent = "Calculation is incorrect. Check the telemetry reading and the real distance.";
    } else if (isCorrect === "partial") {
        // Rung verify method handled its own feedback display, do not override
    }
}

// ---------------------------------------------------------
// 3D OBSERVATORY (Three.js) - Rung 1: Eratosthenes
// ---------------------------------------------------------
const canvas = document.getElementById('main-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 50000);
// Move camera to look directly at the day side (+X axis) where the cities are located
camera.position.set(5, 0, 0);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;

// Earth Group
const earthGroup = new THREE.Group();
scene.add(earthGroup);

// Moon Group (Rung 2)
const moonGroup = new THREE.Group();
moonGroup.visible = false;
scene.add(moonGroup);

// ---------------------------------------------------------
// RUNG 2: LUNAR ECLIPSE GEOMETRY (Full System)
// ---------------------------------------------------------
// We scale down the system to fit in the camera view
const r2EarthRadius = 1.0;
const r2MoonRadius = r2EarthRadius / 3.5;
const r2Distance = 4.0; // Distance from earth to moon

// Earth
const r2EarthGeo = new THREE.SphereGeometry(r2EarthRadius, 32, 32);
const r2EarthMat = new THREE.MeshPhongMaterial({ color: 0x125d98 });
const r2Earth = new THREE.Mesh(r2EarthGeo, r2EarthMat);
moonGroup.add(r2Earth);

// Shadow Cone (Cylinder to represent Aristarchus' assumption)
const coneGeo = new THREE.CylinderGeometry(r2EarthRadius, r2EarthRadius, 10, 32, 1, true);
coneGeo.rotateZ(Math.PI/2); // point along X axis
coneGeo.translate(-5, 0, 0); // push it back behind Earth (-X)
const coneMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
const shadowCone = new THREE.Mesh(coneGeo, coneMat);
moonGroup.add(shadowCone);

// Outline the shadow to make its boundary obvious
const shadowEdgesGeo = new THREE.EdgesGeometry(coneGeo);
const shadowEdgesMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
const shadowOutline = new THREE.LineSegments(shadowEdgesGeo, shadowEdgesMat);
moonGroup.add(shadowOutline);

// Penumbra (Outer Shadow rays expanding outwards)
const penumbraGeo = new THREE.CylinderGeometry(r2EarthRadius * 2.5, r2EarthRadius, 10, 32, 1, true);
penumbraGeo.rotateZ(Math.PI/2); 
penumbraGeo.translate(-5, 0, 0); 
const penumbraMat = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
const penumbraCone = new THREE.Mesh(penumbraGeo, penumbraMat);
moonGroup.add(penumbraCone);

// Penumbra Rays (Wireframe outline of the expanding cone)
const penumbraEdgesGeo = new THREE.EdgesGeometry(penumbraGeo);
const penumbraEdgesMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.15 });
const penumbraRays = new THREE.LineSegments(penumbraEdgesGeo, penumbraEdgesMat);
moonGroup.add(penumbraRays);

// Moon
const r2MoonGeo = new THREE.SphereGeometry(r2MoonRadius, 32, 32);
const r2MoonMat = new THREE.MeshPhongMaterial({ color: 0xdddddd });
const r2Moon = new THREE.Mesh(r2MoonGeo, r2MoonMat);
moonGroup.add(r2Moon);

const moonAmbient = new THREE.AmbientLight(0xffffff, 0.1);
moonGroup.add(moonAmbient);
const moonLight = new THREE.DirectionalLight(0xffffff, 1.2);
moonLight.position.set(10, 0, 0); // Sun is far right (+X)
moonGroup.add(moonLight);

// Assumption Label (Sprite)
const canvasUI = document.createElement('canvas');
canvasUI.width = 1024;
canvasUI.height = 256;
const ctxUI = canvasUI.getContext('2d');
ctxUI.fillStyle = 'rgba(0,0,0,0.6)';
ctxUI.fillRect(0,0,1024,256);
ctxUI.fillStyle = '#fff';
ctxUI.textAlign = 'center';
ctxUI.font = 'bold 40px sans-serif';
ctxUI.fillText("Assumption:", 512, 60);
ctxUI.fillStyle = '#00ffaa';
ctxUI.font = '36px sans-serif';
ctxUI.fillText("The Sun is infinitely far away,", 512, 130);
ctxUI.fillText("so Earth's shadow is as wide as the Earth itself.", 512, 180);

const texUI = new THREE.CanvasTexture(canvasUI);
const matUI = new THREE.SpriteMaterial({ map: texUI });
const spriteUI = new THREE.Sprite(matUI);
spriteUI.scale.set(5, 1.25, 1);
spriteUI.position.set(-2, 2.5, 0);
moonGroup.add(spriteUI);

// ---------------------------------------------------------
// RUNG 3: DISTANCE TO THE MOON (3D SEXTANT SIMULATION)
// ---------------------------------------------------------
const distGroup = new THREE.Group();
scene.add(distGroup);

// ---------------------------------------------------------
// RUNG 3: DISTANCE TO THE MOON (GEOMETRIC VISUALIZATION)
// ---------------------------------------------------------

// Lighting for Geometry
const r3Light = new THREE.DirectionalLight(0xffffff, 1.5);
r3Light.position.set(5, 5, 10);
distGroup.add(r3Light);
distGroup.add(new THREE.AmbientLight(0xffffff, 0.6));

// Earth for Rung 3
const r3EarthGeo = new THREE.SphereGeometry(0.5, 32, 32);
const r3EarthMat = new THREE.MeshPhongMaterial({ color: 0x125dff });
const r3Earth = new THREE.Mesh(r3EarthGeo, r3EarthMat);
r3Earth.position.set(0, 0, 0);
distGroup.add(r3Earth);

// Moon for Rung 3
// Make the Moon's radius exactly match 0.50 degrees at distance 20
const r3MoonRadius = 20 * Math.tan((0.50 / 2) * Math.PI / 180); // ~0.087266
const r3MoonGeo = new THREE.SphereGeometry(r3MoonRadius, 32, 32);
const r3MoonMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });
const r3Moon = new THREE.Mesh(r3MoonGeo, r3MoonMat);
r3Moon.position.set(20, 0, 0);
distGroup.add(r3Moon);

// Distance Line (Center line from Earth to Moon)
const r3DistLineMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.5 });
const r3DistLinePoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(20, 0, 0)];
const r3DistLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(r3DistLinePoints), r3DistLineMat);
distGroup.add(r3DistLine);

// Sightlines (Cone edges from Earth to Moon's top/bottom)
const r3SightlineMat = new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 2 });
const r3SightlinePoints = [
    new THREE.Vector3(20, 0.15, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(20, -0.15, 0)
];
const r3SightlineGeo = new THREE.BufferGeometry().setFromPoints(r3SightlinePoints);
const r3Sightline = new THREE.Line(r3SightlineGeo, r3SightlineMat);
distGroup.add(r3Sightline);

// Transparent cone showing angular FOV
const r3ConeHeight = 20;
const r3ConeRadius = 0.15;
const r3ConeGeo = new THREE.ConeGeometry(r3ConeRadius, r3ConeHeight, 16);
const r3ConeMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.2, depthWrite: false });
var r3Cone = new THREE.Mesh(r3ConeGeo, r3ConeMat);
r3Cone.rotation.z = Math.PI / 2;
r3Cone.position.set(10, 0, 0);
distGroup.add(r3Cone);

// Labels using Canvas Sprites
function createR3TextSprite(text, fontSize = 64, color = "white") {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = `bold ${fontSize}px "Outfit", sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
    return sprite;
}

const r3LabelD = createR3TextSprite("d (Distance)", 32, "#aaaaaa");
r3LabelD.position.set(10, -0.8, 0);
r3LabelD.scale.set(6, 1.5, 1);
distGroup.add(r3LabelD);

var r3LabelTheta = createR3TextSprite("θ = 0.50°", 48, "#ffaa00");
r3LabelTheta.position.set(5, 0.8, 0);
r3LabelTheta.scale.set(6, 1.5, 1);
distGroup.add(r3LabelTheta);

const r3LabelMoon = createR3TextSprite("D_moon", 32, "#cccccc");
r3LabelMoon.position.set(20, 0.6, 0);
r3LabelMoon.scale.set(4, 1, 1);
distGroup.add(r3LabelMoon);

window.r3Cone = r3Cone;
window.r3SightlineGeo = r3SightlineGeo;
window.r3LabelTheta = r3LabelTheta;

distGroup.visible = false;

// ---------------------------------------------------------
// RUNG 4: DISTANCE TO THE SUN (ARISTARCHUS METHOD)
// ---------------------------------------------------------
const sunGroup = new THREE.Group();
scene.add(sunGroup);

const r4Light = new THREE.DirectionalLight(0xffaa55, 1.5);
r4Light.position.set(0, 0, -10); // Sun is far away
sunGroup.add(r4Light);
sunGroup.add(new THREE.AmbientLight(0xffffff, 0.4));

const r4EarthGeo = new THREE.SphereGeometry(0.5, 32, 32);
const r4EarthMat = new THREE.MeshPhongMaterial({ color: 0x125dff });
const r4Earth = new THREE.Mesh(r4EarthGeo, r4EarthMat);
r4Earth.position.set(0, 0, 0);
sunGroup.add(r4Earth);

const r4MoonGeo = new THREE.SphereGeometry(0.15, 32, 32);
const r4MoonMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });
const r4Moon = new THREE.Mesh(r4MoonGeo, r4MoonMat);
r4Moon.position.set(0, 10, 0);
sunGroup.add(r4Moon);

const r4SunGeo = new THREE.SphereGeometry(3, 32, 32);
const r4SunMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
const r4Sun = new THREE.Mesh(r4SunGeo, r4SunMat);
sunGroup.add(r4Sun);

// Add a glowing aura to the Sun
const r4SunGlowGeo = new THREE.SphereGeometry(4.5, 32, 32);
const r4SunGlowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.4 });
const r4SunGlow = new THREE.Mesh(r4SunGlowGeo, r4SunGlowMat);
r4Sun.add(r4SunGlow);

const r4LineMatSolid = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
const r4LineMatDashed = new THREE.LineDashedMaterial({ color: 0xaaaaaa, dashSize: 0.5, gapSize: 0.5 });
const r4LineMatHypo = new THREE.LineBasicMaterial({ color: 0x00e5ff });

const r4EarthMoonLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,10,0)]),
    r4LineMatSolid
);
sunGroup.add(r4EarthMoonLine);

const r4MoonSunLine = new THREE.Line(new THREE.BufferGeometry(), r4LineMatDashed);
sunGroup.add(r4MoonSunLine);

const r4EarthSunLine = new THREE.Line(new THREE.BufferGeometry(), r4LineMatHypo);
sunGroup.add(r4EarthSunLine);

const r4RightAngleGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 9.0, 0),
    new THREE.Vector3(1.0, 9.0, 0),
    new THREE.Vector3(1.0, 10, 0)
]);
const r4RightAngle = new THREE.Line(r4RightAngleGeo, new THREE.LineBasicMaterial({color: 0xff0000, linewidth: 2}));
sunGroup.add(r4RightAngle);

const r4LabelD = createR3TextSprite("d (Moon)", 32, "#aaaaaa");
r4LabelD.position.set(-1.5, 5, 0);
r4LabelD.scale.set(4, 1, 1);
sunGroup.add(r4LabelD);

var r4LabelSunD = createR3TextSprite("D_sun", 32, "#ffdd44");
sunGroup.add(r4LabelSunD);

window.r4Sun = r4Sun;
window.r4MoonSunLine = r4MoonSunLine;
window.r4EarthSunLine = r4EarthSunLine;
window.r4LabelSunD = r4LabelSunD;

sunGroup.visible = false;

// ---------------------------------------------------------
// RUNG 8: STELLAR PARALLAX (3D Geometric Model)
const stellarGroup = new THREE.Group();
stellarGroup.visible = false;
scene.add(stellarGroup);

// Sun in the center
const stellarSun = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
stellarGroup.add(stellarSun);

// Sun Glow
const sunGlowMat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture((() => {
        const c = document.createElement('canvas'); c.width = 128; c.height = 128;
        const ctx = c.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 255, 100, 1.0)');
        grad.addColorStop(0.3, 'rgba(255, 200, 50, 0.8)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad; ctx.fillRect(0,0,128,128);
        return c;
    })()),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const sunGlow = new THREE.Sprite(sunGlowMat);
sunGlow.scale.set(12, 12, 1);
stellarGroup.add(sunGlow);

// Earth orbit path
const stellarOrbit = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(
        Array.from({length: 64}).map((_, i) => {
            const a = (i / 64) * Math.PI * 2;
            return new THREE.Vector3(10 * Math.cos(a), 0, 10 * Math.sin(a));
        })
    ),
    new THREE.LineBasicMaterial({ color: 0x4444ff, transparent: true, opacity: 0.5 })
);
stellarGroup.add(stellarOrbit);

// Jan Earth and Jul Earth
const stellarEarthGeo = new THREE.SphereGeometry(1, 16, 16);
const stellarEarthMat = new THREE.MeshBasicMaterial({ color: 0x4488ff });
const stellarJanEarth = new THREE.Mesh(stellarEarthGeo, stellarEarthMat);
stellarJanEarth.position.set(10, 0, 0); // Jan
stellarGroup.add(stellarJanEarth);
const stellarJulEarth = new THREE.Mesh(stellarEarthGeo, stellarEarthMat);
stellarJulEarth.position.set(-10, 0, 0); // Jul
stellarGroup.add(stellarJulEarth);

// Baseline (1 AU + 1 AU)
const stellarBaseline = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(10, 0, 0), new THREE.Vector3(-10, 0, 0)]),
    new THREE.LineBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0.8, linewidth: 2 })
);
stellarGroup.add(stellarBaseline);

// Foreground Star (61 Cygni) at Z = -100
const stellarStarMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });
const stellarStar = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), stellarStarMat);
stellarStar.position.set(0, 0, -100);
stellarGroup.add(stellarStar);

// Add a glow to the star
const starGlowMat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture((() => {
        const c = document.createElement('canvas'); c.width = 128; c.height = 128;
        const ctx = c.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 200, 100, 1.0)');
        grad.addColorStop(0.2, 'rgba(255, 150, 50, 0.8)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad; ctx.fillRect(0,0,128,128);
        return c;
    })()),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const starGlow = new THREE.Sprite(starGlowMat);
starGlow.scale.set(15, 15, 1);
starGlow.position.set(0, 0, -100);
stellarGroup.add(starGlow);

// Background Sky Grid & Stars at Z = -200
const stellarGridMat = new THREE.LineBasicMaterial({ color: 0x444466, transparent: true, opacity: 0.5 });

// 0.7 arcsec true shift maps to 20 units in 3D. 1 arcsec = 28.5714 units.
const ARCSEC_TO_3D = 20 / 0.7;

for (let i = -4; i <= 4; i++) {
    const arcsec = i * 0.2;
    const x = arcsec * ARCSEC_TO_3D;
    const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, -40, -200),
        new THREE.Vector3(x, 40, -200)
    ]);
    const line = new THREE.Line(geo, stellarGridMat);
    if (i === 0) {
        line.material = new THREE.LineBasicMaterial({ color: 0x8888aa, transparent: true, opacity: 0.8, linewidth: 2 });
    }
    stellarGroup.add(line);
    
    // Grid label
    const lbl = createStellarLabel(arcsec.toFixed(1) + '"', "#8888aa", 48, "rgba(0,0,0,0.8)", 256);
    lbl.position.set(x, -45, -200);
    lbl.scale.set(10, 5, 1);
    stellarGroup.add(lbl);
}

// Generate the identical background starfield via pure 3D Sprites mapped to arcsec
const starTex = new THREE.CanvasTexture((() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(32, 32, 8, 0, Math.PI*2); ctx.fill();
    return c;
})());

for(let i=0; i<50; i++) {
    // Generate star coordinates in pure arcseconds: range roughly [-1.0, 1.0]
    const arcX = Math.sin(i*123) * 1.0;
    const arcY = Math.cos(i*321) * 1.0;
    const size = (Math.sin(i*456) * 0.5 + 0.5) * 2 + 1; // size between 1 and 3
    
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true }));
    sprite.position.set(arcX * ARCSEC_TO_3D, arcY * ARCSEC_TO_3D, -201);
    sprite.scale.set(size, size, 1);
    stellarGroup.add(sprite);
}

// Sightlines
const stellarJanSightGeo = new THREE.BufferGeometry();
const stellarJanSight = new THREE.Line(stellarJanSightGeo, new THREE.LineBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.8 }));
stellarJanSight.frustumCulled = false;
stellarGroup.add(stellarJanSight);

const stellarJulSightGeo = new THREE.BufferGeometry();
const stellarJulSight = new THREE.Line(stellarJulSightGeo, new THREE.LineBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 }));
stellarJulSight.frustumCulled = false;
stellarGroup.add(stellarJulSight);

// Projections on background
const stellarProjGeo = new THREE.CircleGeometry(2, 16);
const stellarProjMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
const stellarJanProj = new THREE.Mesh(stellarProjGeo, stellarProjMat);
stellarJanProj.position.set(0, 0, -199.9);
stellarGroup.add(stellarJanProj);

const stellarJulProj = new THREE.Mesh(stellarProjGeo, stellarProjMat.clone());
stellarJulProj.position.set(0, 0, -199.9);
stellarGroup.add(stellarJulProj);

// Pre-calculate sightlines since they are static
const starPos = new THREE.Vector3(0, 0, -100);

// Jan
const janPos = new THREE.Vector3(10, 0, 0);
const janDir = new THREE.Vector3().subVectors(starPos, janPos).normalize();
const tJan = (-200 - janPos.z) / janDir.z;
const pJanX = janPos.x + tJan * janDir.x;
const pJanY = janPos.y + tJan * janDir.y;
stellarJanSightGeo.setFromPoints([janPos, new THREE.Vector3(pJanX, pJanY, -200)]);
stellarJanProj.position.set(pJanX, pJanY, -199.9);

// Jul
const julPos = new THREE.Vector3(-10, 0, 0);
const julDir = new THREE.Vector3().subVectors(starPos, julPos).normalize();
const tJul = (-200 - julPos.z) / julDir.z;
const pJulX = julPos.x + tJul * julDir.x;
const pJulY = julPos.y + tJul * julDir.y;
stellarJulSightGeo.setFromPoints([julPos, new THREE.Vector3(pJulX, pJulY, -200)]);
stellarJulProj.position.set(pJulX, pJulY, -199.9);

window.stellarJanProj = stellarJanProj;
window.stellarJulProj = stellarJulProj;

// Add 3D Labels for Stellar Parallax
function createStellarLabel(text, color = "white", fontSize = 48, shadowColor = "rgba(0,0,0,0.8)", cWidth = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = cWidth; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = `bold ${fontSize}px "Outfit", sans-serif`;
    
    // Add text shadow for legibility
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cWidth/2, 64);
    
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.renderOrder = 999; // Ensure it renders on top
    return sprite;
}

function updateStellarLabel(sprite, text, color = "white", fontSize = 48, shadowColor = "rgba(0,0,0,0.8)", cWidth = 512) {
    if (!sprite || !sprite.material || !sprite.material.map) return;
    const tex = sprite.material.map;
    const canvas = tex.image;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = `bold ${fontSize}px "Outfit", sans-serif`;
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, 64);
    
    tex.needsUpdate = true;
}

const lblSun = createStellarLabel("Sun", "#ffff00", 64);
lblSun.position.set(0, 3, 0);
lblSun.scale.set(10, 2.5, 1);
stellarGroup.add(lblSun);

const lblJan = createStellarLabel("Jan Earth", "#4488ff", 48);
lblJan.position.set(10, -2, 0);
lblJan.scale.set(8, 2, 1);
stellarGroup.add(lblJan);

const lblJul = createStellarLabel("Jul Earth", "#4488ff", 48);
lblJul.position.set(-10, -2, 0);
lblJul.scale.set(8, 2, 1);
stellarGroup.add(lblJul);

const lblBaseline = createStellarLabel("Baseline (2 AU)", "#00ffaa", 48);
lblBaseline.position.set(0, -1.5, 0);
lblBaseline.scale.set(12, 3, 1);
stellarGroup.add(lblBaseline);

const lblStar = createStellarLabel("61 Cygni", "#ffaa44", 64);
lblStar.position.set(0, 3, -100);
lblStar.scale.set(12, 3, 1);
stellarGroup.add(lblStar);

const lblBg = createStellarLabel("Background Stars", "#8888aa", 64, "rgba(0,0,0,0.8)", 1024);
lblBg.position.set(0, 30, -200); // raised slightly
lblBg.scale.set(80, 10, 1); // doubled scale to match 1024 width
stellarGroup.add(lblBg);

// Parallax Angle Ruler (at the star)
const stellarAngleArc = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 })
);
stellarAngleArc.frustumCulled = false;
stellarGroup.add(stellarAngleArc);

// Central construction line from Sun (0,0,0) to Cygni (0,0,-100)
const stellarCygniSunLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -100)]),
    new THREE.LineDashedMaterial({ color: 0x888888, dashSize: 2, gapSize: 2, transparent: true, opacity: 0.6 })
);
stellarCygniSunLine.computeLineDistances();
stellarGroup.add(stellarCygniSunLine);

const lblTheta = createStellarLabel('p = ?', '#ffffff', 64);
lblTheta.position.set(0, 5, -85); // elevated and pushed towards earth
lblTheta.scale.set(12, 3, 1);
stellarGroup.add(lblTheta);

// 3D Ruler (Caliper) at the background (Using Planes for visible thickness)
const stellarCaliper = new THREE.Group();
const calMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });

// Top horizontal bar
const calH = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), calMat);
// Left vertical tick
const calL = new THREE.Mesh(new THREE.PlaneGeometry(1, 4), calMat);
// Right vertical tick
const calR = new THREE.Mesh(new THREE.PlaneGeometry(1, 4), calMat);

stellarCaliper.add(calH);
stellarCaliper.add(calL);
stellarCaliper.add(calR);
stellarGroup.add(stellarCaliper);

window.stellarCaliperMat = calMat;
window.stellarCalH = calH;
window.stellarCalL = calL;
window.stellarCalR = calR;

const lblCaliper = createStellarLabel('Shift: ?', '#ffffff', 64);
lblCaliper.position.set(0, 15, -200); // placed high above the grid center
lblCaliper.scale.set(24, 6, 1);
stellarGroup.add(lblCaliper);

window.stellarAngleArc = stellarAngleArc;
window.stellarLblTheta = lblTheta;
window.stellarCaliper = stellarCaliper;
window.stellarLblCaliper = lblCaliper;

// RUNG 10: RADAR TO VENUS (3D Geometric Model)
// ---------------------------------------------------------

// =========================================================
// RUNG 9: SPECTROSCOPIC PARALLAX (H-R Diagram Cluster)
// =========================================================
let hyades3DGroup = null;
let pleiades3DGroup = null;
let pleiadesLine = null;
let pleiadesLabel = null;
let r9RulerGroup = null;
let r9AbsoluteSphere = null;
let r9MilkyWayDisk = null;
let r9Wavefronts = [];
let r9ProjLines = null;

const clusterGroup = new THREE.Group();
clusterGroup.visible = false;
scene.add(clusterGroup);

// Earth / Sun sphere at origin
const r9EarthGeo = new THREE.SphereGeometry(0.3, 16, 16);
const r9EarthMat = new THREE.MeshBasicMaterial({ color: 0x4488ff });
const r9EarthSphere = new THREE.Mesh(r9EarthGeo, r9EarthMat);
r9EarthSphere.position.set(0, 0, 0);
clusterGroup.add(r9EarthSphere);

const r9EarthLabel = createStellarLabel("Earth (0 pc)", "#4488ff", 48);
r9EarthLabel.position.set(0, 1.2, 0);
r9EarthLabel.scale.set(6, 1.5, 1);
clusterGroup.add(r9EarthLabel);

// Concentric Grid Rings on X-Z floor plane (1 unit = 10 pc)
function createGridRing(radius, colorHex) {
    const points = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.15 });
    return new THREE.Line(geo, mat);
}

const ring50 = createGridRing(5.0, 0x555555);
const ring100 = createGridRing(10.0, 0x555555);
const ring150 = createGridRing(15.0, 0x555555);
clusterGroup.add(ring50);
clusterGroup.add(ring100);
clusterGroup.add(ring150);

const lbl50 = createStellarLabel("50 pc", "#888888", 36);
lbl50.position.set(0, -0.6, -5.0);
lbl50.scale.set(3, 0.75, 1);
clusterGroup.add(lbl50);

const lbl100 = createStellarLabel("100 pc", "#888888", 36);
lbl100.position.set(0, -0.6, -10.0);
lbl100.scale.set(3, 0.75, 1);
clusterGroup.add(lbl100);

const lbl150 = createStellarLabel("150 pc", "#888888", 36);
lbl150.position.set(0, -0.6, -15.0);
lbl150.scale.set(3, 0.75, 1);
clusterGroup.add(lbl150);

// 1. ABSOLUTE MAGNITUDE REFERENCE SPHERE (10 parsecs = 1.0 unit)
const r9AbsGeo = new THREE.SphereGeometry(1.0, 32, 16);
const r9AbsMat = new THREE.MeshBasicMaterial({
    color: 0x00ffaa,
    wireframe: true,
    transparent: true,
    opacity: 0.04
});
r9AbsoluteSphere = new THREE.Mesh(r9AbsGeo, r9AbsMat);
clusterGroup.add(r9AbsoluteSphere);

const r9AbsRing = createGridRing(1.0, 0x00ffaa);
r9AbsRing.material.opacity = 0.4;
clusterGroup.add(r9AbsRing);

const r9AbsLabel = createStellarLabel("Absolute Mag Standard (10 pc)", "#00ffaa", 36);
r9AbsLabel.position.set(0, -1.0, -1.0);
r9AbsLabel.scale.set(6.0, 1.5, 1);
clusterGroup.add(r9AbsLabel);

// 2. MILKY WAY GALACTIC CONTEXT PLANE
const milkyWayGeo = new THREE.BufferGeometry();
const milkyWayCount = 400;
const milkyWayPositions = new Float32Array(milkyWayCount * 3);
const milkyWayColors = new Float32Array(milkyWayCount * 3);
for (let i = 0; i < milkyWayCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const r = 4.0 + Math.random() * 26.0;
    milkyWayPositions[i * 3] = r * Math.cos(theta);
    milkyWayPositions[i * 3 + 1] = -2.5 + (Math.random() - 0.5) * 0.8;
    milkyWayPositions[i * 3 + 2] = r * Math.sin(theta);
    
    // Faint galactic dust colors
    milkyWayColors[i * 3] = 0.2 + Math.random() * 0.15;
    milkyWayColors[i * 3 + 1] = 0.25 + Math.random() * 0.15;
    milkyWayColors[i * 3 + 2] = 0.45 + Math.random() * 0.25;
}
milkyWayGeo.setAttribute('position', new THREE.BufferAttribute(milkyWayPositions, 3));
milkyWayGeo.setAttribute('color', new THREE.BufferAttribute(milkyWayColors, 3));
const milkyWayMat = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending
});
r9MilkyWayDisk = new THREE.Points(milkyWayGeo, milkyWayMat);
clusterGroup.add(r9MilkyWayDisk);

// 3. PARSEC LINE-OF-SIGHT RULER FOR PLEIADES
r9RulerGroup = new THREE.Group();
clusterGroup.add(r9RulerGroup);

const rulerPts = [
    new THREE.Vector3(0, -0.6, 0),
    new THREE.Vector3(-10.4, 7.2, -22.1)
];
const rulerLineGeo = new THREE.BufferGeometry().setFromPoints(rulerPts);
const rulerLine = new THREE.Line(rulerLineGeo, new THREE.LineBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.4 }));
r9RulerGroup.add(rulerLine);

// Ticks at 50, 100, 150, 200, 250 pc
[50, 100, 150, 200, 250].forEach(d => {
    const cx = (d / 10.0) * -0.4;
    const cy = (d / 10.0) * 0.3 - 0.6;
    const cz = (d / 10.0) * -0.85;
    
    const tickPts = [
        new THREE.Vector3(cx - 0.4, cy, cz),
        new THREE.Vector3(cx + 0.4, cy, cz)
    ];
    const tickGeo = new THREE.BufferGeometry().setFromPoints(tickPts);
    const tickLine = new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.6 }));
    r9RulerGroup.add(tickLine);
});

// Helper for mapping B-V to ThreeJS Color
function getThreeStarColor(bv) {
    if (bv < 0.0) return new THREE.Color(0x99ccff);      // Blue (O/B)
    if (bv < 0.3) return new THREE.Color(0xddeeff);      // Blue-White (A)
    if (bv < 0.6) return new THREE.Color(0xffffff);      // White (F)
    if (bv < 0.8) return new THREE.Color(0xffffee);      // Yellow-White (G)
    if (bv < 1.2) return new THREE.Color(0xffddaa);      // Orange (K)
    return new THREE.Color(0xff8888);                 // Red (M)
}

// Static Hyades Cluster Group (Z = -4.7 => 47 pc)
hyades3DGroup = new THREE.Group();
hyades3DGroup.position.set(0.24, -0.19, -4.69);
clusterGroup.add(hyades3DGroup);

const hyadesGlowGeo = new THREE.SphereGeometry(1.8, 16, 16);
const hyadesGlowMat = new THREE.MeshBasicMaterial({
    color: 0xffaa44,
    transparent: true,
    opacity: 0.07,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const hyadesGlow = new THREE.Mesh(hyadesGlowGeo, hyadesGlowMat);
hyades3DGroup.add(hyadesGlow);

// Warm and diverse stars
const hyadesStarCount = 80;
const hyadesStarGeo = new THREE.BufferGeometry();
const hyadesPositions = new Float32Array(hyadesStarCount * 3);
const hyadesColors = new Float32Array(hyadesStarCount * 3);
for (let i = 0; i < hyadesStarCount; i++) {
    const r = Math.pow(Math.random(), 1.5) * 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    hyadesPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    hyadesPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    hyadesPositions[i * 3 + 2] = r * Math.cos(phi);
    
    // Random representative B-V values for Hyades (-0.1 to 1.5)
    const bv = -0.1 + Math.random() * 1.6;
    const color = getThreeStarColor(bv);
    hyadesColors[i * 3] = color.r;
    hyadesColors[i * 3 + 1] = color.g;
    hyadesColors[i * 3 + 2] = color.b;
}
hyadesStarGeo.setAttribute('position', new THREE.BufferAttribute(hyadesPositions, 3));
hyadesStarGeo.setAttribute('color', new THREE.BufferAttribute(hyadesColors, 3));

const hyadesStarMat = new THREE.PointsMaterial({
    size: 0.28,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
});
const hyadesPoints = new THREE.Points(hyadesStarGeo, hyadesStarMat);
hyades3DGroup.add(hyadesPoints);

const hyadesLabelObj = createStellarLabel("Hyades Cluster (~47 pc)", "#ffaa44", 44);
hyadesLabelObj.position.set(0, 1.8, 0);
hyadesLabelObj.scale.set(8, 2, 1);
hyades3DGroup.add(hyadesLabelObj);

// Dynamic Pleiades Cluster Group (starts at Z = -8.5, X = -4.0, Y = 3.0 => 100 pc, visually exaggerated off-axis)
pleiades3DGroup = new THREE.Group();
pleiades3DGroup.position.set(-4.0, 3.0, -8.5);
clusterGroup.add(pleiades3DGroup);

const pleiadesGlowGeo = new THREE.SphereGeometry(2.0, 16, 16);
const pleiadesGlowMat = new THREE.MeshBasicMaterial({
    color: 0x55aaff,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const pleiadesGlow = new THREE.Mesh(pleiadesGlowGeo, pleiadesGlowMat);
pleiades3DGroup.add(pleiadesGlow);

// Mostly blue-white young stars
const pleiadesStarCount = 100;
const pleiadesStarGeo = new THREE.BufferGeometry();
const pleiadesPositions = new Float32Array(pleiadesStarCount * 3);
const pleiadesColors = new Float32Array(pleiadesStarCount * 3);
for (let i = 0; i < pleiadesStarCount; i++) {
    const r = Math.pow(Math.random(), 1.5) * 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pleiadesPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pleiadesPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pleiadesPositions[i * 3 + 2] = r * Math.cos(phi);
    
    // Younger stars: B-V values skewed blue-white (-0.2 to 0.4)
    const bv = -0.2 + Math.random() * 0.6;
    const color = getThreeStarColor(bv);
    pleiadesColors[i * 3] = color.r;
    pleiadesColors[i * 3 + 1] = color.g;
    pleiadesColors[i * 3 + 2] = color.b;
}
pleiadesStarGeo.setAttribute('position', new THREE.BufferAttribute(pleiadesPositions, 3));
pleiadesStarGeo.setAttribute('color', new THREE.BufferAttribute(pleiadesColors, 3));

const pleiadesStarMat = new THREE.PointsMaterial({
    size: 0.28,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
});
const pleiadesPoints = new THREE.Points(pleiadesStarGeo, pleiadesStarMat);
pleiades3DGroup.add(pleiadesPoints);
window.pleiadesPoints = pleiadesPoints;

pleiadesLabel = createStellarLabel("Pleiades (100 pc)", "#55aaff", 44);
pleiadesLabel.position.set(0, 1.8, 0);
pleiadesLabel.scale.set(8, 2, 1);
pleiades3DGroup.add(pleiadesLabel);
window.pleiadesLabel = pleiadesLabel;

// Static Hyades dashed sightline (pointing to off-axis Hyades center)
const hyadesLineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.24, -0.19, -4.69)
]);
const hyadesLineMat = new THREE.LineDashedMaterial({
    color: 0xffaa44,
    dashSize: 0.3,
    gapSize: 0.15,
    transparent: true,
    opacity: 0.4
});
const hyadesLine = new THREE.Line(hyadesLineGeo, hyadesLineMat);
hyadesLine.computeLineDistances();
clusterGroup.add(hyadesLine);

// Dynamic Pleiades dashed sightline (starts pointing to off-axis Pleiades center)
const pleiadesLineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-4.0, 3.0, -8.5)
]);
const pleiadesLineMat = new THREE.LineDashedMaterial({
    color: 0x55aaff,
    dashSize: 0.3,
    gapSize: 0.15,
    transparent: true,
    opacity: 0.4
});
pleiadesLine = new THREE.Line(pleiadesLineGeo, pleiadesLineMat);
pleiadesLine.computeLineDistances();
clusterGroup.add(pleiadesLine);
window.pleiadesLine = pleiadesLine;

// 5. PROJECTOR LINES FROM PLEIADES TO 10 PC REFERENCE PLANE
const r9ProjLinesGeo = new THREE.BufferGeometry();
const r9ProjLinesMat = new THREE.LineBasicMaterial({
    color: 0x55aaff,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending
});
r9ProjLines = new THREE.LineSegments(r9ProjLinesGeo, r9ProjLinesMat);
clusterGroup.add(r9ProjLines);
window.r9ProjLines = r9ProjLines;

// 4. INVERSE-SQUARE LAW LIGHT SHELL WAVEFRONTS
r9Wavefronts = [];
const waveCount = 3;
for (let i = 0; i < waveCount; i++) {
    const waveGeo = new THREE.RingGeometry(0.01, 0.4, 32);
    // Face the origin
    waveGeo.rotateX(Math.PI / 2);
    const waveMat = new THREE.MeshBasicMaterial({
        color: 0x55aaff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    clusterGroup.add(waveMesh);
    r9Wavefronts.push({
        mesh: waveMesh,
        progress: i / waveCount
    });
}
window.r9Wavefronts = r9Wavefronts;

// =========================================================
// RUNG 10: DISTANCE TO GALAXIES (Cepheid Variables)
// =========================================================
const galaxiesGroup = new THREE.Group();
galaxiesGroup.visible = false;
scene.add(galaxiesGroup);

// Ambient light for galaxies group
galaxiesGroup.add(new THREE.AmbientLight(0xffffff, 1.2));

// Represent the Earth at the origin (0, 0, 0)
const r10EarthGeo = new THREE.SphereGeometry(3.0, 32, 32);
const r10EarthMat = new THREE.MeshPhongMaterial({
    color: 0x1d4ed8,
    emissive: 0x1e3a8a,
    shininess: 25,
    transparent: true,
    opacity: 0.95
});
const r10EarthMesh = new THREE.Mesh(r10EarthGeo, r10EarthMat);
r10EarthMesh.position.set(0, 0, 0);
galaxiesGroup.add(r10EarthMesh);

const r10EarthGrid = new THREE.Mesh(
    new THREE.SphereGeometry(3.05, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.15 })
);
r10EarthMesh.add(r10EarthGrid);

const r10EarthLabel = createStellarLabel("Earth (0 pc)", "#00d4ff", 42);
r10EarthLabel.position.set(0, 4.5, 0);
r10EarthLabel.scale.set(8, 2, 1);
galaxiesGroup.add(r10EarthLabel);

// 1. Andromeda Galaxy Group (M31) - rotating spiral star points
const andromedaGroup = new THREE.Group();
andromedaGroup.position.set(150, 100, -240); // 300 units distance off-axis
galaxiesGroup.add(andromedaGroup);

const andromedaPointsCount = 3500;
const andromedaGeo = new THREE.BufferGeometry();
const andromedaPositions = new Float32Array(andromedaPointsCount * 3);
const andromedaColors = new Float32Array(andromedaPointsCount * 3);

// Generate logarithmic spiral points centered locally at (0, 0, 0)
for (let i = 0; i < andromedaPointsCount; i++) {
    const arm = i % 2 === 0 ? 0 : Math.PI;
    const theta = (i / andromedaPointsCount) * 20; 
    const radius = 2.5 * Math.pow(1.15, theta); 
    
    const spreadX = (Math.random() - 0.5) * radius * 0.15;
    const spreadY = (Math.random() - 0.5) * radius * 0.15;
    const spreadZ = (Math.random() - 0.5) * radius * 0.08 * (1.0 - radius / 60.0);
    
    // Position locally relative to M31 center (0,0,0)
    const x = radius * Math.cos(theta + arm) + spreadX;
    const y = radius * Math.sin(theta + arm) + spreadY;
    const z = (Math.random() - 0.5) * radius * 0.1 + spreadZ;
    
    andromedaPositions[i * 3] = x;
    andromedaPositions[i * 3 + 1] = y;
    andromedaPositions[i * 3 + 2] = z;
    
    const coreFactor = Math.max(0, 1.0 - radius / 35.0);
    const r = 0.5 + coreFactor * 0.5 + Math.random() * 0.1;
    const g = 0.6 + coreFactor * 0.3 + Math.random() * 0.1;
    const b = 0.95 + coreFactor * 0.05;
    
    andromedaColors[i * 3] = r;
    andromedaColors[i * 3 + 1] = g;
    andromedaColors[i * 3 + 2] = b;
}

andromedaGeo.setAttribute('position', new THREE.BufferAttribute(andromedaPositions, 3));
andromedaGeo.setAttribute('color', new THREE.BufferAttribute(andromedaColors, 3));

const andromedaPointsMat = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
});

const andromedaPoints = new THREE.Points(andromedaGeo, andromedaPointsMat);
// Rotate slightly to present a gorgeous tilted galaxy view locally
andromedaPoints.rotation.x = Math.PI / 6;
andromedaPoints.rotation.y = Math.PI / 4;
andromedaGroup.add(andromedaPoints);
window.r9AndromedaPoints = andromedaPoints;

const andromedaLabel = createStellarLabel("Andromeda Galaxy (M31)", "#55aaff", 42, "rgba(0,0,0,0.8)", 1024);
andromedaLabel.position.set(0, 18, 0); // Position relative to andromedaGroup center
andromedaLabel.scale.set(16, 2, 1);
andromedaGroup.add(andromedaLabel);
window.andromedaLabel = andromedaLabel;

// 2. Small Magellanic Cloud (SMC) Cluster - dwarf cluster of stars
const smcGroup = new THREE.Group();
smcGroup.position.set(-60, -40, -70); // 100 units distance off-axis
galaxiesGroup.add(smcGroup);

const smcPointsCount = 1000;
const smcGeo = new THREE.BufferGeometry();
const smcPositions = new Float32Array(smcPointsCount * 3);
const smcColors = new Float32Array(smcPointsCount * 3);

// Generate SMC points locally centered at (0, 0, 0)
for (let i = 0; i < smcPointsCount; i++) {
    const u = Math.random();
    const radius = 8 * Math.pow(u, 2); 
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    smcPositions[i * 3] = x;
    smcPositions[i * 3 + 1] = y;
    smcPositions[i * 3 + 2] = z;
    
    smcColors[i * 3] = 0.85 + Math.random() * 0.15;
    smcColors[i * 3 + 1] = 0.75 + Math.random() * 0.2;
    smcColors[i * 3 + 2] = 0.5 + Math.random() * 0.2; // warmer dwarf cloud color
}

smcGeo.setAttribute('position', new THREE.BufferAttribute(smcPositions, 3));
smcGeo.setAttribute('color', new THREE.BufferAttribute(smcColors, 3));

const smcPointsMat = new THREE.PointsMaterial({
    size: 1.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const smcPoints = new THREE.Points(smcGeo, smcPointsMat);
smcGroup.add(smcPoints);

const smcLabel = createStellarLabel("Small Magellanic Cloud (60 kpc)", "#ffdd44", 42, "rgba(0,0,0,0.8)", 1024);
smcLabel.position.set(0, 12, 0); // Position relative to smcGroup center
smcLabel.scale.set(16, 2, 1);
smcGroup.add(smcLabel);

// 3. Sightline rulers and parsec markers
// SMC sightline (dashed yellow) from Earth (0,0,0) to SMC group position (-60, -40, -70)
const smcCenter = smcGroup.position;
const smcLineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    smcCenter
]);
const smcLineMat = new THREE.LineDashedMaterial({ color: 0xffcc44, dashSize: 2, gapSize: 1, transparent: true, opacity: 0.35 });
const smcLine = new THREE.Line(smcLineGeo, smcLineMat);
smcLine.computeLineDistances();
galaxiesGroup.add(smcLine);

// SMC ticks at 20, 40 kpc
[20, 40].forEach(kpc => {
    const frac = kpc / 60.0;
    const tickCenter = new THREE.Vector3().lerpVectors(new THREE.Vector3(0,0,0), smcCenter, frac);
    const tickPts = [new THREE.Vector3(tickCenter.x - 1, tickCenter.y, tickCenter.z), new THREE.Vector3(tickCenter.x + 1, tickCenter.y, tickCenter.z)];
    const tickGeo = new THREE.BufferGeometry().setFromPoints(tickPts);
    const tickLine = new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.5 }));
    galaxiesGroup.add(tickLine);
    
    const tickLbl = createStellarLabel(`${kpc} kpc`, "#ffcc44", 32);
    tickLbl.position.set(tickCenter.x, tickCenter.y - 2, tickCenter.z);
    tickLbl.scale.set(4, 1, 1);
    galaxiesGroup.add(tickLbl);
});

// Andromeda sightline (dashed blue-white) from Earth (0,0,0) to M31 group position (150, 100, -240)
const andromedaCenter = andromedaGroup.position;
const andromedaLineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    andromedaCenter
]);
const andromedaLineMat = new THREE.LineDashedMaterial({ color: 0x55aaff, dashSize: 4, gapSize: 2, transparent: true, opacity: 0.35 });
const andromedaLine = new THREE.Line(andromedaLineGeo, andromedaLineMat);
andromedaLine.computeLineDistances();
galaxiesGroup.add(andromedaLine);

// Andromeda ticks at 250, 500 kpc
[250, 500].forEach(kpc => {
    const frac = kpc / 794.0;
    const tickCenter = new THREE.Vector3().lerpVectors(new THREE.Vector3(0,0,0), andromedaCenter, frac);
    const tickPts = [new THREE.Vector3(tickCenter.x - 2, tickCenter.y, tickCenter.z), new THREE.Vector3(tickCenter.x + 2, tickCenter.y, tickCenter.z)];
    const tickGeo = new THREE.BufferGeometry().setFromPoints(tickPts);
    const tickLine = new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: 0x55aaff, transparent: true, opacity: 0.5 }));
    galaxiesGroup.add(tickLine);
    
    const tickLbl = createStellarLabel(`${kpc} kpc`, "#55aaff", 32);
    tickLbl.position.set(tickCenter.x, tickCenter.y - 4, tickCenter.z);
    tickLbl.scale.set(5, 1.25, 1);
    galaxiesGroup.add(tickLbl);
});

// 4. Yellow Emissive Cepheid Stars: A, B, C inside SMC Group
const cepheidGeoA = new THREE.SphereGeometry(1.2, 16, 16);
const cepheidMatA = new THREE.MeshPhongMaterial({ color: 0xffdd44, emissive: 0xffaa00, shininess: 30, transparent: true });
const starA = new THREE.Mesh(cepheidGeoA, cepheidMatA);
starA.position.set(-6, 0, 0); // Local relative to SMC core
smcGroup.add(starA);
window.r9StarA = starA;

const glowShellA = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }));
starA.add(glowShellA);

const lblA = createStellarLabel("SMC-Cepheid A", "#ffdd44", 36);
lblA.position.set(0, 3, 0);
lblA.scale.set(6, 1.5, 1);
starA.add(lblA);

const cepheidGeoB = new THREE.SphereGeometry(2.0, 16, 16);
const cepheidMatB = new THREE.MeshPhongMaterial({ color: 0xffdd44, emissive: 0xffaa00, shininess: 30, transparent: true });
const starB = new THREE.Mesh(cepheidGeoB, cepheidMatB);
starB.position.set(0, 0, 0); // Local at SMC core
smcGroup.add(starB);
window.r9StarB = starB;

const glowShellB = new THREE.Mesh(new THREE.SphereGeometry(3.0, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }));
starB.add(glowShellB);

const lblB = createStellarLabel("SMC-Cepheid B", "#ffdd44", 36);
lblB.position.set(0, 4.5, 0);
lblB.scale.set(6, 1.5, 1);
starB.add(lblB);

const cepheidGeoC = new THREE.SphereGeometry(3.2, 16, 16);
const cepheidMatC = new THREE.MeshPhongMaterial({ color: 0xffdd44, emissive: 0xffaa00, shininess: 30, transparent: true });
const starC = new THREE.Mesh(cepheidGeoC, cepheidMatC);
starC.position.set(6, 0, 0); // Local relative to SMC core
smcGroup.add(starC);
window.r9StarC = starC;

const glowShellC = new THREE.Mesh(new THREE.SphereGeometry(4.8, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }));
starC.add(glowShellC);

const lblC = createStellarLabel("SMC-Cepheid C", "#ffdd44", 36);
lblC.position.set(0, 6, 0);
lblC.scale.set(6, 1.5, 1);
starC.add(lblC);

// 5. Andromeda V1 Cepheid Star inside Andromeda Group (M31)
const cepheidGeoV1 = new THREE.SphereGeometry(1.5, 16, 16);
const cepheidMatV1 = new THREE.MeshPhongMaterial({ color: 0xffdd44, emissive: 0xffaa00, shininess: 30, transparent: true });
const starV1 = new THREE.Mesh(cepheidGeoV1, cepheidMatV1);
starV1.position.set(4, 3, 0); // Local relative to M31 core
andromedaGroup.add(starV1);
window.r9StarV1 = starV1;

const glowShellV1 = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }));
starV1.add(glowShellV1);

const lblV1 = createStellarLabel("Andromeda V1", "#55aaff", 36);
lblV1.position.set(0, 3.5, 0);
lblV1.scale.set(6, 1.5, 1);
starV1.add(lblV1);

// 6. Dynamic Cepheid light wavefront pulse system
window.r10Wavefronts = [];
for (let i = 0; i < 3; i++) {
    const waveGeo = new THREE.RingGeometry(0.8, 1.0, 32);
    const waveMat = new THREE.MeshBasicMaterial({
        color: 0xffdd44,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.visible = false;
    galaxiesGroup.add(waveMesh);
    window.r10Wavefronts.push({
        mesh: waveMesh,
        progress: i / 3.0
    });
}

// RUNG 6: MARS PARALLAX (1672)
// ---------------------------------------------------------
const marsGroup = new THREE.Group();
scene.add(marsGroup);

const rmarsLight = new THREE.DirectionalLight(0xffffff, 1.5);
rmarsLight.position.set(20, 10, 20);
marsGroup.add(rmarsLight);
marsGroup.add(new THREE.AmbientLight(0x404040, 1.0));

const rmarsEarthGeo = new THREE.SphereGeometry(2, 32, 32);
const rmarsEarthMat = new THREE.MeshPhongMaterial({ color: 0x125dff });
const rmarsEarth = new THREE.Mesh(rmarsEarthGeo, rmarsEarthMat);
rmarsEarth.position.set(0, 0, 0);
marsGroup.add(rmarsEarth);

// Realistic Latitude Positions: Paris (~48.8° N), French Guiana (~4.9° N)
// Placed on the front-right hemisphere (facing Mars at +X and Camera at +Z)
const pParis = new THREE.Vector3(0.66, 1.50, 1.14);
const pGuiana = new THREE.Vector3(1.00, 0.17, 1.73);
window.rmarsParisPos = pParis;
window.rmarsGuianaPos = pGuiana;

// Markers on Earth
const rmarsMarkerGeo = new THREE.SphereGeometry(0.15, 16, 16);
const rmarsMarkerMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
const rmarsMarker1 = new THREE.Mesh(rmarsMarkerGeo, rmarsMarkerMat);
rmarsMarker1.position.copy(pParis);
marsGroup.add(rmarsMarker1);
const rmarsMarker2 = new THREE.Mesh(rmarsMarkerGeo, rmarsMarkerMat);
rmarsMarker2.position.copy(pGuiana);
marsGroup.add(rmarsMarker2);

const rmarsMarsGeo = new THREE.SphereGeometry(1.0, 32, 32);
const rmarsMarsMat = new THREE.MeshPhongMaterial({ color: 0xff4422 });
const rmarsMars = new THREE.Mesh(rmarsMarsGeo, rmarsMarsMat);
rmarsMars.position.set(30, 0, 0); 
marsGroup.add(rmarsMars);

// Backdrop stars
const rmarsStarsGeo = new THREE.BufferGeometry();
const rmarsStarsPos = [];
for (let i = 0; i < 800; i++) {
    rmarsStarsPos.push(
        100,
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 150
    );
}
rmarsStarsGeo.setAttribute('position', new THREE.Float32BufferAttribute(rmarsStarsPos, 3));
const rmarsStarsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.4 });
const rmarsStars = new THREE.Points(rmarsStarsGeo, rmarsStarsMat);
marsGroup.add(rmarsStars);

// Projections of Mars on the backdrop
const rmarsProjGeo = new THREE.SphereGeometry(1.5, 16, 16);
const rmarsProjMat1 = new THREE.MeshBasicMaterial({ color: 0xff4422, transparent: true, opacity: 0.8 });
const rmarsProjMat2 = new THREE.MeshBasicMaterial({ color: 0xff4422, transparent: true, opacity: 0.8 });
const rmarsProj1 = new THREE.Mesh(rmarsProjGeo, rmarsProjMat1);
const rmarsProj2 = new THREE.Mesh(rmarsProjGeo, rmarsProjMat2);
marsGroup.add(rmarsProj1);
marsGroup.add(rmarsProj2);

window.rmarsProj1 = rmarsProj1;
window.rmarsProj2 = rmarsProj2;

const rmarsSightMat = new THREE.LineBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.8 });
const rmarsSight1Geo = new THREE.BufferGeometry();
const rmarsSight1 = new THREE.Line(rmarsSight1Geo, rmarsSightMat);
marsGroup.add(rmarsSight1);

const rmarsSight2Geo = new THREE.BufferGeometry();
const rmarsSight2 = new THREE.Line(rmarsSight2Geo, rmarsSightMat);
marsGroup.add(rmarsSight2);

const rmarsLabelParis = createR3TextSprite("Paris", 32, "#ffffff");
rmarsLabelParis.position.set(0.66, 1.9, 1.14);
rmarsLabelParis.scale.set(4, 1, 1);
marsGroup.add(rmarsLabelParis);

const rmarsLabelGuiana = createR3TextSprite("Guiana", 32, "#ffffff");
rmarsLabelGuiana.position.set(1.00, -0.3, 1.73);
rmarsLabelGuiana.scale.set(5, 1.25, 1);
marsGroup.add(rmarsLabelGuiana);

const rmarsLabelMars = createR3TextSprite("Mars", 48, "#ffaa00");
rmarsLabelMars.position.set(30, 2, 0);
rmarsLabelMars.scale.set(4, 1, 1);
marsGroup.add(rmarsLabelMars);

// Ruler Line (Earth to Mars)
const rmarsRulerMat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.5, gapSize: 0.5 });
const rmarsRulerGeo = new THREE.BufferGeometry();
rmarsRulerGeo.setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0)]); // Initialize with dummy points
const rmarsRuler = new THREE.Line(rmarsRulerGeo, rmarsRulerMat);
rmarsRuler.computeLineDistances();
marsGroup.add(rmarsRuler);

// Ruler Text Label
const rmarsLabelDist = createR3TextSprite("D = ?", 32, "#ffffff");
rmarsLabelDist.position.set(15, -1.5, 0);
rmarsLabelDist.scale.set(6, 1.5, 1);
marsGroup.add(rmarsLabelDist);

// Angle Arc at Mars
const rmarsAngleMat = new THREE.LineBasicMaterial({ color: 0x00ffaa, linewidth: 2 });
const rmarsAngleGeo = new THREE.BufferGeometry();
const rmarsAngle = new THREE.Line(rmarsAngleGeo, rmarsAngleMat);
marsGroup.add(rmarsAngle);

// Angle Text Label
const rmarsLabelTheta = createR3TextSprite("θ = 24\"", 32, "#00ffaa");
rmarsLabelTheta.position.set(24, 0, 0);
rmarsLabelTheta.scale.set(6, 1.5, 1);
marsGroup.add(rmarsLabelTheta);

window.rmarsMars = rmarsMars;
window.rmarsLabelMars = rmarsLabelMars;
window.rmarsRulerGeo = rmarsRulerGeo;
window.rmarsRuler = rmarsRuler;
window.rmarsLabelDist = rmarsLabelDist;
window.rmarsAngleGeo = rmarsAngleGeo;
window.rmarsLabelTheta = rmarsLabelTheta;
window.rmarsSight1Geo = rmarsSight1Geo;
window.rmarsSight2Geo = rmarsSight2Geo;
window.rmarsSightMat = rmarsSightMat;

marsGroup.visible = false;

// ---------------------------------------------------------
// RUNG 7: TRANSIT OF VENUS
// ---------------------------------------------------------
const transitGroup = new THREE.Group();
scene.add(transitGroup);

const t7Light = new THREE.DirectionalLight(0xffffff, 1.5);
t7Light.position.set(20, 10, 20);
transitGroup.add(t7Light);
transitGroup.add(new THREE.AmbientLight(0x404040, 1.0));

// Earth
const t7EarthGeo = new THREE.SphereGeometry(2, 32, 32);
const t7EarthMat = new THREE.MeshPhongMaterial({ color: 0x125dff });
const t7Earth = new THREE.Mesh(t7EarthGeo, t7EarthMat);
t7Earth.position.set(0, 0, 0);
transitGroup.add(t7Earth);

// North/South Observers
const t7ObsGeo = new THREE.SphereGeometry(0.5, 16, 16);
const t7ObsN = new THREE.Mesh(t7ObsGeo, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
t7ObsN.position.set(0, 2, 0);
transitGroup.add(t7ObsN);

const t7ObsS = new THREE.Mesh(t7ObsGeo, new THREE.MeshBasicMaterial({ color: 0x00aaff }));
t7ObsS.position.set(0, -2, 0);
transitGroup.add(t7ObsS);

// Venus
const t7VenusGeo = new THREE.SphereGeometry(1.9, 32, 32);
const t7VenusMat = new THREE.MeshPhongMaterial({ color: 0x222222 }); // Silhouette
const t7Venus = new THREE.Mesh(t7VenusGeo, t7VenusMat);
t7Venus.position.set(40, 0, -20); 
transitGroup.add(t7Venus);

// Sun (Background Sphere)
const t7SunGeo = new THREE.SphereGeometry(40, 64, 64);
const t7SunMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
const t7Sun = new THREE.Mesh(t7SunGeo, t7SunMat);
t7Sun.position.set(140, 0, 0); // Front surface is exactly at X=100
t7Sun.rotation.y = -Math.PI / 2; // Face Earth
transitGroup.add(t7Sun);

// Sunspots 3D (Mapped to spherical surface to match 2D)
const spots2D = [
    {x: -0.3, y: 0.1, s: 0.05},
    {x: -0.28, y: 0.15, s: 0.03},
    {x: 0.2, y: -0.3, s: 0.08},
    {x: 0.4, y: 0.2, s: 0.04}
];
const spotMat = new THREE.MeshBasicMaterial({ color: 0xcc5500, side: THREE.DoubleSide });
spots2D.forEach(sp => {
    const sGeo = new THREE.CircleGeometry(sp.s * 40, 16);
    const spot = new THREE.Mesh(sGeo, spotMat);
    const z = sp.x * 40;
    const y = -sp.y * 40;
    const xOffset = Math.sqrt(40.1 * 40.1 - y * y - z * z);
    spot.position.set(140 - xOffset, y, z);
    const normal = new THREE.Vector3().subVectors(spot.position, new THREE.Vector3(140, 0, 0)).normalize();
    spot.lookAt(new THREE.Vector3().copy(spot.position).add(normal));
    transitGroup.add(spot);
});

// Sightlines (True)
const t7SightNGeo = new THREE.BufferGeometry();
const t7SightN = new THREE.Line(t7SightNGeo, new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8, linewidth: 2 }));
t7SightN.frustumCulled = false;
transitGroup.add(t7SightN);

const t7SightSGeo = new THREE.BufferGeometry();
const t7SightS = new THREE.Line(t7SightSGeo, new THREE.LineBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.8, linewidth: 2 }));
t7SightS.frustumCulled = false;
transitGroup.add(t7SightS);

// Projections on Sun
const projGeo = new THREE.CircleGeometry(2.5, 16);
const t7ProjN = new THREE.Mesh(projGeo, new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide }));
t7ProjN.rotation.y = -Math.PI / 2;
transitGroup.add(t7ProjN);

const t7ProjS = new THREE.Mesh(projGeo, new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide }));
t7ProjS.rotation.y = -Math.PI / 2;
transitGroup.add(t7ProjS);

// Angle Wedge Indicator
const t7AngleWedgeGeo = new THREE.BufferGeometry();
const t7AngleWedgeMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
const t7AngleWedge = new THREE.Mesh(t7AngleWedgeGeo, t7AngleWedgeMat);
t7AngleWedge.frustumCulled = false;
transitGroup.add(t7AngleWedge);

// Caliper bracket in 3D
const t7CalMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
const t7CalGeo = new THREE.BufferGeometry();
const t7Caliper = new THREE.LineSegments(t7CalGeo, t7CalMat);
t7Caliper.frustumCulled = false;
transitGroup.add(t7Caliper);

window.t7Venus = t7Venus;
window.t7SightNGeo = t7SightNGeo;
window.t7SightSGeo = t7SightSGeo;
window.t7AngleWedgeGeo = t7AngleWedgeGeo;
window.t7CalGeo = t7CalGeo;
window.t7Caliper = t7Caliper;
window.t7ProjN = t7ProjN;
window.t7ProjS = t7ProjS;

transitGroup.visible = false;

// ---------------------------------------------------------
// RUNG 8: ACTUAL SIZE OF THE SUN (Radar Venus)
// ---------------------------------------------------------
const venusGroup = new THREE.Group();
scene.add(venusGroup);

const r5Light = new THREE.DirectionalLight(0xffffff, 1.5);
r5Light.position.set(20, 10, 20);
venusGroup.add(r5Light);
venusGroup.add(new THREE.AmbientLight(0x404040, 1.0));

// Earth
const r5EarthGeo = new THREE.SphereGeometry(2, 32, 32);
const r5EarthMat = new THREE.MeshPhongMaterial({ color: 0x125dff });
const r5Earth = new THREE.Mesh(r5EarthGeo, r5EarthMat);
r5Earth.position.set(0, 0, 0);
venusGroup.add(r5Earth);

// Venus
const r5VenusGeo = new THREE.SphereGeometry(1.9, 32, 32);
const r5VenusMat = new THREE.MeshPhongMaterial({ color: 0xeebb88 });
const r5Venus = new THREE.Mesh(r5VenusGeo, r5VenusMat);
r5Venus.position.set(40, 0, 0); 
venusGroup.add(r5Venus);

// Radar Pulse
const r5PulseGeo = new THREE.RingGeometry(0.1, 0.3, 32);
const r5PulseMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
const r5Pulse = new THREE.Mesh(r5PulseGeo, r5PulseMat);
r5Pulse.rotation.y = Math.PI / 2;
venusGroup.add(r5Pulse);

// Distance Line
const r5DistLineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(40,0,0)]);
const r5DistLine = new THREE.Line(r5DistLineGeo, new THREE.LineDashedMaterial({ color: 0xaaaaaa, dashSize: 1, gapSize: 1 }));
r5DistLine.computeLineDistances();
venusGroup.add(r5DistLine);

window.r5Pulse = r5Pulse;
window.r5Venus = r5Venus;
window.r5Earth = r5Earth;
window.r5DistLine = r5DistLine;

venusGroup.visible = false;

// ---------------------------------------------------------
// RUNG 6: ACTUAL SIZE OF THE SUN (Pinhole Camera)
// ---------------------------------------------------------
const pinholeGroup = new THREE.Group();
scene.add(pinholeGroup);

const r6Light = new THREE.DirectionalLight(0xffffff, 1.5);
r6Light.position.set(20, 10, 20);
pinholeGroup.add(r6Light);
pinholeGroup.add(new THREE.AmbientLight(0x404040, 1.0));

// Sun
const r6SunGeo = new THREE.SphereGeometry(15, 64, 64);
const r6SunMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
const r6Sun = new THREE.Mesh(r6SunGeo, r6SunMat);
r6Sun.position.set(-150, 0, 0);
pinholeGroup.add(r6Sun);

// Sun Diameter Indicator (3D)
const r6SunDiaGeo = new THREE.CylinderGeometry(0.3, 0.3, 30, 16);
const r6SunDiaMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
const r6SunDia = new THREE.Mesh(r6SunDiaGeo, r6SunDiaMat);
r6SunDia.position.set(-149.9, 0, 0); // slightly in front of center so it's visible on the sphere
pinholeGroup.add(r6SunDia);

// Pinhole Wall
const r6WallGeo = new THREE.PlaneGeometry(20, 20);
const r6WallMat = new THREE.MeshPhongMaterial({ color: 0x888888, side: THREE.DoubleSide });
const r6Wall = new THREE.Mesh(r6WallGeo, r6WallMat);
r6Wall.position.set(0, 0, 0);
r6Wall.rotation.y = Math.PI / 2;
pinholeGroup.add(r6Wall);

// Pinhole Hole (Dark circle)
const r6HoleGeo = new THREE.CircleGeometry(0.5, 32);
const r6HoleMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
const r6Hole = new THREE.Mesh(r6HoleGeo, r6HoleMat);
r6Hole.position.set(0, 0, 0);
r6Hole.rotation.y = Math.PI / 2;
r6Hole.position.x += 0.01;
pinholeGroup.add(r6Hole);

// Projection Screen
const r6ScreenGeo = new THREE.PlaneGeometry(10, 10);
const r6ScreenMat = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const r6Screen = new THREE.Mesh(r6ScreenGeo, r6ScreenMat);
r6Screen.position.set(20, 0, 0); // Will animate based on L
r6Screen.rotation.y = Math.PI / 2;
pinholeGroup.add(r6Screen);
window.r6Screen = r6Screen;

// Projected Sun Image on Screen
const r6ProjGeo = new THREE.CylinderGeometry(1, 1, 0.1, 32);
const r6ProjMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
const r6Proj = new THREE.Mesh(r6ProjGeo, r6ProjMat);
r6Proj.position.set(20, 0, 0);
r6Proj.rotation.z = Math.PI / 2;
pinholeGroup.add(r6Proj);
window.r6Proj = r6Proj;

// Light Rays (Lines forming the cones)
const r6RaysGeo = new THREE.BufferGeometry();
const r6RaysMat = new THREE.LineBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.5 });
const r6Rays = new THREE.LineSegments(r6RaysGeo, r6RaysMat);
pinholeGroup.add(r6Rays);
window.r6Rays = r6Rays;

pinholeGroup.visible = false;

// ---------------------------------------------------------
// RUNG 12: GALAXY-SCALE SCALING RELATIONS
// ---------------------------------------------------------
const rung12Group = new THREE.Group();
scene.add(rung12Group);

// Ambient light for galaxies
rung12Group.add(new THREE.AmbientLight(0xffffff, 1.2));

// Milky Way (Earth Observatory) at (0, 0, 0)
const r12MilkyWayGeo = new THREE.SphereGeometry(1.2, 32, 32);
const r12MilkyWayMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9 });
const r12MilkyWay = new THREE.Mesh(r12MilkyWayGeo, r12MilkyWayMat);
rung12Group.add(r12MilkyWay);

// Milky Way Label
const r12MilkyWayLabel = createStellarLabel("Milky Way (0 Mpc)", "#00ffff", 36, "rgba(0,0,0,0.8)", 512);
r12MilkyWayLabel.position.set(0, 2.2, 0);
r12MilkyWayLabel.scale.set(8, 2, 1);
rung12Group.add(r12MilkyWayLabel);

// Helper to generate 3D points for spirals/ellipticals
function createR12Galaxy(type, baseColorStr) {
    const particleCount = 3500;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const baseColor = new THREE.Color(baseColorStr);

    for (let i = 0; i < particleCount; i++) {
        if (type === 'spiral') {
            const u = Math.random();
            const r = 6.0 * Math.pow(u, 1.4);
            const theta = Math.random() * Math.PI * 2;
            const arm = (i % 2) * Math.PI; 
            const angle = theta * 1.2 + arm; // tighter arms
            const armThickness = 0.8 * Math.exp(-r/2) + 0.15;
            positions[i * 3] = r * Math.cos(angle) + (Math.random() - 0.5) * armThickness * 2.5;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 0.3 * Math.exp(-r/3);
            positions[i * 3 + 2] = r * Math.sin(angle) + (Math.random() - 0.5) * armThickness * 2.5;
        } else {
            // Elliptical shape (dense core)
            const u = Math.random();
            const r = 5.0 * Math.pow(u, 2.5); // more concentrated center
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 1.0;
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.75;
            positions[i * 3 + 2] = r * Math.cos(phi) * 1.0;
        }

        // Color gradient: whiter/yellower in center, bluer/redder on edges
        const dist = Math.sqrt(positions[i*3]*positions[i*3] + positions[i*3+2]*positions[i*3+2]);
        const mixFactor = Math.max(0, 1 - dist / 6.0);
        const c = baseColor.clone().lerp(new THREE.Color(0xffffee), mixFactor * 0.8 + 0.2);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Dynamic procedural circular texture for particles
    let sprite = null;
    if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
        sprite = new THREE.CanvasTexture(canvas);
    }

    const mat = new THREE.PointsMaterial({
        size: 0.6,
        map: sprite,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const points = new THREE.Points(geo, mat);

    // Save original positions for elliptical jitter
    if (type === 'elliptical') {
        points.userData.originalPositions = new Float32Array(positions);
    }

    return points;
}

// Positions & Colors mapping actual distances to 3D units (roughly 1 unit = 0.8 Mpc)
const r12GalaxySpecs = [
    { pos: new THREE.Vector3(8, 2, -6), color: "#55aaff", labelColor: "#55aaff" }, // M31: ~0.78 Mpc -> 10 units
    { pos: new THREE.Vector3(-15, 4, -12), color: "#44ddff", labelColor: "#44ddff" }, // M81: ~3.60 Mpc -> 20 units
    { pos: new THREE.Vector3(22, -8, -25), color: "#ffcc66", labelColor: "#ffcc66" }, // M87: ~12.5 Mpc -> 35 units
    { pos: new THREE.Vector3(-38, -15, -45), color: "#ff8855", labelColor: "#ff8855" } // Coma NGC 4889: ~63.0 Mpc -> 60 units
];

window.r12GalaxyModels = [];

r12State.galaxies.forEach((gal, idx) => {
    const spec = r12GalaxySpecs[idx];
    const group = new THREE.Group();
    group.position.copy(spec.pos);
    rung12Group.add(group);

    // Create galaxy points
    const points = createR12Galaxy(gal.type, spec.color);
    if (gal.type === 'spiral') {
        points.rotation.x = Math.PI / 4; // tilt spiral view beautifully
        points.rotation.y = Math.random() * Math.PI; // randomize initial rotation
    }
    
    // Add a glowing core
    const coreGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);
    
    group.add(points);

    // Save references to points for animation
    window.r12GalaxyModels.push({
        group: group,
        points: points,
        label: null,
        type: gal.type
    });

    // Create Label
    const label = createStellarLabel(`${gal.name} (${gal.trueDistMpc} Mpc)`, spec.labelColor, 42, "rgba(0,0,0,0.8)", 1024);
    label.position.set(0, 6.0, 0);
    label.scale.set(16, 2, 1);
    group.add(label);
    
    window.r12GalaxyModels[idx].label = label;
});

// Selection Ring
const r12RingGeo = new THREE.RingGeometry(7, 7.5, 32);
const r12RingMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
const r12SelectionRing = new THREE.Mesh(r12RingGeo, r12RingMat);
r12SelectionRing.rotation.x = Math.PI / 2;
rung12Group.add(r12SelectionRing);
window.r12SelectionRing = r12SelectionRing;

// Dashed Line from Earth to active galaxy
const r12SightlineGeo = new THREE.BufferGeometry();
const r12SightlineMat = new THREE.LineDashedMaterial({ color: 0x00ffff, dashSize: 1, gapSize: 1 });
const r12Sightline = new THREE.Line(r12SightlineGeo, r12SightlineMat);
rung12Group.add(r12Sightline);
window.r12Sightline = r12Sightline;

rung12Group.visible = false;

// ---------------------------------------------------------
// RUNG 13: TYPE IA SUPERNOVAE (3D Scene)
// ---------------------------------------------------------
const rung13Group = new THREE.Group();
scene.add(rung13Group);

// Ambient light
rung13Group.add(new THREE.AmbientLight(0xffffff, 1.2));

// Milky Way (Earth Observatory) at (0, 0, 0)
const r13SupernovaMilkyWayGeo = new THREE.SphereGeometry(1.2, 32, 32);
const r13SupernovaMilkyWayMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9 });
const r13SupernovaMilkyWay = new THREE.Mesh(r13SupernovaMilkyWayGeo, r13SupernovaMilkyWayMat);
rung13Group.add(r13SupernovaMilkyWay);

// Milky Way Label
const r13SupernovaMilkyWayLabel = createStellarLabel("Milky Way (0 Mpc)", "#00ffff", 36, "rgba(0,0,0,0.8)", 512);
r13SupernovaMilkyWayLabel.position.set(0, 2.2, 0);
r13SupernovaMilkyWayLabel.scale.set(8, 2, 1);
rung13Group.add(r13SupernovaMilkyWayLabel);

// Helper to create a binary supernova candidate (white dwarf + red giant companion)
function createR13SupernovaSystem(colorWD, colorCompanion, sizeWD, sizeCompanion, orbitRadius) {
    const sysGroup = new THREE.Group();

    // Orbit path line
    const orbitGeo = new THREE.BufferGeometry();
    const orbitPoints = [];
    for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(orbitRadius * Math.cos(theta), 0, orbitRadius * Math.sin(theta)));
    }
    orbitGeo.setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.4 });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    sysGroup.add(orbitLine);

    // White Dwarf (WD)
    const wdGeo = new THREE.SphereGeometry(sizeWD, 16, 16);
    const wdMat = new THREE.MeshBasicMaterial({ color: colorWD });
    const wd = new THREE.Mesh(wdGeo, wdMat);
    sysGroup.add(wd);

    // Companion Star (Red Giant / Main Sequence)
    const compGeo = new THREE.SphereGeometry(sizeCompanion, 16, 16);
    const compMat = new THREE.MeshBasicMaterial({ color: colorCompanion });
    const companion = new THREE.Mesh(compGeo, compMat);
    sysGroup.add(companion);

    // Gas stream representing accretion (simple gas belt)
    const streamGeo = new THREE.RingGeometry(orbitRadius * 0.2, orbitRadius * 0.95, 32);
    const streamMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
    const stream = new THREE.Mesh(streamGeo, streamMat);
    stream.rotation.x = Math.PI / 2;
    sysGroup.add(stream);

    // Supernova Flare (hidden initially, flashes/glows on verification)
    const flareGeo = new THREE.SphereGeometry(sizeWD * 4.5, 32, 32);
    const flareMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    const flare = new THREE.Mesh(flareGeo, flareMat);
    sysGroup.add(flare);

    return {
        group: sysGroup,
        wd: wd,
        companion: companion,
        orbitRadius: orbitRadius,
        flare: flare,
        stream: stream
    };
}

// 3 SN Host Galaxies: M101 (6.4 Mpc), NGC 4526 (16 Mpc), MCG -01-39-003 (35 Mpc)
// Scaled positions
const r13SNGalaxySpecs = [
    { pos: new THREE.Vector3(10, 2, -6), name: "M101 (6.4 Mpc)", colorWD: 0xffffff, colorComp: 0xff5500, sizeWD: 0.25, sizeComp: 0.7, orbitR: 1.2, labelColor: "#55aaff", galType: "spiral", galColor: "#55aaff" },
    { pos: new THREE.Vector3(-18, 4, -14), name: "NGC 4526 (16 Mpc)", colorWD: 0xffffff, colorComp: 0xff8833, sizeWD: 0.2, sizeComp: 0.6, orbitR: 1.0, labelColor: "#44ddff", galType: "spiral", galColor: "#33aaff" },
    { pos: new THREE.Vector3(28, -8, -25), name: "MCG -01-39-003 (35 Mpc)", colorWD: 0xffffff, colorComp: 0xffaa44, sizeWD: 0.18, sizeComp: 0.5, orbitR: 0.8, labelColor: "#ffcc66", galType: "elliptical", galColor: "#ffbb55" }
];

window.r13SupernovaSystems = [];

r13SNGalaxySpecs.forEach((spec, idx) => {
    const parentGroup = new THREE.Group();
    parentGroup.position.copy(spec.pos);
    rung13Group.add(parentGroup);

    // Create host galaxy background
    const points = createR12Galaxy(spec.galType, spec.galColor);
    if (spec.galType === 'spiral') {
        points.rotation.x = Math.PI / 4;
        points.rotation.y = Math.random() * Math.PI;
    }
    parentGroup.add(points);

    // Glowing core
    const coreGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
    const core = new THREE.Mesh(coreGeo, coreMat);
    parentGroup.add(core);

    // Create SN binary candidate (positioned slightly offset from galactic center)
    const snSys = createR13SupernovaSystem(spec.colorWD, spec.colorComp, spec.sizeWD, spec.sizeComp, spec.orbitR);
    snSys.group.position.set(1.5, 0.5, 1.5); // offset inside host galaxy
    parentGroup.add(snSys.group);

    // Save reference for rotation / flare animation
    window.r13SupernovaSystems.push({
        group: parentGroup,
        snSys: snSys,
        points: points,
        label: null
    });

    // Create Label
    const label = createStellarLabel(spec.name, spec.labelColor, 40, "rgba(0,0,0,0.8)", 1024);
    label.position.set(0, 5.0, 0);
    label.scale.set(16, 2, 1);
    parentGroup.add(label);
    
    window.r13SupernovaSystems[idx].label = label;
});

// Selection focus ring for active supernova
const r13SelectionRing = new THREE.Mesh(
    new THREE.RingGeometry(6.5, 7.0, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
);
r13SelectionRing.rotation.x = Math.PI / 2;
rung13Group.add(r13SelectionRing);
window.r13SelectionRing = r13SelectionRing;

// Dashed Line from Earth to active supernova host galaxy
const r13Sightline = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineDashedMaterial({ color: 0x00ffaa, dashSize: 1, gapSize: 1 })
);
rung13Group.add(r13Sightline);
window.r13Sightline = r13Sightline;

rung13Group.visible = false;


// ---------------------------------------------------------
// RUNG 14: GRAVITATIONAL WAVE STANDARD SIRENS (3D Scene)
// ---------------------------------------------------------
const rung14Group = new THREE.Group();
scene.add(rung14Group);

// Ambient light
rung14Group.add(new THREE.AmbientLight(0xffffff, 1.2));

// Milky Way (Earth Observatory) at (0, 0, 0)
const r14MilkyWayGeo = new THREE.SphereGeometry(1.2, 32, 32);
const r14MilkyWayMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9 });
const r14MilkyWay = new THREE.Mesh(r14MilkyWayGeo, r14MilkyWayMat);
rung14Group.add(r14MilkyWay);

// Milky Way Label
const r14MilkyWayLabel = createStellarLabel("Milky Way (0 Mpc)", "#00ffff", 36, "rgba(0,0,0,0.8)", 512);
r14MilkyWayLabel.position.set(0, 2.2, 0);
r14MilkyWayLabel.scale.set(8, 2, 1);
rung14Group.add(r14MilkyWayLabel);

// Helper to create binary orbit visualizer
function createR14BinarySystem(type, color1, color2, size1, size2, orbitRadius) {
    const systemGroup = new THREE.Group();
    
    // Orbit line
    const orbitGeo = new THREE.BufferGeometry();
    const orbitPoints = [];
    for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(orbitRadius * Math.cos(theta), 0, orbitRadius * Math.sin(theta)));
    }
    orbitGeo.setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.4 });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    systemGroup.add(orbitLine);
    
    // Body 1
    const body1Geo = new THREE.SphereGeometry(size1, 16, 16);
    const body1Mat = new THREE.MeshBasicMaterial({ color: color1 });
    const body1 = new THREE.Mesh(body1Geo, body1Mat);
    systemGroup.add(body1);
    
    // Body 2
    const body2Geo = new THREE.SphereGeometry(size2, 16, 16);
    const body2Mat = new THREE.MeshBasicMaterial({ color: color2 });
    const body2 = new THREE.Mesh(body2Geo, body2Mat);
    systemGroup.add(body2);
    
    // Waves: circular ripple rings propagating outward
    const waveRings = [];
    for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.RingGeometry(0.95, 1.0, 32);
        const ringMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ffaa, 
            side: THREE.DoubleSide, 
            transparent: true, 
            opacity: 0 
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        systemGroup.add(ring);
        waveRings.push(ring);
    }
    
    return {
        group: systemGroup,
        body1: body1,
        body2: body2,
        rings: waveRings,
        orbitRadius: orbitRadius,
        speed: 0.05
    };
}

// 3 Events: GW170817 (40 Mpc), GW150914 (410 Mpc), GW190521 (5300 Mpc)
// We map them to scaled distances: 8 units, 18 units, 30 units
const r14EventSpecs = [
    { pos: new THREE.Vector3(8, 1, -5), color1: 0x00d4ff, color2: 0x00ffaa, size1: 0.4, size2: 0.35, orbitR: 1.0, name: "GW170817 (40 Mpc)", labelColor: "#00ffaa" },
    { pos: new THREE.Vector3(-14, 3, -11), color1: 0x333333, color2: 0x111111, size1: 0.6, size2: 0.5, orbitR: 1.5, name: "GW150914 (410 Mpc)", labelColor: "#ffcc66" },
    { pos: new THREE.Vector3(20, -6, -22), color1: 0xff0055, color2: 0x550022, size1: 0.9, size2: 0.8, orbitR: 2.2, name: "GW190521 (5.3 Gpc)", labelColor: "#ff0055" }
];

window.r14BinarySystems = [];

r14EventSpecs.forEach((spec, idx) => {
    const sys = createR14BinarySystem(idx === 1 ? 'black_hole' : 'neutron_star', spec.color1, spec.color2, spec.size1, spec.size2, spec.orbitR);
    sys.group.position.copy(spec.pos);
    rung14Group.add(sys.group);
    
    // Save reference for rotation / wave animation
    window.r14BinarySystems.push(sys);
    
    // Add Label
    const label = createStellarLabel(spec.name, spec.labelColor, 40, "rgba(0,0,0,0.8)", 1024);
    label.position.set(0, spec.size1 * 2 + 1.8, 0);
    label.scale.set(16, 2, 1);
    sys.group.add(label);
    
    // Accretion discs for black holes
    if (idx === 1 || idx === 2) {
        // Accretion disk for body 1
        const diskGeo = new THREE.RingGeometry(spec.size1 * 1.1, spec.size1 * 2.2, 32);
        const diskMat = new THREE.MeshBasicMaterial({ 
            color: spec.color1 === 0xff0055 ? 0xff5500 : 0xffaa00, 
            side: THREE.DoubleSide, 
            transparent: true, 
            opacity: 0.6 
        });
        const disk = new THREE.Mesh(diskGeo, diskMat);
        disk.rotation.x = Math.PI / 2;
        sys.body1.add(disk);
    }
});

// Selection focus ring for active event
const r14SelectionRing = new THREE.Mesh(
    new THREE.RingGeometry(4.5, 4.8, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
);
r14SelectionRing.rotation.x = Math.PI / 2;
rung14Group.add(r14SelectionRing);
window.r14SelectionRing = r14SelectionRing;

// Dashed Line from Earth to active standard siren
const r14Sightline = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineDashedMaterial({ color: 0x00ffaa, dashSize: 1, gapSize: 1 })
);
rung14Group.add(r14Sightline);
window.r14Sightline = r14Sightline;

rung14Group.visible = false;

// ---------------------------------------------------------
// RUNG 1: ERATOSTHENES GEOMETRY
// ---------------------------------------------------------

// Earth Sphere
const earthRadius = 1.5;
const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
const earthMat = new THREE.MeshPhongMaterial({ 
    color: 0x125dff, 
    emissive: 0x021034,
    shininess: 10,
    flatShading: true 
});
const earth = new THREE.Mesh(earthGeo, earthMat);
earthGroup.add(earth);

// Constants for cities (placed on equator/prime meridian for simplicity of lighting)
// To make the math perfectly align with lighting, we place Syene directly facing the sun (+X axis)
const syeneLat = 0; // Directly facing sun
const alexLat = 7.2 * (Math.PI / 180); // 7.2 degrees north of Syene

// Function to convert lat/lon to 3D position
function getPositionFromLatLon(lat, lon, radius) {
    const phi = lat;
    const theta = lon;
    const x = radius * Math.cos(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi);
    const z = -radius * Math.cos(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
}

function getR1ArcPoints(startLat, endLat, radius, segments = 32) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const lat = startLat + (endLat - startLat) * t;
        const x = radius * Math.cos(lat);
        const y = radius * Math.sin(lat);
        const z = 0;
        points.push(new THREE.Vector3(x, y, z).multiplyScalar(1.005));
    }
    return points;
}

// Markers for Syene and Alexandria
const syenePos = getPositionFromLatLon(syeneLat, 0, earthRadius);
const alexPos = getPositionFromLatLon(alexLat, 0, earthRadius);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
// Sun rays coming directly at Syene
sunLight.position.copy(syenePos).normalize().multiplyScalar(10);
scene.add(sunLight);

// Syene Well
const wellGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 16);
const wellMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
const well = new THREE.Mesh(wellGeo, wellMat);
well.position.copy(syenePos);
well.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), syenePos.clone().normalize());
earthGroup.add(well);

// Alexandria Pole
const poleGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.2, 8);
const poleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const pole = new THREE.Mesh(poleGeo, poleMat);
// Position pole slightly above surface so it sticks out
const alexNormal = alexPos.clone().normalize();
pole.position.copy(alexPos).add(alexNormal.clone().multiplyScalar(0.1));
pole.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), alexNormal);
earthGroup.add(pole);

// Alexandria Shadow
const shadowLength = Math.tan(7.2 * Math.PI/180) * 0.2; // roughly
const shadowGeo = new THREE.PlaneGeometry(0.02, shadowLength);
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, opacity: 0.7, transparent: true });
const shadow = new THREE.Mesh(shadowGeo, shadowMat);
// Lay shadow flat on the ground pointing away from sun (-x direction)
shadow.position.copy(alexPos);
// Align to surface
shadow.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), alexNormal);
// Rotate so it points left
shadow.rotateX(Math.PI/2);
earthGroup.add(shadow);

// Invisible hitboxes for clicking (larger for easier clicking)
const hitGeo = new THREE.SphereGeometry(0.15, 16, 16);
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0 }); // Invisible

const syeneHit = new THREE.Mesh(hitGeo, hitMat.clone());
syeneHit.position.copy(syenePos);
syeneHit.userData = { city: 'Syene' };
earthGroup.add(syeneHit);

const alexHit = new THREE.Mesh(hitGeo, hitMat.clone());
alexHit.position.copy(alexPos);
alexHit.userData = { city: 'Alexandria' };
earthGroup.add(alexHit);

// Small subtle visual markers so user knows where to click
const markerGeo = new THREE.SphereGeometry(0.02, 8, 8);
const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const syeneMarker = new THREE.Mesh(markerGeo, markerMat);
syeneMarker.position.copy(syenePos).multiplyScalar(1.02);
earthGroup.add(syeneMarker);

const alexMarker = new THREE.Mesh(markerGeo, markerMat);
alexMarker.position.copy(alexPos).multiplyScalar(1.02);
earthGroup.add(alexMarker);

// Geometry Lines (Hidden by default)
const linesGroup = new THREE.Group();
linesGroup.visible = false;
earthGroup.add(linesGroup);

// Dynamic measurement visualizers for Rung 1 (Eratosthenes)
const r1DistanceLineGeo = new THREE.BufferGeometry();
const r1DistanceLineMat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3, depthTest: false });
const r1DistanceLine = new THREE.Line(r1DistanceLineGeo, r1DistanceLineMat);
r1DistanceLine.renderOrder = 998;
earthGroup.add(r1DistanceLine);
window.r1DistanceLine = r1DistanceLine;

const r1DistanceLabel = createStellarLabel("s = 500 km", "#ffff00", 36, "rgba(0,0,0,0.8)", 256);
r1DistanceLabel.scale.set(1.5, 0.4, 1);
earthGroup.add(r1DistanceLabel);
window.r1DistanceLabel = r1DistanceLabel;


// depthTest: false ensures the lines inside the earth are drawn over the solid sphere
const lineMat = new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 2, depthTest: false });
const rayMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthTest: false });

// Line from center through Syene (Equator)
const syeneLinePoints = [new THREE.Vector3(0,0,0), syenePos.clone().multiplyScalar(1.5)];
linesGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(syeneLinePoints), lineMat));

// Line from center through Alexandria (Transversal)
const alexLinePoints = [new THREE.Vector3(0,0,0), alexPos.clone().multiplyScalar(1.5)];
linesGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(alexLinePoints), lineMat));

// Parallel Sun rays (Horizontal)
const ray1 = [new THREE.Vector3(earthRadius * 2, syenePos.y, syenePos.z), syenePos];
linesGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ray1), rayMat));

// Ray hitting Alexandria pole
const ray2 = [new THREE.Vector3(earthRadius * 2, alexPos.y, alexPos.z), alexPos];
linesGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ray2), rayMat));

// Add the Alternate Interior Angles Arcs (7.2 degrees)
const arcGeo = new THREE.TorusGeometry(0.5, 0.01, 8, 32, 7.2 * Math.PI/180);
const arcMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa });
const centerArc = new THREE.Mesh(arcGeo, arcMat);
centerArc.rotation.x = Math.PI / 2; // Lie flat in XY plane
linesGroup.add(centerArc);

const poleArc = new THREE.Mesh(arcGeo, arcMat);
poleArc.position.copy(alexPos);
poleArc.rotation.x = Math.PI / 2;
linesGroup.add(poleArc);

// Add a button to toggle geometric lines
const toggleLinesBtn = document.createElement('button');
toggleLinesBtn.className = 'btn toggle-btn';
toggleLinesBtn.textContent = 'Toggle Geometric Lines';
toggleLinesBtn.style.width = '100%';
toggleLinesBtn.style.marginBottom = '16px';
toggleLinesBtn.style.borderColor = 'rgba(255,255,255,0.2)';
toggleLinesBtn.onclick = () => {
    linesGroup.visible = !linesGroup.visible;
    if(linesGroup.visible) {
        // Zoom out to see everything
        camera.position.set(0, 0, 6);
        controls.target.set(0, 0, 0);
        // Make earth transparent to see internal lines
        earthMat.transparent = true;
        earthMat.opacity = 0.2;
        earthMat.wireframe = true;
    } else {
        // Return to normal
        earthMat.transparent = false;
        earthMat.opacity = 1.0;
        earthMat.wireframe = false;
    }
};

// ---------------------------------------------------------
// 2D SCHEMATIC LOGIC (PREMIUM UI)
// ---------------------------------------------------------
const canvas2d = document.getElementById('canvas-2d');
const ctx2d = canvas2d.getContext('2d');
const btnClose2d = document.getElementById('btn-close-2d');

function resize2D() {
    canvas2d.width = canvas2d.clientWidth;
    canvas2d.height = canvas2d.clientHeight;
}
window.addEventListener('resize', resize2D);

btnClose2d.onclick = () => {
    canvas2d.style.display = 'none';
    btnClose2d.style.display = 'none';
};

function drawSky(ctx, w, h, cy) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, cy);
    skyGrad.addColorStop(0, '#0a1930');
    skyGrad.addColorStop(1, '#1e3c72');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, cy);
}

function drawGround(ctx, w, h, cy) {
    const groundGrad = ctx.createLinearGradient(0, cy, 0, h);
    groundGrad.addColorStop(0, '#c29d59');
    groundGrad.addColorStop(1, '#8a6d3b');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, cy, w, h - cy);
    
    // Ground line
    ctx.strokeStyle = '#e6c887';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();
}

function render2DSyene() {
    r1ActiveCity = 'Syene';
    canvas2d.style.display = 'block';
    btnClose2d.style.display = 'block';
    resize2D();
    
    const w = canvas2d.width;
    const h = canvas2d.height;
    ctx2d.clearRect(0, 0, w, h);
    
    const cx = w / 2;
    const cy = h / 2 + 50;
    
    drawSky(ctx2d, w, h, cy);
    drawGround(ctx2d, w, h, cy);
    
    // Draw Sun directly overhead
    ctx2d.fillStyle = '#ffcc00';
    ctx2d.shadowColor = '#ffcc00';
    ctx2d.shadowBlur = 40;
    ctx2d.beginPath();
    ctx2d.arc(cx, 80, 40, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.shadowBlur = 0; // reset
    
    // Draw Well
    const wellWidth = 100;
    const wellDepth = 280;
    ctx2d.fillStyle = '#111'; // dark inside well
    ctx2d.fillRect(cx - wellWidth/2, cy, wellWidth, wellDepth);
    
    // Well walls (bricks)
    ctx2d.fillStyle = '#5c4a3d';
    ctx2d.fillRect(cx - wellWidth/2 - 20, cy, 20, wellDepth);
    ctx2d.fillRect(cx + wellWidth/2, cy, 20, wellDepth);
    
    // Draw Sun Rays (Straight down)
    ctx2d.strokeStyle = 'rgba(255, 220, 100, 0.9)';
    ctx2d.lineWidth = 4;
    ctx2d.setLineDash([15, 10]);
    for(let i = -1; i <= 1; i++) {
        ctx2d.beginPath();
        ctx2d.moveTo(cx + i*25, 120);
        ctx2d.lineTo(cx + i*25, cy + wellDepth);
        ctx2d.stroke();
    }
    ctx2d.setLineDash([]);
    
    // Text Box at the bottom of the screen
    const boxW = 460;
    const boxH = 80;
    const boxX = cx - boxW/2;
    const boxY = h - boxH - 40;
    
    ctx2d.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx2d.beginPath();
    ctx2d.roundRect(boxX, boxY, boxW, boxH, 10);
    ctx2d.fill();
    ctx2d.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx2d.lineWidth = 1;
    ctx2d.stroke();
    
    ctx2d.fillStyle = '#fff';
    ctx2d.font = '20px "Outfit", sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.fillText("Syene: Sun is directly overhead.", cx, boxY + 32);
    ctx2d.fillText("Rays reach the well's bottom. No shadow.", cx, boxY + 60);
}

function render2DAlexandria() {
    r1ActiveCity = 'Alexandria';
    canvas2d.style.display = 'block';
    btnClose2d.style.display = 'block';
    resize2D();
    
    const w = canvas2d.width;
    const h = canvas2d.height;
    ctx2d.clearRect(0, 0, w, h);
    
    const cx = w / 2;
    const cy = h / 2 + 100;
    
    // Read the user's slider input dynamically if it exists
    const angleInput = document.getElementById('input-angle');
    const angle = angleInput ? parseFloat(angleInput.value) : 7.2; 
    const angleRad = angle * Math.PI / 180;
    
    const drawAngleRad = Math.max(angleRad, 3 * Math.PI / 180);
    
    drawSky(ctx2d, w, h, cy);
    drawGround(ctx2d, w, h, cy);
    
    // Draw Pole (Obelisk style)
    const poleHeight = 280;
    const poleWidth = 16;
    ctx2d.fillStyle = '#ddd';
    ctx2d.beginPath();
    ctx2d.moveTo(cx - poleWidth/2, cy);
    ctx2d.lineTo(cx + poleWidth/2, cy);
    ctx2d.lineTo(cx + poleWidth/4, cy - poleHeight);
    ctx2d.lineTo(cx - poleWidth/4, cy - poleHeight);
    ctx2d.fill();
    
    // Draw Shadow
    const shadowLength = poleHeight * Math.tan(drawAngleRad);
    ctx2d.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx2d.beginPath();
    ctx2d.moveTo(cx, cy);
    ctx2d.lineTo(cx + shadowLength, cy);
    ctx2d.lineTo(cx + shadowLength - 10, cy + 10); // slight skew
    ctx2d.lineTo(cx - 10, cy + 10);
    ctx2d.fill();
    
    // Draw Sun Position based on angle
    const sunDist = 350;
    const sunX = cx + shadowLength - Math.sin(drawAngleRad) * sunDist;
    const sunY = cy - Math.cos(drawAngleRad) * sunDist;
    
    ctx2d.fillStyle = '#ffcc00';
    ctx2d.shadowColor = '#ffcc00';
    ctx2d.shadowBlur = 40;
    ctx2d.beginPath();
    ctx2d.arc(sunX, sunY, 30, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.shadowBlur = 0;
    
    // Draw Sun Ray (Hypotenuse)
    ctx2d.strokeStyle = 'rgba(255, 220, 100, 0.9)';
    ctx2d.lineWidth = 3;
    ctx2d.setLineDash([15, 10]);
    ctx2d.beginPath();
    // extend ray slightly past shadow
    ctx2d.moveTo(sunX, sunY);
    ctx2d.lineTo(cx + shadowLength, cy);
    ctx2d.stroke();
    ctx2d.setLineDash([]);
    
    // Draw Angle Arc and Vertical Guide
    ctx2d.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx2d.lineWidth = 2;
    ctx2d.setLineDash([5, 5]);
    ctx2d.beginPath();
    ctx2d.moveTo(cx, cy - poleHeight);
    ctx2d.lineTo(cx, cy - poleHeight - 100);
    ctx2d.stroke();
    ctx2d.setLineDash([]);
    
    ctx2d.strokeStyle = '#00ffaa';
    ctx2d.lineWidth = 3;
    ctx2d.beginPath();
    ctx2d.arc(cx, cy - poleHeight, 50, Math.PI/2 - drawAngleRad, Math.PI/2);
    ctx2d.stroke();
    
    // Text Box at the bottom of the screen
    const boxW = 480;
    const boxH = 80;
    const boxX = cx - boxW/2;
    const boxY = h - boxH - 40;
    
    ctx2d.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx2d.beginPath();
    ctx2d.roundRect(boxX, boxY, boxW, boxH, 10);
    ctx2d.fill();
    ctx2d.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx2d.lineWidth = 1;
    ctx2d.stroke();
    
    ctx2d.fillStyle = '#fff';
    ctx2d.font = '20px "Outfit", sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.fillText("Alexandria: Earth's curvature causes", cx, boxY + 32);
    ctx2d.fillText("sun rays to strike at an angle.", cx, boxY + 60);
    
    // Angle Label (Positioned near the arc, pushed slightly higher to avoid the sun)
    ctx2d.fillStyle = '#00ffaa';
    ctx2d.font = 'bold 24px "Outfit", sans-serif';
    // Position label based on drawn angle, but display real angle text
    ctx2d.fillText("θ = " + angle.toFixed(1) + "°", cx + 25 + Math.sin(drawAngleRad/2)*70, cy - poleHeight - 70);
}

function render2DLunarEclipse() {
    canvas2d.style.display = 'block';
    btnClose2d.style.display = 'block';
    resize2D();
    // The actual drawing happens inside the animate loop for Rung 2
}

function draw2DEclipseAnim() {
    const w = canvas2d.width;
    const h = canvas2d.height;
    ctx2d.clearRect(0, 0, w, h);
    
    const cx = w / 2;
    const cy = h / 2 - 40; // slightly higher to fit the bottom panel
    
    // Premium Deep Space Background
    const gradBg = ctx2d.createRadialGradient(cx, cy, 100, cx, cy, Math.max(w, h));
    gradBg.addColorStop(0, '#0a1224');
    gradBg.addColorStop(1, '#020408');
    ctx2d.fillStyle = gradBg;
    ctx2d.fillRect(0, 0, w, h);
    
    // Draw some distant background stars to make it look spectacular
    ctx2d.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const numStars = 20;
    for (let i = 0; i < numStars; i++) {
        const sx = (Math.sin(i * 12345.67) * 0.5 + 0.5) * w;
        const sy = (Math.cos(i * 98765.43) * 0.5 + 0.5) * h;
        const size = (Math.sin(i * 555.5) * 0.5 + 0.5) * 1.5 + 0.5;
        ctx2d.beginPath();
        ctx2d.arc(sx, sy, size, 0, Math.PI * 2);
        ctx2d.fill();
    }
    
    // Read the user's ratio slider dynamically
    const ratioInput = document.getElementById('input-ratio');
    const ratio = ratioInput ? parseFloat(ratioInput.value) : 3.5;
    
    const moonRadius2d = 45;
    const shadowRadius2d = moonRadius2d * ratio;
    
    // 1. Draw Earth's Penumbra (Soft outer orange-red glow)
    ctx2d.save();
    const penumbraGlow = ctx2d.createRadialGradient(cx, cy, shadowRadius2d - 10, cx, cy, shadowRadius2d + 20);
    penumbraGlow.addColorStop(0, 'rgba(20, 5, 2, 0.9)');
    penumbraGlow.addColorStop(0.5, 'rgba(120, 30, 15, 0.4)');
    penumbraGlow.addColorStop(1, 'rgba(255, 60, 20, 0)');
    ctx2d.fillStyle = penumbraGlow;
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, shadowRadius2d + 20, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.restore();
    
    // 2. Draw Earth's Umbra (Shadow core)
    ctx2d.save();
    ctx2d.shadowColor = '#ff3300';
    ctx2d.shadowBlur = 15;
    ctx2d.strokeStyle = 'rgba(255, 60, 20, 0.5)';
    ctx2d.lineWidth = 3;
    ctx2d.fillStyle = 'rgba(5, 2, 2, 0.92)';
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, shadowRadius2d, 0, Math.PI*2);
    ctx2d.fill();
    ctx2d.stroke();
    ctx2d.restore();
    
    // Label Shadow
    ctx2d.fillStyle = '#ff6644';
    ctx2d.font = 'bold 16px "Outfit", sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.fillText("Earth's Umbra Shadow", cx, cy - shadowRadius2d - 15);
    
    const startX = cx - shadowRadius2d + moonRadius2d;
    
    // Draw guide lines / slots across the shadow width
    for (let i = 0; i < Math.floor(ratio); i++) {
        const x = startX + (i * moonRadius2d * 2);
        
        // Draw dotted moon slot outline
        ctx2d.save();
        ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx2d.setLineDash([4, 4]);
        ctx2d.lineWidth = 1.5;
        ctx2d.beginPath();
        ctx2d.arc(x, cy, moonRadius2d, 0, Math.PI * 2);
        ctx2d.stroke();
        ctx2d.restore();
        
        // Draw slot number
        ctx2d.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx2d.font = 'bold 14px "Outfit", sans-serif';
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'middle';
        ctx2d.fillText((i + 1).toString(), x, cy);
    }
    
    // Draw fractional slot if any
    const remainder = ratio - Math.floor(ratio);
    if (remainder > 0.01) {
        const i = Math.floor(ratio);
        const x = startX + (i * moonRadius2d * 2);
        
        ctx2d.save();
        ctx2d.strokeStyle = 'rgba(255, 120, 50, 0.15)';
        ctx2d.setLineDash([2, 2]);
        ctx2d.lineWidth = 1.0;
        ctx2d.beginPath();
        ctx2d.arc(x, cy, moonRadius2d, 0, Math.PI * 2);
        ctx2d.stroke();
        ctx2d.restore();
        
        // Draw partial filled bar/label
        ctx2d.fillStyle = 'rgba(255, 120, 50, 0.35)';
        ctx2d.font = 'bold 12px "Outfit", sans-serif';
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'middle';
        ctx2d.fillText("+" + remainder.toFixed(2), x - moonRadius2d * (1 - remainder), cy);
    }
    
    // 3. Horizontal Shadow Caliper (Span)
    const isCorrect = (ratio === 3.5);
    ctx2d.strokeStyle = isCorrect ? '#00ffaa' : '#00e5ff';
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    ctx2d.moveTo(cx - shadowRadius2d, cy);
    ctx2d.lineTo(cx + shadowRadius2d, cy);
    ctx2d.stroke();
    
    // Ticks
    ctx2d.beginPath();
    ctx2d.moveTo(cx - shadowRadius2d, cy - 8);
    ctx2d.lineTo(cx - shadowRadius2d, cy + 8);
    ctx2d.moveTo(cx + shadowRadius2d, cy - 8);
    ctx2d.lineTo(cx + shadowRadius2d, cy + 8);
    ctx2d.stroke();
    
    // 4. Draw the interactive draggable Moon
    if (r2MoonX === null) {
        r2MoonX = cx - shadowRadius2d - 80;
    }
    
    // Snap to slot centers if close during dragging
    if (r2IsDragging) {
        for (let i = 0; i <= Math.floor(ratio); i++) {
            const slotX = startX + i * moonRadius2d * 2;
            if (Math.abs(r2MoonX - slotX) < 15) {
                r2MoonX = slotX; // Snap!
                break;
            }
        }
    }
    
    // Draw the Moon! It gets red-tinted inside the Earth's shadow
    const distToCenter = Math.abs(r2MoonX - cx);
    const isInsideShadow = distToCenter < shadowRadius2d;
    
    drawMoon2D(r2MoonX, cy, moonRadius2d, 1.0, isInsideShadow);
    
    // Draw Moon caliper
    ctx2d.strokeStyle = r2IsDragging ? '#ffff33' : '#ffff00';
    ctx2d.lineWidth = 1.5;
    ctx2d.beginPath();
    ctx2d.moveTo(r2MoonX - moonRadius2d, cy + moonRadius2d + 12);
    ctx2d.lineTo(r2MoonX + moonRadius2d, cy + moonRadius2d + 12);
    ctx2d.stroke();
    
    ctx2d.beginPath();
    ctx2d.moveTo(r2MoonX - moonRadius2d, cy + moonRadius2d + 8);
    ctx2d.lineTo(r2MoonX - moonRadius2d, cy + moonRadius2d + 16);
    ctx2d.moveTo(r2MoonX + moonRadius2d, cy + moonRadius2d + 8);
    ctx2d.lineTo(r2MoonX + moonRadius2d, cy + moonRadius2d + 16);
    ctx2d.stroke();
    
    ctx2d.fillStyle = '#ffff00';
    ctx2d.font = 'bold 12px "Outfit", sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.fillText("Moon Diameter (D_moon)", r2MoonX, cy + moonRadius2d + 28);
    
    // Draw grab instruction if hovered
    const grabHover = (ctx2d.canvas.style.cursor === 'grab' || ctx2d.canvas.style.cursor === 'grabbing');
    if (grabHover) {
        ctx2d.fillStyle = '#ffffff';
        ctx2d.font = '11px "Outfit", sans-serif';
        ctx2d.fillText(r2IsDragging ? "Dragging..." : "Drag to Measure", r2MoonX, cy - moonRadius2d - 12);
    }
    
    // Text Box at the bottom
    const boxW = 560;
    const boxH = 95;
    const boxX = cx - boxW/2;
    const boxY = h - boxH - 25;
    
    ctx2d.fillStyle = 'rgba(5, 12, 28, 0.9)';
    ctx2d.beginPath();
    ctx2d.roundRect(boxX, boxY, boxW, boxH, 12);
    ctx2d.fill();
    ctx2d.strokeStyle = isCorrect ? '#00ffaa' : '#00e5ff';
    ctx2d.lineWidth = 2;
    ctx2d.stroke();
    
    ctx2d.fillStyle = '#eee';
    ctx2d.font = '16px "Outfit", sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.fillText("Slide the Shadow Ratio or drag the Moon across Earth's shadow.", cx, boxY + 28);
    
    const calcMoonDia = Math.round(12732 / ratio);
    
    if (isCorrect) {
        ctx2d.fillStyle = '#00ffaa';
        ctx2d.font = 'bold 18px "Outfit", sans-serif';
        ctx2d.fillText(`Perfect! Earth Shadow = 3.50 × Moon Diameter`, cx, boxY + 56);
        ctx2d.font = 'bold 16px "Outfit", sans-serif';
        ctx2d.fillStyle = '#88ffcc';
        ctx2d.fillText(`D_moon = 12,732 km / 3.5 = ${calcMoonDia.toLocaleString()} km`, cx, boxY + 80);
    } else {
        ctx2d.fillStyle = '#ffcc00';
        ctx2d.font = 'bold 17px "Outfit", sans-serif';
        ctx2d.fillText(`Current Shadow Width: ${ratio.toFixed(2)} × Moon Diameters`, cx, boxY + 56);
        ctx2d.font = '15px "Outfit", sans-serif';
        ctx2d.fillStyle = '#ffb300';
        ctx2d.fillText(`Estimated Moon size: ${calcMoonDia.toLocaleString()} km (Target: 3,474 km)`, cx, boxY + 80);
    }
}

function render2DAngularSize() {
    canvas2d.style.display = 'block';
    btnClose2d.style.display = 'block';
    resize2D();
}

function draw2DAngularSize() {
    const w = canvas2d.width;
    const h = canvas2d.height;
    ctx2d.clearRect(0, 0, w, h);
    
    // Layout geometry
    const cx1 = w / 4;
    const cx2 = 3 * w / 4;
    const cy = h / 2 - 15; // Shifted up slightly to give more room at the bottom
    
    // Viewfinder (top-left) and Sextant (bottom-left) Y coordinates
    const cyView = cy - 105;
    const cySextant = cy + 100; // Pulls sextant up to avoid collision with bottom box
    
    const time = Date.now() * 0.002;
    
    // Premium Deep Space Background
    const gradBg = ctx2d.createRadialGradient(w/2, h/2, 50, w/2, h/2, Math.max(w, h));
    gradBg.addColorStop(0, '#0a101f');
    gradBg.addColorStop(1, '#020408');
    ctx2d.fillStyle = gradBg;
    ctx2d.fillRect(0, 0, w, h);
    
    // Slider state (Coin Distance L_coin from 50 to 300 cm)
    const inputs = els.controls.querySelectorAll('input');
    let coinDist = 100;
    if (inputs.length > 0) coinDist = parseFloat(inputs[0].value);
    
    // Calculate the angle theta in degrees
    const thetaRad = 2 * Math.atan(2.0 / (2 * coinDist));
    const thetaDeg = thetaRad * 180 / Math.PI;
    
    const isAligned = Math.abs(thetaDeg - 0.5) < 0.02; // target is 0.50 degrees
    
    // ----------------------------------------------------------------
    // LEFT SIDE (TOP): Telescope Viewfinder (Horizontal Split)
    // ----------------------------------------------------------------
    const apertureR = 90;
    const moonR = 30;
    
    // Viewfinder Outer Rim
    ctx2d.strokeStyle = '#445566';
    ctx2d.lineWidth = 8;
    ctx2d.beginPath();
    ctx2d.arc(cx1, cyView, apertureR + 4, 0, Math.PI*2);
    ctx2d.stroke();
    
    // Clip inside viewfinder
    ctx2d.save();
    ctx2d.beginPath();
    ctx2d.arc(cx1, cyView, apertureR, 0, Math.PI*2);
    ctx2d.clip();
    
    // Stars in viewfinder
    drawStars2D(ctx2d, w, h);
    
    // Split Viewfinder line (horizontal split)
    ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    ctx2d.moveTo(cx1 - apertureR, cyView);
    ctx2d.lineTo(cx1 + apertureR, cyView);
    ctx2d.stroke();
    
    // TOP HALF: Direct View (Fixed Moon, bottom limb touches the split line)
    ctx2d.save();
    ctx2d.beginPath();
    ctx2d.rect(cx1 - apertureR, cyView - apertureR, apertureR * 2, apertureR);
    ctx2d.clip();
    drawMoon2D(cx1, cyView - moonR, moonR, 1.0, false); // Direct Moon
    ctx2d.restore();
    
    // BOTTOM HALF: Reflected View (Slides vertically)
    // When theta = 0.50 deg, the top limb of reflected Moon touches the split line (center = cyView + moonR)
    // If angle is too large, the reflected Moon is lower (creating a gap).
    // If angle is too small, the reflected Moon is higher (overlapping).
    const targetAngle = 0.5;
    const pixelShift = (thetaDeg - targetAngle) * 120; // 120 pixels per degree of mismatch
    
    ctx2d.save();
    ctx2d.beginPath();
    ctx2d.rect(cx1 - apertureR, cyView, apertureR * 2, apertureR);
    ctx2d.clip();
    drawMoon2D(cx1, cyView + moonR + pixelShift, moonR, 0.8, false); // Reflected Moon
    ctx2d.restore();
    
    ctx2d.restore(); // Restore main canvas state from viewfinder clip
    
    // Draw viewfinder labels outside the circle to avoid clipping and moon overlap
    ctx2d.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx2d.font = 'bold 11px "Outfit", sans-serif';
    ctx2d.textAlign = 'right';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText("DIRECT VIEW  —", cx1 - apertureR - 10, cyView - 20);
    
    ctx2d.fillStyle = 'rgba(0, 229, 255, 0.7)';
    ctx2d.font = 'bold 11px "Outfit", sans-serif';
    ctx2d.textAlign = 'left';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText("—  REFLECTED VIEW", cx1 + apertureR + 10, cyView + 20);
    
    // Viewfinder Label (Aligned horizontally with right title)
    ctx2d.fillStyle = '#fff';
    ctx2d.font = 'bold 20px "Outfit", sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'alphabetic';
    ctx2d.fillText("Sextant Viewfinder (Limb-to-Limb)", cx1, cy - 210);
    
    // ----------------------------------------------------------------
    // LEFT SIDE (BOTTOM): 2D Sextant Schematic
    // ----------------------------------------------------------------
    const pivotX = cx1;
    const pivotY = cySextant - 70;
    const armLen = 110;
    
    const startAngle = -15 * Math.PI / 180;
    const endAngle = 45 * Math.PI / 180;
    
    // Frame Outline
    ctx2d.strokeStyle = '#4b5e70';
    ctx2d.lineWidth = 4;
    ctx2d.lineCap = 'round';
    
    // Left Arm
    ctx2d.beginPath();
    ctx2d.moveTo(pivotX, pivotY);
    ctx2d.lineTo(pivotX + armLen * Math.sin(startAngle), pivotY + armLen * Math.cos(startAngle));
    ctx2d.stroke();
    
    // Right Arm
    ctx2d.beginPath();
    ctx2d.moveTo(pivotX, pivotY);
    ctx2d.lineTo(pivotX + armLen * Math.sin(endAngle), pivotY + armLen * Math.cos(endAngle));
    ctx2d.stroke();
    
    // Cross brace
    ctx2d.beginPath();
    ctx2d.moveTo(pivotX + (armLen * 0.65) * Math.sin(startAngle), pivotY + (armLen * 0.65) * Math.cos(startAngle));
    ctx2d.lineTo(pivotX + (armLen * 0.65) * Math.sin(endAngle), pivotY + (armLen * 0.65) * Math.cos(endAngle));
    ctx2d.stroke();
    
    // Arc Scale
    ctx2d.strokeStyle = '#d4af37'; // Brass/Gold
    ctx2d.lineWidth = 7;
    ctx2d.beginPath();
    ctx2d.arc(pivotX, pivotY, armLen, startAngle + Math.PI/2, endAngle + Math.PI/2);
    ctx2d.stroke();
    
    // Markings
    ctx2d.strokeStyle = '#ffffff';
    ctx2d.lineWidth = 1;
    for (let d = 0; d <= 25; d += 5) {
        const tickAngle = -15 + d * 2.4;
        const rad = tickAngle * Math.PI / 180;
        const startR = armLen - 6;
        const endR = armLen + 2;
        
        ctx2d.beginPath();
        ctx2d.moveTo(pivotX + startR * Math.sin(rad), pivotY + startR * Math.cos(rad));
        ctx2d.lineTo(pivotX + endR * Math.sin(rad), pivotY + endR * Math.cos(rad));
        ctx2d.stroke();
        
        // Label
        ctx2d.fillStyle = '#aaa';
        ctx2d.font = '9px "Outfit", sans-serif';
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'top';
        const labelR = armLen + 8;
        ctx2d.fillText((d / 10).toFixed(1) + "°", pivotX + labelR * Math.sin(rad), pivotY + labelR * Math.cos(rad));
    }
    
    // Index Mirror
    ctx2d.fillStyle = '#8b9bb4';
    ctx2d.beginPath();
    ctx2d.arc(pivotX, pivotY, 8, 0, Math.PI*2);
    ctx2d.fill();
    
    // Horizon Glass (mounted on left arm)
    const glassX = pivotX + (armLen * 0.45) * Math.sin(startAngle + 10 * Math.PI/180);
    const glassY = pivotY + (armLen * 0.45) * Math.cos(startAngle + 10 * Math.PI/180);
    ctx2d.fillStyle = 'rgba(0, 229, 255, 0.4)';
    ctx2d.strokeStyle = '#d4af37';
    ctx2d.lineWidth = 1.5;
    ctx2d.beginPath();
    ctx2d.rect(glassX - 5, glassY - 10, 10, 15);
    ctx2d.fill();
    ctx2d.stroke();
    
    // Telescope tube
    const telX = pivotX + (armLen * 0.5) * Math.sin(endAngle - 10 * Math.PI/180);
    const telY = pivotY + (armLen * 0.5) * Math.cos(endAngle - 10 * Math.PI/180);
    ctx2d.strokeStyle = '#2c3e50';
    ctx2d.lineWidth = 6;
    ctx2d.beginPath();
    ctx2d.moveTo(telX, telY);
    ctx2d.lineTo(glassX, glassY);
    ctx2d.stroke();
    
    // Index Arm (rotating)
    const visualAngle = -15 + ((thetaDeg - 0.35) / 2.15) * 60;
    const visualAngleRad = visualAngle * Math.PI / 180;
    
    ctx2d.strokeStyle = '#d4af37';
    ctx2d.lineWidth = 4;
    ctx2d.beginPath();
    ctx2d.moveTo(pivotX, pivotY);
    ctx2d.lineTo(pivotX + (armLen + 8) * Math.sin(visualAngleRad), pivotY + (armLen + 8) * Math.cos(visualAngleRad));
    ctx2d.stroke();
    
    // Vernier Window
    ctx2d.fillStyle = 'rgba(255, 215, 0, 0.2)';
    ctx2d.strokeStyle = '#ffffff';
    ctx2d.lineWidth = 1;
    ctx2d.beginPath();
    ctx2d.arc(pivotX + armLen * Math.sin(visualAngleRad), pivotY + armLen * Math.cos(visualAngleRad), 8, 0, Math.PI*2);
    ctx2d.fill();
    ctx2d.stroke();
    
    // Pill background for the Sextant Index to make it look like a high-tech HUD readout
    const pillW = 210;
    const pillH = 30;
    const pillX = cx1 - pillW / 2;
    const pillY = cy + 10 - pillH / 2;
    
    ctx2d.fillStyle = 'rgba(5, 12, 20, 0.75)';
    ctx2d.beginPath();
    ctx2d.roundRect(pillX, pillY, pillW, pillH, 6);
    ctx2d.fill();
    
    ctx2d.strokeStyle = isAligned ? 'rgba(0, 255, 170, 0.4)' : 'rgba(0, 229, 255, 0.4)';
    ctx2d.lineWidth = 1;
    ctx2d.stroke();
    
    ctx2d.fillStyle = isAligned ? '#00ffaa' : '#00e5ff';
    ctx2d.font = 'bold 15px "JetBrains Mono", monospace';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText(`Sextant Index: ${thetaDeg.toFixed(2)}°`, cx1, cy + 10);
    
    // ----------------------------------------------------------------
    // RIGHT SIDE: 2D Coin Projection Schematic
    // ----------------------------------------------------------------
    const eyeX = cx2 - 130;
    const eyeY = cy;
    const moonX = cx2 + 130;
    const moonY = cy;
    const moonVisualR = 35;
    const d_total = moonX - eyeX; // 260 pixels
    
    // Map coin distance (50 to 300) to visual position (40 to 190 pixels)
    const d_visual = 45 + ((coinDist - 50) / 250) * 135;
    const coinX = eyeX + d_visual;
    const coinR = 18; // fixed visual radius
    
    // Similar triangle projection: where does the coin's shadow fall on the Moon plane?
    const projectedR = coinR * (d_total / d_visual);
    const isEclipsingMoon = (projectedR >= moonVisualR);
    
    // 1. Draw glowing visual sightlines
    ctx2d.strokeStyle = isEclipsingMoon ? 'rgba(0, 255, 170, 0.5)' : 'rgba(0, 229, 255, 0.5)';
    ctx2d.lineWidth = 2;
    ctx2d.setLineDash([8, 6]);
    ctx2d.lineDashOffset = -time * 15;
    
    // Top line
    ctx2d.beginPath();
    ctx2d.moveTo(eyeX, eyeY);
    ctx2d.lineTo(moonX, moonY - projectedR);
    ctx2d.stroke();
    
    // Bottom line
    ctx2d.beginPath();
    ctx2d.moveTo(eyeX, eyeY);
    ctx2d.lineTo(moonX, moonY + projectedR);
    ctx2d.stroke();
    ctx2d.setLineDash([]);
    
    // 2. Draw projection shadow beam (cone)
    const gradCone = ctx2d.createLinearGradient(eyeX, eyeY, moonX, moonY);
    gradCone.addColorStop(0, 'rgba(0, 229, 255, 0.05)');
    gradCone.addColorStop(1, isEclipsingMoon ? 'rgba(0, 255, 170, 0.15)' : 'rgba(0, 229, 255, 0.15)');
    ctx2d.fillStyle = gradCone;
    ctx2d.beginPath();
    ctx2d.moveTo(eyeX, eyeY);
    ctx2d.lineTo(moonX, moonY - projectedR);
    ctx2d.lineTo(moonX, moonY + projectedR);
    ctx2d.closePath();
    ctx2d.fill();
    
    // 3. Draw Moon
    drawMoon2D(moonX, moonY, moonVisualR, 1.0, false);
    
    // 4. Draw Coin
    ctx2d.fillStyle = '#d4af37'; // Gold
    ctx2d.beginPath();
    ctx2d.arc(coinX, eyeY, coinR, 0, Math.PI*2);
    ctx2d.fill();
    ctx2d.strokeStyle = '#ffffff';
    ctx2d.lineWidth = 2;
    ctx2d.stroke();
    
    // 5. Draw Eye (Observer)
    ctx2d.fillStyle = '#0a101f';
    ctx2d.strokeStyle = '#00e5ff';
    ctx2d.lineWidth = 3;
    ctx2d.beginPath();
    ctx2d.arc(eyeX, eyeY, 15, 0, Math.PI*2);
    ctx2d.fill();
    ctx2d.stroke();
    
    ctx2d.fillStyle = '#00ffaa';
    ctx2d.beginPath();
    ctx2d.arc(eyeX + 3, eyeY, 5, 0, Math.PI*2);
    ctx2d.fill();
    
    // Titles (aligned horizontally at cy - 210)
    ctx2d.fillStyle = '#fff';
    ctx2d.font = 'bold 20px "Outfit", sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'alphabetic';
    ctx2d.fillText("Coin Projection Analogy", cx2, cy - 210);
    
    // Ruler dimension line from Eye center (eyeX) to Coin center (coinX)
    const rulerY = eyeY + 25;
    const midX = (eyeX + coinX) / 2;
    
    ctx2d.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx2d.lineWidth = 1.5;
    ctx2d.beginPath();
    ctx2d.moveTo(eyeX, rulerY);
    ctx2d.lineTo(coinX, rulerY);
    ctx2d.stroke();
    
    // Ruler end ticks
    ctx2d.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    ctx2d.lineWidth = 1.5;
    ctx2d.beginPath();
    ctx2d.moveTo(eyeX, rulerY - 5);
    ctx2d.lineTo(eyeX, rulerY + 5);
    ctx2d.moveTo(coinX, rulerY - 5);
    ctx2d.lineTo(coinX, rulerY + 5);
    ctx2d.stroke();
    
    // Ruler distance label with dark background clearing
    const labelText = `${coinDist.toFixed(0)} cm`;
    ctx2d.font = 'bold 11px "JetBrains Mono", monospace';
    ctx2d.textBaseline = 'middle';
    ctx2d.textAlign = 'center';
    const textWidth = ctx2d.measureText(labelText).width;
    
    ctx2d.fillStyle = '#020408'; // Matches radial gradient background color
    ctx2d.fillRect(midX - textWidth/2 - 6, rulerY - 8, textWidth + 12, 16);
    
    ctx2d.fillStyle = '#00e5ff';
    ctx2d.fillText(labelText, midX, rulerY);

    // Labels positioned elegantly around the components to prevent any overlap or overflow
    ctx2d.fillStyle = '#aaa';
    ctx2d.font = '13px "Outfit", sans-serif';
    ctx2d.textBaseline = 'top';
    ctx2d.textAlign = 'center';
    
    // Eye label is placed directly below the eye circle, aligned with other labels
    ctx2d.fillText("Eye", eyeX, eyeY + 55);
    
    // Moon label is placed directly below the moon circle, aligned with other labels
    ctx2d.fillText("Moon (3,474 km)", moonX, eyeY + 55);
    
    // Coin label is placed directly below the coin, moving dynamically with it
    ctx2d.fillText("Coin", coinX, eyeY + 55);
    
    // Draw Theta angle indicator at eye
    ctx2d.fillStyle = '#00e5ff';
    ctx2d.font = 'bold 16px "Outfit", sans-serif';
    ctx2d.textBaseline = 'alphabetic';
    ctx2d.fillText("θ", eyeX + 25, eyeY - 5);
    
    // ----------------------------------------------------------------
    // BOTTOM SIDE: Verification Text Box
    // ----------------------------------------------------------------
    
    let line1 = "";
    let line2 = "";
    let font1 = '18px "Outfit", sans-serif';
    let font2 = 'bold 20px "Outfit", sans-serif';
    let color2 = '#ffaa00';
    
    if (isAligned) {
        line1 = "Tangent Alignment Achieved! Coin perfectly matches Moon's angular size.";
        line2 = `Angular Size θ = 0.50° (at ${coinDist.toFixed(0)} cm)`;
        font2 = 'bold 24px "Outfit", sans-serif';
        color2 = '#00ffaa';
    } else {
        line1 = "Adjust the slider to align the viewfinder or match the sightline cone.";
        if (thetaDeg > 0.5) {
            line2 = `Reflected Moon is too high (Angle ${thetaDeg.toFixed(2)}° > 0.50°). Slide further away.`;
        } else {
            line2 = `Reflected Moon is too low (Angle ${thetaDeg.toFixed(2)}° < 0.50°). Slide closer.`;
        }
    }
    
    ctx2d.font = font1;
    const w1 = ctx2d.measureText(line1).width;
    ctx2d.font = font2;
    const w2 = ctx2d.measureText(line2).width;
    
    const boxW = Math.max(w1, w2) + 60; // Proportional to text with padding
    const boxH = 90; // Box height
    const boxX = w/2 - boxW/2;
    const boxY = h - boxH - 15;
    
    ctx2d.fillStyle = 'rgba(5, 12, 20, 0.9)';
    ctx2d.beginPath();
    ctx2d.roundRect(boxX, boxY, boxW, boxH, 15);
    ctx2d.fill();
    
    ctx2d.strokeStyle = isAligned ? '#00ffaa' : '#ffaa00';
    ctx2d.lineWidth = 2;
    ctx2d.stroke();
    
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle'; 
    
    ctx2d.fillStyle = '#ddd';
    ctx2d.font = font1;
    ctx2d.fillText(line1, w/2, boxY + 30);
    
    ctx2d.fillStyle = color2;
    ctx2d.font = font2;
    ctx2d.fillText(line2, w/2, boxY + 60);
}

function drawStars2D(ctx, w, h) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 30; i++) {
        const x = (Math.sin(i * 12345) * 0.5 + 0.5) * w;
        const y = (Math.cos(i * 54321) * 0.5 + 0.5) * h;
        const r = (Math.sin(i * 999) * 0.5 + 0.5) * 1.5 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fill();
    }
}

function drawHUDNumber(x, y, labelNumber) {
    ctx2d.shadowColor = 'transparent';
    ctx2d.fillStyle = '#fff';
    ctx2d.font = 'bold 32px "Outfit", sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText(labelNumber.toString(), x, y);
}

function drawMoon2D(x, y, r, opacity, isEclipsed) {
    ctx2d.save();
    
    // Color depends on whether it is in the shadow (red-grey) or bright
    const baseColor = isEclipsed ? `rgba(120, 60, 50, ${opacity})` : `rgba(220, 220, 220, ${opacity})`;
    const craterColor = isEclipsed ? `rgba(80, 40, 30, ${opacity})` : `rgba(180, 180, 180, ${opacity})`;
    
    if (!isEclipsed) {
        ctx2d.shadowColor = '#fff';
        ctx2d.shadowBlur = 15;
    } else {
        ctx2d.shadowColor = 'transparent';
    }
    
    ctx2d.fillStyle = baseColor;
    ctx2d.beginPath();
    ctx2d.arc(x, y, r, 0, Math.PI*2);
    ctx2d.fill();
    
    // craters
    ctx2d.shadowColor = 'transparent';
    ctx2d.fillStyle = craterColor;
    ctx2d.beginPath();
    ctx2d.arc(x - r*0.3, y - r*0.2, r*0.2, 0, Math.PI*2);
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.arc(x + r*0.4, y + r*0.3, r*0.3, 0, Math.PI*2);
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.arc(x - r*0.2, y + r*0.4, r*0.15, 0, Math.PI*2);
    ctx2d.fill();
    // 3. Draw Moon
    drawMoon2D(moonX, moonY, moonVisualR, 1.0, false);
    
    // 4. Draw Coin
    ctx2d.fillStyle = '#d4af37'; // Gold
    ctx2d.beginPath();
    ctx2d.arc(coinX, eyeY, coinR, 0, Math.PI*2);
    ctx2d.fill();
    ctx2d.strokeStyle = '#ffffff';
    ctx2d.lineWidth = 2;
    ctx2d.stroke();
    
    // 5. Draw Eye (Observer)
    ctx2d.fillStyle = '#0a101f';
    ctx2d.strokeStyle = '#00e5ff';
    ctx2d.lineWidth = 3;
    ctx2d.beginPath();
    ctx2d.arc(eyeX, eyeY, 15, 0, Math.PI*2);
    ctx2d.fill();
    ctx2d.stroke();
    
    ctx2d.fillStyle = '#00ffaa';
    ctx2d.beginPath();
    ctx2d.arc(eyeX + 3, eyeY, 5, 0, Math.PI*2);
    ctx2d.fill();
    
    // Titles (aligned horizontally at cy - 210)
    ctx2d.fillStyle = '#fff';
    ctx2d.font = 'bold 20px "Outfit", sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'alphabetic';
    ctx2d.fillText("Coin Projection Analogy", cx2, cy - 210);
    
    // Ruler dimension line from Eye center (eyeX) to Coin center (coinX)
    const rulerY = eyeY + 25;
    const midX = (eyeX + coinX) / 2;
    
    ctx2d.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx2d.lineWidth = 1.5;
    ctx2d.beginPath();
    ctx2d.moveTo(eyeX, rulerY);
    ctx2d.lineTo(coinX, rulerY);
    ctx2d.stroke();
    
    // Ruler end ticks
    ctx2d.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    ctx2d.lineWidth = 1.5;
    ctx2d.beginPath();
    ctx2d.moveTo(eyeX, rulerY - 5);
    ctx2d.lineTo(eyeX, rulerY + 5);
    ctx2d.moveTo(coinX, rulerY - 5);
    ctx2d.lineTo(coinX, rulerY + 5);
    ctx2d.stroke();
    
    // Ruler distance label with dark background clearing
    const labelText = `${coinDist.toFixed(0)} cm`;
    ctx2d.font = 'bold 11px "JetBrains Mono", monospace';
    ctx2d.textBaseline = 'middle';
    ctx2d.textAlign = 'center';
    const textWidth = ctx2d.measureText(labelText).width;
    
    ctx2d.fillStyle = '#020408'; // Matches radial gradient background color
    ctx2d.fillRect(midX - textWidth/2 - 6, rulerY - 8, textWidth + 12, 16);
    
    ctx2d.fillStyle = '#00e5ff';
    ctx2d.fillText(labelText, midX, rulerY);

    // Labels positioned elegantly around the components to prevent any overlap or overflow
    ctx2d.fillStyle = '#aaa';
    ctx2d.font = '13px "Outfit", sans-serif';
    ctx2d.textBaseline = 'top';
    ctx2d.textAlign = 'center';
    
    // Eye label is placed directly below the eye circle, aligned with other labels
    ctx2d.fillText("Eye", eyeX, eyeY + 55);
    
    // Moon label is placed directly below the moon circle, aligned with other labels
    ctx2d.fillText("Moon (3,474 km)", moonX, eyeY + 55);
    
    // Coin label is placed directly below the coin, moving dynamically with it
    ctx2d.fillText("Coin", coinX, eyeY + 55);
    
    // Draw Theta angle indicator at eye
    ctx2d.fillStyle = '#00e5ff';
    ctx2d.font = 'bold 16px "Outfit", sans-serif';
    ctx2d.textBaseline = 'alphabetic';
    ctx2d.fillText("θ", eyeX + 25, eyeY - 5);
    
    // ----------------------------------------------------------------
    // BOTTOM SIDE: Verification Text Box
    // ----------------------------------------------------------------
    
    let line1 = "";
    let line2 = "";
    let font1 = '18px "Outfit", sans-serif';
    let font2 = 'bold 20px "Outfit", sans-serif';
    let color2 = '#ffaa00';
    
    if (isAligned) {
        line1 = "Tangent Alignment Achieved! Coin perfectly matches Moon's angular size.";
        line2 = `Angular Size θ = 0.50° (at ${coinDist.toFixed(0)} cm)`;
        font2 = 'bold 24px "Outfit", sans-serif';
        color2 = '#00ffaa';
    } else {
        line1 = "Adjust the slider to align the viewfinder or match the sightline cone.";
        if (thetaDeg > 0.5) {
            line2 = `Reflected Moon is too high (Angle ${thetaDeg.toFixed(2)}° > 0.50°). Slide further away.`;
        } else {
            line2 = `Reflected Moon is too low (Angle ${thetaDeg.toFixed(2)}° < 0.50°). Slide closer.`;
        }
    }
    
    ctx2d.font = font1;
    const w1 = ctx2d.measureText(line1).width;
    ctx2d.font = font2;
    const w2 = ctx2d.measureText(line2).width;
    
    const boxW = Math.max(w1, w2) + 60; // Proportional to text with padding
    const boxH = 90; // Box height
    const boxX = w/2 - boxW/2;
    const boxY = h - boxH - 15;
    
    ctx2d.fillStyle = 'rgba(5, 12, 20, 0.9)';
    ctx2d.beginPath();
    ctx2d.roundRect(boxX, boxY, boxW, boxH, 15);
    ctx2d.fill();
    
    ctx2d.strokeStyle = isAligned ? '#00ffaa' : '#ffaa00';
    ctx2d.lineWidth = 2;
    ctx2d.stroke();
    
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle'; 
    
    ctx2d.fillStyle = '#ddd';
    ctx2d.font = font1;
    ctx2d.fillText(line1, w/2, boxY + 30);
    
    ctx2d.fillStyle = color2;
    ctx2d.font = font2;
    ctx2d.fillText(line2, w/2, boxY + 60);
}

function drawStars2D(ctx, w, h) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 30; i++) {
        const x = (Math.sin(i * 12345) * 0.5 + 0.5) * w;
        const y = (Math.cos(i * 54321) * 0.5 + 0.5) * h;
        const r = (Math.sin(i * 999) * 0.5 + 0.5) * 1.5 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fill();
    }
}

function drawHUDNumber(x, y, labelNumber) {
    ctx2d.shadowColor = 'transparent';
    ctx2d.fillStyle = '#fff';
    ctx2d.font = 'bold 32px "Outfit", sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText(labelNumber.toString(), x, y);
}

function drawMoon2D(x, y, r, opacity, isEclipsed) {
    ctx2d.save();
    
    // Color depends on whether it is in the shadow (red-grey) or bright
    const baseColor = isEclipsed ? `rgba(120, 60, 50, ${opacity})` : `rgba(220, 220, 220, ${opacity})`;
    const craterColor = isEclipsed ? `rgba(80, 40, 30, ${opacity})` : `rgba(180, 180, 180, ${opacity})`;
    
    if (!isEclipsed) {
        ctx2d.shadowColor = '#fff';
        ctx2d.shadowBlur = 15;
    } else {
        ctx2d.shadowColor = 'transparent';
    }
    
    ctx2d.fillStyle = baseColor;
    ctx2d.beginPath();
    ctx2d.arc(x, y, r, 0, Math.PI*2);
    ctx2d.fill();
    
    // craters
    ctx2d.shadowColor = 'transparent';
    ctx2d.fillStyle = craterColor;
    ctx2d.beginPath();
    ctx2d.arc(x - r*0.3, y - r*0.2, r*0.2, 0, Math.PI*2);
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.arc(x + r*0.4, y + r*0.3, r*0.3, 0, Math.PI*2);
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.arc(x - r*0.2, y + r*0.4, r*0.15, 0, Math.PI*2);
    ctx2d.fill();
    
    ctx2d.restore();
}

// Raycaster for clicking
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// View Toggles
const btnView3d = document.getElementById('btn-view-3d');
const btnView2d = document.getElementById('btn-view-2d');
const btnViewWiki = document.getElementById('btn-view-wiki');
const wikiContainer = document.getElementById('wiki-container');

if (btnView3d && btnView2d) {
    btnView3d.addEventListener('click', () => {
        btnView3d.classList.add('active');
        btnView2d.classList.remove('active');
        if (btnViewWiki) btnViewWiki.classList.remove('active');
        canvas2d.style.display = 'none';
        btnClose2d.style.display = 'none';
        if (wikiContainer) wikiContainer.style.display = 'none';
        const r9ui = document.getElementById('r9-ui-container');
        if (r9ui) r9ui.style.display = 'none';
        const r12ui = document.getElementById('r12-ui-container');
        if (r12ui) r12ui.style.display = 'none';
        const r13ui = document.getElementById('r13-ui-container');
        if (r13ui) r13ui.style.display = 'none';
        const r14ui = document.getElementById('r14-ui-container');
        if (r14ui) r14ui.style.display = 'none';
        const hrui = document.getElementById('hr-ui-container');
        if (hrui) hrui.style.display = 'none';
        if (els.telemetry) els.telemetry.style.display = 'flex';

        // Clean up previous 3D groups
        if (typeof earthGroup !== 'undefined') earthGroup.visible = false;
        if (typeof moonGroup !== 'undefined') moonGroup.visible = false;
        if (typeof distGroup !== 'undefined') distGroup.visible = false;
        if (typeof sunGroup !== 'undefined') sunGroup.visible = false;
        if (typeof pinholeGroup !== 'undefined') pinholeGroup.visible = false;
        if (typeof marsGroup !== 'undefined') marsGroup.visible = false;
        if (typeof transitGroup !== 'undefined') transitGroup.visible = false;
        if (typeof stellarGroup !== 'undefined') stellarGroup.visible = false;
        if (typeof galaxiesGroup !== 'undefined') galaxiesGroup.visible = false;
        if (typeof clusterGroup !== 'undefined') clusterGroup.visible = false;
        if (typeof venusGroup !== 'undefined') venusGroup.visible = false;
        if (typeof rung12Group !== 'undefined') rung12Group.visible = false;
        if (typeof rung13Group !== 'undefined') rung13Group.visible = false;

        // Show 3D Geometric Scene
        if (currentRung === 1) {
            if (typeof earthGroup !== 'undefined') {
                earthGroup.visible = true;
                if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
                    camera.position.set(5, 0, 0);
                    controls.target.set(0, 0, 0);
                }
            }
        } else if (currentRung === 2) {
            if (typeof moonGroup !== 'undefined') {
                moonGroup.visible = true;
                if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
                    camera.position.set(0, 0, 3);
                    controls.target.set(0, 0, 0);
                }
            }
        } else if (currentRung === 3) {
            if (typeof distGroup !== 'undefined') {
                distGroup.visible = true;
                if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
                    camera.position.set(10, 0, 15);
                    controls.target.set(10, 0, 0);
                }
            }
        } else if (currentRung === 4) {
            if (typeof sunGroup !== 'undefined') {
                sunGroup.visible = true;
                if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
                    camera.position.set(10, 5, 20);
                    controls.target.set(10, 5, 0);
                }
            }
        } else if (currentRung === 5) {
            if (typeof pinholeGroup !== 'undefined') {
                pinholeGroup.visible = true;
                if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
                    camera.position.set(10, 5, 20);
                    controls.target.set(10, 0, 0);
                }
            }
        } else if (currentRung === 6) {
            if (typeof marsGroup !== 'undefined') {
                marsGroup.visible = true;
                if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
                    camera.position.set(60, 20, 80);
                    controls.target.set(30, 0, 0);
                }
            }
        } else if (currentRung === 7) {
            if (typeof transitGroup !== 'undefined') {
                transitGroup.visible = true;
                if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
                    camera.position.set(50, 20, 80);
                    controls.target.set(40, 0, 0);
                }
            }
        } else if (currentRung === 8) {
            if (typeof stellarGroup !== 'undefined') {
                stellarGroup.visible = true;
                if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
                    camera.position.set(0, 10, 30);
                    controls.target.set(0, 0, -20);
                }
            }
        } else if (currentRung === 9) {
            if (typeof clusterGroup !== 'undefined') {
                clusterGroup.visible = true;
                if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
                    camera.position.set(15, 8, 5);
                    controls.target.set(0, 0, -6);
                }
            }
        } else if (currentRung === 10) {
            if (typeof galaxiesGroup !== 'undefined') {
                galaxiesGroup.visible = true;
                if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
                    if (r9State.phase === 1) {
                        camera.position.set(-60, -35, -20);
                        controls.target.set(-60, -40, -70);
                    } else {
                        camera.position.set(150, 105, -190);
                        controls.target.set(150, 100, -240);
                    }
                }
            }
        } else if (currentRung === 11) {
            if (typeof venusGroup !== 'undefined') {
                venusGroup.visible = true;
                if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
                    camera.position.set(20, 15, 30);
                    controls.target.set(20, 0, 0);
                }
            }
        } else if (currentRung === 12) {
            if (typeof rung12Group !== 'undefined') {
                rung12Group.visible = true;
                if (typeof updateR12Selection3D === 'function') updateR12Selection3D();
                if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
                    camera.position.set(25, 20, 45);
                    controls.target.set(-10, -5, -20);
                }
            }
        } else if (currentRung === 13) {
            if (typeof rung13Group !== 'undefined') {
                rung13Group.visible = true;
                if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
                    camera.position.set(0, 15, 30);
                    controls.target.set(0, 0, 0);
                }
            }
        } else if (currentRung === 14) {
            if (typeof rung14Group !== 'undefined') {
                rung14Group.visible = true;
                if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
                    camera.position.set(0, 15, 30);
                    controls.target.set(0, 0, 0);
                }
            }
        }
    });
    
    btnView2d.addEventListener('click', () => {
        btnView2d.classList.add('active');
        btnView3d.classList.remove('active');
        if (btnViewWiki) btnViewWiki.classList.remove('active');
        if (wikiContainer) wikiContainer.style.display = 'none';

        // Manage telemetry bar visibility for Rung 9 2D view
        if (currentRung === 9 || currentRung === 10 || currentRung === 12 || currentRung === 13 || currentRung === 14) {
            if (els.telemetry) els.telemetry.style.display = 'none';
        } else {
            if (els.telemetry) els.telemetry.style.display = 'flex';
        }

        // Clean up all 3D groups when switching to 2D view
        if (typeof earthGroup !== 'undefined') earthGroup.visible = false;
        if (typeof moonGroup !== 'undefined') moonGroup.visible = false;
        if (typeof distGroup !== 'undefined') distGroup.visible = false;
        if (typeof sunGroup !== 'undefined') sunGroup.visible = false;
        if (typeof pinholeGroup !== 'undefined') pinholeGroup.visible = false;
        if (typeof marsGroup !== 'undefined') marsGroup.visible = false;
        if (typeof transitGroup !== 'undefined') transitGroup.visible = false;
        if (typeof stellarGroup !== 'undefined') stellarGroup.visible = false;
        if (typeof galaxiesGroup !== 'undefined') galaxiesGroup.visible = false;
        if (typeof clusterGroup !== 'undefined') clusterGroup.visible = false;
        if (typeof venusGroup !== 'undefined') venusGroup.visible = false;
        if (typeof rung12Group !== 'undefined') rung12Group.visible = false;
        if (typeof rung13Group !== 'undefined') rung13Group.visible = false;
        if (typeof rung14Group !== 'undefined') rung14Group.visible = false;
        if (currentRung === 1) {
            // Rung 1 has two schematics, so default to Alexandria or prompt
            render2DAlexandria(); 
        } else if (currentRung === 2) {
            render2DLunarEclipse();
        } else if (currentRung === 3) {
            render2DAngularSize();
            // Hide 3D group if we show 2D viewfinder
            if (typeof distGroup !== 'undefined') distGroup.visible = false;
        } else if (currentRung === 4) {
            render2DAristarchusAngle();
            if (typeof sunGroup !== 'undefined') sunGroup.visible = false;
        } else if (currentRung === 5) {
            render2DPinholeSun();
            if (typeof pinholeGroup !== 'undefined') pinholeGroup.visible = false;
        } else if (currentRung === 6) {
            render2DMarsParallax();
            if (typeof marsGroup !== 'undefined') marsGroup.visible = false;
        } else if (currentRung === 7) {
            // Handled by draw2DTransit in the main animation loop
            const canvas2d = document.getElementById('canvas-2d');
            const btnClose2d = document.getElementById('btn-close-2d');
            if (canvas2d) canvas2d.style.display = 'block';
            if (btnClose2d) btnClose2d.style.display = 'none';
            if (typeof transitGroup !== 'undefined') transitGroup.visible = false;
        } else if (currentRung === 8) {
            // Handled by main animation loop
            const canvas2d = document.getElementById('canvas-2d');
            const btnClose2d = document.getElementById('btn-close-2d');
            if (canvas2d) canvas2d.style.display = 'block';
            if (btnClose2d) btnClose2d.style.display = 'none';
            if (typeof stellarGroup !== 'undefined') stellarGroup.visible = false;
        } else if (currentRung === 9) {
            const canvas2d = document.getElementById('canvas-2d');
            const btnClose2d = document.getElementById('btn-close-2d');
            if (canvas2d) canvas2d.style.display = 'none';
            if (btnClose2d) btnClose2d.style.display = 'none';
            if (typeof clusterGroup !== 'undefined') clusterGroup.visible = false;
            initRung9UI();
        } else if (currentRung === 10) {
            const canvas2d = document.getElementById('canvas-2d');
            const btnClose2d = document.getElementById('btn-close-2d');
            if (canvas2d) canvas2d.style.display = 'none';
            if (btnClose2d) btnClose2d.style.display = 'none';
            initRung10UI();
        } else if (currentRung === 11) {
            render2DRadarVenus();
            if (typeof venusGroup !== 'undefined') venusGroup.visible = false;
            if (typeof rung12Group !== 'undefined') rung12Group.visible = false;
        } else if (currentRung === 12) {
            const canvas2d = document.getElementById('canvas-2d');
            const btnClose2d = document.getElementById('btn-close-2d');
            if (canvas2d) canvas2d.style.display = 'none';
            if (btnClose2d) btnClose2d.style.display = 'none';
            if (typeof initRung12UI === 'function') initRung12UI();
        } else if (currentRung === 13) {
            const canvas2d = document.getElementById('canvas-2d');
            const btnClose2d = document.getElementById('btn-close-2d');
            if (canvas2d) canvas2d.style.display = 'none';
            if (btnClose2d) btnClose2d.style.display = 'none';
            if (typeof initRung13UI === 'function') initRung13UI();
        } else if (currentRung === 14) {
            const canvas2d = document.getElementById('canvas-2d');
            const btnClose2d = document.getElementById('btn-close-2d');
            if (canvas2d) canvas2d.style.display = 'none';
            if (btnClose2d) btnClose2d.style.display = 'none';
            if (typeof initRung14UI === 'function') initRung14UI();
        }
    });
}

if (btnViewWiki) {
    btnViewWiki.addEventListener('click', () => {
        console.log('Wiki button clicked');
        btnViewWiki.classList.add('active');
        if (btnView3d) btnView3d.classList.remove('active');
        if (btnView2d) btnView2d.classList.remove('active');

        // Hide normal canvases and telemetries
        canvas2d.style.display = 'none';
        btnClose2d.style.display = 'none';
        if (els.telemetry) els.telemetry.style.display = 'none';

        // Hide other specific custom overlay panels
        const r9ui = document.getElementById('r9-ui-container');
        if (r9ui) r9ui.style.display = 'none';
        const r12ui = document.getElementById('r12-ui-container');
        if (r12ui) r12ui.style.display = 'none';
        const r13ui = document.getElementById('r13-ui-container');
        if (r13ui) r13ui.style.display = 'none';
        const r14ui = document.getElementById('r14-ui-container');
        if (r14ui) r14ui.style.display = 'none';
        const hrui = document.getElementById('hr-ui-container');
        if (hrui) hrui.style.display = 'none';

        // Clean up 3D groups
        if (typeof earthGroup !== 'undefined') earthGroup.visible = false;
        if (typeof moonGroup !== 'undefined') moonGroup.visible = false;
        if (typeof distGroup !== 'undefined') distGroup.visible = false;
        if (typeof sunGroup !== 'undefined') sunGroup.visible = false;
        if (typeof pinholeGroup !== 'undefined') pinholeGroup.visible = false;
        if (typeof marsGroup !== 'undefined') marsGroup.visible = false;
        if (typeof transitGroup !== 'undefined') transitGroup.visible = false;
        if (typeof stellarGroup !== 'undefined') stellarGroup.visible = false;
        if (typeof galaxiesGroup !== 'undefined') galaxiesGroup.visible = false;
        if (typeof clusterGroup !== 'undefined') clusterGroup.visible = false;
        if (typeof venusGroup !== 'undefined') venusGroup.visible = false;
        if (typeof rung12Group !== 'undefined') rung12Group.visible = false;
        if (typeof rung13Group !== 'undefined') rung13Group.visible = false;
        if (typeof rung14Group !== 'undefined') rung14Group.visible = false;

        // Show wiki container
        if (wikiContainer) {
            console.log('Showing wikiContainer container');
            wikiContainer.style.display = 'block';
        } else {
            console.error('wikiContainer element not found');
        }

        renderWikiContent();
    });
}

// Interaction State
let targetCameraPos = new THREE.Vector3(5, 0, 0);
let targetControlsTarget = new THREE.Vector3(0, 0, 0);

window.addEventListener('click', (event) => {
    // Hide prompt on first click
    const prompt = document.getElementById('interaction-prompt');
    if (prompt) prompt.style.display = 'none';

    const rect = canvas.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([syeneHit, alexHit]);

    if (intersects.length > 0) {
        const city = intersects[0].object.userData.city;
        
        if (city === 'Syene') {
            render2DSyene();
        } else {
            render2DAlexandria();
        }
        
        // Update telemetry
        const telObs = document.getElementById('telemetry-obs');
        const telVal = document.getElementById('sim-reading');
        if (telObs && telVal) {
            if (city === 'Syene') {
                telObs.textContent = "Syene Well";
                telVal.textContent = "0.0° (No Shadow)";
            } else {
                telObs.textContent = "Alexandria Pole";
                telVal.textContent = "7.2° (Shadow cast)";
            }
        }
    }
});
function render2DAristarchusAngle() {
    canvas2d.style.display = 'block';
    btnClose2d.style.display = 'none';
    resize2D();
    draw2DAristarchusAngle();
}

function draw2DAristarchusAngle() {
    const w = canvas2d.width;
    const h = canvas2d.height;
    ctx2d.clearRect(0, 0, w, h);
    
    // Twilight Sky Background
    const gradSky = ctx2d.createLinearGradient(0, 0, 0, h);
    gradSky.addColorStop(0, '#020b1c');
    gradSky.addColorStop(0.7, '#1a3b5c');
    gradSky.addColorStop(1, '#ff6600');
    ctx2d.fillStyle = gradSky;
    ctx2d.fillRect(0, 0, w, h);
    drawStars2D(ctx2d, w, h);
    
    const horizonY = h * 0.85;
    
    // Ground
    ctx2d.fillStyle = '#01050a';
    ctx2d.fillRect(0, horizonY, w, h - horizonY);
    
    // Glowing Horizon Line
    ctx2d.strokeStyle = '#ffaa00';
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    ctx2d.moveTo(0, horizonY);
    ctx2d.lineTo(w, horizonY);
    ctx2d.stroke();
    
    // Target phi (fixed moon location)
    const targetPhiDeg = 87.0;
    const targetPhiRad = targetPhiDeg * Math.PI / 180;
    
    // Get phi from slider
    let phiDeg = 85.0;
    const inputs = els.controls.querySelectorAll('input');
    if (inputs.length > 0) {
        phiDeg = parseFloat(inputs[0].value);
    }
    const phiRad = phiDeg * Math.PI / 180;
    
    const obsX = w * 0.5;
    const obsY = horizonY;
    
    // Fixed Quarter Moon Position
    const radiusToMoon = Math.min(w, h) * 0.55;
    const moonX = obsX + radiusToMoon * Math.cos(targetPhiRad);
    const moonY = obsY - radiusToMoon * Math.sin(targetPhiRad);
    
    const sunX = w * 0.9;
    const sunY = horizonY;
    
    // Setting Sun (right horizon)
    const gradSun = ctx2d.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
    gradSun.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradSun.addColorStop(0.2, 'rgba(255, 200, 50, 0.8)');
    gradSun.addColorStop(1, 'rgba(255, 100, 0, 0)');
    ctx2d.fillStyle = gradSun;
    ctx2d.beginPath();
    ctx2d.arc(sunX, sunY, 80, 0, Math.PI * 2);
    ctx2d.fill();
    
    ctx2d.fillStyle = '#fff';
    ctx2d.beginPath();
    ctx2d.arc(sunX, sunY, 20, Math.PI, Math.PI*2); // Setting sun half circle (top half)
    ctx2d.fill();
    
    ctx2d.fillStyle = '#ffaa00';
    ctx2d.font = 'bold 18px "Outfit", sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.fillText("SETTING SUN (0°)", sunX, sunY + 25);
    
    // Draw Fixed Quarter Moon
    ctx2d.fillStyle = '#fff'; // Right half (facing sun)
    ctx2d.beginPath();
    ctx2d.arc(moonX, moonY, 20, -Math.PI/2, Math.PI/2);
    ctx2d.fill();
    ctx2d.fillStyle = '#444'; // Left half
    ctx2d.beginPath();
    ctx2d.arc(moonX, moonY, 20, Math.PI/2, Math.PI*1.5);
    ctx2d.fill();
    
    ctx2d.fillStyle = '#fff';
    ctx2d.fillText("QUARTER MOON", moonX, moonY - 30);
    
    // Measuring Quadrant
    const quadR = Math.min(w, h) * 0.35;
    const isAligned = Math.abs(phiDeg - targetPhiDeg) < 0.05;
    
    // Sightline to Sun
    ctx2d.strokeStyle = 'rgba(255, 170, 0, 0.5)';
    ctx2d.setLineDash([5, 5]);
    ctx2d.beginPath();
    ctx2d.moveTo(obsX, obsY);
    ctx2d.lineTo(sunX, sunY);
    ctx2d.stroke();
    
    // Fixed Sightline to Moon
    ctx2d.strokeStyle = 'rgba(0, 229, 255, 0.5)';
    ctx2d.setLineDash([]);
    ctx2d.beginPath();
    ctx2d.moveTo(obsX, obsY);
    ctx2d.lineTo(moonX, moonY);
    ctx2d.stroke();
    
    // Quadrant Arc (0 to 90 degrees)
    ctx2d.strokeStyle = '#d4af37'; // Brass
    ctx2d.lineWidth = 4;
    ctx2d.beginPath();
    ctx2d.arc(obsX, obsY, quadR, Math.PI * 1.5, Math.PI*2); // 90 to 0 degrees in canvas space
    ctx2d.stroke();
    
    // Measuring Arm
    const armX = obsX + quadR * 1.1 * Math.cos(phiRad);
    const armY = obsY - quadR * 1.1 * Math.sin(phiRad);
    ctx2d.strokeStyle = isAligned ? '#00ffaa' : '#ffaa00';
    ctx2d.lineWidth = 3;
    ctx2d.beginPath();
    ctx2d.moveTo(obsX, obsY);
    ctx2d.lineTo(armX, armY);
    ctx2d.stroke();
    
    // Fill Angle
    ctx2d.fillStyle = isAligned ? 'rgba(0, 255, 170, 0.3)' : 'rgba(212, 175, 55, 0.2)';
    ctx2d.beginPath();
    ctx2d.moveTo(obsX, obsY);
    ctx2d.arc(obsX, obsY, quadR, Math.PI*2 - phiRad, Math.PI*2);
    ctx2d.closePath();
    ctx2d.fill();
    
    // Ticks
    ctx2d.lineWidth = 2;
    ctx2d.strokeStyle = '#d4af37';
    for (let d = 0; d <= 90; d += 10) {
        const rad = -d * Math.PI / 180;
        const tickL = (d % 30 === 0) ? 15 : 8;
        ctx2d.beginPath();
        ctx2d.moveTo(obsX + quadR * Math.cos(rad), obsY + quadR * Math.sin(rad));
        ctx2d.lineTo(obsX + (quadR - tickL) * Math.cos(rad), obsY + (quadR - tickL) * Math.sin(rad));
        ctx2d.stroke();
    }
    
    // Angle Text
    ctx2d.fillStyle = isAligned ? '#00ffaa' : '#00e5ff';
    ctx2d.font = 'bold 36px monospace';
    const textRad = -phiRad / 2;
    ctx2d.fillText(`φ = ${phiDeg.toFixed(1)}°`, obsX + (quadR*0.6) * Math.cos(textRad), obsY + (quadR*0.6) * Math.sin(textRad));
}


function render2DMarsParallax() {
    const canvas2d = document.getElementById('canvas-2d');
    const btnClose2d = document.getElementById('btn-close-2d');
    if (canvas2d) canvas2d.style.display = 'block';
    if (btnClose2d) btnClose2d.style.display = 'none';
    resize2D();
    draw2DMarsParallax();
}

function draw2DMarsParallax() {
    if (!ctx2d) return;
    const canvas2d = document.getElementById('canvas-2d');
    const w = canvas2d.width;
    const h = canvas2d.height;
    ctx2d.clearRect(0, 0, w, h);
    
    // Background
    ctx2d.fillStyle = '#050a15';
    ctx2d.fillRect(0, 0, w, h);
    
    // Inputs
    let userTheta = 24;
    const inputs = els.controls.querySelectorAll('input');
    if (inputs.length > 0) {
        userTheta = parseFloat(inputs[0].value);
    }
    
    const trueTheta = 12.48; 
    const isAligned = Math.abs(userTheta - trueTheta) < 0.02;
    
    // Layout for 3 side-by-side viewports
    // Spacing them out slightly more and reducing radius to prevent overlap
    const cx1 = w * 0.16;
    const cx2 = w * 0.5;
    const cx3 = w * 0.84;
    const cy = h * 0.45;
    const radius = Math.min(w * 0.15, h * 0.25);
    
    // Shift calculations (keep visual shift identical to previous version)
    const pixelsPerArcsec = 60 / 12.48; // This ensures trueShiftPixels is 60, keeping circles visually separated
    const trueShiftPixels = trueTheta * pixelsPerArcsec;
    const userShiftPixels = userTheta * pixelsPerArcsec;
    
    // Helper to draw a viewport
    function drawViewport(cx, cy, label, renderContents) {
        ctx2d.save();
        ctx2d.translate(cx, cy);
        
        // Clip to circle
        ctx2d.beginPath();
        ctx2d.arc(0, 0, radius, 0, Math.PI * 2);
        ctx2d.clip();
        
        // Deep space background
        ctx2d.fillStyle = '#000000';
        ctx2d.fill();
        
        // Fixed constellation of stars (same in every viewport)
        ctx2d.fillStyle = '#ffffff';
        for (let i = 0; i < 40; i++) {
            const sx = Math.sin(i * 123) * radius * 0.9;
            const sy = Math.cos(i * 321) * radius * 0.9;
            const sr = (Math.sin(i * 456) * 0.5 + 0.5) * 1.5 + 0.5;
            ctx2d.beginPath();
            ctx2d.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx2d.fill();
        }
        
        // Specific contents (Mars, Caliper)
        renderContents();
        
        ctx2d.restore();
        
        // Viewport Rim
        ctx2d.save();
        ctx2d.translate(cx, cy);
        ctx2d.lineWidth = 6;
        ctx2d.strokeStyle = '#223344';
        ctx2d.beginPath();
        ctx2d.arc(0, 0, radius, 0, Math.PI * 2);
        ctx2d.stroke();
        ctx2d.lineWidth = 2;
        ctx2d.strokeStyle = '#556677';
        ctx2d.stroke();
        
        // Label
        ctx2d.fillStyle = '#ffffff';
        ctx2d.font = '16px Outfit';
        ctx2d.textAlign = 'center';
        ctx2d.fillText(label, 0, radius + 30);
        ctx2d.restore();
    }
    
    // Viewport 1: Paris (Mars shifted right against background)
    drawViewport(cx1, cy, "View from Paris", () => {
        ctx2d.fillStyle = '#ff4422';
        ctx2d.beginPath();
        ctx2d.arc(trueShiftPixels/2, 0, 12, 0, Math.PI * 2);
        ctx2d.fill();
    });
    
    // Viewport 2: French Guiana (Mars shifted left against background)
    drawViewport(cx2, cy, "View from Guiana", () => {
        ctx2d.fillStyle = '#ff4422';
        ctx2d.beginPath();
        ctx2d.arc(-trueShiftPixels/2, 0, 12, 0, Math.PI * 2);
        ctx2d.fill();
    });
    
    // Viewport 3: Superimposed Comparison
    drawViewport(cx3, cy, "Superimposed (Measurement)", () => {
        // Ghost images of Mars
        ctx2d.globalAlpha = 0.4;
        ctx2d.fillStyle = '#ff4422';
        ctx2d.beginPath(); ctx2d.arc(trueShiftPixels/2, 0, 12, 0, Math.PI * 2); ctx2d.fill();
        ctx2d.beginPath(); ctx2d.arc(-trueShiftPixels/2, 0, 12, 0, Math.PI * 2); ctx2d.fill();
        ctx2d.globalAlpha = 1.0;
        
        // Caliper
        const caliperLeft = -userShiftPixels/2;
        const caliperRight = userShiftPixels/2;
        
        ctx2d.strokeStyle = isAligned ? '#00ffaa' : '#00aaff';
        ctx2d.lineWidth = 2;
        
        // Horizontal bar
        ctx2d.beginPath(); ctx2d.moveTo(caliperLeft, 0); ctx2d.lineTo(caliperRight, 0); ctx2d.stroke();
        
        // Vertical ticks
        ctx2d.beginPath(); ctx2d.moveTo(caliperLeft, -15); ctx2d.lineTo(caliperLeft, 15); ctx2d.stroke();
        ctx2d.beginPath(); ctx2d.moveTo(caliperRight, -15); ctx2d.lineTo(caliperRight, 15); ctx2d.stroke();
        
        // Measurement text
        ctx2d.fillStyle = isAligned ? '#00ffaa' : '#00aaff';
        ctx2d.font = 'bold 16px Outfit';
        ctx2d.fillText(`θ = ${userTheta}"`, 0, -25);
    });
    
    // Telemetry updates
    const dMarsEl = document.getElementById('sim-mars-dist');
    const dMarsAuEl = document.getElementById('sim-mars-au');
    if (dMarsEl) {
        // Direct call to the core calculation to guarantee they match perfectly
        const dMars = RUNGS[5].calculate({ parallax_angle: userTheta });
        
        dMarsEl.textContent = `${Math.round(dMars).toLocaleString()} km`;
        dMarsEl.style.color = isAligned ? '#00ffaa' : '#ffffff';
        
        if (dMarsAuEl) {
            const dAu = dMars / 149597870;
            dMarsAuEl.textContent = `${dAu.toFixed(4)} AU`;
            dMarsAuEl.style.color = isAligned ? '#00ffaa' : '#ffffff';
        }
    }
}

function render2DStellarParallax() {
    draw2DStellarParallax();
}

function render2DRadarVenus() {
    const canvas2d = document.getElementById('canvas-2d');
    const btnClose2d = document.getElementById('btn-close-2d');
    if (canvas2d) canvas2d.style.display = 'block';
    if (btnClose2d) btnClose2d.style.display = 'none';
    resize2D();
    draw2DRadarVenus();
}

function draw2DStellarParallax() {
    if (!ctx2d) return;
    const canvas2d = document.getElementById('canvas-2d');
    const w = canvas2d.width;
    const h = canvas2d.height;
    ctx2d.clearRect(0, 0, w, h);
    
    // Deep Space Background with a subtle radial gradient
    const bgGrad = ctx2d.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
    bgGrad.addColorStop(0, '#0a0a1a');
    bgGrad.addColorStop(1, '#020205');
    ctx2d.fillStyle = bgGrad;
    ctx2d.fillRect(0, 0, w, h);
    
    const panelWidth = w / 3;
    const scale = 200; // pixels per arcsec
    const cy = h / 2;
    
    function drawPanel(idx, label, starShiftArcsec, showCaliper = false) {
        const cx = panelWidth * idx + panelWidth / 2;
        
        // Panel Divider with subtle gradient
        if (idx > 0) {
            const divGrad = ctx2d.createLinearGradient(0, 0, 0, h);
            divGrad.addColorStop(0, 'rgba(255,255,255,0.0)');
            divGrad.addColorStop(0.5, 'rgba(255,255,255,0.3)');
            divGrad.addColorStop(1, 'rgba(255,255,255,0.0)');
            ctx2d.strokeStyle = divGrad;
            ctx2d.lineWidth = 1;
            ctx2d.beginPath();
            ctx2d.moveTo(panelWidth * idx, 0);
            ctx2d.lineTo(panelWidth * idx, h);
            ctx2d.stroke();
        }
        
        // Label background (glassmorphism effect)
        ctx2d.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx2d.beginPath();
        ctx2d.roundRect(cx - 150, 45, 300, 50, 25);
        ctx2d.fill();
        ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx2d.stroke();
        
        // Label text
        ctx2d.fillStyle = '#ffffff';
        ctx2d.font = '600 22px "Outfit", sans-serif';
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'middle';
        ctx2d.fillText(label, cx, 70);

        // Bounding box dimensions
        const padX = 15;
        const boxX = panelWidth * idx + padX;
        const boxWidth = panelWidth - padX * 2;
        const boxY = 110;
        const boxHeight = h - 220; // 110 to h-110
        
        // Let's get isAligned for coloring the border
        let isAligned = false;
        let col = '#ff3333';
        const inputs = els.controls.querySelectorAll('input');
        if (inputs.length > 0) {
            const measuredShift = parseFloat(inputs[0].value);
            isAligned = Math.abs(measuredShift - 0.7) <= 0.05;
            col = isAligned ? '#00ffaa' : '#ff3333';
        }

        // Draw viewport background (dark glass panel)
        ctx2d.fillStyle = 'rgba(5, 10, 25, 0.5)';
        ctx2d.beginPath();
        ctx2d.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
        ctx2d.fill();

        // Save context and apply clipping for all contents inside the boundary box
        ctx2d.save();
        ctx2d.beginPath();
        ctx2d.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
        ctx2d.clip();
        
        // Background Grid (inside clip)
        ctx2d.strokeStyle = 'rgba(68, 68, 102, 0.4)';
        ctx2d.lineWidth = 1;
        for (let i = -4; i <= 4; i++) {
            const x = cx + i * (scale / 5); // grid lines every 0.2 arcsec
            if (i === 0) {
                ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx2d.lineWidth = 2;
            } else {
                ctx2d.strokeStyle = 'rgba(68, 68, 102, 0.4)';
                ctx2d.lineWidth = 1;
            }
            ctx2d.beginPath();
            ctx2d.moveTo(x, 110);
            ctx2d.lineTo(x, h - 110);
            ctx2d.stroke();
        }
        
        // Pseudo-random background stars exactly mapped to arcseconds (inside clip)
        ctx2d.fillStyle = '#ffffff';
        for(let i=0; i<50; i++) {
            const arcX = Math.sin(i*123) * 1.0;
            const arcY = Math.cos(i*321) * 1.0;
            const size = (Math.sin(i*456) * 0.5 + 0.5) * 2 + 1;
            
            const sx = cx + arcX * scale;
            const sy = cy - arcY * scale;
            const sr = size * 0.8;
            
            ctx2d.shadowColor = '#ffffff';
            ctx2d.shadowBlur = 8;
            ctx2d.beginPath();
            ctx2d.arc(sx, sy, sr, 0, Math.PI*2);
            ctx2d.fill();
            ctx2d.shadowBlur = 0;
        }
        
        // Foreground Star (61 Cygni) (inside clip)
        const shifts = Array.isArray(starShiftArcsec) ? starShiftArcsec : [starShiftArcsec];
        shifts.forEach(shift => {
            const starX = cx + shift * scale;
            ctx2d.fillStyle = Array.isArray(starShiftArcsec) ? 'rgba(255,170,68,0.7)' : '#ffaa44';
            ctx2d.shadowColor = '#ffaa44';
            ctx2d.shadowBlur = 15;
            ctx2d.beginPath();
            ctx2d.arc(starX, cy, 8, 0, Math.PI*2);
            ctx2d.fill();
            ctx2d.shadowBlur = 0;
        });
        
        // Caliper (Measurement Ruler) only on the Superposition panel (inside clip)
        if (showCaliper) {
            if (inputs.length > 0) {
                const measuredShift = parseFloat(inputs[0].value);
                const bracketWidth = measuredShift * scale;
                const calY = cy + 50;
                
                ctx2d.strokeStyle = col;
                ctx2d.lineWidth = 3;
                
                // I-beam
                ctx2d.beginPath();
                ctx2d.moveTo(cx - bracketWidth/2, calY);
                ctx2d.lineTo(cx + bracketWidth/2, calY);
                ctx2d.moveTo(cx - bracketWidth/2, calY - 15);
                ctx2d.lineTo(cx - bracketWidth/2, calY + 15);
                ctx2d.moveTo(cx + bracketWidth/2, calY - 15);
                ctx2d.lineTo(cx + bracketWidth/2, calY + 15);
                ctx2d.moveTo(cx, calY - 5);
                ctx2d.lineTo(cx, calY + 5);
                ctx2d.stroke();
                
                ctx2d.fillStyle = col;
                ctx2d.font = 'bold 15px "JetBrains Mono", monospace';
                ctx2d.textAlign = 'center';
                ctx2d.fillText("Measured Shift: " + measuredShift.toFixed(2) + '"', cx, calY + 40);
                
                // Also update the telemetry on the sidebar
                const readLabel = document.getElementById('sim-reading');
                if (readLabel) {
                    readLabel.textContent = measuredShift.toFixed(2) + "''";
                    readLabel.style.color = col;
                }
            }
        }

        // Restore context (removing clipping)
        ctx2d.restore();

        // Draw Bounding Box Outline (outside clip for perfect crisp lines)
        ctx2d.strokeStyle = (idx === 2 && isAligned) ? '#00ffaa' : 'rgba(255, 255, 255, 0.2)';
        ctx2d.lineWidth = (idx === 2 && isAligned) ? 3 : 2;
        ctx2d.beginPath();
        ctx2d.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
        ctx2d.stroke();

        // Draw Grid labels (outside clip so they are fully visible below the box)
        for (let i = -4; i <= 4; i++) {
            const x = cx + i * (scale / 5);
            ctx2d.fillStyle = '#8888aa';
            ctx2d.font = '13px "Fira Code", monospace';
            ctx2d.textAlign = 'center';
            ctx2d.textBaseline = 'middle';
            ctx2d.fillText((i * 0.2).toFixed(1) + '"', x, h - 90);
        }
    }
    
    // Panel 0: Jan (Earth at x=10 -> Star projected to x=-10) -> shift = -0.35 arcsec
    drawPanel(0, "January Observation", -0.35);
    
    // Panel 1: Jul (Earth at x=-10 -> Star projected to x=+10) -> shift = +0.35 arcsec
    drawPanel(1, "July Observation", 0.35);
    
    // Panel 2: Superposition
    drawPanel(2, "Superposition", [-0.35, 0.35], true);
}

function draw2DRadarVenus() {
    if (!ctx2d) return;
    const canvas2d = document.getElementById('canvas-2d');
    const w = canvas2d.width;
    const h = canvas2d.height;
    ctx2d.clearRect(0, 0, w, h);
    
    // Deep Space Background
    const gradSky = ctx2d.createLinearGradient(0, 0, w, h);
    gradSky.addColorStop(0, '#050510');
    gradSky.addColorStop(1, '#000000');
    ctx2d.fillStyle = gradSky;
    ctx2d.fillRect(0, 0, w, h);
    drawStars2D(ctx2d, w, h);
    
    // Get Window Time from slider
    let windowTime = 260;
    const inputs = els.controls.querySelectorAll('input');
    if (inputs.length > 0) {
        windowTime = parseFloat(inputs[0].value);
    }
    
    const trueFlight = 276.13;
    const trueOneWay = 138.065;
    const isAligned = Math.abs(windowTime - trueFlight) <= 0.05;
    
    const earthX = w * 0.15;
    const cy = h * 0.5;
    const maxDist = w * 0.7; // Represents trueOneWay one-way travel time
    
    const venusX = earthX + maxDist;
    
    // Animation timing (400s sim mapped to 4s real-time)
    const periodSim = 400; 
    const animScale = 100;
    const currentSimTime = ((Date.now() / 1000) % (periodSim / animScale)) * animScale;
    
    let pulseDist = 0;
    let isOutbound = true;
    let pulseActive = true;
    
    if (currentSimTime <= trueOneWay) {
        pulseDist = maxDist * (currentSimTime / trueOneWay);
    } else if (currentSimTime <= trueFlight) {
        isOutbound = false;
        pulseDist = maxDist * ((trueFlight - currentSimTime) / trueOneWay);
    } else {
        pulseActive = false; // pulse arrived, waiting for next cycle
        pulseDist = 0;
    }
    
    const pulseX = earthX + pulseDist;
    
    // Check if the receive window is currently flashing (duration +/- 15s sim time)
    const isWindowActive = Math.abs(currentSimTime - windowTime) < 15;
    
    // Draw Earth
    ctx2d.shadowBlur = 15;
    ctx2d.shadowColor = '#125dff';
    ctx2d.fillStyle = '#125dff';
    ctx2d.beginPath();
    ctx2d.arc(earthX, cy, 30, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.shadowBlur = 0;
    
    // Draw Earth Antenna
    ctx2d.strokeStyle = '#fff';
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    ctx2d.moveTo(earthX, cy - 30);
    ctx2d.lineTo(earthX + 10, cy - 40);
    ctx2d.lineTo(earthX + 20, cy - 35);
    ctx2d.stroke();
    
    ctx2d.fillStyle = '#fff';
    ctx2d.font = 'bold 16px Outfit';
    ctx2d.textAlign = 'center';
    ctx2d.fillText("EARTH", earthX, cy + 50);
    
    // Draw Venus
    ctx2d.shadowBlur = (currentSimTime > 130 && currentSimTime < 146) ? 30 : 10;
    ctx2d.shadowColor = '#eebb88';
    ctx2d.fillStyle = '#eebb88';
    ctx2d.beginPath();
    ctx2d.arc(venusX, cy, 28, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.shadowBlur = 0;
    
    ctx2d.fillStyle = '#fff';
    ctx2d.fillText("VENUS", venusX, cy + 50);
    
    // Sightline
    ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx2d.setLineDash([5, 5]);
    ctx2d.beginPath();
    ctx2d.moveTo(earthX, cy);
    ctx2d.lineTo(venusX, cy);
    ctx2d.stroke();
    
    // Receive Window Bracket on Earth
    if (isWindowActive) {
        ctx2d.strokeStyle = isAligned ? '#00ffaa' : '#ff3333';
        ctx2d.setLineDash([]);
        ctx2d.lineWidth = 4;
        ctx2d.beginPath();
        ctx2d.arc(earthX, cy, 45, -Math.PI/2, Math.PI/2);
        ctx2d.stroke();
        
        ctx2d.fillStyle = isAligned ? '#00ffaa' : '#ff3333';
        ctx2d.font = 'bold 12px monospace';
        ctx2d.fillText("RECEIVING...", earthX + 45, cy - 50);
    }
    
    // Pulse Path
    if (pulseActive) {
        ctx2d.strokeStyle = isOutbound ? '#00ffaa' : '#00aaff';
        ctx2d.setLineDash([]);
        ctx2d.lineWidth = 2;
        ctx2d.beginPath();
        ctx2d.moveTo(earthX, cy);
        ctx2d.lineTo(pulseX, cy);
        ctx2d.stroke();
        
        // Radar Pulse Arc
        ctx2d.lineWidth = 3;
        ctx2d.beginPath();
        const arcRadius = 15;
        if (isOutbound) {
            ctx2d.arc(pulseX, cy, arcRadius, -Math.PI/3, Math.PI/3);
        } else {
            ctx2d.arc(pulseX, cy, arcRadius, Math.PI - Math.PI/3, Math.PI + Math.PI/3);
        }
        ctx2d.stroke();
    }
    
    // Feedback Text
    ctx2d.fillStyle = isAligned ? '#00ffaa' : '#ffaa00';
    ctx2d.font = 'bold 24px monospace';
    ctx2d.fillText(`Window: ${windowTime.toFixed(2)} s`, w/2, cy - 80);
    
    // Sim Timer
    ctx2d.fillStyle = '#fff';
    ctx2d.font = '16px monospace';
    ctx2d.textAlign = 'left';
    ctx2d.fillText(`T+ ${currentSimTime.toFixed(2)} s`, earthX - 30, cy - 80);
    
    // Telemetry Sync
    const tWin = document.getElementById('sim-radar-window');
    const tState = document.getElementById('sim-radar-state');
    if (tWin) tWin.textContent = `${windowTime.toFixed(2)} s`;
    if (tState) {
        tState.textContent = isAligned ? "LOCKED" : "Searching...";
        tState.style.color = isAligned ? '#00ffaa' : '#ffaa00';
    }
}

function render2DPinholeSun() {
    const canvas2d = document.getElementById('canvas-2d');
    const btnClose2d = document.getElementById('btn-close-2d');
    if (canvas2d) canvas2d.style.display = 'block';
    if (btnClose2d) btnClose2d.style.display = 'none';
    resize2D();
    draw2DPinholeSun();
}

function draw2DPinholeSun() {
    if (!ctx2d) return;
    const canvas2d = document.getElementById('canvas-2d');
    const w = canvas2d.width;
    const h = canvas2d.height;
    ctx2d.clearRect(0, 0, w, h);
    
    // Deep Space/Atmosphere Background
    const gradSky = ctx2d.createLinearGradient(0, 0, w, h);
    gradSky.addColorStop(0, '#050B14');
    gradSky.addColorStop(1, '#1A2A40');
    ctx2d.fillStyle = gradSky;
    ctx2d.fillRect(0, 0, w, h);
    
    // Get d from slider
    let d_caliper = 1.5;
    const inputs = els.controls.querySelectorAll('input');
    if (inputs.length > 0) {
        d_caliper = parseFloat(inputs[0].value);
    }
    
    const L = 100; // Fixed screen distance
    
    // Update Telemetry
    const diaEl = document.getElementById('sim-image-dia');
    if (diaEl) diaEl.textContent = d_caliper.toFixed(2) + " cm";
    
    // Geometry
    const holeX = w * 0.5;
    const cy = h * 0.5;
    const screenX = holeX + w * 0.3; // fixed visual distance for screen
    const screenDistVis = screenX - holeX;
    
    // Proportional triangles:
    const visAngle = 0.15; // rad
    
    // Sun position
    const sunDistVis = holeX; // put sun at x=0
    const sunX = 0;
    const sunRadius = sunDistVis * Math.tan(visAngle);
    
    // True image projection height
    const trueProjRadius = screenDistVis * Math.tan(visAngle);
    
    // Draw Sun with glow
    ctx2d.shadowBlur = 30;
    ctx2d.shadowColor = '#FFAA00';
    const sunGrad = ctx2d.createRadialGradient(sunX, cy, 0, sunX, cy, sunRadius);
    sunGrad.addColorStop(0, '#FFFFFF');
    sunGrad.addColorStop(0.3, '#FFF7A0');
    sunGrad.addColorStop(0.8, '#FFAA00');
    sunGrad.addColorStop(1, '#FF4400');
    
    ctx2d.fillStyle = sunGrad;
    ctx2d.beginPath();
    ctx2d.arc(sunX, cy, sunRadius, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.shadowBlur = 0; // reset
    
    // Draw Sun Diameter Indicator
    ctx2d.strokeStyle = '#00FFCC';
    ctx2d.lineWidth = 2;
    ctx2d.setLineDash([4, 4]);
    ctx2d.beginPath();
    ctx2d.moveTo(sunX + 20, cy - sunRadius);
    ctx2d.lineTo(sunX + 20, cy + sunRadius);
    ctx2d.stroke();
    
    // Sun Diameter Caps
    ctx2d.setLineDash([]);
    ctx2d.beginPath();
    ctx2d.moveTo(sunX + 10, cy - sunRadius);
    ctx2d.lineTo(sunX + 30, cy - sunRadius);
    ctx2d.moveTo(sunX + 10, cy + sunRadius);
    ctx2d.lineTo(sunX + 30, cy + sunRadius);
    ctx2d.stroke();
    
    // Sun Diameter Label
    ctx2d.fillStyle = '#00FFCC';
    ctx2d.font = 'bold 16px Outfit';
    ctx2d.fillText("D_sun", sunX + 40, cy);
    
    // Pinhole Wall (Metallic gradient)
    const wallGrad = ctx2d.createLinearGradient(holeX - 10, 0, holeX + 10, 0);
    wallGrad.addColorStop(0, '#222');
    wallGrad.addColorStop(0.5, '#666');
    wallGrad.addColorStop(1, '#222');
    ctx2d.fillStyle = wallGrad;
    ctx2d.fillRect(holeX - 5, 0, 10, cy - 2); // top half
    ctx2d.fillRect(holeX - 5, cy + 2, 10, h - (cy + 2)); // bottom half
    
    // Screen (Illuminated panel)
    ctx2d.fillStyle = '#EAEAEA';
    ctx2d.shadowBlur = 10;
    ctx2d.shadowColor = '#000';
    ctx2d.fillRect(screenX, cy - 100, 8, 200);
    ctx2d.shadowBlur = 0;
    
    // Projected Image on Screen (Bright)
    ctx2d.fillStyle = '#FFDD44';
    ctx2d.shadowBlur = 15;
    ctx2d.shadowColor = '#FFAA00';
    ctx2d.fillRect(screenX - 2, cy - trueProjRadius, 6, trueProjRadius * 2);
    ctx2d.shadowBlur = 0;
    
    // Light Rays (Glowing beams)
    ctx2d.strokeStyle = 'rgba(255, 220, 100, 0.4)';
    ctx2d.setLineDash([5, 5]);
    ctx2d.lineWidth = 1.5;
    ctx2d.beginPath();
    // Top ray
    ctx2d.moveTo(sunX, cy + sunRadius);
    ctx2d.lineTo(holeX, cy);
    ctx2d.lineTo(screenX, cy - trueProjRadius);
    // Bottom ray
    ctx2d.moveTo(sunX, cy - sunRadius);
    ctx2d.lineTo(holeX, cy);
    ctx2d.lineTo(screenX, cy + trueProjRadius);
    // Center ray
    ctx2d.moveTo(sunX, cy);
    ctx2d.lineTo(screenX, cy);
    ctx2d.stroke();
    
    // Caliper Measurement
    const pxPerCm = (trueProjRadius * 2) / 0.93;
    const caliperHeight = d_caliper * pxPerCm;
    
    // Check if caliper is perfectly matching true size
    const isCorrect = Math.abs(d_caliper - 0.93) < 0.01;
    const color = isCorrect ? '#00FF00' : '#FF3333';
    
    ctx2d.setLineDash([]);
    ctx2d.strokeStyle = color;
    ctx2d.lineWidth = 3;
    ctx2d.beginPath();
    const cx = screenX + 25; // Draw caliper to the right of screen
    ctx2d.moveTo(cx - 15, cy - caliperHeight/2);
    ctx2d.lineTo(cx, cy - caliperHeight/2);
    ctx2d.moveTo(cx - 15, cy + caliperHeight/2);
    ctx2d.lineTo(cx, cy + caliperHeight/2);
    ctx2d.moveTo(cx, cy - caliperHeight/2);
    ctx2d.lineTo(cx, cy + caliperHeight/2);
    ctx2d.stroke();
    
    // Labels
    ctx2d.fillStyle = '#AABBCC';
    ctx2d.font = '14px Outfit';
    ctx2d.fillText("DISTANCE L = 100 cm", (holeX + screenX)/2 - 60, cy + 120);
    
    ctx2d.fillStyle = color;
    ctx2d.font = 'bold 16px Outfit';
    ctx2d.fillText("d = " + d_caliper.toFixed(2) + " cm", cx + 10, cy + 5);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Resize handler
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    
    // Rung 2 Eclipse Animation
    if (currentRung === 2) {
        if (typeof r2Moon !== 'undefined') {
            const time = Date.now() * 0.0005;
            // Moon orbits through the shadow cone
            r2Moon.position.x = -r2Distance; // Fixed behind Earth
            // Oscillate on Z axis to simulate passing through the umbra
            r2Moon.position.z = Math.sin(time) * 3.0; 
            
            // Telemetry and Eclipse Color update
            const telObs = document.getElementById('sim-eclipse-phase');
            const distToCenter = Math.abs(r2Moon.position.z);
            if (distToCenter < r2EarthRadius - r2MoonRadius) {
                if (telObs) {
                    telObs.textContent = "Total Eclipse";
                    telObs.style.color = "#ff5555";
                }
                r2Moon.material.color.setHex(0x552222); // Red-grey during total eclipse
            } else if (distToCenter < r2EarthRadius + r2MoonRadius) {
                if (telObs) {
                    telObs.textContent = "Partial Eclipse";
                    telObs.style.color = "#ffaa00";
                }
                r2Moon.material.color.setHex(0xaa8888); // Dimming during partial
            } else {
                if (telObs) {
                    telObs.textContent = "No Eclipse";
                    telObs.style.color = "#ffffff";
                }
                r2Moon.material.color.setHex(0xdddddd); // Bright white outside shadow
            }
        }
    } // <-- Close currentRung === 2 block
    
    // Rung 3 Geometric Animation (2D telemetry & 3D update)
    if (currentRung === 3) {
        const inputs = els.controls.querySelectorAll('input');
        if (inputs.length > 0) {
            const coinDist = parseFloat(inputs[0].value);
            
            // Map coin distance to angle
            const thetaRad = 2 * Math.atan(2.0 / (2 * coinDist));
            const thetaDeg = thetaRad * 180 / Math.PI;
            
            const telAng = document.getElementById('sim-angular-size');
            if (telAng) telAng.textContent = `${thetaDeg.toFixed(2)}°`;
            
            // Update the geometric cone radius based on theta
            if (typeof window.r3Cone !== 'undefined' && typeof window.r3SightlineGeo !== 'undefined') {
                const distance = 20;
                // Calculate radius at distance 20 to match the half-angle
                const radiusAt20 = distance * Math.tan(thetaRad / 2);
                
                // Update Cone geometry scaling
                // The cone has default radius 0.15, so scaleFactor determines the visual spread
                const scaleFactor = radiusAt20 / 0.15;
                window.r3Cone.scale.set(scaleFactor, 1, scaleFactor);
                
                // Update Sightlines
                const positions = window.r3SightlineGeo.attributes.position.array;
                // Top sightline
                positions[1] = radiusAt20;
                // Bottom sightline
                positions[7] = -radiusAt20;
                window.r3SightlineGeo.attributes.position.needsUpdate = true;
                
                // Update Label Text
                if (typeof window.r3LabelTheta !== 'undefined') {
                    const canvas = document.createElement('canvas');
                    canvas.width = 512; canvas.height = 128;
                    const ctx = canvas.getContext('2d');
                    ctx.font = `bold 48px "Outfit", sans-serif`;
                    ctx.fillStyle = "#ffaa00";
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`θ = ${thetaDeg.toFixed(2)}°`, 256, 64);
                    
                    if (window.r3LabelTheta.material.map) window.r3LabelTheta.material.map.dispose();
                    window.r3LabelTheta.material.map = new THREE.CanvasTexture(canvas);
                    window.r3LabelTheta.material.needsUpdate = true;
                }
            }
        }
    }
    
    // Rung 4 Geometric Animation
    if (currentRung === 4) {
        const inputs = els.controls.querySelectorAll('input');
        if (inputs.length > 0) {
            const phiDeg = parseFloat(inputs[0].value);
            const phiRad = phiDeg * Math.PI / 180;
            
            const telPhi = document.getElementById('sim-phi');
            if (telPhi) telPhi.textContent = `${phiDeg.toFixed(1)}°`;
            
            // Calculate Sun position
            // Earth is (0,0,0). Moon is (0,10,0). Angle at Earth is phi. Angle at Moon is 90 deg.
            // Sun is at (X, 10, 0)
            // tan(phi) = X / 10 => X = 10 * tan(phi)
            const sunX = 10 * Math.tan(phiRad);
            
            if (typeof window.r4Sun !== 'undefined') {
                window.r4Sun.position.set(sunX, 10, 0);
                
                window.r4MoonSunLine.geometry.setFromPoints([new THREE.Vector3(0,10,0), new THREE.Vector3(sunX, 10, 0)]);
                window.r4MoonSunLine.computeLineDistances();
                
                window.r4EarthSunLine.geometry.setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(sunX, 10, 0)]);
                
                window.r4LabelSunD.position.set(sunX / 2, 5, 0);
                
                // Pan camera focus to stay centered between Earth and Sun, but don't force zoom distance!
                const targetX = sunX / 2;
                const deltaX = (targetX - controls.target.x) * 0.1;
                controls.target.x += deltaX;
                camera.position.x += deltaX;
                
                const deltaY = (5 - controls.target.y) * 0.1;
                controls.target.y += deltaY;
                camera.position.y += deltaY;
            }
        }
    } else if (currentRung === 6) {
        const inputs = els.controls.querySelectorAll('input');
        if (inputs.length > 0) {
            const thetaArcsec = parseFloat(inputs[0].value);
            const isAligned = Math.abs(thetaArcsec - 12.48) < 0.02;
            
            // Telemetry updates for 3D
            const dMarsEl = document.getElementById('sim-mars-dist');
            const dMarsAuEl = document.getElementById('sim-mars-au');
            if (dMarsEl) {
                // Direct call to the core calculation to guarantee they match perfectly
                const dMars = RUNGS[5].calculate({ parallax_angle: thetaArcsec });
                dMarsEl.textContent = `${Math.round(dMars).toLocaleString()} km`;
                dMarsEl.style.color = isAligned ? '#00ffaa' : '#ffffff';
                
                if (dMarsAuEl) {
                    const dAu = dMars / 149597870;
                    dMarsAuEl.textContent = `${dAu.toFixed(4)} AU`;
                    dMarsAuEl.style.color = isAligned ? '#00ffaa' : '#ffffff';
                }
            }
            
            if (typeof window.rmarsSight1Geo !== 'undefined' && typeof window.rmarsSight2Geo !== 'undefined') {
                // To keep the lines perfectly straight, Mars physically moves closer/further as theta changes.
                // At average distance theta=12.48, Mars is at X=30.
                const xMars = 30 * (12.48 / thetaArcsec);
                
                if (typeof window.rmarsMars !== 'undefined') {
                    window.rmarsMars.position.set(xMars, 0, 0);
                    if (typeof window.rmarsLabelMars !== 'undefined') {
                        window.rmarsLabelMars.position.set(xMars, 2, 0);
                    }
                }
                
                // Project sightlines perfectly from realistic coordinates
                const pParis = window.rmarsParisPos || new THREE.Vector3(0.66, 1.50, 1.14);
                const pGuiana = window.rmarsGuianaPos || new THREE.Vector3(1.00, 0.17, 1.73);

                const t1 = (100 - pParis.x) / (xMars - pParis.x);
                const pProj1 = new THREE.Vector3(
                    100,
                    pParis.y + t1 * (0 - pParis.y),
                    pParis.z + t1 * (0 - pParis.z)
                );
                
                const t2 = (100 - pGuiana.x) / (xMars - pGuiana.x);
                const pProj2 = new THREE.Vector3(
                    100,
                    pGuiana.y + t2 * (0 - pGuiana.y),
                    pGuiana.z + t2 * (0 - pGuiana.z)
                );
                
                // Update Sightlines
                window.rmarsSight1Geo.setFromPoints([pParis, pProj1]);
                window.rmarsSight2Geo.setFromPoints([pGuiana, pProj2]);
                window.rmarsSightMat.color.setHex(isAligned ? 0x00ffaa : 0x00aaff);
                
                // Update Ruler
                if (typeof window.rmarsRulerGeo !== 'undefined') {
                    window.rmarsRulerGeo.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(xMars, 0, 0)]);
                    if (window.rmarsRuler) window.rmarsRuler.computeLineDistances();
                    
                    if (typeof window.rmarsLabelDist !== 'undefined') {
                        window.rmarsLabelDist.position.set(xMars / 2, -1.5, 0);
                        const dMars = RUNGS[5].calculate({ parallax_angle: thetaArcsec });
                        let dStr = Math.round(dMars).toLocaleString();
                        
                        // Update canvas texture for Ruler
                        const canvas = document.createElement('canvas');
                        canvas.width = 600; canvas.height = 128;
                        const ctx = canvas.getContext('2d');
                        ctx.font = `bold 48px "Outfit", sans-serif`;
                        ctx.fillStyle = "#ffffff";
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(`D = ${dStr} km`, 300, 64);
                        if (window.rmarsLabelDist.material.map) window.rmarsLabelDist.material.map.dispose();
                        window.rmarsLabelDist.material.map = new THREE.CanvasTexture(canvas);
                        window.rmarsLabelDist.material.needsUpdate = true;
                    }
                }
                
                // Update Angle Arc at Mars
                if (typeof window.rmarsAngleGeo !== 'undefined') {
                    const R = 8; // arc radius
                    const delta = Math.atan2(2, xMars);
                    const arcPoints = [];
                    for (let i = 0; i <= 10; i++) {
                        const t = i / 10;
                        const a = Math.PI - delta + (2 * delta) * t;
                        arcPoints.push(new THREE.Vector3(xMars + R * Math.cos(a), R * Math.sin(a), 0));
                    }
                    window.rmarsAngleGeo.setFromPoints(arcPoints);
                    
                    if (typeof window.rmarsLabelTheta !== 'undefined') {
                        window.rmarsLabelTheta.position.set(xMars - R - 3, 0, 0);
                        
                        // Update canvas texture for Theta
                        const canvas = document.createElement('canvas');
                        canvas.width = 512; canvas.height = 128;
                        const ctx = canvas.getContext('2d');
                        ctx.font = `bold 64px "Outfit", sans-serif`;
                        ctx.fillStyle = isAligned ? "#00ffaa" : "#00aaff";
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(`θ = ${thetaArcsec}"`, 256, 64);
                        if (window.rmarsLabelTheta.material.map) window.rmarsLabelTheta.material.map.dispose();
                        window.rmarsLabelTheta.material.map = new THREE.CanvasTexture(canvas);
                        window.rmarsLabelTheta.material.needsUpdate = true;
                    }
                }
                
                if (typeof window.rmarsProj1 !== 'undefined') {
                    window.rmarsProj1.position.copy(pProj1);
                    window.rmarsProj2.position.copy(pProj2);
                    window.rmarsProj1.material.color.setHex(isAligned ? 0x00ffaa : 0xff4422);
                    window.rmarsProj2.material.color.setHex(isAligned ? 0x00ffaa : 0xff4422);
                }
            }
        }
    } else if (currentRung === 7) {
        const inputs = els.controls.querySelectorAll('input');
        if (inputs.length > 0) {
            const shiftArcsec = parseFloat(inputs[0].value);
            const trueShift = 40.0;
            const isAligned = Math.abs(shiftArcsec - trueShift) <= 0.2;
            
            // Animation loop (15s period)
            const tAnim = (Date.now() % 15000) / 15000;
            // Venus Z goes from -60 to 60 to ensure it clears the sun
            const venusZ = -60 + tAnim * 120;
            
            // Earth observers are at Y = 2 and Y = -2
            if (typeof window.t7Venus !== 'undefined') {
                window.t7Venus.position.set(40, 0, venusZ);
            }
            
            // Update Sightlines using true Sphere Intersection
            if (typeof window.t7SightNGeo !== 'undefined' && typeof window.t7ProjN !== 'undefined') {
                const pNorth = new THREE.Vector3(0, 2, 0);
                const pSouth = new THREE.Vector3(0, -2, 0);
                const vPos = new THREE.Vector3(40, 0, venusZ);
                
                // Define the Sun sphere physically
                const sunSphere = new THREE.Sphere(new THREE.Vector3(140, 0, 0), 40);
                
                // Project from North
                const dirN = new THREE.Vector3().subVectors(vPos, pNorth).normalize();
                const rayN = new THREE.Ray(pNorth, dirN);
                const proj1 = new THREE.Vector3();
                rayN.intersectSphere(sunSphere, proj1);
                
                // Project from South
                const dirS = new THREE.Vector3().subVectors(vPos, pSouth).normalize();
                const rayS = new THREE.Ray(pSouth, dirS);
                const proj2 = new THREE.Vector3();
                rayS.intersectSphere(sunSphere, proj2);
                
                // If they don't intersect, default to a plane at X=140 (center of sun) so it doesn't break
                // This plane perfectly joins the sphere's equator, eliminating all jitter!
                if (!proj1.x) proj1.copy(new THREE.Vector3(140, pNorth.y + (140 - pNorth.x) / dirN.x * dirN.y, pNorth.z + (140 - pNorth.x) / dirN.x * dirN.z));
                if (!proj2.x) proj2.copy(new THREE.Vector3(140, pSouth.y + (140 - pSouth.x) / dirS.x * dirS.y, pSouth.z + (140 - pSouth.x) / dirS.x * dirS.z));
                
                window.t7SightNGeo.setFromPoints([pNorth, proj1]);
                window.t7SightSGeo.setFromPoints([pSouth, proj2]);
                
                // Offset projections slightly in front of the surface to prevent Z-fighting
                // If hitting the plane (X >= 140), normal is straight towards Earth (-1, 0, 0)
                const surfN = proj1.x >= 139.9 ? new THREE.Vector3(-1, 0, 0) : new THREE.Vector3().subVectors(proj1, sunSphere.center).normalize();
                const surfS = proj2.x >= 139.9 ? new THREE.Vector3(-1, 0, 0) : new THREE.Vector3().subVectors(proj2, sunSphere.center).normalize();
                
                // Keep shadow size constant when projecting onto the fallback plane
                const scaleN = proj1.x >= 139.9 ? 1.5 : 1.0;
                const scaleS = proj2.x >= 139.9 ? 1.5 : 1.0;
                window.t7ProjN.scale.set(scaleN, scaleN, 1);
                window.t7ProjS.scale.set(scaleS, scaleS, 1);
                
                window.t7ProjN.position.copy(proj1).add(surfN.multiplyScalar(0.5));
                window.t7ProjS.position.copy(proj2).add(surfS.multiplyScalar(0.5));
                
                // Orient projection shadows to face along the normal
                window.t7ProjN.lookAt(new THREE.Vector3().copy(window.t7ProjN.position).add(surfN));
                window.t7ProjS.lookAt(new THREE.Vector3().copy(window.t7ProjS.position).add(surfS));
                
                // Update Angle Wedge Geometry
                if (typeof window.t7AngleWedgeGeo !== 'undefined') {
                    const vertices = new Float32Array([
                        vPos.x, vPos.y, vPos.z,
                        proj1.x, proj1.y, proj1.z,
                        proj2.x, proj2.y, proj2.z,
                        
                        vPos.x, vPos.y, vPos.z,
                        pNorth.x, pNorth.y, pNorth.z,
                        pSouth.x, pSouth.y, pSouth.z
                    ]);
                    window.t7AngleWedgeGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                }
                
                // Measurement Caliper (Driven by Slider)
                if (typeof window.t7CalGeo !== 'undefined') {
                    const trueSepY = proj1.y - proj2.y; // Should be ~negative since North hits lower
                    const sepCenterY = (proj1.y + proj2.y) / 2;
                    
                    // True shift is 40.0 arcsec, map this to trueSepY
                    // User's measured separation:
                    const measuredSepY = (shiftArcsec / 40.0) * Math.abs(trueSepY);
                    
                    const mY1 = sepCenterY - measuredSepY / 2; // North side
                    const mY2 = sepCenterY + measuredSepY / 2; // South side
                    
                    // Tracking Caliper (I-beam shape) that follows Venus's shadow
                    const zMid = proj1.z; // Track horizontally
                    
                    const mTarget1 = new THREE.Vector3(140, mY1, zMid);
                    const mTarget2 = new THREE.Vector3(140, mY2, zMid);
                    const mRay1 = new THREE.Ray(new THREE.Vector3(0,0,0), new THREE.Vector3().copy(mTarget1).normalize());
                    const mRay2 = new THREE.Ray(new THREE.Vector3(0,0,0), new THREE.Vector3().copy(mTarget2).normalize());
                    const mHit1 = new THREE.Vector3();
                    const mHit2 = new THREE.Vector3();
                    mRay1.intersectSphere(sunSphere, mHit1);
                    mRay2.intersectSphere(sunSphere, mHit2);
                    
                    if (!mHit1.x) mHit1.copy(mTarget1);
                    if (!mHit2.x) mHit2.copy(mTarget2);
                    
                    // 3D Caliper Bracket on Sun surface (I-beam shape)
                    const xOff1 = mHit1.x - 2.5;
                    const xOff2 = mHit2.x - 2.5;
                    
                    const zSpan = 4; // Width of horizontal ticks
                    
                    const p1L = new THREE.Vector3(xOff1, mY1, zMid - zSpan);
                    const p1R = new THREE.Vector3(xOff1, mY1, zMid + zSpan);
                    
                    const p2L = new THREE.Vector3(xOff2, mY2, zMid - zSpan);
                    const p2R = new THREE.Vector3(xOff2, mY2, zMid + zSpan);
                    
                    const p1M = new THREE.Vector3(xOff1, mY1, zMid);
                    const p2M = new THREE.Vector3(xOff2, mY2, zMid);
                    
                    window.t7CalGeo.setFromPoints([
                        p1L, p1R,   // Top tick
                        p2L, p2R,   // Bottom tick
                        p1M, p2M    // Main vertical
                    ]);
                    
                    // High-contrast white when unaligned to never blend with sun
                    const colHex = isAligned ? 0x00ffaa : 0xffffff; 
                    window.t7Caliper.material.color.setHex(colHex);
                }
                
                // Telemetry Update for 3D
                const canvas2d = document.getElementById('canvas-2d');
                if (canvas2d && canvas2d.style.display === 'none') {
                    const tShift = document.getElementById('sim-transit-shift');
                    const tAu = document.getElementById('sim-transit-au');
                    if (tShift) tShift.textContent = `${shiftArcsec.toFixed(1)}"`;
                    if (tAu) {
                        const auCalc = 149597870 * (40.0 / shiftArcsec);
                        tAu.textContent = `${(auCalc / 1000000).toFixed(1)} M km`;
                        tAu.style.color = isAligned ? '#00ffaa' : '#ffffff';
                    }
                }
            }
        }
    } else if (currentRung === 11) {
        const inputs = els.controls.querySelectorAll('input');
        if (inputs.length > 0) {
            const windowTime = parseFloat(inputs[0].value);
            const trueFlight = 276.13;
            const trueOneWay = 138.065;
            const isAligned = Math.abs(windowTime - trueFlight) <= 0.05;
            
            // Animation timing (400s sim mapped to 4s real-time)
            const periodSim = 400; 
            const animScale = 100;
            const currentSimTime = ((Date.now() / 1000) % (periodSim / animScale)) * animScale;
            
            let pulseDist = 0;
            let isOutbound = true;
            let pulseActive = true;
            
            // Venus is physically located at X=40 in the scene
            // The pulse should reach X=40 exactly at T=trueOneWay
            const venusDist = 40; 
            
            if (currentSimTime <= trueOneWay) {
                pulseDist = venusDist * (currentSimTime / trueOneWay);
            } else if (currentSimTime <= trueFlight) {
                isOutbound = false;
                pulseDist = venusDist * ((trueFlight - currentSimTime) / trueOneWay);
            } else {
                pulseActive = false; // pulse arrived
                pulseDist = 0;
            }
            
            if (typeof window.r5Pulse !== 'undefined') {
                if (pulseActive) {
                    window.r5Pulse.visible = true;
                    window.r5Pulse.position.set(pulseDist, 0, 0);
                    // Color based on outbound or return
                    window.r5Pulse.material.color.setHex(isOutbound ? 0x00ffaa : 0x00aaff);
                } else {
                    window.r5Pulse.visible = false;
                }
            }
            
            // Highlight Earth if receiving
            const isWindowActive = Math.abs(currentSimTime - windowTime) < 15;
            if (typeof window.r5Earth !== 'undefined') {
                if (isWindowActive) {
                    window.r5Earth.material.emissive.setHex(isAligned ? 0x00ffaa : 0xff3333);
                } else {
                    window.r5Earth.material.emissive.setHex(0x000000);
                }
            }
            
            // Flash Venus when hit
            if (typeof window.r5Venus !== 'undefined') {
                if (Math.abs(currentSimTime - trueOneWay) < 8) {
                    window.r5Venus.material.emissive.setHex(0x553311);
                } else {
                    window.r5Venus.material.emissive.setHex(0x000000);
                }
            }
            
            // Telemetry Sync (Only in 3D since 2D has its own)
            const canvas2d = document.getElementById('canvas-2d');
            if (canvas2d && canvas2d.style.display === 'none') {
                const tWin = document.getElementById('sim-radar-window');
                const tState = document.getElementById('sim-radar-state');
                if (tWin) tWin.textContent = `${windowTime.toFixed(2)} s`;
                if (tState) {
                    tState.textContent = isAligned ? "LOCKED" : "Searching...";
                    tState.style.color = isAligned ? '#00ffaa' : '#ffaa00';
                }
            }
        }
    } else if (currentRung === 8) {
        const inputs = els.controls.querySelectorAll('input');
        if (inputs.length > 0) {
            const shiftArcsec = parseFloat(inputs[0].value);
            const isAligned = Math.abs(shiftArcsec - 0.7) <= 0.05;
            const col = isAligned ? 0x00ffaa : 0xff3333;
            const colStr = isAligned ? "#00ffaa" : "#ff3333";
            
            // 1. Update projection dot colors
            if (window.stellarJanProj) window.stellarJanProj.material.color.setHex(isAligned ? 0x00ffaa : 0xff0000);
            if (window.stellarJulProj) window.stellarJulProj.material.color.setHex(isAligned ? 0x00ffaa : 0xff0000);
            
            // 2. Draw dynamic ruler directly between the two red projections (at Y=0, Z=-199.5)
            if (window.stellarCaliper) {
                const width = Math.max(0.1, (shiftArcsec / 0.7) * 20); // 0.7" shift maps to 20 units in 3D
                const halfW = width / 2;
                const y = 0; // Exactly at Y=0 (directly between projection dots)
                const z = -199.5;
                const thick = 0.5; // visible thickness
                
                if (window.stellarCalH && window.stellarCalL && window.stellarCalR) {
                    // Horizontal bar
                    window.stellarCalH.position.set(0, y, z);
                    window.stellarCalH.scale.set(width, thick, 1);
                    
                    // Left vertical tick
                    window.stellarCalL.position.set(-halfW, y, z);
                    window.stellarCalL.scale.set(thick, 1, 1); // height 4 (scale.y=1 keeps geometry height 4)
                    
                    // Right vertical tick
                    window.stellarCalR.position.set(halfW, y, z);
                    window.stellarCalR.scale.set(thick, 1, 1); // height 4
                    
                    window.stellarCaliperMat.color.setHex(col);
                }
            }
            
            // 3. Update dynamic caliper label text and position it above the ruler
            if (window.stellarLblCaliper) {
                window.stellarLblCaliper.position.set(0, 5, -199.5); // Placed above Y=0
                
                const canvas = document.createElement('canvas');
                canvas.width = 512; canvas.height = 128;
                const ctx = canvas.getContext('2d');
                ctx.font = `bold 64px "Outfit", sans-serif`;
                
                // Text shadow
                ctx.shadowColor = "rgba(0,0,0,0.8)";
                ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                
                ctx.fillStyle = colStr;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`Shift: ${shiftArcsec.toFixed(2)}"`, 256, 64);
                
                if (window.stellarLblCaliper.material.map) window.stellarLblCaliper.material.map.dispose();
                window.stellarLblCaliper.material.map = new THREE.CanvasTexture(canvas);
                window.stellarLblCaliper.material.needsUpdate = true;
            }
            
            // 4. Update parallax angle arc at the star (Z=-100)
            if (window.stellarAngleArc) {
                // Approximate circular arc from x=0 (Sun-star axis) to x=1 (January sightline)
                const arcPts = [];
                for(let i=0; i<=10; i++) {
                    const t = i/10;
                    const x = 1.0 * t; // goes from 0 to 1
                    const zOff = 10 * Math.cos(Math.asin(x/10)); // radius 10, x goes 0 to 1
                    arcPts.push(new THREE.Vector3(x, 0, -100 + zOff));
                }
                window.stellarAngleArc.geometry.setFromPoints(arcPts);
                window.stellarAngleArc.material.color.setHex(col);
            }
            
            // 5. Update parallax angle label text and position it next to the arc
            if (window.stellarLblTheta) {
                window.stellarLblTheta.position.set(2.5, 4, -85); // shifted right next to the p arc
                
                const p = shiftArcsec / 2; // parallax is half the shift
                const canvas = document.createElement('canvas');
                canvas.width = 512; canvas.height = 128;
                const ctx = canvas.getContext('2d');
                ctx.font = `bold 64px "Outfit", sans-serif`;
                
                // Text shadow
                ctx.shadowColor = "rgba(0,0,0,0.8)";
                ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                
                ctx.fillStyle = colStr;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`p = ${p.toFixed(2)}"`, 256, 64);
                
                if (window.stellarLblTheta.material.map) window.stellarLblTheta.material.map.dispose();
                window.stellarLblTheta.material.map = new THREE.CanvasTexture(canvas);
                window.stellarLblTheta.material.needsUpdate = true;
            }
            
            // 6. Also update the telemetry on the sidebar
            const readLabel = document.getElementById('sim-reading');
            if (readLabel) {
                readLabel.textContent = shiftArcsec.toFixed(2) + "''";
                readLabel.style.color = colStr;
            }
        }
    } else if (currentRung === 5) {
        const inputs = els.controls.querySelectorAll('input');
        if (inputs.length > 0) {
            const d_caliper = parseFloat(inputs[0].value);
            if (typeof window.r6Screen !== 'undefined' && typeof window.r6Proj !== 'undefined') {
                const dist = 20; // Fixed screen distance
                window.r6Screen.position.x = dist;
                window.r6Proj.position.x = dist;
                
                // Scale projection circle based on actual true size
                const L = 100;
                const true_d = L * 0.0093;
                const scale = Math.max(0.1, true_d * 0.5);
                window.r6Proj.scale.set(scale, 1, scale);
                
                // Update rays (static now)
                if (typeof window.r6Rays !== 'undefined') {
                    const pts = [
                        new THREE.Vector3(-150, 15, 0), new THREE.Vector3(0,0,0),
                        new THREE.Vector3(0,0,0), new THREE.Vector3(dist, -scale, 0),
                        new THREE.Vector3(-150, -15, 0), new THREE.Vector3(0,0,0),
                        new THREE.Vector3(0,0,0), new THREE.Vector3(dist, scale, 0)
                    ];
                    window.r6Rays.geometry.setFromPoints(pts);
                }
                
                // Add/scale 3D caliper (red box)
                if (typeof window.r6Caliper === 'undefined') {
                    const calGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1));
                    const calMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
                    window.r6Caliper = new THREE.LineSegments(calGeo, calMat);
                    window.r6Caliper.rotation.y = Math.PI / 2;
                    window.r6Caliper.position.x = dist + 0.05; // slightly behind screen so visible from back too
                    pinholeGroup.add(window.r6Caliper);
                }
                
                // Scale caliper based on user d
                // true_d (0.93) maps to `scale * 2` height in 3D scene.
                // so visual_d = (d_caliper / 0.93) * (scale * 2)
                const vis_d = (d_caliper / 0.93) * (scale * 2);
                window.r6Caliper.scale.set(vis_d, vis_d, 1);
                
                const isCorrect = Math.abs(d_caliper - 0.93) < 0.01;
                window.r6Caliper.material.color.setHex(isCorrect ? 0x00ff00 : 0xff0000);
            }
        }
    } else if (currentRung === 9) {
        const inputs = els.controls.querySelectorAll('input');
        if (inputs.length > 0) {
            const distMod = parseFloat(inputs[0].value);
            const distPc = Math.pow(10, (distMod + 5) / 5);
            
            // Map distance along realistic off-axis sightline vector in Taurus
            // Hyades: RA 4h27m, Dec +15.87d => unit vector (0.05, -0.04, -0.998)
            // Pleiades: RA 3h47m, Dec +24.12d => unit vector (-0.14, 0.10, -0.985)
            const xVal = distPc * -0.04;
            const yVal = distPc * 0.03;
            const zVal = distPc * -0.085;
            
            const isFitCorrect = Math.abs(distMod - 5.67) < 0.1;
            
            if (pleiades3DGroup) {
                pleiades3DGroup.position.set(xVal, yVal, zVal);
                pleiades3DGroup.rotation.y += 0.001;
            }
            if (window.pleiadesLabel) {
                updateStellarLabel(window.pleiadesLabel, `Pleiades (${Math.round(distPc)} pc)`, "#55aaff", 44);
            }
            
            if (window.pleiadesLine) {
                const pts = [
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(xVal, yVal, zVal)
                ];
                window.pleiadesLine.geometry.setFromPoints(pts);
                window.pleiadesLine.computeLineDistances();
                
                if (isFitCorrect) {
                    window.pleiadesLine.material.color.setHex(0x00ffaa);
                    window.pleiadesLine.material.opacity = 0.8;
                } else {
                    window.pleiadesLine.material.color.setHex(0x55aaff);
                    window.pleiadesLine.material.opacity = 0.4;
                }
            }
            
            if (r9MilkyWayDisk) {
                r9MilkyWayDisk.rotation.y += 0.0003;
            }
            
            if (window.r9ProjLines && window.pleiadesPoints) {
                const positions = [];
                const pleiadesGeo = window.pleiadesPoints.geometry;
                const posAttr = pleiadesGeo.attributes.position;
                const starCount = posAttr.count;
                
                for (let i = 0; i < starCount; i++) {
                    const px = posAttr.getX(i);
                    const py = posAttr.getY(i);
                    const pz = posAttr.getZ(i);
                    
                    const sx = xVal + px;
                    const sy = yVal + py;
                    const sz = zVal + pz;
                    
                    // radial distance from Earth
                    const r = Math.sqrt(sx*sx + sy*sy + sz*sz);
                    // project onto the 10 pc standard absolute magnitude reference sphere (r = 1.0)
                    const px_proj = sx / r;
                    const py_proj = sy / r;
                    const pz_proj = sz / r;
                    
                    positions.push(sx, sy, sz);
                    positions.push(px_proj, py_proj, pz_proj);
                }
                
                window.r9ProjLines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                window.r9ProjLines.geometry.attributes.position.needsUpdate = true;
                
                if (isFitCorrect) {
                    window.r9ProjLines.material.color.setHex(0x00ffaa);
                    window.r9ProjLines.material.opacity = 0.35;
                } else {
                    window.r9ProjLines.material.color.setHex(0x55aaff);
                    window.r9ProjLines.material.opacity = 0.15;
                }
            }
            
            if (window.r9Wavefronts && window.r9Wavefronts.length > 0) {
                window.r9Wavefronts.forEach(w => {
                    w.progress += 0.004;
                    if (w.progress > 1.0) w.progress = 0.0;
                    
                    // Propagate wavefronts along the off-axis sightline vector
                    w.mesh.position.set(xVal * (1.0 - w.progress), yVal * (1.0 - w.progress), zVal * (1.0 - w.progress));
                    w.mesh.lookAt(new THREE.Vector3(0, 0, 0));
                    
                    const scale = 1.0 + w.progress * 12.0;
                    w.mesh.scale.set(scale, scale, 1.0);
                    
                    const intensity = 1.0 / Math.pow(1.0 + w.progress * 3.5, 2);
                    
                    if (isFitCorrect) {
                        w.mesh.material.color.setHex(0x00ffaa);
                        w.mesh.material.opacity = intensity * 0.45;
                    } else {
                        w.mesh.material.color.setHex(0x55aaff);
                        w.mesh.material.opacity = intensity * 0.20;
                    }
                });
            }
            
            if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
                if (typeof window.r9LastStep === 'undefined') {
                    window.r9LastStep = -1;
                    window.r9CamTransitionFrames = 0;
                }
                
                if (window.r9LastStep !== hrState.step) {
                    window.r9LastStep = hrState.step;
                    window.r9CamTransitionFrames = 90;
                }
                
                let targetCamPos = new THREE.Vector3(15, 8, 5);
                let targetLookAt = new THREE.Vector3(0, 0, -6);
                
                if (hrState.step === 1) {
                    targetCamPos.set(10.24, 5.0, -2.69);
                    targetLookAt.set(0.24, -0.19, -4.69);
                } else if (hrState.step === 2) {
                    targetCamPos.set(xVal + 22.0, yVal + 9.0, zVal + 5.0);
                    targetLookAt.set(xVal, yVal, zVal);
                } else if (hrState.step >= 3) {
                    targetCamPos.set(xVal + 26.0, yVal + 4.0, zVal);
                    targetLookAt.set(xVal, yVal, zVal);
                }
                
                if (window.r9CamTransitionFrames > 0) {
                    window.r9CamTransitionFrames--;
                    camera.position.lerp(targetCamPos, 0.05);
                    controls.target.lerp(targetLookAt, 0.05);
                } else if (hrState.step >= 3) {
                    const deltaX = xVal - controls.target.x;
                    const deltaY = yVal - controls.target.y;
                    const deltaZ = zVal - controls.target.z;
                    controls.target.set(xVal, yVal, zVal);
                    camera.position.x += deltaX;
                    camera.position.y += deltaY;
                    camera.position.z += deltaZ;
                }
            }
            
            // Performance-optimized dynamic text texture update
            if (window.pleiadesLabel) {
                const roundedDist = Math.round(distPc);
                if (typeof window.lastPleiadesDistPc === 'undefined' || window.lastPleiadesDistPc !== roundedDist) {
                    window.lastPleiadesDistPc = roundedDist;
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = 512; canvas.height = 128;
                    const ctx = canvas.getContext('2d');
                    ctx.font = `bold 44px "Outfit", sans-serif`;
                    
                    ctx.shadowColor = "rgba(0,0,0,0.8)";
                    ctx.shadowBlur = 8;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    
                    ctx.fillStyle = "#55aaff";
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`Pleiades (${roundedDist} pc)`, 256, 64);
                    
                    if (window.pleiadesLabel.material.map) window.pleiadesLabel.material.map.dispose();
                    window.pleiadesLabel.material.map = new THREE.CanvasTexture(canvas);
                    window.pleiadesLabel.material.needsUpdate = true;
                }
            }
        }
        if (hyades3DGroup) {
            hyades3DGroup.rotation.y += 0.0008;
        }
    } else if (currentRung === 10) {
        // Rotate Andromeda galaxy representation
        if (window.r9AndromedaPoints) {
            window.r9AndromedaPoints.rotation.z += 0.001;
        }
        
        // Pulsate stars
        const now = Date.now();
        
        // Star A (P = 5s)
        if (window.r9StarA) {
            const info = cepheidData['A'];
            const phase = ((now - info.phaseOffset) % (info.period * 1000)) / (info.period * 1000);
            const factor = getCepheidFactor('A', phase);
            const scale = 1.0 + 0.3 * factor;
            window.r9StarA.scale.set(scale, scale, scale);
            window.r9StarA.material.opacity = 0.7 + 0.3 * factor;
        }
        
        // Star B (P = 15s)
        if (window.r9StarB) {
            const info = cepheidData['B'];
            const phase = ((now - info.phaseOffset) % (info.period * 1000)) / (info.period * 1000);
            const factor = getCepheidFactor('B', phase);
            const scale = 1.0 + 0.25 * factor;
            window.r9StarB.scale.set(scale, scale, scale);
            window.r9StarB.material.opacity = 0.7 + 0.3 * factor;
        }
        
        // Star C (P = 35s)
        if (window.r9StarC) {
            const info = cepheidData['C'];
            const phase = ((now - info.phaseOffset) % (info.period * 1000)) / (info.period * 1000);
            const factor = getCepheidFactor('C', phase);
            const scale = 1.0 + 0.2 * factor;
            window.r9StarC.scale.set(scale, scale, scale);
            window.r9StarC.material.opacity = 0.7 + 0.3 * factor;
        }
        
        // Star V1 (P = 31.4s)
        if (window.r9StarV1) {
            const info = cepheidData['V1'];
            const phase = ((now - info.phaseOffset) % (info.period * 1000)) / (info.period * 1000);
            const factor = getCepheidFactor('V1', phase);
            const scale = 1.0 + 0.35 * factor;
            window.r9StarV1.scale.set(scale, scale, scale);
            window.r9StarV1.material.opacity = 0.7 + 0.3 * factor;
        }

        // Create 3D selection focus ring if it doesn't exist
        if (typeof window.r9SelectionRing === 'undefined' && typeof THREE !== 'undefined' && typeof galaxiesGroup !== 'undefined') {
            const ringGeo = new THREE.TorusGeometry(1.0, 0.08, 8, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0.8 });
            window.r9SelectionRing = new THREE.Mesh(ringGeo, ringMat);
            galaxiesGroup.add(window.r9SelectionRing);
        }
        
        if (window.r9SelectionRing) {
            let activeStar = null;
            let targetRadius = 1.0;
            if (r9State.selectedStar === 'A' && window.r9StarA) { activeStar = window.r9StarA; targetRadius = 1.6; }
            else if (r9State.selectedStar === 'B' && window.r9StarB) { activeStar = window.r9StarB; targetRadius = 2.6; }
            else if (r9State.selectedStar === 'C' && window.r9StarC) { activeStar = window.r9StarC; targetRadius = 4.0; }
            else if (r9State.selectedStar === 'V1' && window.r9StarV1) { activeStar = window.r9StarV1; targetRadius = 2.0; }
            
            if (activeStar) {
                window.r9SelectionRing.visible = true;
                activeStar.getWorldPosition(window.r9SelectionRing.position);
                
                // Let the ring face the camera
                if (typeof camera !== 'undefined') {
                    window.r9SelectionRing.lookAt(camera.position);
                }
                
                // Pulsate and rotate selection ring
                const br = 1.0 + 0.15 * Math.sin(Date.now() * 0.003);
                window.r9SelectionRing.scale.set(targetRadius * br, targetRadius * br, 1);
            } else {
                window.r9SelectionRing.visible = false;
            }
        }

        // Animate Cepheid light wavefront pulses along the line of sight to Earth (0,0,0)
        if (window.r10Wavefronts && window.r10Wavefronts.length > 0) {
            let activeStar = null;
            let activeColor = 0xffcc44;
            let activePeriod = 15.0;
            if (r9State.selectedStar === 'A' && window.r9StarA) { activeStar = window.r9StarA; activeColor = 0xffcc44; activePeriod = 5.0; }
            else if (r9State.selectedStar === 'B' && window.r9StarB) { activeStar = window.r9StarB; activeColor = 0xffdd44; activePeriod = 15.0; }
            else if (r9State.selectedStar === 'C' && window.r9StarC) { activeStar = window.r9StarC; activeColor = 0xffaa00; activePeriod = 35.0; }
            else if (r9State.selectedStar === 'V1' && window.r9StarV1) { activeStar = window.r9StarV1; activeColor = 0x55aaff; activePeriod = 31.4; }

            if (activeStar) {
                // Map speed inversely to period: short period = fast pulses
                const waveSpeed = 0.003 + (1.0 / activePeriod) * 0.06;
                const starWorldPos = new THREE.Vector3();
                activeStar.getWorldPosition(starWorldPos);
                
                window.r10Wavefronts.forEach(w => {
                    w.mesh.visible = true;
                    w.progress += waveSpeed;
                    if (w.progress > 1.0) w.progress = 0.0;

                    // Interpolate wavefront along sightline from activeStar world coordinates to Earth (0,0,0)
                    w.mesh.position.lerpVectors(starWorldPos, new THREE.Vector3(0, 0, 0), w.progress);
                    w.mesh.lookAt(new THREE.Vector3(0, 0, 0));

                    const scale = 2.0 + w.progress * 25.0;
                    w.mesh.scale.set(scale, scale, 1.0);

                    // Opacity falloff using inverse square law
                    const intensity = 1.0 / Math.pow(1.0 + w.progress * 4.0, 2);
                    w.mesh.material.color.setHex(activeColor);
                    w.mesh.material.opacity = intensity * 0.7;
                });
            } else {
                window.r10Wavefronts.forEach(w => { w.mesh.visible = false; });
            }
        }

        // Adjust camera target dynamically based on the active phase in 3D too
        if (r9State.cameraTransitionActive && typeof camera !== 'undefined' && typeof controls !== 'undefined') {
            if (typeof window.r10LastRung === 'undefined') {
                window.r10LastRung = -1;
                window.r10LastPhase = -1;
                window.r10CamTransitionFrames = 0;
            }
            
            if (window.r10LastRung !== currentRung || window.r10LastPhase !== r9State.phase) {
                window.r10LastRung = currentRung;
                window.r10LastPhase = r9State.phase;
                window.r10CamTransitionFrames = 90;
            }
            
            const targetZ = (r9State.phase === 1) ? -70 : -240;
            const targetCamZ = (r9State.phase === 1) ? -20 : -190;
            const targetX = (r9State.phase === 1) ? -60 : 150;
            const targetY = (r9State.phase === 1) ? -40 : 100;
            
            if (window.r10CamTransitionFrames > 0) {
                window.r10CamTransitionFrames--;
                const targetLookAt = new THREE.Vector3(targetX, targetY, targetZ);
                const targetCamPos = new THREE.Vector3(targetX, targetY + 5, targetCamZ);
                
                camera.position.lerp(targetCamPos, 0.05);
                controls.target.lerp(targetLookAt, 0.05);
            } else {
                r9State.cameraTransitionActive = false;
            }
        }

        if (window.andromedaLabel) {
            if (r9State.phase === 2) {
                const inputs = els.controls.querySelectorAll('input');
                if (inputs.length >= 3) {
                    const appMag = parseFloat(inputs[0].value);
                    const absMag = parseFloat(inputs[2].value);
                    const distPc = Math.pow(10, (appMag - absMag + 5) / 5);
                    const distKpc = distPc / 1000.0;
                    updateStellarLabel(window.andromedaLabel, `Andromeda Galaxy (${Math.round(distKpc).toLocaleString()} kpc)`, "#55aaff", 42);
                }
            } else {
                updateStellarLabel(window.andromedaLabel, "Andromeda Galaxy (M31)", "#55aaff", 42);
            }
        }

        // Also update telemetry active star in the sidebar
        const statusLabel = document.getElementById('sim-status');
        const starLabel = document.getElementById('sim-star');
        const periodLabel = document.getElementById('sim-period');
        
        if (statusLabel) {
            statusLabel.textContent = r9State.phase === 1 ? "Phase 1: Plot SMC Cepheids" : "Phase 2: Calibrate Andromeda";
        }
        if (starLabel) {
            starLabel.textContent = r9State.points[r9State.selectedStar].name;
        }
        if (periodLabel) {
            periodLabel.textContent = `${r9State.points[r9State.selectedStar].p.toFixed(1)} days`;
        }
    }
    
    // 2D animation loop
    if (canvas2d.style.display === 'block') {
        if (currentRung === 2) draw2DEclipseAnim();
        if (currentRung === 3) draw2DAngularSize();
        if (currentRung === 4) draw2DAristarchusAngle();
        if (currentRung === 5) draw2DPinholeSun();
        if (currentRung === 6) draw2DMarsParallax();
        if (currentRung === 7) draw2DTransit();
        if (currentRung === 8) draw2DStellarParallax();
        if (currentRung === 11) draw2DRadarVenus();
    }
    
    if (currentRung === 9) {
        drawHRTelescope();
    }
    if (currentRung === 10) {
        drawRung9TelescopeCanvas();
    }
    
    // Rung 13 (Type Ia Supernovae) 3D Scene Animation
    if (currentRung === 13 && typeof window.r13SupernovaSystems !== 'undefined') {
        const time = Date.now() * 0.001;
        window.r13SupernovaSystems.forEach((model, idx) => {
            // Rotate galaxy points slowly
            if (model.points) model.points.rotation.y += 0.0015;
            
            // Orbit WD and companion star around each other
            const sys = model.snSys;
            const orbitSpeed = time * (idx === 0 ? 1.5 : idx === 1 ? 1.0 : 0.6);
            sys.wd.position.set(sys.orbitRadius * Math.cos(orbitSpeed), 0, sys.orbitRadius * Math.sin(orbitSpeed));
            sys.companion.position.set(-sys.orbitRadius * Math.cos(orbitSpeed), 0, -sys.orbitRadius * Math.sin(orbitSpeed));
            
            // Rotate accretion gas belt
            sys.stream.rotation.z += 0.015;
            
            // Supernova flare effect on white dwarf when verified
            const sn = r13State.supernovae[idx];
            if (sn && sn.verified) {
                sys.flare.material.opacity = 0.85 + Math.sin(Date.now() * 0.015) * 0.15;
                const scale = 1.0 + Math.sin(Date.now() * 0.005) * 0.1;
                sys.flare.scale.set(scale, scale, scale);
                // Also position the flare at the white dwarf's current orbital position
                sys.flare.position.copy(sys.wd.position);
            } else {
                sys.flare.material.opacity = 0;
            }
        });
        
        // Update Rung 13 selection ring and sightline
        if (window.r13SelectionRing && window.r13Sightline) {
            const activeIdx = r13State.activeSupernovaIndex;
            const activeModel = window.r13SupernovaSystems[activeIdx];
            if (activeModel) {
                // Point selection ring and sightline to active galaxy's binary offset position
                const targetPos = new THREE.Vector3();
                activeModel.snSys.group.getWorldPosition(targetPos);
                window.r13SelectionRing.position.copy(targetPos);
                
                const pts = [new THREE.Vector3(0,0,0), targetPos];
                window.r13Sightline.geometry.setFromPoints(pts);
                window.r13Sightline.computeLineDistances();
                
                const sn = r13State.supernovae[activeIdx];
                if (sn && sn.verified) {
                    window.r13Sightline.material.dashSize = 1000;
                    window.r13Sightline.material.gapSize = 0;
                } else {
                    window.r13Sightline.material.dashSize = 2;
                    window.r13Sightline.material.gapSize = 2;
                }
                window.r13Sightline.material.needsUpdate = true;
            }
        }
    }
    
    // Rung 14 (Gravitational Wave Standard Sirens) 3D system animation
    if (currentRung === 14 && typeof window.r14BinarySystems !== 'undefined') {
        const time = Date.now() * 0.001;
        window.r14BinarySystems.forEach((sys, idx) => {
            const speed = (idx === 0 ? 3.5 : idx === 1 ? 2.0 : 1.0) * time;
            
            // Orbit positions
            sys.body1.position.set(sys.orbitRadius * Math.cos(speed), 0, sys.orbitRadius * Math.sin(speed));
            sys.body2.position.set(-sys.orbitRadius * Math.cos(speed), 0, -sys.orbitRadius * Math.sin(speed));
            
            // Accretion disk spin
            sys.body1.rotation.y += 0.02;
            sys.body2.rotation.y += 0.02;
            
            // Propagating circular wave rings (ripples in spacetime)
            sys.rings.forEach((ring, rIdx) => {
                const progress = ((time * 0.5 + rIdx / 3) % 1.0);
                const maxRadius = sys.orbitRadius * 5;
                const currentRadius = 0.5 + progress * maxRadius;
                
                ring.scale.set(currentRadius, currentRadius, 1);
                ring.material.opacity = Math.max(0, 0.6 * (1.0 - progress));
            });
        });
        
        // Update Rung 14 selection ring and sightline
        if (window.r14SelectionRing && window.r14Sightline) {
            const activeIdx = r14State.activeEventIndex;
            const activeSys = window.r14BinarySystems[activeIdx];
            if (activeSys) {
                const targetPos = activeSys.group.position;
                window.r14SelectionRing.position.copy(targetPos);
                
                const pts = [new THREE.Vector3(0,0,0), targetPos];
                window.r14Sightline.geometry.setFromPoints(pts);
                window.r14Sightline.computeLineDistances();
                
                const ev = r14State.events[activeIdx];
                if (ev && ev.verified) {
                    window.r14Sightline.material.dashSize = 1000;
                    window.r14Sightline.material.gapSize = 0;
                } else {
                    window.r14Sightline.material.dashSize = 2;
                    window.r14Sightline.material.gapSize = 2;
                }
                window.r14Sightline.material.needsUpdate = true;
            }
        }
    }
    
    controls.update();
    renderer.render(scene, camera);
}

function draw2DTransit() {
    if (!ctx2d) return;
    const canvas2d = document.getElementById('canvas-2d');
    const w = canvas2d.width;
    const h = canvas2d.height;
    ctx2d.clearRect(0, 0, w, h);
    
    // Deep Space Background
    const gradSky = ctx2d.createLinearGradient(0, 0, w, h);
    gradSky.addColorStop(0, '#050510');
    gradSky.addColorStop(1, '#000000');
    ctx2d.fillStyle = gradSky;
    ctx2d.fillRect(0, 0, w, h);
    
    // Get Transit Shift from slider
    let shiftArcsec = 70;
    const inputs = els.controls.querySelectorAll('input');
    if (inputs.length > 0) {
        shiftArcsec = parseFloat(inputs[0].value);
    }
    
    const trueShift = 40.0;
    const isAligned = Math.abs(shiftArcsec - trueShift) <= 0.2;
    
    // Layout centers
    const cx1 = w * 0.2;
    const cy1 = h * 0.3;
    const r1 = Math.min(w, h) * 0.15;
    
    const cx2 = w * 0.2;
    const cy2 = h * 0.7;
    const r2 = Math.min(w, h) * 0.15;
    
    const cx3 = w * 0.7;
    const cy3 = h * 0.5;
    const r3 = Math.min(w, h) * 0.35;
    
    // Animation driver
    const tAnim = (Date.now() % 15000) / 15000;
    
    // Draw Sun Helper
    const drawSun = (cx, cy, r) => {
        ctx2d.shadowBlur = r * 0.3;
        ctx2d.shadowColor = '#ffaa00';
        ctx2d.fillStyle = '#ffaa00';
        ctx2d.beginPath();
        ctx2d.arc(cx, cy, r, 0, Math.PI * 2);
        ctx2d.fill();
        ctx2d.shadowBlur = 0;
        
        // Sunspots
        ctx2d.fillStyle = '#cc5500';
        const spots = [
            {x: -0.3, y: 0.1, s: 0.05},
            {x: -0.28, y: 0.15, s: 0.03},
            {x: 0.2, y: -0.3, s: 0.08},
            {x: 0.4, y: 0.2, s: 0.04}
        ];
        spots.forEach(sp => {
            ctx2d.beginPath();
            ctx2d.arc(cx + sp.x * r, cy + sp.y * r, sp.s * r, 0, Math.PI * 2);
            ctx2d.fill();
        });
    };
    
    drawSun(cx1, cy1, r1);
    drawSun(cx2, cy2, r2);
    drawSun(cx3, cy3, r3);
    
    // Labels
    ctx2d.fillStyle = '#fff';
    ctx2d.font = 'bold 16px Outfit';
    ctx2d.textAlign = 'center';
    ctx2d.fillText("VIEW FROM NORTH POLE", cx1, cy1 - r1 - 20);
    ctx2d.fillText("VIEW FROM SOUTH POLE", cx2, cy2 - r2 - 20);
    ctx2d.font = 'bold 20px Outfit';
    ctx2d.fillText("SUPERPOSITION", cx3, cy3 - r3 - 25);
    
    ctx2d.font = '12px Outfit';
    ctx2d.fillStyle = 'rgba(255,255,255,0.7)';
    ctx2d.fillText("Venus crosses Southern Hemisphere", cx1, cy1 + r1 + 25);
    ctx2d.fillText("Venus crosses Northern Hemisphere", cx2, cy2 + r2 + 25);
    ctx2d.fillText("Measure physical shift between paths", cx3, cy3 + r3 + 30);
    
    // True chord offsets (relative to radius)
    const trueOffN = 0.15;
    const trueOffS = -0.15;
    
    const drawTransit = (cx, cy, r, offsetRatio, color, label) => {
        const chordY = cy + offsetRatio * r;
        const dx = Math.sqrt(r*r - Math.pow(offsetRatio * r, 2));
        
        // Path
        ctx2d.strokeStyle = color;
        ctx2d.lineWidth = 2;
        ctx2d.setLineDash([5, 5]);
        ctx2d.beginPath();
        ctx2d.moveTo(cx - dx, chordY);
        ctx2d.lineTo(cx + dx, chordY);
        ctx2d.stroke();
        ctx2d.setLineDash([]);
        
        // Venus
        const vx = cx - r * 1.2 + (tAnim * r * 2.4);
        if (Math.abs(vx - cx) < dx) {
            ctx2d.fillStyle = '#000000';
            ctx2d.beginPath();
            ctx2d.arc(vx, chordY, r * 0.06, 0, Math.PI * 2);
            ctx2d.fill();
        }
        
        ctx2d.fillStyle = color;
        ctx2d.font = '12px Outfit';
        ctx2d.textAlign = 'left';
        ctx2d.fillText(label, cx + dx + 10, chordY);
    };
    
    drawTransit(cx1, cy1, r1, trueOffN, 'rgba(255,0,0,0.6)', 'N Path');
    drawTransit(cx2, cy2, r2, trueOffS, 'rgba(0,170,255,0.6)', 'S Path');
    
    // Superposition (both true paths)
    drawTransit(cx3, cy3, r3, trueOffN, 'rgba(255,0,0,0.6)', '');
    drawTransit(cx3, cy3, r3, trueOffS, 'rgba(0,170,255,0.6)', '');
    
    // Calipers based on slider
    const caliperDist = (shiftArcsec / 40.0) * (r3 * (trueOffN - trueOffS));
    const calY1 = cy3 + caliperDist / 2;
    const calY2 = cy3 - caliperDist / 2;
    
    ctx2d.strokeStyle = isAligned ? '#00ffaa' : '#ff3333';
    ctx2d.lineWidth = 3;
    
    // Vertical line
    ctx2d.beginPath();
    ctx2d.moveTo(cx3, calY1);
    ctx2d.lineTo(cx3, calY2);
    ctx2d.stroke();
    
    // Horizontal ticks
    ctx2d.beginPath();
    ctx2d.moveTo(cx3 - 20, calY1);
    ctx2d.lineTo(cx3 + 20, calY1);
    ctx2d.moveTo(cx3 - 20, calY2);
    ctx2d.lineTo(cx3 + 20, calY2);
    ctx2d.stroke();
    
    // Shift Text
    ctx2d.fillStyle = isAligned ? '#00ffaa' : '#ff3333';
    ctx2d.font = 'bold 24px Outfit';
    ctx2d.textAlign = 'center';
    ctx2d.fillText(`θ = ${shiftArcsec.toFixed(1)}"`, cx3 + 60, cy3);
    
    // Telemetry Update
    const tShift = document.getElementById('sim-transit-shift');
    const tAu = document.getElementById('sim-transit-au');
    if (tShift) tShift.textContent = `${shiftArcsec.toFixed(1)}"`;
    if (tAu) {
        const auCalc = 149597870 * (40.0 / shiftArcsec);
        tAu.textContent = `${(auCalc / 1000000).toFixed(1)} M km`;
        tAu.style.color = isAligned ? '#00ffaa' : '#ffffff';
    }
}

function draw2DRadarVenus() {
    if (!ctx2d) return;
    const canvas2d = document.getElementById('canvas-2d');
    const w = canvas2d.width;
    const h = canvas2d.height;
    ctx2d.clearRect(0, 0, w, h);
    
    // Deep Space Background
    const gradSky = ctx2d.createLinearGradient(0, 0, w, h);
    gradSky.addColorStop(0, '#050510');
    gradSky.addColorStop(1, '#000000');
    ctx2d.fillStyle = gradSky;
    ctx2d.fillRect(0, 0, w, h);
    
    drawStars2D(ctx2d, w, h);
    
    // Get Window Time from slider
    let windowTime = 260;
    const inputs = els.controls.querySelectorAll('input');
    if (inputs.length > 0) {
        windowTime = parseFloat(inputs[0].value);
    }
    
    const trueFlight = 276.13;
    const trueOneWay = 138.065;
    const isAligned = Math.abs(windowTime - trueFlight) <= 0.05;
    
    const earthX = w * 0.15;
    const cy = h * 0.5;
    const maxDist = w * 0.7; // Represents trueOneWay one-way travel time
    
    const venusX = earthX + maxDist;
    
    // Animation timing (400s sim mapped to 4s real-time)
    const periodSim = 400; 
    const animScale = 100;
    const currentSimTime = ((Date.now() / 1000) % (periodSim / animScale)) * animScale;
    
    let pulseDist = 0;
    let isOutbound = true;
    let pulseActive = true;
    
    if (currentSimTime <= trueOneWay) {
        pulseDist = maxDist * (currentSimTime / trueOneWay);
    } else if (currentSimTime <= trueFlight) {
        isOutbound = false;
        pulseDist = maxDist * ((trueFlight - currentSimTime) / trueOneWay);
    } else {
        pulseActive = false; // pulse arrived, waiting for next cycle
        pulseDist = 0;
    }
    
    // Draw Earth to Venus line
    ctx2d.beginPath();
    ctx2d.setLineDash([10, 15]);
    ctx2d.moveTo(earthX, cy);
    ctx2d.lineTo(venusX, cy);
    ctx2d.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx2d.lineWidth = 1;
    ctx2d.stroke();
    ctx2d.setLineDash([]);
    
    // Draw Earth
    ctx2d.shadowBlur = 20;
    ctx2d.shadowColor = '#125dff';
    ctx2d.fillStyle = '#125dff';
    ctx2d.beginPath();
    ctx2d.arc(earthX, cy, 20, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.shadowBlur = 0;
    
    // Draw Venus
    ctx2d.shadowBlur = 10;
    ctx2d.shadowColor = '#eebb88';
    ctx2d.fillStyle = '#eebb88';
    ctx2d.beginPath();
    ctx2d.arc(venusX, cy, 18, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.shadowBlur = 0;
    
    // Draw Pulse
    if (pulseActive) {
        const px = isOutbound ? earthX + pulseDist : venusX - (maxDist - pulseDist);
        
        ctx2d.shadowBlur = 20;
        ctx2d.shadowColor = isOutbound ? '#00ffaa' : '#00aaff';
        ctx2d.strokeStyle = isOutbound ? '#00ffaa' : '#00aaff';
        ctx2d.lineWidth = 4;
        ctx2d.beginPath();
        ctx2d.arc(px, cy, 30, isOutbound ? -Math.PI/4 : Math.PI*0.75, isOutbound ? Math.PI/4 : Math.PI*1.25);
        ctx2d.stroke();
        
        // Secondary pulse wave
        ctx2d.beginPath();
        ctx2d.arc(px + (isOutbound ? -10 : 10), cy, 40, isOutbound ? -Math.PI/6 : Math.PI*0.83, isOutbound ? Math.PI/6 : Math.PI*1.17);
        ctx2d.stroke();
        ctx2d.shadowBlur = 0;
    }
    
    // Highlight Earth if receiving
    const isWindowActive = Math.abs(currentSimTime - windowTime) < 15;
    if (isWindowActive && !isOutbound) {
        ctx2d.strokeStyle = isAligned ? '#00ffaa' : '#ff3333';
        ctx2d.lineWidth = 2;
        ctx2d.beginPath();
        ctx2d.arc(earthX, cy, 35, 0, Math.PI * 2);
        ctx2d.stroke();
    }
    
    // Feedback Text
    ctx2d.fillStyle = isAligned ? '#00ffaa' : '#ffaa00';
    ctx2d.font = 'bold 24px monospace';
    ctx2d.fillText(`Window: ${windowTime.toFixed(2)} s`, w/2, cy - 80);
    
    // Sim Timer
    ctx2d.fillStyle = '#fff';
    ctx2d.font = '16px monospace';
    ctx2d.textAlign = 'left';
    ctx2d.fillText(`T+ ${currentSimTime.toFixed(2)} s`, earthX - 30, cy - 80);
    
    // Telemetry Sync
    const tWin = document.getElementById('sim-radar-window');
    const tState = document.getElementById('sim-radar-state');
    if (tWin) tWin.textContent = `${windowTime.toFixed(2)} s`;
    if (tState) {
        tState.textContent = isAligned ? "LOCKED" : "Searching...";
        tState.style.color = isAligned ? '#00ffaa' : '#ffaa00';
    }
}

animate();
init();



// =========================================================
// RUNG 9: SPECTROSCOPIC PARALLAX (H-R DIAGRAM DATA & UI)
// =========================================================
const hrBaseSequence = [
    { x: -0.15, y: -4.0 },
    { x: -0.10, y: -1.5 },
    { x: 0.0, y: 0.6 },
    { x: 0.2, y: 1.8 },
    { x: 0.4, y: 3.0 },
    { x: 0.6, y: 4.4 },
    { x: 0.8, y: 5.6 },
    { x: 1.0, y: 6.6 },
    { x: 1.2, y: 8.0 },
    { x: 1.4, y: 9.8 }
];

function getBaseM(bv) {
    if (bv <= -0.15) return -4.0;
    if (bv >= 1.4) return 9.8;
    for (let i = 0; i < hrBaseSequence.length - 1; i++) {
        const p1 = hrBaseSequence[i];
        const p2 = hrBaseSequence[i+1];
        if (bv >= p1.x && bv <= p2.x) {
            const pct = (bv - p1.x) / (p2.x - p1.x);
            return p1.y + pct * (p2.y - p1.y);
        }
    }
    return 0;
}

// Denser Pleiades background stars generation (150 stars with realistic cluster scatter)
const pleiadesData = [];
for (let i = 0; i < 150; i++) {
    const bv = -0.15 + (i / 150) * 1.45;
    const scatter = (Math.sin(i * 4321) * 0.38) + (Math.sin(i * 123) * 0.12);
    const baseM = getBaseM(bv);
    const m = baseM + 5.67 + scatter;
    pleiadesData.push({ bv: bv, m: m });
}

// Custom Chart.js plugin to draw H-R Diagram regions and labels
const hrRegionsPlugin = {
    id: 'hrRegions',
    beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;
        if (!xAxis || !yAxis) return;
        
        ctx.save();
        
        // Helper to draw a shaded box and label
        function drawRegion(xMin, xMax, yMin, yMax, label, color) {
            const xLeft = xAxis.getPixelForValue(xMin);
            const xRight = xAxis.getPixelForValue(xMax);
            const yTop = yAxis.getPixelForValue(yMin);
            const yBottom = yAxis.getPixelForValue(yMax);
            
            ctx.fillStyle = color;
            ctx.fillRect(xLeft, yTop, xRight - xLeft, yBottom - yTop);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.font = 'bold 8px Outfit';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, (xLeft + xRight) / 2, (yTop + yBottom) / 2);
        }
        
        // 1. Supergiants: B-V from -0.4 to 1.6, M from -8.0 to -4.0
        drawRegion(-0.4, 1.6, -8.0, -4.0, "SUPERGIANTS", "rgba(239, 68, 68, 0.05)");
        
        // 2. Giants: B-V from 0.8 to 1.6, M from -1.0 to 2.0
        drawRegion(0.8, 1.6, -1.0, 2.0, "GIANTS", "rgba(245, 158, 11, 0.05)");
        
        // 3. White Dwarfs: B-V from -0.3 to 0.5, M from 9.5 to 12.0
        drawRegion(-0.3, 0.5, 9.5, 12.0, "WHITE DWARFS", "rgba(6, 182, 212, 0.05)");
        
        // 4. Main Sequence Label (drawn near the diagonal trendline)
        const msX = xAxis.getPixelForValue(0.45);
        const msY = yAxis.getPixelForValue(3.4);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 8.5px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.save();
        ctx.translate(msX, msY);
        ctx.rotate(0.65);
        ctx.fillText("MAIN SEQUENCE", 0, 0);
        ctx.restore();
        
        // 5. Draw Spectral Class labels at the top of the chart grid area
        if (chart.chartArea) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.font = 'bold 8.5px Outfit';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            const spectralClasses = [
                { label: "O", x: -0.35 },
                { label: "B", x: -0.16 },
                { label: "A", x: 0.14 },
                { label: "F", x: 0.44 },
                { label: "G", x: 0.70 },
                { label: "K", x: 1.10 },
                { label: "M", x: 1.50 }
            ];
            
            spectralClasses.forEach(sc => {
                const px = xAxis.getPixelForValue(sc.x);
                ctx.fillText(sc.label, px, chart.chartArea.top + 5);
            });

            // 6. Draw Spectral Type Color Band at the bottom of the chart grid
            const area = chart.chartArea;
            const xMin = xAxis.getPixelForValue(-0.4);
            const xMax = xAxis.getPixelForValue(1.6);
            const yPos = area.bottom - 4; // 4px thick band
            const height = 4;
            
            const grad = ctx.createLinearGradient(xMin, 0, xMax, 0);
            grad.addColorStop(0, '#5aa6ff');      // Class O (Hot Blue)
            grad.addColorStop(0.12, '#a5f3fc');   // Class B (Blue-White)
            grad.addColorStop(0.27, '#ffffff');   // Class A (White)
            grad.addColorStop(0.42, '#fef08a');   // Class F (Yellow-White)
            grad.addColorStop(0.55, '#fbbf24');   // Class G (Yellow)
            grad.addColorStop(0.75, '#f97316');   // Class K (Orange)
            grad.addColorStop(1.0, '#ef4444');    // Class M (Red)
            
            ctx.fillStyle = grad;
            ctx.fillRect(xMin, yPos, xMax - xMin, height);
        }
        
        ctx.restore();
    }
};

let hrChart = null;

function initRung9UI() {
    const viewport = document.getElementById('viewport-container');
    let ui = document.getElementById('hr-ui-container');
    
    if (!ui) {
        ui = document.createElement('div');
        ui.id = 'hr-ui-container';
        
        ui.innerHTML = `
            <!-- H-R Diagram Panel -->
            <div class="hr-panel" id="hr-chart-panel">
                <div class="hr-panel-header">Hertzsprung-Russell Diagram (Main Sequence Fitting)</div>
                <div class="hr-canvas-container">
                    <canvas id="hr-chart-canvas"></canvas>
                </div>
            </div>
            
            <!-- Telescope View Panel -->
            <div class="hr-panel" id="hr-telescope-panel">
                <div class="hr-panel-header" id="hr-telescope-header">Telescope Viewfinder: Hyades Cluster</div>
                <div class="hr-telescope-layout">
                    <div class="hr-viewfinder-container">
                        <canvas id="hr-telescope-canvas"></canvas>
                    </div>
                    <div id="hr-telescope-instructions" style="flex:1; display:flex; flex-direction:column; justify-content:center; min-height:0;">
                        <div class="hr-step-indicator" id="hr-step-indicator" style="font-family:'Outfit'; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#00d4ff; margin-bottom:6px;">Step 1 of 4: Calibrate Baseline</div>
                        <p id="hr-instr-text" style="color:#fff; font-family:'Outfit'; font-size:11px; margin-bottom:5px; min-height:45px; line-height:1.4;">
                            Click the glowing stars in the Hyades cluster to measure their distance using parallax and plot their true brightness (Absolute Magnitude, M).
                        </p>
                        
                        <!-- Star details container -->
                        <div id="hr-star-details" class="hr-star-details-box" style="display:none; background:rgba(2, 16, 52, 0.6); border:1px solid rgba(0, 212, 255, 0.15); border-radius:8px; padding:5px 10px; margin:4px 0; font-family:'Outfit'; font-size:10px; color:#fff; text-align:left;"></div>
                        
                        <!-- Buttons row -->
                        <div style="display:flex; gap:10px; margin-top:4px;">
                            <button id="hr-btn-plot-star" class="hr-btn" style="flex:1; background:linear-gradient(135deg, #125DFF 0%, #00d4ff 100%); border:none; border-radius:6px; color:#fff; font-family:'Outfit'; font-size:11px; font-weight:600; padding:6px; cursor:pointer; transition:all 0.3s;" disabled>Plot Star</button>
                            <button id="hr-btn-action" class="hr-btn" style="flex:1.2; display:none; background:linear-gradient(135deg, #00ffaa 0%, #00b8ff 100%); border:none; border-radius:6px; color:#fff; font-family:'Outfit'; font-size:11px; font-weight:600; padding:6px; cursor:pointer; transition:all 0.3s;">Point to Pleiades →</button>
                        </div>
                        
                        <div id="hr-telescope-success" class="hr-instruction-box success" style="display:none; background:rgba(0, 255, 170, 0.02); border:1px solid rgba(0, 255, 170, 0.3); border-radius:8px; padding:10px; margin-top:10px; text-align:left;">
                            <h4 style="margin:0 0 4px 0; font-size:11px; font-family:'Outfit'; color:#00ffaa; text-transform:uppercase; letter-spacing:0.5px;">Pleiades Calibration Complete!</h4>
                            <p style="margin:0; font-size:10px; color:rgba(255, 255, 255, 0.8); line-height:1.4;">Offset (m - M) = 5.67 mag matches perfectly.<br>This reveals a distance of ~136 parsecs (~443 light years). Enter this in your notebook to verify!</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Historical Info Panel -->
            <div class="hr-panel" id="hr-info-panel">
                <div class="hr-panel-header">Spectroscopic Parallax Method</div>
                <p id="hr-info-text" style="color:#c4c4c4; font-family:'Space Grotesk', sans-serif; font-size:11px; margin:0; line-height:1.5;">
                    Trigonometric parallax fails for star clusters far in the Milky Way. However, since main sequence stars of a given temperature (color index) share the same absolute luminosity, we can match their relative apparent brightness to a calibrated local cluster (the Hyades). The offset between apparent and absolute magnitudes is the <strong>distance modulus</strong>, unlocking distances across the entire galaxy!
                </p>
            </div>
        `;
        viewport.appendChild(ui);
        
        // Add Event Listeners for Telescope interactions
        const tCanvas = document.getElementById('hr-telescope-canvas');
        tCanvas.addEventListener('mousemove', (e) => {
            const rect = tCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = tCanvas.width / 2;
            const cy = tCanvas.height / 2;
            
            let hoveredIdx = null;
            const isPleiades = (hrState.step >= 3) || (hrState.step === 2 && hrState.pointedToPleiades);
            const starsList = isPleiades ? hrState.pleiadesStars : hrState.hyadesStars;
            
            // Check if hover is within any star
            starsList.forEach((s, idx) => {
                const sx = cx + s.dx;
                const sy = cy + s.dy;
                if (Math.hypot(x - sx, y - sy) < 12) {
                    hoveredIdx = idx;
                }
            });
            
            if (hoveredIdx !== null) {
                tCanvas.style.cursor = 'pointer';
            } else {
                tCanvas.style.cursor = 'default';
            }
            
            if (hrState.hoveredStarIndex !== hoveredIdx) {
                hrState.hoveredStarIndex = hoveredIdx;
                drawHRTelescope();
            }
        });
        
        tCanvas.addEventListener('click', (e) => {
            const rect = tCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = tCanvas.width / 2;
            const cy = tCanvas.height / 2;
            
            let clickedIdx = null;
            const isPleiades = (hrState.step >= 3) || (hrState.step === 2 && hrState.pointedToPleiades);
            const starsList = isPleiades ? hrState.pleiadesStars : hrState.hyadesStars;
            
            starsList.forEach((s, idx) => {
                const sx = cx + s.dx;
                const sy = cy + s.dy;
                if (Math.hypot(x - sx, y - sy) < 12) {
                    clickedIdx = idx;
                }
            });
            
            if (clickedIdx !== null) {
                hrState.selectedStarIndex = clickedIdx;
                hrState.activeFilter = 'none';
                hrState.analyzerTab = 'spectrum';
                hrState.spectrumAnalyzed = false;
                hrState.filterBClicked = false;
                hrState.filterVClicked = false;
                showHRStarDetails(clickedIdx);
                drawHRTelescope();
            }
        });
        
        // Plot star button listener
        document.getElementById('hr-btn-plot-star').addEventListener('click', () => {
            const isPleiades = (hrState.step >= 3) || (hrState.step === 2 && hrState.pointedToPleiades);
            const starsList = isPleiades ? hrState.pleiadesStars : hrState.hyadesStars;
            if (hrState.selectedStarIndex !== null) {
                const star = starsList[hrState.selectedStarIndex];
                star.plotted = true;
                hrState.selectedStarIndex = null;
                
                // Hide details box and disable plot button
                document.getElementById('hr-star-details').style.display = 'none';
                document.getElementById('hr-btn-plot-star').disabled = true;
                
                // Redraw telescope
                drawHRTelescope();
                
                // Update UI state and Chart
                updateHRUIState();
                
                // Check progress
                const plottedCount = starsList.filter(s => s.plotted).length;
                if (hrState.step === 1 && plottedCount === hrState.hyadesStars.length) {
                    // Hyades calibrated!
                    hrState.step = 2; // Move to step 2 trigger
                    updateHRUIState();
                } else if (hrState.step === 2 && plottedCount >= 5) {
                    // Pleiades observed enough!
                    // Show action button to proceed to fitting
                    updateHRUIState();
                }
            }
        });
        
        // Action button click listener
        document.getElementById('hr-btn-action').addEventListener('click', () => {
            if (hrState.step === 2) {
                const pleiadesPlotted = hrState.pleiadesStars.filter(s => s.plotted).length;
                if (pleiadesPlotted === 0) {
                    // Action: Point to Pleiades
                    hrState.selectedStarIndex = null;
                    hrState.hoveredStarIndex = null;
                    hrState.pointedToPleiades = true;
                    
                    const tCanvas = document.getElementById('hr-telescope-canvas');
                    if (tCanvas) {
                        tCanvas.style.opacity = '0';
                        setTimeout(() => {
                            tCanvas.style.transition = 'opacity 0.5s ease';
                            tCanvas.style.opacity = '1';
                        }, 50);
                    }
                    
                    drawHRTelescope();
                    updateHRUIState();
                } else if (pleiadesPlotted >= 5) {
                    // Action: Proceed to Fitting
                    hrState.step = 3;
                    hrState.selectedStarIndex = null;
                    hrState.hoveredStarIndex = null;
                    
                    drawHRTelescope();
                    updateHRUIState();
                }
            }
        });
    }
    
    ui.style.display = 'grid';
    
    // Hide details box on initial load
    document.getElementById('hr-star-details').style.display = 'none';
    document.getElementById('hr-btn-plot-star').disabled = true;
    document.getElementById('hr-btn-plot-star').style.display = 'block';
    document.getElementById('hr-btn-action').style.display = 'none';
    
    const ctx = document.getElementById('hr-chart-canvas').getContext('2d');
    
    if (hrChart) {
        hrChart.destroy();
    }
    
    hrChart = new Chart(ctx, {
        type: 'scatter',
        plugins: [hrRegionsPlugin],
        data: {
            datasets: [
                {
                    label: 'Calibrated Hyades (Reference)',
                    data: [],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.85)',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false
                },
                {
                    label: 'Hyades Trendline',
                    data: hrBaseSequence,
                    showLine: true,
                    borderColor: '#00d4ff',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.35,
                    backgroundColor: 'transparent',
                    fill: false,
                    hidden: true // Show only after Step 1 is complete!
                },
                {
                    label: 'Observed Pleiades',
                    data: [],
                    borderColor: '#ffd700',
                    backgroundColor: 'rgba(255, 215, 0, 0.85)',
                    pointRadius: 5.5,
                    pointHoverRadius: 7.5,
                    showLine: false
                },
                {
                    label: 'Pleiades Background Cluster',
                    data: [],
                    borderColor: 'rgba(255, 215, 0, 0.25)',
                    backgroundColor: 'rgba(255, 215, 0, 0.15)',
                    pointRadius: 2,
                    pointHoverRadius: 3,
                    showLine: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        boxWidth: 10,
                        padding: 8,
                        font: { family: 'Outfit', size: 9 },
                        filter: function(item) {
                            return item.text !== 'Pleiades Background Cluster';
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: -0.4,
                    max: 1.6,
                    title: {
                        display: true,
                        text: 'Color Index (B - V)',
                        color: '#a5b4fc',
                        font: { family: 'Outfit', size: 11, weight: 'bold' }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#c4c4c4', font: { family: 'Fira Code', size: 9 } }
                },
                y: {
                    reverse: true,
                    min: -8.0,
                    max: 12.0,
                    title: {
                        display: true,
                        text: 'Magnitude (Apparent m / Absolute M)',
                        color: '#a5b4fc',
                        font: { family: 'Outfit', size: 11, weight: 'bold' }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#c4c4c4', font: { family: 'Fira Code', size: 9 } }
                }
            }
        }
    });
    
    updateHRUIState();
}

// Helper function to draw star spectrum
function drawStarSpectrum(canvas, bv, progress = 1.0) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Calculate temperature using Ballesteros' formula
    const temp = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
    
    // Planck's law simplified for visual plotting scale
    function planck(lambda) {
        const c1 = 3.74e8;
        const c2 = 1.4388e7;
        return c1 / (Math.pow(lambda, 5) * (Math.exp(c2 / (lambda * temp)) - 1));
    }
    
    // Find peak wavelength (Wien's Law)
    const lambdaPeak = 2.897772e6 / temp;
    const peakIntensity = planck(lambdaPeak);
    
    // Draw background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 30; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h - 15);
        ctx.stroke();
    }
    
    // Draw visible rainbow band at the bottom (380 to 750 nm)
    const rainbowGrad = ctx.createLinearGradient(0, 0, w, 0);
    // visible band starts at x = (380-150)/850 * w = 27.1%
    // ends at x = (750-150)/850 * w = 70.6%
    rainbowGrad.addColorStop(0, '#000'); 
    rainbowGrad.addColorStop(0.25, '#000');
    rainbowGrad.addColorStop(0.27, '#3f007f'); // Violet (380nm)
    rainbowGrad.addColorStop(0.34, '#0000ff'); // Blue (440nm)
    rainbowGrad.addColorStop(0.41, '#00ffff'); // Cyan (500nm)
    rainbowGrad.addColorStop(0.47, '#00ff00'); // Green (550nm)
    rainbowGrad.addColorStop(0.53, '#ffff00'); // Yellow (600nm)
    rainbowGrad.addColorStop(0.59, '#ff7f00'); // Orange (650nm)
    rainbowGrad.addColorStop(0.65, '#ff0000'); // Red (700nm)
    rainbowGrad.addColorStop(0.71, '#500000'); // Deep red (750nm)
    rainbowGrad.addColorStop(0.73, '#000');
    rainbowGrad.addColorStop(1, '#000');
    
    ctx.fillStyle = rainbowGrad;
    ctx.fillRect(0, h - 8, w, 8);
    
    // Draw wavelength labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '7.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("150nm", 15, h - 12);
    ctx.fillText("575nm", w * 0.5, h - 12);
    ctx.fillText("1000nm", w - 20, h - 12);
    
    // Draw Planck's blackbody curve
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffd700';
    
    const limit = Math.round(w * progress);
    for (let x = 0; x < limit; x++) {
        const lambda = 150 + (x / w) * 850; // 150nm to 1000nm
        const intensity = planck(lambda);
        const y = h - 15 - (intensity / peakIntensity) * (h - 25);
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw peak pointer
    if (progress >= 1.0) {
        const peakX = (lambdaPeak - 150) / 850 * w;
        if (peakX >= 0 && peakX < w) {
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(peakX, 2);
            ctx.lineTo(peakX, h - 15);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.arc(peakX, h - 15 - (planck(lambdaPeak)/peakIntensity)*(h - 25), 3.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Add peak text annotation (Wien's displacement law + temperature)
            ctx.fillStyle = '#00d4ff';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = peakX < w / 2 ? 'left' : 'right';
            ctx.fillText(`λpeak: ${Math.round(lambdaPeak)}nm (${Math.round(temp)}K)`, peakX + (peakX < w / 2 ? 6 : -6), 12);
        }
    }
}

// Animate spectrum analysis sweep
function animateStarSpectrum(canvas, bv) {
    let progress = 0;
    function frame() {
        if (hrState.selectedStarIndex === null) return;
        progress += 0.05;
        if (progress >= 1.0) {
            progress = 1.0;
            drawStarSpectrum(canvas, bv, 1.0);
            hrState.spectrumAnalyzed = true;
            showHRStarDetails(hrState.selectedStarIndex);
            return;
        }
        drawStarSpectrum(canvas, bv, progress);
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

function showHRStarDetails(index) {
    const details = document.getElementById('hr-star-details');
    const plotBtn = document.getElementById('hr-btn-plot-star');
    if (!details || !plotBtn) return;
    
    const isPleiades = (hrState.step >= 3) || (hrState.step === 2 && hrState.pointedToPleiades);
    const star = isPleiades ? hrState.pleiadesStars[index] : hrState.hyadesStars[index];
    
    if (star.plotted) {
        hrState.selectedStarIndex = null;
        updateHRUIState();
        return;
    }
    
    // Calculate star physics values
    const temp = Math.round(4600 * (1 / (0.92 * star.bv + 1.7) + 1 / (0.92 * star.bv + 0.62)));
    const lambdaPeak = Math.round(2.897772e6 / temp);
    const m_V = star.appMag;
    const m_B = star.appMag + star.bv;
    const dist = !isPleiades ? (1 / star.parallax).toFixed(1) : null;
    
    const hasSpec = hrState.spectrumAnalyzed ? ' ✓' : '';
    const hasFilters = (hrState.filterBClicked && hrState.filterVClicked) ? ' ✓' : '';
    
    // Build tabs HTML
    let tabsHtml = `
        <div class="hr-analyzer-tabs" id="hr-analyzer-tabs" style="display:flex; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:8px;">
            <button class="hr-analyzer-tab" data-tab="spectrum" style="flex:1; text-align:center; font-size:9.5px; font-family:'Outfit'; font-weight:600; text-transform:uppercase; color:${hrState.analyzerTab === 'spectrum' ? '#00d4ff' : 'rgba(255,255,255,0.45)'}; border:none; border-bottom:${hrState.analyzerTab === 'spectrum' ? '2px solid #00d4ff' : '2px solid transparent'}; background:transparent; padding:6px 0; cursor:pointer;">1. Spec${hasSpec}</button>
            <button class="hr-analyzer-tab" data-tab="filters" style="flex:1; text-align:center; font-size:9.5px; font-family:'Outfit'; font-weight:600; text-transform:uppercase; color:${hrState.analyzerTab === 'filters' ? '#00d4ff' : 'rgba(255,255,255,0.45)'}; border:none; border-bottom:${hrState.analyzerTab === 'filters' ? '2px solid #00d4ff' : '2px solid transparent'}; background:transparent; padding:6px 0; cursor:pointer;">2. Filters${hasFilters}</button>
            <button class="hr-analyzer-tab" data-tab="luminosity" style="flex:1; text-align:center; font-size:9.5px; font-family:'Outfit'; font-weight:600; text-transform:uppercase; color:${hrState.analyzerTab === 'luminosity' ? '#00d4ff' : 'rgba(255,255,255,0.45)'}; border:none; border-bottom:${hrState.analyzerTab === 'luminosity' ? '2px solid #00d4ff' : '2px solid transparent'}; background:transparent; padding:6px 0; cursor:pointer;">3. Lum</button>
        </div>
    `;
    
    let tabContent = "";
    
    if (hrState.analyzerTab === 'spectrum') {
        tabContent = `
            <div style="font-family:'Outfit'; font-size:10px;">
                <p style="margin:0 0 4px 0; font-size:9px; color:rgba(255,255,255,0.5);">Prism spectrometry splits the light to find the peak wavelength: Wien's Displacement Law.</p>
                <canvas id="hr-spec-canvas" width="180" height="75" style="display:block; width:100%; height:75px; margin:4px 0; background:#01040d; border-radius:4px; border:1px solid rgba(255,255,255,0.06);"></canvas>
                
                <div style="display:flex; justify-content:space-between; margin-top:4px;">
                    <span>Peak Wavelength (λ<sub>peak</sub>):</span>
                    <span style="font-family:'Fira Code'; font-weight:bold; color:#ffd700;">${hrState.spectrumAnalyzed ? lambdaPeak + ' nm' : '-- nm'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:2px;">
                    <span>Calculated Temperature (T):</span>
                    <span style="font-family:'Fira Code'; font-weight:bold; color:#ffd700;">${hrState.spectrumAnalyzed ? temp.toLocaleString() + ' K' : '-- K'}</span>
                </div>
                
                ${!hrState.spectrumAnalyzed ? `
                    <button id="hr-btn-analyze-spec" class="hr-btn" style="background:rgba(0,212,255,0.15); border:1px solid #00d4ff; color:#00d4ff; font-family:'Outfit'; font-size:10px; font-weight:600; padding:5px; border-radius:4px; cursor:pointer; width:100%; margin-top:5px; transition:all 0.2s;">Analyze Prism Spectrum</button>
                ` : `
                    <p style="margin:4px 0 0 0; color:#00ffaa; font-size:9px; font-style:italic;">Spectrum analyzed! Bluer stars peak in short wavelengths (UV/blue) and are hot; redder stars peak in long wavelengths (red/IR) and are cool.</p>
                `}
            </div>
        `;
    } else if (hrState.analyzerTab === 'filters') {
        tabContent = `
            <div style="font-family:'Outfit'; font-size:10px;">
                <p style="margin:0 0 4px 0; font-size:9px; color:rgba(255,255,255,0.5);">Astronomers use B (Blue) and V (Visual) filters. The difference (B-V) is the Color Index.</p>
                
                <div style="display:flex; gap:8px; margin:6px 0;">
                    <button class="hr-btn filter-toggle-btn ${hrState.activeFilter === 'B' ? 'active' : ''}" data-filter="B" style="flex:1; padding:5px; border-radius:4px; font-family:'Outfit'; font-size:9.5px; font-weight:600; border:1px solid ${hrState.activeFilter === 'B' ? '#00d4ff' : 'rgba(255,255,255,0.2)'}; background:${hrState.activeFilter === 'B' ? 'rgba(0,212,255,0.2)' : 'transparent'}; color:#fff; cursor:pointer;">Blue Filter (B)</button>
                    <button class="hr-btn filter-toggle-btn ${hrState.activeFilter === 'V' ? 'active' : ''}" data-filter="V" style="flex:1; padding:5px; border-radius:4px; font-family:'Outfit'; font-size:9.5px; font-weight:600; border:1px solid ${hrState.activeFilter === 'V' ? '#00ffaa' : 'rgba(255,255,255,0.2)'}; background:${hrState.activeFilter === 'V' ? 'rgba(0,255,170,0.2)' : 'transparent'}; color:#fff; cursor:pointer;">Visual Filter (V)</button>
                </div>
                
                <div style="display:flex; justify-content:space-between; margin-top:4px;">
                    <span>Blue Apparent Mag (m<sub>B</sub>):</span>
                    <span style="font-family:'Fira Code'; font-weight:bold;">${hrState.filterBClicked ? m_B.toFixed(2) : '--'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:2px;">
                    <span>Visual Apparent Mag (m<sub>V</sub>):</span>
                    <span style="font-family:'Fira Code'; font-weight:bold;">${hrState.filterVClicked ? m_V.toFixed(2) : '--'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:4px; border-top:1px dashed rgba(255,255,255,0.1); padding-top:4px;">
                    <span>Color Index (B - V):</span>
                    <span style="font-family:'Fira Code'; font-weight:bold; color:#ffd700;">${(hrState.filterBClicked && hrState.filterVClicked) ? star.bv.toFixed(2) : '--'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:2px;">
                    <span>Estimated Temp (T):</span>
                    <span style="font-family:'Fira Code'; font-weight:bold; color:#ffd700;">${(hrState.filterBClicked && hrState.filterVClicked) ? temp.toLocaleString() + ' K' : '-- K'}</span>
                </div>
                
                ${(hrState.filterBClicked && hrState.filterVClicked) ? `
                    <p style="margin:4px 0 0 0; color:#00ffaa; font-size:9px; font-style:italic;">Filters measured! Temperature is calculated using Ballesteros' formula from the color index.</p>
                ` : `
                    <p style="margin:4px 0 0 0; color:rgba(255,255,255,0.4); font-size:9px;">Toggle both B and V filters to measure the color index.</p>
                `}
            </div>
        `;
    } else if (hrState.analyzerTab === 'luminosity') {
        if (!isPleiades) {
            tabContent = `
                <div style="font-family:'Outfit'; font-size:10px;">
                    <p style="margin:0 0 4px 0; font-size:9px; color:rgba(255,255,255,0.5);">Since this star is nearby, we measure its parallax to calculate its distance and absolute magnitude (true brightness).</p>
                    
                    <div style="display:flex; justify-content:space-between; margin-top:4px;">
                        <span>Parallax (π):</span>
                        <span style="font-family:'Fira Code';">${star.parallax.toFixed(4)}"</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:2px;">
                        <span>Calculated Distance (d):</span>
                        <span style="font-family:'Fira Code';">1/π = <strong>${dist} pc</strong></span>
                    </div>
                    <p style="margin:4px 0 2px 0; border-top:1px solid rgba(255,255,255,0.08); padding-top:3px; font-size:9px; color:rgba(255,255,255,0.6);"><strong>Absolute Mag (M):</strong></p>
                    <p style="margin:2px 0; font-family:'Fira Code'; font-size:9px; color:#ffd700; background:rgba(0,0,0,0.25); padding:2px 4px; border-radius:4px; text-align:center;">M = m - 5 log<sub>10</sub>(d) + 5 = <strong>${star.absMag.toFixed(2)}</strong></p>
                    <p style="margin:4px 0 0 0; color:#00ffaa; font-size:9px;">Plotting Temperature (X) vs Luminosity (Y) defines the Main Sequence calibration curve!</p>
                </div>
            `;
        } else {
            tabContent = `
                <div style="font-family:'Outfit'; font-size:10px;">
                    <p style="margin:0 0 4px 0; font-size:9px; color:rgba(255,255,255,0.5);">This star is too distant for parallax. We only know its apparent visual brightness (m = ${m_V.toFixed(2)}) and color (B-V = ${star.bv.toFixed(2)}).</p>
                    <div style="display:flex; justify-content:space-between; margin-top:4px;">
                        <span>Apparent visual mag (m):</span>
                        <span style="font-family:'Fira Code';">${m_V.toFixed(2)} mag</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:2px;">
                        <span>Parallax (π):</span>
                        <span style="font-family:'Fira Code'; color:#ff7777;">&lt; 0.002" (Too small!)</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:2px;">
                        <span>Absolute Mag (M):</span>
                        <span style="font-family:'Fira Code'; color:#ff7777;">Unknown</span>
                    </div>
                    <p style="margin:4px 0 0 0; color:#ffd700; font-size:9.5px; font-style:italic; line-height:1.3;">But because it has the same color index (B-V) as calibration stars, we assume it has the same absolute magnitude! By shifting them to fit the calibrated curve, we find the distance modulus.</p>
                </div>
            `;
        }
    }
    
    // Details header with star name
    const starColorClass = isPleiades ? '#ffd700' : '#00d4ff';
    const starType = isPleiades ? 'Pleiades Star' : 'Nearby Calibrator';
    
    details.innerHTML = `
        <h4 style="margin:0 0 6px 0; color:${starColorClass}; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">${star.name} (${starType})</h4>
        ${tabsHtml}
        <div id="hr-analyzer-content" style="min-height:115px;">
            ${tabContent}
        </div>
    `;
    
    // Bind Tab Click Listeners
    const tabs = details.querySelectorAll('.hr-analyzer-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            hrState.analyzerTab = tab.getAttribute('data-tab');
            hrState.activeFilter = 'none'; // reset filter on tab switch
            showHRStarDetails(index);
            drawHRTelescope();
        });
    });
    
    // Bind Analyze Spectrum button listener
    const analyzeBtn = document.getElementById('hr-btn-analyze-spec');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', () => {
            hrState.activeFilter = 'prism';
            drawHRTelescope();
            animateStarSpectrum(document.getElementById('hr-spec-canvas'), star.bv);
        });
    }
    
    // Bind Filter Toggles
    const filterBtns = details.querySelectorAll('.filter-toggle-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            if (hrState.activeFilter === filter) {
                hrState.activeFilter = 'none';
            } else {
                hrState.activeFilter = filter;
                if (filter === 'B') hrState.filterBClicked = true;
                if (filter === 'V') hrState.filterVClicked = true;
            }
            showHRStarDetails(index);
            drawHRTelescope();
        });
    });
    
    // Render spectrum canvas if in spectrum tab
    if (hrState.analyzerTab === 'spectrum') {
        const canvas = document.getElementById('hr-spec-canvas');
        if (canvas) {
            if (hrState.spectrumAnalyzed) {
                drawStarSpectrum(canvas, star.bv, 1.0);
            } else {
                // Draw a flat baseline until analyzed
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, canvas.height - 15);
                ctx.lineTo(canvas.width, canvas.height - 15);
                ctx.stroke();
                
                // Draw visible spectrum band at the bottom
                const rainbowGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
                // visible band starts at x = (380-150)/850 * w = 27.1%
                // ends at x = (750-150)/850 * w = 70.6%
                rainbowGrad.addColorStop(0, '#000');
                rainbowGrad.addColorStop(0.25, '#000');
                rainbowGrad.addColorStop(0.27, '#3f007f'); // Violet (380nm)
                rainbowGrad.addColorStop(0.34, '#0000ff'); // Blue (440nm)
                rainbowGrad.addColorStop(0.41, '#00ffff'); // Cyan (500nm)
                rainbowGrad.addColorStop(0.47, '#00ff00'); // Green (550nm)
                rainbowGrad.addColorStop(0.53, '#ffff00'); // Yellow (600nm)
                rainbowGrad.addColorStop(0.59, '#ff7f00'); // Orange (650nm)
                rainbowGrad.addColorStop(0.65, '#ff0000'); // Red (700nm)
                rainbowGrad.addColorStop(0.71, '#500000'); // Deep red (750nm)
                rainbowGrad.addColorStop(0.73, '#000');
                rainbowGrad.addColorStop(1, '#000');
                ctx.fillStyle = rainbowGrad;
                ctx.fillRect(0, canvas.height - 8, canvas.width, 8);
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.font = '7.5px monospace';
                ctx.textAlign = 'center';
                ctx.fillText("150nm", 15, canvas.height - 12);
                ctx.fillText("575nm", canvas.width * 0.5, canvas.height - 12);
                ctx.fillText("1000nm", canvas.width - 20, canvas.height - 12);
            }
        }
    }
    
    // Check if fully analyzed
    const isAnalyzed = hrState.spectrumAnalyzed && hrState.filterBClicked && hrState.filterVClicked;
    
    plotBtn.disabled = !isAnalyzed;
    plotBtn.textContent = isAnalyzed 
        ? (!isPleiades ? "Plot Reference Star" : "Plot Observed Star")
        : "Complete Analysis to Plot";
    
    updateHRUIState();
}
function drawHRTelescope() {
    const canvas = document.getElementById('hr-telescope-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = 230;
    canvas.height = 230;
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const rView = 100;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#020715';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rView, 0, Math.PI * 2);
    ctx.clip();
    
    const isPleiades = (hrState.step >= 3) || (hrState.step === 2 && hrState.pointedToPleiades);
    
    if (isPleiades) {
        // Draw Pleiades background - beautiful blue reflection nebula
        const nebGrad = ctx.createRadialGradient(cx + 10, cy - 10, 5, cx, cy, rView);
        nebGrad.addColorStop(0, 'rgba(0, 160, 255, 0.35)');
        nebGrad.addColorStop(0.5, 'rgba(0, 100, 255, 0.15)');
        nebGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = nebGrad;
        ctx.fillRect(cx - rView, cy - rView, rView * 2, rView * 2);
        
        const nebGrad2 = ctx.createRadialGradient(cx - 30, cy + 20, 2, cx - 20, cy + 20, 50);
        nebGrad2.addColorStop(0, 'rgba(0, 200, 255, 0.25)');
        nebGrad2.addColorStop(1, 'transparent');
        ctx.fillStyle = nebGrad2;
        ctx.fillRect(cx - rView, cy - rView, rView * 2, rView * 2);
    } else {
        // Draw Hyades background - warm dust glow
        const nebGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rView);
        nebGrad.addColorStop(0, 'rgba(235, 137, 50, 0.12)');
        nebGrad.addColorStop(0.6, 'rgba(100, 50, 255, 0.05)');
        nebGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = nebGrad;
        ctx.fillRect(cx - rView, cy - rView, rView * 2, rView * 2);
    }
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - rView, cy);
    ctx.lineTo(cx + rView, cy);
    ctx.moveTo(cx, cy - rView);
    ctx.lineTo(cx, cy + rView);
    ctx.stroke();
    
    const starsList = isPleiades ? hrState.pleiadesStars : hrState.hyadesStars;
    
    starsList.forEach((s, idx) => {
        const x = cx + s.dx;
        const y = cy + s.dy;
        
        const isHovered = hrState.hoveredStarIndex === idx;
        const isSelected = hrState.selectedStarIndex === idx;
        
        // Calculate size based on filter (simulate physical color response)
        let sizeScale = 1.0;
        if (hrState.activeFilter === 'B') {
            // Bluer stars (lower B-V) appear relatively larger in Blue filter
            sizeScale = Math.max(0.4, 1.0 - (s.bv) * 0.35);
        } else if (hrState.activeFilter === 'V') {
            // Visual filter matches appMag
            sizeScale = 1.0;
        } else if (hrState.activeFilter === 'prism') {
            sizeScale = 0.9; // subtle dimming through prism dispersion
        }
        const activeRadius = s.r * sizeScale;
        
        if (s.plotted) {
            const haloColor = isPleiades ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 212, 255, 0.35)';
            const halo = ctx.createRadialGradient(x, y, 1, x, y, activeRadius * 2.5);
            halo.addColorStop(0, haloColor);
            halo.addColorStop(1, 'transparent');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(x, y, activeRadius * 2.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const pulse = 1 + 0.25 * Math.sin(Date.now() * 0.005 + idx);
            let baseHaloColor = isPleiades ? 'rgba(0, 170, 255, 0.4)' : 'rgba(255, 200, 100, 0.45)';
            // Overlay filter color on halos
            if (hrState.activeFilter === 'B') baseHaloColor = 'rgba(0, 120, 255, 0.5)';
            else if (hrState.activeFilter === 'V') baseHaloColor = 'rgba(150, 255, 0, 0.4)';
            
            const halo = ctx.createRadialGradient(x, y, 1, x, y, activeRadius * 3 * pulse);
            halo.addColorStop(0, baseHaloColor);
            halo.addColorStop(1, 'transparent');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(x, y, activeRadius * 3 * pulse, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (isHovered && !s.plotted) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, activeRadius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (isSelected) {
            ctx.strokeStyle = isPleiades ? '#ffd700' : '#00d4ff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, activeRadius + 6, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x - activeRadius - 10, y); ctx.lineTo(x - activeRadius - 4, y);
            ctx.moveTo(x + activeRadius + 4, y); ctx.lineTo(x + activeRadius + 10, y);
            ctx.moveTo(x, y - activeRadius - 10); ctx.lineTo(x, y - activeRadius - 4);
            ctx.moveTo(x, y + activeRadius + 4); ctx.lineTo(x, y + activeRadius + 10);
            ctx.stroke();
            
            // Draw diffraction rainbow if active filter is prism
            if (hrState.activeFilter === 'prism') {
                const grad = ctx.createLinearGradient(x + activeRadius + 8, y, x + activeRadius + 40, y);
                // Warm/Cool stars have slightly different diffraction patterns peaking in bluer/redder colors
                if (s.bv < 0.3) {
                    // Hot blue star: peaks bluer
                    grad.addColorStop(0, 'rgba(0, 80, 255, 0.8)');
                    grad.addColorStop(0.3, 'rgba(0, 255, 120, 0.7)');
                    grad.addColorStop(0.6, 'rgba(255, 255, 0, 0.5)');
                    grad.addColorStop(0.9, 'rgba(255, 0, 0, 0.2)');
                    grad.addColorStop(1, 'transparent');
                } else {
                    // Cool red/yellow star: peaks redder
                    grad.addColorStop(0, 'rgba(0, 0, 255, 0.2)');
                    grad.addColorStop(0.3, 'rgba(0, 255, 0, 0.5)');
                    grad.addColorStop(0.6, 'rgba(255, 255, 0, 0.7)');
                    grad.addColorStop(0.9, 'rgba(255, 0, 0, 0.8)');
                    grad.addColorStop(1, 'transparent');
                }
                ctx.fillStyle = grad;
                ctx.fillRect(x + activeRadius + 8, y - 2, 32, 4);
            }
        }
        
        let starColor = '#ffffff';
        if (s.bv < 0.0) {
            starColor = '#a5f3fc'; // Cyan blue-white
        } else if (s.bv < 0.3) {
            starColor = '#f8fafc'; // Bright white
        } else if (s.bv < 0.7) {
            starColor = '#fef08a'; // Yellow
        } else if (s.bv < 1.2) {
            starColor = '#fed7aa'; // Orange
        } else {
            starColor = '#fca5a5'; // Red-orange
        }
        ctx.fillStyle = starColor;
        
        ctx.beginPath();
        ctx.arc(x, y, activeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        if (s.plotted && (hrState.step < 3)) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '8px Fira Code';
            ctx.textAlign = 'center';
            ctx.fillText("✓", x, y - activeRadius - 4);
        }
    });

    // Draw active filter tint overlay before restore() so it's clipped to viewfinder circle
    if (hrState.activeFilter === 'B') {
        ctx.fillStyle = 'rgba(0, 100, 255, 0.15)';
        ctx.fillRect(cx - rView, cy - rView, rView * 2, rView * 2);
    } else if (hrState.activeFilter === 'V') {
        ctx.fillStyle = 'rgba(180, 255, 0, 0.08)';
        ctx.fillRect(cx - rView, cy - rView, rView * 2, rView * 2);
    } else if (hrState.activeFilter === 'prism') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(cx - rView, cy - rView, rView * 2, rView * 2);
    }
    
    // Draw tooltip for hovered star (clipped inside viewfinder)
    if (hrState.hoveredStarIndex !== null) {
        const hStar = starsList[hrState.hoveredStarIndex];
        const hx = cx + hStar.dx;
        const hy = cy + hStar.dy;
        
        ctx.font = "bold 8.5px 'Outfit', sans-serif";
        const text = hStar.name;
        const textWidth = ctx.measureText(text).width;
        
        const padX = 6;
        const padY = 4;
        const rectW = textWidth + padX * 2;
        const rectH = 14;
        
        const rx = hx - rectW / 2;
        const ry = hy - hStar.r - 20; // Position above the star
        
        // Tooltip box
        ctx.fillStyle = 'rgba(11, 16, 34, 0.9)';
        ctx.strokeStyle = isPleiades ? 'rgba(255, 215, 0, 0.65)' : 'rgba(0, 212, 255, 0.7)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(rx, ry, rectW, rectH, 3);
        } else {
            ctx.rect(rx, ry, rectW, rectH);
        }
        ctx.fill();
        ctx.stroke();
        
        // Tooltip text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, hx, ry + rectH / 2 + 0.5);
    }
    
    ctx.restore();
    
    const input = document.getElementById('input-dist_mod');
    const modVal = input ? parseFloat(input.value) : 5.0;
    const isCorrect = Math.abs(modVal - 5.67) < 0.1;
    
    const isLocked = hrState.step === 4;
    ctx.strokeStyle = isLocked ? '#00ffaa' : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, rView, 0, Math.PI * 2);
    ctx.stroke();
    
    if (isLocked) {
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, rView + 10, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#00ffaa';
        ctx.font = "bold 9px 'Outfit'";
        ctx.textAlign = 'center';
        ctx.fillText("LOCK", cx, cy - rView - 15);
    }
}

function updateHRUIState() {
    const input = document.getElementById('input-dist_mod');
    const stepIndicator = document.getElementById('hr-step-indicator');
    const instrText = document.getElementById('hr-instr-text');
    const btnPlot = document.getElementById('hr-btn-plot-star');
    const btnAction = document.getElementById('hr-btn-action');
    const successBox = document.getElementById('hr-telescope-success');
    const modVal = input ? parseFloat(input.value) : 5.0;
    const isCorrect = Math.abs(modVal - 5.67) < 0.1;
    
    const isStarSelected = hrState.selectedStarIndex !== null;
    const details = document.getElementById('hr-star-details');
    
    // Toggle details vs instructions visibility
    if (details) {
        details.style.display = isStarSelected ? 'block' : 'none';
    }
    if (stepIndicator) {
        stepIndicator.style.display = isStarSelected ? 'none' : 'block';
    }
    if (instrText) {
        const showInstr = !isStarSelected && (hrState.step !== 4);
        instrText.style.display = showInstr ? 'block' : 'none';
    }
    
    if (input) {
        if (hrState.step === 1 || hrState.step === 2) {
            input.disabled = true;
            input.classList.add('slider-locked');
        } else {
            input.disabled = false;
            input.classList.remove('slider-locked');
        }
    }
    
    if (hrState.step === 1) {
        const plottedCount = hrState.hyadesStars.filter(s => s.plotted).length;
        if (stepIndicator) stepIndicator.textContent = "Step 1 of 4: Calibrate Baseline";
        if (instrText) {
            instrText.innerHTML = `Click the glowing stars in the viewfinder to measure their distance via parallax and plot their true brightness (Absolute Mag, M). We must observe at least one star from each section (Supergiant, Giant, Main Sequence, White Dwarf) to build a complete H-R Diagram map. <br><strong>Progress: ${plottedCount} / ${hrState.hyadesStars.length} stars plotted.</strong>`;
        }
        if (btnPlot) btnPlot.style.display = isStarSelected ? 'block' : 'none';
        if (btnAction) btnAction.style.display = 'none';
        if (successBox) successBox.style.display = 'none';
        
    } else if (hrState.step === 2) {
        const plottedCount = hrState.pleiadesStars.filter(s => s.plotted).length;
        if (stepIndicator) stepIndicator.textContent = "Step 2 of 4: Observe Pleiades";
        
        const telescopeHeader = document.getElementById('hr-telescope-header');
        if (telescopeHeader) {
            if (hrState.pointedToPleiades) {
                telescopeHeader.textContent = "Telescope Viewfinder: Pleiades Cluster (M45)";
            } else {
                telescopeHeader.textContent = "Telescope Viewfinder: Hyades Cluster";
            }
        }
        
        if (!hrState.pointedToPleiades) {
            if (instrText) {
                instrText.innerHTML = `Great! The Hyades baseline curve is now calibrated. Now, point your telescope to the distant Pleiades cluster to observe its apparent magnitudes.`;
            }
            if (btnPlot) btnPlot.style.display = 'none';
            if (btnAction) {
                btnAction.style.display = 'block';
                btnAction.textContent = "Point Telescope to Pleiades →";
            }
            if (successBox) successBox.style.display = 'none';
        } else {
            if (instrText) {
                instrText.innerHTML = `Click the glowing stars in the Pleiades cluster to measure their color index (B-V) and Apparent Magnitude (m). Since they are far, parallax is below detection limit. <br><strong>Progress: ${plottedCount} / ${hrState.pleiadesStars.length} stars plotted.</strong>`;
            }
            
            // Manage button visibility
            if (isStarSelected) {
                if (btnPlot) btnPlot.style.display = plottedCount < hrState.pleiadesStars.length ? 'block' : 'none';
                if (btnAction) btnAction.style.display = 'none';
            } else {
                if (btnPlot) btnPlot.style.display = 'none';
                if (plottedCount >= 5) {
                    if (instrText) {
                        instrText.innerHTML = `You have observed ${plottedCount} Pleiades stars. They are plotted on the H-R Diagram as yellow dots. Click 'Start Curve Fitting' to align the sequences (stable main sequence stars align to the calibration trendline, while giants, supergiants, and white dwarfs sit in their own regions).`;
                    }
                    if (btnAction) {
                        btnAction.style.display = 'block';
                        btnAction.textContent = "Start Curve Fitting →";
                    }
                } else {
                    if (btnAction) btnAction.style.display = 'none';
                }
            }
            if (successBox) successBox.style.display = 'none';
        }
    } else if (hrState.step === 3 || hrState.step === 4) {
        if (stepIndicator) {
            stepIndicator.textContent = hrState.step === 3 ? "Step 3 of 4: Align Main Sequences" : "Step 4 of 4: Calculate Distance";
        }
        
        if (btnPlot) btnPlot.style.display = 'none';
        if (btnAction) btnAction.style.display = 'none';
        
        const telescopeHeader = document.getElementById('hr-telescope-header');
        if (telescopeHeader) telescopeHeader.textContent = "Telescope Viewfinder: Pleiades Cluster (M45)";
        
        if (isCorrect) {
            hrState.step = 4;
            if (stepIndicator) stepIndicator.textContent = "Step 4 of 4: Calculate Distance";
            if (instrText) instrText.style.display = 'none';
            if (successBox) successBox.style.display = 'block';
        } else {
            hrState.step = 3;
            if (instrText) {
                instrText.style.display = 'block';
                instrText.innerHTML = `Current Modulus: <strong>${modVal.toFixed(2)} mag</strong>. Slide the <strong>Distance Modulus (m-M)</strong> slider in the notebook sidebar to vertically align the Pleiades stars with the Hyades calibration trendline.`;
            }
            if (successBox) successBox.style.display = 'none';
        }
    }
    
    function getStarColor(bv, alpha = 1.0) {
        if (bv < 0.0) return `rgba(165, 243, 252, ${alpha})`; // Cyan blue-white
        if (bv < 0.3) return `rgba(248, 250, 252, ${alpha})`; // Bright white
        if (bv < 0.7) return `rgba(254, 240, 138, ${alpha})`; // Yellow
        if (bv < 1.2) return `rgba(254, 215, 170, ${alpha})`; // Orange
        return `rgba(252, 165, 165, ${alpha})`; // Red-orange
    }
    
    const hyadesPlottedStars = hrState.hyadesStars.filter(s => s.plotted);
    const hyadesPoints = hyadesPlottedStars.map(s => ({ x: s.bv, y: s.absMag }));
    hrChart.data.datasets[0].data = hyadesPoints;
    hrChart.data.datasets[0].backgroundColor = hyadesPlottedStars.map(s => getStarColor(s.bv, 0.8));
    hrChart.data.datasets[0].borderColor = hyadesPlottedStars.map(s => getStarColor(s.bv, 1.0));
    
    const hyadesPlottedCount = hrState.hyadesStars.filter(s => s.plotted).length;
    hrChart.data.datasets[1].hidden = (hyadesPlottedCount < hrState.hyadesStars.length);
    
    const pleiadesPlottedStars = hrState.pleiadesStars.filter(s => s.plotted);
    const pleiadesPlottedPoints = pleiadesPlottedStars.map(s => {
        const yVal = hrState.step >= 3 ? (s.appMag - modVal) : s.appMag;
        return { x: s.bv, y: yVal };
    });
    hrChart.data.datasets[2].data = pleiadesPlottedPoints;
    
    if (hrState.step >= 3) {
        const backgroundPoints = pleiadesData.map(d => ({ x: d.bv, y: d.m - modVal }));
        hrChart.data.datasets[3].data = backgroundPoints;
    } else {
        hrChart.data.datasets[3].data = [];
    }
    
    if (hrState.step === 4) {
        hrChart.data.datasets[2].borderColor = '#00ffaa';
        hrChart.data.datasets[2].backgroundColor = 'rgba(0, 255, 170, 0.85)';
        hrChart.data.datasets[3].borderColor = 'rgba(0, 255, 170, 0.25)';
        hrChart.data.datasets[3].backgroundColor = 'rgba(0, 255, 170, 0.15)';
    } else {
        hrChart.data.datasets[2].backgroundColor = pleiadesPlottedStars.map(s => getStarColor(s.bv, 0.8));
        hrChart.data.datasets[2].borderColor = pleiadesPlottedStars.map(s => getStarColor(s.bv, 1.0));
        
        if (hrState.step >= 3) {
            hrChart.data.datasets[3].backgroundColor = pleiadesData.map(d => getStarColor(d.bv, 0.15));
            hrChart.data.datasets[3].borderColor = pleiadesData.map(d => getStarColor(d.bv, 0.25));
        }
    }
    
    hrChart.update('none');
}

function initRung10UI() {
    const viewport = document.getElementById('viewport-container');
    let ui = document.getElementById('r9-ui-container');
    
    // Create UI if it doesn't exist
    if (!ui) {
        ui = document.createElement('div');
        ui.id = 'r9-ui-container';
        
        ui.innerHTML = `
            <!-- Telescope Panel -->
            <div class="r9-panel" id="r9-telescope-panel">
                <div class="r9-panel-header">TELESCOPE: SMALL MAGELLANIC CLOUD</div>
                <div class="r9-telescope-layout">
                    <div class="r9-viewfinder-container">
                        <canvas id="r9-telescope-canvas"></canvas>
                    </div>
                    <div id="r9-telescope-instructions" style="text-align:center;">
                        <p id="r9-instr-text" style="color:#fff; font-family:'Outfit'; font-size:11px; margin-bottom:5px; min-height:33px;">Click Stars A, B, and C in the viewfinder and use the Apparent Mag. slider to measure them.</p>
                        <button class="r9-btn" id="r9-btn-plot" disabled>PLOT STAR</button>
                        <div id="r9-telescope-success" class="r9-instruction-box success" style="display:none;">
                            <h4>SMC Cepheids: Calibrated!</h4>
                            <p>We know the SMC distance from previous methods.<br>Thus, Apparent Mag (m) reveals True Brightness (M).<br>Click 'Observe Andromeda V1'.</p>
                        </div>
                        <button class="r9-btn" id="r9-btn-observe-v1" style="display:none; margin-top:10px;">OBSERVE ANDROMEDA V1 →</button>
                        <button class="r9-btn" id="r9-btn-back-smc" style="display:none; margin-top:10px;">← BACK TO SMC</button>
                    </div>
                </div>
            </div>
            
            <!-- Light Curve Panel -->
            <div class="r9-panel" id="r9-lc-panel">
                <div class="r9-panel-header" id="r9-lc-header">Light Curve: Select a Star</div>
                <div class="r9-canvas-container">
                    <canvas id="r9-lc-canvas"></canvas>
                </div>
            </div>
            
            <!-- Period-Luminosity Panel -->
            <div class="r9-panel" id="r9-pl-panel">
                <div class="r9-panel-header">Period-Luminosity Diagram</div>
                <div class="r9-canvas-container">
                    <canvas id="r9-pl-canvas"></canvas>
                </div>
                <div id="r9-pl-instructions" class="r9-instruction-box" style="display:none;">
                    <h4>Use the graph to find Andromeda V1's Absolute Magnitude.</h4>
                    <p>Move the Absolute Mag (M) slider in the sidebar to match the graph's prediction (M = -5.50) and calculate distance.</p>
                </div>
            </div>
        `;
        viewport.appendChild(ui);
        
        // Add event listeners to new buttons
        document.getElementById('r9-btn-plot').addEventListener('click', () => {
            if (r9State.selectedStar && !r9State.plottedStars.includes(r9State.selectedStar)) {
                r9State.plottedStars.push(r9State.selectedStar);
                if (r9State.plottedStars.length === 3) {
                    r9State.showSuccessPhase1 = true;
                    document.getElementById('r9-telescope-success').style.display = 'block';
                    document.getElementById('r9-btn-observe-v1').style.display = 'inline-block';
                    document.getElementById('r9-btn-plot').style.display = 'none';
                    updateR10PLChart(); // Switch to showing Absolute Mag axis
                }
                updateR10PLChart();
            }
        });
        
        document.getElementById('r9-btn-observe-v1').addEventListener('click', () => {
            r9State.phase = 2;
            r9State.selectedStar = 'V1';
            r9State.cameraTransitionActive = true;
            
            // UI updates
            document.querySelector('#r9-telescope-panel .r9-panel-header').textContent = 'TELESCOPE: ANDROMEDA GALAXY';
            document.getElementById('r9-telescope-success').style.display = 'none';
            document.getElementById('r9-btn-observe-v1').style.display = 'none';
            document.getElementById('r9-btn-back-smc').style.display = 'inline-block';
            document.getElementById('r9-pl-instructions').style.display = 'block';
            
            const inputs = document.querySelectorAll('#controls-container input');
            if (inputs.length >= 3) {
                inputs[0].value = 17.00;
                document.getElementById('val-app_mag').textContent = "17.00 mag";
                inputs[1].value = 10.0;
                document.getElementById('val-period').textContent = "10.0 days";
                inputs[2].value = -4.00;
                document.getElementById('val-abs_mag').textContent = "-4.00 mag";
                updateCalculation();
            }
            updateR10PLChart();
        });
        
        document.getElementById('r9-btn-back-smc').addEventListener('click', () => {
            r9State.phase = 1;
            r9State.selectedStar = 'A';
            r9State.cameraTransitionActive = true;
            
            document.querySelector('#r9-telescope-panel .r9-panel-header').textContent = 'TELESCOPE: SMALL MAGELLANIC CLOUD';
            document.getElementById('r9-telescope-success').style.display = 'block';
            document.getElementById('r9-btn-observe-v1').style.display = 'inline-block';
            document.getElementById('r9-btn-back-smc').style.display = 'none';
            document.getElementById('r9-pl-instructions').style.display = 'none';
            updateR10PLChart();
            updateCalculation();
        });
        
        // Setup Telescope Canvas click interactions
        const tCanvas = document.getElementById('r9-telescope-canvas');
        tCanvas.addEventListener('click', (e) => {
            const rect = tCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const rView = Math.min(rect.width, rect.height) / 2 - 10;
            
            if (r9State.phase === 1) {
                const starAPos = { x: cx - 0.55 * rView, y: cy + 0.3 * rView };
                const starBPos = { x: cx + 0.1 * rView, y: cy - 0.5 * rView };
                const starCPos = { x: cx + 0.55 * rView, y: cy + 0.3 * rView };
                
                if (Math.hypot(x - starAPos.x, y - starAPos.y) < 25) r9State.selectedStar = 'A';
                else if (Math.hypot(x - starBPos.x, y - starBPos.y) < 25) r9State.selectedStar = 'B';
                else if (Math.hypot(x - starCPos.x, y - starCPos.y) < 25) r9State.selectedStar = 'C';
                
                updateR10UIState();
                updateCalculation();
            } else if (r9State.phase === 2) {
                if (Math.hypot(x - cx, y - cy) < 25) r9State.selectedStar = 'V1';
            }
        });
        
        // Initialize Charts
        initR9Charts();
    }
    
    ui.style.display = 'grid'; // show
    
    // Initial UI state sync
    updateR10UIState();
}

function updateR10UIState() {
    // Automatically set and manage the Absolute Magnitude slider in accordance with preexisting knowledge for Phase 1
    const inputs = document.querySelectorAll('#controls-container input');
    if (inputs.length >= 3 && r9State.selectedStar) {
        const trueAbs = r9State.points[r9State.selectedStar].M;
        if (r9State.phase === 1) {
            inputs[2].value = trueAbs;
            const absDisplay = document.getElementById('val-abs_mag');
            if (absDisplay) absDisplay.textContent = trueAbs.toFixed(2) + " mag";
            inputs[2].disabled = true;
            inputs[2].classList.add('slider-locked');
            inputs[2].classList.remove('slider-correct');
        } else {
            inputs[2].disabled = false;
            inputs[2].classList.remove('slider-locked');
        }
    }

    if (r9State.phase === 1) {
        const btnPlot = document.getElementById('r9-btn-plot');
        const instrText = document.getElementById('r9-instr-text');
        
        if (btnPlot) {
            if (r9State.selectedStar && !r9State.plottedStars.includes(r9State.selectedStar)) {
                const inputs = document.querySelectorAll('#controls-container input');
                const info = cepheidData[r9State.selectedStar];
                if (inputs.length >= 2) {
                    const userAppMag = parseFloat(inputs[0].value);
                    const userPeriod = parseFloat(inputs[1].value);
                    
                    const magMatch = Math.abs(userAppMag - info.meanM) < 0.1;
                    const periodMatch = Math.abs(userPeriod - info.period) < 0.5;
                    
                    if (magMatch && periodMatch) {
                        btnPlot.disabled = false;
                        if (instrText) {
                            instrText.innerHTML = `<span style="color:#00ffaa; font-weight:bold;">Both measurements match!</span> Click 'Plot Star' to record the data.`;
                        }
                    } else if (!magMatch) {
                        btnPlot.disabled = true;
                        if (instrText) {
                            instrText.innerHTML = `Selected: <strong>${info.name}</strong>.<br/>1. Slide the <strong>Apparent Mag. (m)</strong> slider to match the mean of its light curve (~${info.meanM.toFixed(2)} mag).`;
                        }
                    } else {
                        btnPlot.disabled = true;
                        if (instrText) {
                            instrText.innerHTML = `Magnitude matched! Now slide the <strong>Period (P)</strong> slider to match the star's period (~${info.period.toFixed(1)} days) observed from peak-to-peak.`;
                        }
                    }
                } else {
                    btnPlot.disabled = true;
                }
            } else if (r9State.selectedStar) {
                const info = cepheidData[r9State.selectedStar];
                btnPlot.disabled = true;
                if (instrText) {
                    instrText.innerHTML = `<strong>${info.name}</strong> has been successfully plotted! Select another star to measure.`;
                }
            } else {
                btnPlot.disabled = true;
                if (instrText) {
                    instrText.innerHTML = `Click Stars A, B, and C in the viewfinder and use the Apparent Mag. and Period sliders to measure them.`;
                }
            }
        }
    }
    
    // Update Light Curve Chart based on selected star
    if (r9State.selectedStar) {
        const info = cepheidData[r9State.selectedStar];
        document.getElementById('r9-lc-header').textContent = `Light Curve: ${info.name}`;
        
        // Generate light curve data using Time (days) on x-axis
        const pts = [];
        for (let p = 0; p <= 2.2; p += 0.05) {
            const t = p * info.period;
            const am = info.meanM - info.amp * getCepheidFactor(r9State.selectedStar, p);
            pts.push({ x: t, y: am });
        }
        r9LcChart.data.datasets[0].data = pts;
        
        // Set dynamic min and max for both axes to keep the curve centered
        if (r9LcChart) {
            r9LcChart.options.scales.x.min = 0;
            r9LcChart.options.scales.x.max = 2.0 * info.period;
            r9LcChart.options.scales.x.title.text = 'Time (days)';
            
            r9LcChart.options.scales.y.min = info.meanM - info.amp - 0.5;
            r9LcChart.options.scales.y.max = info.meanM + info.amp + 0.5;
        }
        r9LcChart.update();
    }
}

function initR9Charts() {
    Chart.defaults.color = '#a0aec0';
    Chart.defaults.font.family = "'Outfit', sans-serif";
    
    // Light Curve Chart
    const ctxLc = document.getElementById('r9-lc-canvas').getContext('2d');
    r9LcChart = new Chart(ctxLc, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Apparent Magnitude',
                data: [],
                borderColor: '#fb923c',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4
            }, {
                // Phase indicator dot (animated)
                label: 'Current Phase',
                data: [{x: 0, y: 0}],
                backgroundColor: '#fb923c',
                pointRadius: 6,
                pointHoverRadius: 6
            }, {
                // Apparent Magnitude Guide Line (interactive)
                label: 'Measured Apparent Mag',
                type: 'line',
                data: [],
                borderColor: 'rgba(255, 255, 255, 0.5)',
                borderDash: [5, 5],
                borderWidth: 1.5,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: {
                    type: 'linear', min: 0, max: 2,
                    title: { display: true, text: 'Phase (Periods)' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                y: {
                    reverse: true, // Magnitudes are reversed!
                    title: { display: true, text: 'Apparent Mag (m)' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Period-Luminosity Chart
    const ctxPl = document.getElementById('r9-pl-canvas').getContext('2d');
    r9PlChart = new Chart(ctxPl, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'SMC Cepheids (Plotted)',
                    data: [],
                    backgroundColor: '#fb923c',
                    pointRadius: 6
                },
                {
                    label: 'Trend Line',
                    type: 'line',
                    data: [],
                    borderColor: '#00ffaa',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4
                },
                {
                    label: 'Slider Trace',
                    type: 'line',
                    data: [],
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderDash: [5, 5],
                    borderWidth: 1,
                    pointRadius: 0
                },
                {
                    label: 'Period Slider Trace',
                    type: 'line',
                    data: [],
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderDash: [5, 5],
                    borderWidth: 1,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 500 }, // allow smooth transitions
            scales: {
                x: {
                    type: 'linear', min: 0, max: 40,
                    title: { display: true, text: 'Period (days)' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                y: {
                    id: 'y-m',
                    reverse: true,
                    min: 16.5, max: 12.5,
                    title: { display: true, text: 'Apparent Mag (m) [SMC]' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    position: 'left'
                },
                yM: {
                    id: 'y-M',
                    reverse: true,
                    min: -3.0, max: -7.0, // Calibrated absolute mag
                    title: { display: true, text: 'Absolute Mag (M)', color: '#00ffaa' },
                    grid: { drawOnChartArea: false },
                    position: 'right',
                    display: false // Hidden until Phase 1 success
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function updateR10PLChart() {
    if (!r9PlChart) return;
    
    // Plot stars
    const plottedPts = [];
    r9State.plottedStars.forEach(s => {
        const info = cepheidData[s];
        plottedPts.push({ x: info.period, y: info.meanM });
    });
    r9PlChart.data.datasets[0].data = plottedPts;
    
    // Trend line (only if all 3 plotted or in Phase 2)
    const trendPts = [];
    if (r9State.plottedStars.length === 3 || r9State.phase === 2) {
        for (let p = 2; p <= 40; p += 2) {
            // M = -2.78 log(P) - 1.35
            const absM = -2.78 * Math.log10(p) - 1.35;
            // SMC distance modulus is 19.50
            const appM = absM + 19.50;
            trendPts.push({ x: p, y: appM });
        }
    }
    r9PlChart.data.datasets[1].data = trendPts;
    
    // Show Absolute Mag axis if Phase 1 success
    if (r9State.showSuccessPhase1 || r9State.phase === 2) {
        r9PlChart.options.scales.yM.display = true;
    } else {
        r9PlChart.options.scales.yM.display = false;
    }
    
    r9PlChart.update();
}

function drawAndromedaBackground(ctx, cx, cy, rView) {
    // Offset the galaxy center so Andromeda's core is off-center, placing V1 (which is at center of viewfinder) in the arms
    const gx = cx - 0.35 * rView;
    const gy = cy - 0.25 * rView;
    const angle = -Math.PI / 5; // Tilted ~-36 degrees
    
    // Fill background black first
    ctx.fillStyle = '#020205';
    ctx.fillRect(cx - rView, cy - rView, rView * 2, rView * 2);
    
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(angle);
    
    // 1. Outer faint halo (large)
    ctx.save();
    ctx.scale(2.5, 0.7);
    const haloGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rView * 1.2);
    haloGrad.addColorStop(0, 'rgba(80, 100, 180, 0.15)');
    haloGrad.addColorStop(0.5, 'rgba(40, 60, 130, 0.06)');
    haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, rView * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // 2. Spiral disk (medium)
    ctx.save();
    ctx.scale(2.2, 0.55);
    const diskGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rView * 0.8);
    diskGrad.addColorStop(0, 'rgba(160, 190, 255, 0.3)');
    diskGrad.addColorStop(0.4, 'rgba(100, 140, 230, 0.15)');
    diskGrad.addColorStop(0.8, 'rgba(50, 80, 160, 0.04)');
    diskGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = diskGrad;
    ctx.beginPath();
    ctx.arc(0, 0, rView * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // 3. Bright central bulge/core (small)
    ctx.save();
    ctx.scale(1.8, 0.5);
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rView * 0.3);
    coreGrad.addColorStop(0, 'rgba(255, 245, 210, 0.9)'); // warm center
    coreGrad.addColorStop(0.3, 'rgba(255, 225, 170, 0.6)');
    coreGrad.addColorStop(0.7, 'rgba(255, 190, 120, 0.15)');
    coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, rView * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // 4. Spiral arms resolved star-dust detail
    ctx.fillStyle = 'rgba(200, 220, 255, 0.35)';
    for (let i = 0; i < 200; i++) {
        // Deterministic spiral placement using mathematical formula based on index i
        const theta = (i * 0.18) % (Math.PI * 4);
        const radius = (i * 0.3) + 6;
        if (radius > rView * 1.5) continue;
        
        const armOffset = (i % 2 === 0) ? 0 : Math.PI;
        const spiralX = radius * Math.cos(theta + armOffset);
        const spiralY = radius * 0.25 * Math.sin(theta + armOffset);
        
        const size = Math.max(0.4, 1.0 - radius / (rView * 0.8));
        ctx.beginPath();
        ctx.arc(spiralX, spiralY, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
    
    // 5. Faint dark dust lane arcs
    ctx.save();
    ctx.translate(gx + 5, gy + 3);
    ctx.rotate(angle);
    ctx.scale(2.1, 0.45);
    ctx.strokeStyle = 'rgba(10, 8, 5, 0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, rView * 0.5, 0.1, Math.PI * 0.9);
    ctx.stroke();
    ctx.restore();
    
    // 6. Milky Way foreground stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    const fgStars = [
        { x: cx - 0.7 * rView, y: cy - 0.4 * rView, size: 0.9 },
        { x: cx - 0.2 * rView, y: cy + 0.6 * rView, size: 0.8 },
        { x: cx + 0.6 * rView, y: cy - 0.5 * rView, size: 1.1 },
        { x: cx + 0.45 * rView, y: cy + 0.55 * rView, size: 0.7 },
        { x: cx - 0.5 * rView, y: cy + 0.2 * rView, size: 1.0 },
        { x: cx + 0.1 * rView, y: cy - 0.7 * rView, size: 0.8 }
    ];
    fgStars.forEach(fs => {
        ctx.beginPath();
        ctx.arc(fs.x, fs.y, fs.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawRung9TelescopeCanvas() {
    const tCanvas = document.getElementById('r9-telescope-canvas');
    if (!tCanvas || tCanvas.offsetParent === null) return;
    
    // Resize to fit container
    const rect = tCanvas.parentElement.getBoundingClientRect();
    if (tCanvas.width !== rect.width || tCanvas.height !== rect.height) {
        tCanvas.width = rect.width;
        tCanvas.height = rect.height;
    }
    
    const ctx = tCanvas.getContext('2d');
    const w = tCanvas.width;
    const h = tCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    
    ctx.clearRect(0, 0, w, h);
    
    // Draw viewport circle background
    const rView = Math.min(w, h) / 2 - 10;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rView, 0, Math.PI * 2);
    ctx.clip();
    
    if (r9State.phase === 2) {
        // Draw realistic Andromeda Galaxy background
        drawAndromedaBackground(ctx, cx, cy, rView);
    } else {
        // Deep space background
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rView);
        grad.addColorStop(0, '#0a0a20');
        grad.addColorStop(1, '#020205');
        ctx.fillStyle = grad;
        ctx.fillRect(cx - rView, cy - rView, rView * 2, rView * 2);
    }
    
    // Crosshairs
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.2)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(cx - rView, cy); ctx.lineTo(cx + rView, cy);
    ctx.moveTo(cx, cy - rView); ctx.lineTo(cx, cy + rView);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw stars
    const now = Date.now();
    let starsToDraw = [];
    if (r9State.phase === 1) {
        starsToDraw = [
            { id: 'A', x: cx - 0.55 * rView, y: cy + 0.3 * rView },
            { id: 'B', x: cx + 0.1 * rView, y: cy - 0.5 * rView },
            { id: 'C', x: cx + 0.55 * rView, y: cy + 0.3 * rView }
        ];
    } else if (r9State.phase === 2) {
        starsToDraw = [ { id: 'V1', x: cx, y: cy } ];
    }
    
    starsToDraw.forEach(s => {
        const info = cepheidData[s.id];
        const isPlotted = r9State.plottedStars.includes(s.id);
        // Pulsing radius
        const phase = ((now - info.phaseOffset) % (info.period * 1000)) / (info.period * 1000);
        const br = 1.0 + 0.3 * getCepheidFactor(s.id, phase);
        const radius = info.baseR * br;
        
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        if (isPlotted) {
            ctx.fillStyle = '#e6fffa';
            ctx.shadowColor = '#00ffaa';
        } else {
            ctx.fillStyle = '#fffbeb';
            ctx.shadowColor = '#fb923c';
        }
        ctx.shadowBlur = 15 * br;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(s.id === 'V1' ? 'Andromeda V1' : `SMC-Cepheid ${s.id}`, s.x, s.y - 15);
        
        // Selection reticle
        if (r9State.selectedStar === s.id) {
            ctx.strokeStyle = '#00ffaa';
            ctx.beginPath();
            ctx.arc(s.x, s.y, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(s.x, s.y, 20, 0, Math.PI * 0.5);
            ctx.stroke();
        }
    });
    
    ctx.restore();
    
    // Draw Light Curve dynamic phase dot
    if (r9LcChart && r9State.selectedStar) {
        const info = cepheidData[r9State.selectedStar];
        const phase = ((now - info.phaseOffset) % (info.period * 1000)) / (info.period * 1000);
        const am = info.meanM - info.amp * getCepheidFactor(r9State.selectedStar, phase);
        
        // Find dataset 1 (the dot) - x position is in Time (days)
        r9LcChart.data.datasets[1].data = [{ x: phase * info.period, y: am }];
        
        // Guide line from Apparent Mag slider
        const inputs = document.querySelectorAll('#controls-container input');
        if (inputs.length > 0) {
            const userAppMag = parseFloat(inputs[0].value);
            r9LcChart.data.datasets[2].data = [
                { x: 0, y: userAppMag },
                { x: 2.2 * info.period, y: userAppMag }
            ];
            
            // If perfectly matched to the star's mean apparent mag, turn solid green
            if (Math.abs(userAppMag - info.meanM) < 0.1) {
                r9LcChart.data.datasets[2].borderColor = '#00ffaa';
                r9LcChart.data.datasets[2].borderDash = [];
                r9LcChart.data.datasets[2].borderWidth = 2;
            } else {
                r9LcChart.data.datasets[2].borderColor = 'rgba(255, 255, 255, 0.5)';
                r9LcChart.data.datasets[2].borderDash = [5, 5];
                r9LcChart.data.datasets[2].borderWidth = 1.5;
            }
        }
        r9LcChart.update('none'); // Update without animation for performance
    }
    
    // Draw PL chart dynamic slider trace
    if (r9State.phase === 2 && r9PlChart) {
        const inputs = document.querySelectorAll('#controls-container input');
        if (inputs.length >= 3) {
            const userPeriod = parseFloat(inputs[1].value);
            const userAbsMag = parseFloat(inputs[2].value);
            // Translate absolute mag back to SMC apparent mag for graphing
            const traceY = userAbsMag + 19.50;
            
            // Horizontal Absolute Mag trace
            r9PlChart.data.datasets[2].data = [
                { x: 0, y: traceY },
                { x: 40, y: traceY }
            ];
            
            // Vertical Period trace
            r9PlChart.data.datasets[3].data = [
                { x: userPeriod, y: 16.5 },
                { x: userPeriod, y: 12.5 }
            ];
            
            // Check if BOTH period and absolute mag are matched to Andromeda V1
            const periodMatch = Math.abs(userPeriod - 31.4) < 0.5;
            const absMagMatch = Math.abs(userAbsMag - (-5.50)) < 0.10;
            
            if (periodMatch && absMagMatch) {
                r9PlChart.data.datasets[2].borderColor = '#00ffaa';
                r9PlChart.data.datasets[2].borderDash = [];
                r9PlChart.data.datasets[2].borderWidth = 2;
                
                r9PlChart.data.datasets[3].borderColor = '#00ffaa';
                r9PlChart.data.datasets[3].borderDash = [];
                r9PlChart.data.datasets[3].borderWidth = 2;
            } else {
                r9PlChart.data.datasets[2].borderColor = periodMatch ? 'rgba(0, 255, 170, 0.4)' : 'rgba(255, 255, 255, 0.5)';
                r9PlChart.data.datasets[2].borderDash = [5, 5];
                r9PlChart.data.datasets[2].borderWidth = 1;
                
                r9PlChart.data.datasets[3].borderColor = absMagMatch ? 'rgba(0, 255, 170, 0.4)' : 'rgba(255, 255, 255, 0.5)';
                r9PlChart.data.datasets[3].borderDash = [5, 5];
                r9PlChart.data.datasets[3].borderWidth = 1;
            }
            r9PlChart.update('none');
        }
    }
}



// --- RUNG 12 UI & LOGIC ---

// Simple state for interactive viewfinder
let r12Viewfinder = {
    targetIdx: 0,
    currentX: 120,
    currentY: 100,
    animFrameId: null,
    targets: [
        { name: "NGC 224 (M31)", x: 120, y: 100, size: 28, type: "spiral" },
        { name: "NGC 3031 (M81)", x: 280, y: 130, size: 22, type: "spiral" },
        { name: "NGC 4486 (M87)", x: 460, y: 80, size: 18, type: "elliptical" },
        { name: "NGC 4889 (Coma)", x: 620, y: 120, size: 14, type: "elliptical" }
    ]
};

function initRung12UI() {
    const viewport = document.getElementById('viewport-container');
    let ui = document.getElementById('r12-ui-container');
    
    if (!ui) {
        ui = document.createElement('div');
        ui.id = 'r12-ui-container';
        
        ui.innerHTML = `
            <!-- CARD 1.5: Doppler Physics Animation (On Top, Taller) -->
            <div class="r9-panel" style="width:100%; max-width:820px; margin:0 auto; background:rgba(2, 16, 52, 0.85); box-shadow: 0 4px 20px rgba(0,0,0,0.5); flex-shrink: 0;">
                <div class="r9-panel-header" id="r12-anim-header" style="font-size:11px; padding:8px 12px;">
                    HOW THE SPECTRUM IS FORMED
                </div>
                <div style="position:relative; background:#020408; height:240px; overflow:hidden;">
                    <canvas id="r12-doppler-canvas" style="width:100%; height:100%;"></canvas>
                </div>
            </div>

            <!-- CARD 1: Telescope Targeting (Middle, Taller) -->
            <div class="r9-panel" style="width:100%; max-width:820px; margin:12px auto 0 auto; background:rgba(2, 16, 52, 0.85); box-shadow: 0 4px 20px rgba(0,0,0,0.5); flex-shrink: 0;">
                <div class="r9-panel-header" style="font-size:11px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                    <span>TELESCOPE VIEW: LOCATE TARGET GALAXIES</span>
                    <span id="r12-viewfinder-status" style="color:#00ffaa;">Locking target...</span>
                </div>
                <div style="position:relative; background:#010206; height:200px; overflow:hidden;">
                    <canvas id="r12-viewfinder-canvas" style="width:100%; height:100%; cursor:crosshair;"></canvas>
                </div>
            </div>

            <!-- CARD 2: Spectral Analysis Lab (Bottom, Taller) -->
            <div class="r9-panel" style="width:100%; max-width:820px; margin:12px auto 0 auto; background:rgba(2, 16, 52, 0.85); box-shadow: 0 4px 20px rgba(0,0,0,0.5); flex-shrink: 0;">
                <div style="display:flex; gap:0; min-height:340px;">
                    <!-- Left: Spectrometer -->
                    <div style="flex:1; display:flex; flex-direction:column; border-right:1px solid rgba(0,212,255,0.15);">
                        <div class="r9-panel-header" id="r12-header" style="font-size:11px; padding:6px 10px;">
                            SPECTROMETER: NGC 224 (Spiral)
                        </div>
                        <div style="flex:1; position:relative; background:#020408; min-height:260px;">
                            <canvas id="r12-spectrometer-canvas" style="width:100%; height:100%;"></canvas>
                        </div>
                    </div>
                    <!-- Right: Scaling Chart -->
                    <div style="flex:1; display:flex; flex-direction:column;">
                        <div class="r9-panel-header" id="r12-chart-header" style="font-size:11px; padding:6px 10px;">
                            SCALING RELATION
                        </div>
                        <div style="flex:1; position:relative; background:#020408; min-height:260px;">
                            <canvas id="r12-chart-canvas" style="width:100%; height:100%;"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Dynamic Physics Explanation Box -->
                <div id="r12-explanation-box" style="padding:10px 12px; background:rgba(2, 10, 30, 0.95); border-top:1px solid rgba(0,212,255,0.25); color:#fff; font-family:'Outfit',sans-serif; font-size:11.5px; line-height:1.45;">
                </div>

                <!-- Bottom Info Bar -->
                <div id="r12-info-bar" style="display:flex; gap:15px; padding:8px 12px; background:rgba(2,16,52,0.9); border-top:1px solid rgba(0,212,255,0.2); font-family:'JetBrains Mono',monospace; font-size:11px;">
                    <span style="color:#888;">TARGET: <span id="r12-info-name" style="color:#fff;">NGC 224</span></span>
                    <span style="color:#888;">TYPE: <span id="r12-info-type" style="color:#00d4ff;">Spiral</span></span>
                    <span style="color:#888;">m: <span id="r12-info-m" style="color:#ffcc66;">3.44</span></span>
                    <span style="color:#888;">W: <span id="r12-info-w" style="color:#ff0055;">300</span> km/s</span>
                    <span style="color:#888;">M: <span id="r12-info-M" style="color:#00ffaa;">—</span></span>
                    <span style="color:#888;">d: <span id="r12-info-d" style="color:#fff;">— Mpc</span></span>
                    <span id="r12-info-status" style="margin-left:auto; color:#888;">0 / 4 calibrated</span>
                </div>
            </div>
        `;
        viewport.appendChild(ui);
        
        // Handle viewfinder click interactions
        const vfCanvas = document.getElementById('r12-viewfinder-canvas');
        vfCanvas.addEventListener('click', (e) => {
            const rect = vfCanvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            const mapX = (clickX / rect.width) * vfCanvas.width;
            const mapY = (clickY / rect.height) * vfCanvas.height;
            
            let closestIdx = 0;
            let minDist = 9999;
            r12Viewfinder.targets.forEach((t, i) => {
                const dist = Math.sqrt(Math.pow(t.x - mapX, 2) + Math.pow(t.y - mapY, 2));
                if (dist < minDist) {
                    minDist = dist;
                    closestIdx = i;
                }
            });
            
            r12Viewfinder.targetIdx = closestIdx;
            syncR12UI();
        });

        // Resize handler
        const resizeHandler = () => {
            if (currentRung === 12) {
                drawR12DopplerAnim();
                drawR12Viewfinder();
                drawR12Spectrometer();
                drawR12Chart();
            }
        };
        window.addEventListener('resize', resizeHandler);
    }
    
    // Position layout below the main header bar to avoid text overlap!
    ui.style.display = 'flex';
    ui.style.flexDirection = 'column';
    ui.style.position = 'absolute';
    ui.style.top = '60px'; // Shifted down to clear "THE OBSERVATORY" title
    ui.style.left = '10px';
    ui.style.right = '10px';
    ui.style.bottom = '10px';
    ui.style.zIndex = '5';
    ui.style.overflowY = 'auto'; // Safe scrolling for smaller dimensions
    
    // Restore slider state of active galaxy on load
    const gal = r12State.galaxies[r12State.activeGalaxyIndex];
    const widthInput = document.getElementById('input-spectral_width');
    if (widthInput) {
        widthInput.value = gal.W;
        const valObj = document.getElementById('val-spectral_width');
        if (valObj) valObj.textContent = gal.W + ' km/s';
    }

    // Cancel any existing animation frame and start a clean loop
    if (r12Viewfinder.animFrameId) {
        cancelAnimationFrame(r12Viewfinder.animFrameId);
    }
    
    function animate() {
        if (currentRung === 12) {
            updateR12ViewfinderAnim();
            r12Viewfinder.animFrameId = requestAnimationFrame(animate);
        }
    }
    animate();

    syncR12UI();
}

function updateR12ViewfinderAnim() {
    const target = r12Viewfinder.targets[r12Viewfinder.targetIdx];
    
    // Smoothly interpolate reticle coordinates towards the targeted galaxy
    const dx = target.x - r12Viewfinder.currentX;
    const dy = target.y - r12Viewfinder.currentY;
    
    r12Viewfinder.currentX += dx * 0.12;
    r12Viewfinder.currentY += dy * 0.12;
    
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    // Auto-load spectral data once the telescope has arrived/locked on target
    if (dist < 2.0 && r12State.activeGalaxyIndex !== r12Viewfinder.targetIdx) {
        r12State.activeGalaxyIndex = r12Viewfinder.targetIdx;
        
        const gal = r12State.galaxies[r12State.activeGalaxyIndex];
        const widthInput = document.getElementById('input-spectral_width');
        if (widthInput) {
            widthInput.value = gal.W;
            const valObj = document.getElementById('val-spectral_width');
            if (valObj) valObj.textContent = gal.W + ' km/s';
        }
        updateCalculation();
    }
    
    // syncR12UI will update DOM states and trigger canvas redraws
    syncR12UI();
}

function syncR12UI() {
    const activeGal = r12State.galaxies[r12State.activeGalaxyIndex];
    const targetGal = r12State.galaxies[r12Viewfinder.targetIdx];
    
    // Calculate reticle distance to target galaxy to verify lock state
    const dx = r12Viewfinder.targets[r12Viewfinder.targetIdx].x - r12Viewfinder.currentX;
    const dy = r12Viewfinder.targets[r12Viewfinder.targetIdx].y - r12Viewfinder.currentY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const locked = dist < 2.0;

    // Status text in viewfinder header
    const vfStatus = document.getElementById('r12-viewfinder-status');
    if (vfStatus) {
        if (locked) {
            if (targetGal.verified) {
                vfStatus.textContent = targetGal.name.split(' ')[0] + ' Calibrated ✓';
                vfStatus.style.color = '#00ffaa';
            } else {
                vfStatus.textContent = targetGal.name.split(' ')[0] + ' Spectra Loaded';
                vfStatus.style.color = '#00d4ff';
            }
        } else {
            vfStatus.textContent = 'Slewing Telescope to ' + targetGal.name.split(' ')[0] + '...';
            vfStatus.style.color = '#ffcc66';
        }
    }
    
    // Header
    const header = document.getElementById('r12-header');
    if (header) {
        const label = activeGal.type === 'spiral' ? 'Spiral — Tully-Fisher' : 'Elliptical — Faber-Jackson';
        header.textContent = 'SPECTROMETER: ' + activeGal.name + ' (' + label + ')';
    }
    
    // Chart header
    const chartHeader = document.getElementById('r12-chart-header');
    if (chartHeader) {
        chartHeader.textContent = activeGal.type === 'spiral' ? 'TULLY-FISHER RELATION' : 'FABER-JACKSON RELATION';
    }
    
    // Get current slider value
    const widthInput = document.getElementById('input-spectral_width');
    const W = widthInput ? parseFloat(widthInput.value) : 150;
    
    // Calculate M from current W
    let M;
    if (activeGal.type === 'spiral') {
        M = -10.2 * Math.log10(W) + 6.25;
    } else {
        M = -9.0 * Math.log10(W) + 0.70;
    }
    const m = activeGal.trueAppMag;
    const distPc = Math.pow(10, (m - M + 5) / 5);
    const distMpc = distPc / 1000000;
    
    // Is this measurement correct?
    const isCorrect = Math.abs(W - activeGal.trueWidth) < (activeGal.trueWidth * 0.08);
    
    // Info bar
    const infoName = document.getElementById('r12-info-name');
    const infoType = document.getElementById('r12-info-type');
    const infoM_el = document.getElementById('r12-info-m');
    const infoW = document.getElementById('r12-info-w');
    const infoAbsM = document.getElementById('r12-info-M');
    const infoD = document.getElementById('r12-info-d');
    const infoStatus = document.getElementById('r12-info-status');
    
    if (infoName) infoName.textContent = activeGal.name.split(' ')[0];
    if (infoType) infoType.textContent = activeGal.type === 'spiral' ? 'Spiral' : 'Elliptical';
    if (infoM_el) infoM_el.textContent = m.toFixed(2);
    if (infoW) {
        infoW.textContent = W;
        infoW.style.color = isCorrect ? '#00ffaa' : '#ff0055';
    }
    if (infoAbsM) {
        infoAbsM.textContent = M.toFixed(2);
        infoAbsM.style.color = isCorrect ? '#00ffaa' : '#aaa';
    }
    if (infoD) {
        infoD.textContent = distMpc.toFixed(2) + ' Mpc';
        infoD.style.color = isCorrect ? '#00ffaa' : '#aaa';
    }
    if (infoStatus) {
        const count = r12State.galaxies.filter(g => g.verified).length;
        infoStatus.textContent = count + ' / 4 calibrated';
        infoStatus.style.color = count === 4 ? '#00ffaa' : '#888';
    }
    
    // Update Dynamic Explanation
    const explanation = document.getElementById('r12-explanation-box');
    if (explanation) {
        if (activeGal.type === 'spiral') {
            if (isCorrect) {
                explanation.innerHTML = `<span style="color:#00ffaa; font-weight:bold;">Tully-Fisher Locked:</span> You have aligned the calipers to the limits of the 21cm hydrogen line. The separation width (<strong>W = ${W} km/s</strong>) represents how fast this galaxy spins. Using Tully-Fisher, this rotational speed translates to an Absolute Magnitude of <strong>M = ${M.toFixed(2)}</strong>. Dist: <strong>${distMpc.toFixed(2)} Mpc</strong>. Click <strong>Verify</strong> to save.`;
            } else {
                explanation.innerHTML = `<span style="color:#00d4ff; font-weight:bold;">Tully-Fisher Measurement:</span> Adjust the slider. You are measuring the total width of the hydrogen line. Because this spiral rotates, gas swarming toward us is blueshifted (left) and gas moving away is redshifted (right). The distance between the peaks tells us the rotational speed (W). Currently: <strong>${W} km/s</strong>.`;
            }
        } else {
            if (isCorrect) {
                explanation.innerHTML = `<span style="color:#00ffaa; font-weight:bold;">Faber-Jackson Locked:</span> Your fitted Gaussian profile perfectly matches the absorption lines. The velocity dispersion (<strong>&sigma; = ${W} km/s</strong>) tells us the average speeds of stars in random orbits. Faber-Jackson translates this to an Absolute Magnitude of <strong>M = ${M.toFixed(2)}</strong>. Dist: <strong>${distMpc.toFixed(2)} Mpc</strong>. Click <strong>Verify</strong> to save.`;
            } else {
                explanation.innerHTML = `<span style="color:#ffcc66; font-weight:bold;">Faber-Jackson Measurement:</span> Adjust the slider to fit the absorption profile. Elliptical galaxies don't rotate cleanly; stars swarm in chaotic orbits. The dispersion (&sigma;) broadens the absorption dip. Fit the Gaussian line (dashed cyan) to align with the stellar random velocities! Currently: <strong>${W} km/s</strong>.`;
            }
        }
    }

    drawR12DopplerAnim();
    drawR12Viewfinder();
    drawR12Spectrometer();
    drawR12Chart();
}

function drawR12DopplerAnim() {
    const canvas = document.getElementById('r12-doppler-canvas');
    if (!canvas) return;
    
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    const activeGal = r12State.galaxies[r12State.activeGalaxyIndex];
    const t = performance.now() / 1000; // time in seconds
    
    // Update animation header
    const animHeader = document.getElementById('r12-anim-header');
    if (animHeader) {
        animHeader.textContent = activeGal.type === 'spiral'
            ? 'HOW THE SPECTRUM IS FORMED — SPIRAL ROTATION (TULLY-FISHER)'
            : 'HOW THE SPECTRUM IS FORMED — RANDOM STELLAR MOTIONS (FABER-JACKSON)';
    }
    
    // Shared geometry
    const cx = w * 0.32;
    const cy = h * 0.5;
    const galRadius = 45; // Fixed radius to match peak/wing offsets exactly
    const specX = w * 0.66;
    const specW = w * 0.30;
    const specH = 160;   // Centered spectrum height
    const specY = cy - specH / 2; // Perfectly aligned midpoint
    const midSpecY = cy;
    
    if (activeGal.type === 'spiral') {
        // === ROTATED SPIRAL GALAXY: Vertical disk orientation ===
        const tiltAngle = Math.PI / 5; // tilt so it is edge-on-ish (compressed horizontally)
        const rotSpeed = 0.4;
        
        // Draw galaxy disk (elliptical projection tilted vertically)
        const haloGrad = ctx.createRadialGradient(cx, cy, galRadius * 0.1, cx, cy, galRadius * 1.2);
        haloGrad.addColorStop(0, 'rgba(200, 220, 255, 0.15)');
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, galRadius * Math.sin(tiltAngle) * 1.2, galRadius * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw stars in a rotating disk
        const starCount = 80;
        for (let i = 0; i < starCount; i++) {
            const rFrac = 0.15 + (i / starCount) * 0.85;
            const baseAngle = (i * 2.399) + Math.sin(i * 0.3) * 0.5;
            const angle = baseAngle + t * rotSpeed * (1.2 / rFrac);
            
            const diskX = Math.cos(angle) * rFrac * galRadius;
            const diskY = Math.sin(angle) * rFrac * galRadius;
            
            // Project so it is a vertical ellipse (compressed horizontally)
            const projX = cx + diskX * Math.sin(tiltAngle);
            const projY = cy + diskY;
            
            // Doppler speed: stars at the top (projY < cy) are approaching (blueshift)
            // Stars at the bottom (projY > cy) are receding (redshift)
            const vRadial = (projY - cy) / galRadius;
            
            let starColor;
            if (vRadial < -0.15) {
                const intensity = Math.min(1, Math.abs(vRadial) * 1.5);
                const r = Math.round(80 * (1 - intensity));
                const g = Math.round(150 + 105 * intensity);
                const b = 255;
                starColor = 'rgb(' + r + ',' + g + ',' + b + ')';
            } else if (vRadial > 0.15) {
                const intensity = Math.min(1, Math.abs(vRadial) * 1.5);
                const r = 255;
                const g = Math.round(200 * (1 - intensity));
                const b = Math.round(100 * (1 - intensity));
                starColor = 'rgb(' + r + ',' + g + ',' + b + ')';
            } else {
                starColor = 'rgba(255, 255, 255, 0.7)';
            }
            
            ctx.fillStyle = starColor;
            const dotSize = 1.2 + rFrac * 1.0;
            ctx.beginPath();
            ctx.arc(projX, projY, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Bright core
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, galRadius * 0.15);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, galRadius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Vertical Rotation arrows
        ctx.strokeStyle = '#66bbff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        const arrowX1 = cx - galRadius * Math.sin(tiltAngle) * 0.6;
        const arrowX2 = cx + galRadius * Math.sin(tiltAngle) * 0.6;
        ctx.beginPath();
        ctx.moveTo(arrowX1, cy - galRadius * 0.8);
        ctx.quadraticCurveTo(cx, cy - galRadius * 1.1, arrowX2, cy - galRadius * 0.8);
        ctx.stroke();
        ctx.setLineDash([]);
        // Arrowhead (pointing along tangent of the curve)
        const topDx = arrowX2 - cx;
        const topDy = galRadius * 0.3;
        const topAlpha = Math.atan2(topDy, topDx);
        ctx.fillStyle = '#66bbff';
        ctx.beginPath();
        ctx.moveTo(arrowX2, cy - galRadius * 0.8);
        ctx.lineTo(
            arrowX2 - 6 * Math.cos(topAlpha) + 4 * Math.sin(topAlpha),
            (cy - galRadius * 0.8) - 6 * Math.sin(topAlpha) - 4 * Math.cos(topAlpha)
        );
        ctx.lineTo(
            arrowX2 - 6 * Math.cos(topAlpha) - 4 * Math.sin(topAlpha),
            (cy - galRadius * 0.8) - 6 * Math.sin(topAlpha) + 4 * Math.cos(topAlpha)
        );
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#ff6644';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(arrowX2, cy + galRadius * 0.8);
        ctx.quadraticCurveTo(cx, cy + galRadius * 1.1, arrowX1, cy + galRadius * 0.8);
        ctx.stroke();
        ctx.setLineDash([]);
        // Arrowhead (pointing along tangent of the curve)
        const botDx = arrowX1 - cx;
        const botDy = -galRadius * 0.3;
        const botAlpha = Math.atan2(botDy, botDx);
        ctx.fillStyle = '#ff6644';
        ctx.beginPath();
        ctx.moveTo(arrowX1, cy + galRadius * 0.8);
        ctx.lineTo(
            arrowX1 - 6 * Math.cos(botAlpha) + 4 * Math.sin(botAlpha),
            (cy + galRadius * 0.8) - 6 * Math.sin(botAlpha) - 4 * Math.cos(botAlpha)
        );
        ctx.lineTo(
            arrowX1 - 6 * Math.cos(botAlpha) - 4 * Math.sin(botAlpha),
            (cy + galRadius * 0.8) - 6 * Math.sin(botAlpha) + 4 * Math.cos(botAlpha)
        );
        ctx.closePath();
        ctx.fill();
        
        // Labels placed safely on the LEFT side of the canvas (x = 15) to prevent cropping!
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#66bbff';
        ctx.fillText('BLUESHIFTED (Approaching)', 15, cy - galRadius * 0.6);
        
        ctx.fillStyle = '#ff6644';
        ctx.fillText('REDSHIFTED (Receding)', 15, cy + galRadius * 0.6);
        
        // Observer icon on the OTHER side (Right side, in the gap)
        const obsX = w * 0.51;
        ctx.fillStyle = '#00ffaa';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🔭 Observer', obsX, cy - 10);
        
        // Horizontal sightline
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(obsX - 35, cy);
        ctx.lineTo(cx + galRadius * Math.sin(tiltAngle) * 0.3, cy);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // === ROTATED SPECTRUM ===
        const baseX = specX + specW * 0.15;
        
        // Background box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(specX - 5, specY - 5, specW + 10, specH + 10, 4);
        ctx.fill();
        ctx.stroke();
        
        // Draw vertical double-horned profile with precise stop mappings
        const specGrad = ctx.createLinearGradient(0, specY, 0, specY + specH);
        specGrad.addColorStop(0, '#66bbff');     // Top tail (blue)
        specGrad.addColorStop(0.27, '#66bbff');   // Top peak (blueshifted - blue)
        specGrad.addColorStop(0.45, '#00d4ff');   // Mid
        specGrad.addColorStop(0.55, '#00d4ff');   // Mid
        specGrad.addColorStop(0.73, '#ff6644');   // Bottom peak (redshifted - red!)
        specGrad.addColorStop(1, '#ff6644');     // Bottom tail (red)
        
        ctx.strokeStyle = specGrad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let py = 0; py < specH; py++) {
            const v = ((py - specH / 2) / (specH / 2)) * 400; // v from -400 (top) to +400 (bottom)
            let intensity = 0;
            // Peaks are at v = -180 and v = +180
            intensity += 40 * Math.exp(-Math.pow(v - 180, 2) / 600); // bottom peak (red)
            intensity += 40 * Math.exp(-Math.pow(v + 180, 2) / 600); // top peak (blue)
            intensity += Math.max(0, 12 - 0.00015 * v * v);
            
            const x = baseX + intensity;
            const y = specY + py;
            if (py === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Plot Title centered at the top of the spectrum box
        ctx.fillStyle = '#88ccee';
        ctx.font = '9px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Emission Profile (HI 21cm)', specX + specW / 2, specY + 12);
        
        // Top peak label (Blue text)
        ctx.fillStyle = '#66bbff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Blue peak', baseX + 48, cy - 36 + 3);
        
        // Bottom peak label (Red text)
        ctx.fillStyle = '#ff6644';
        ctx.fillText('Red peak', baseX + 48, cy + 36 + 3);
        
        // Vertical W measurement arrow (Ends exactly at peaks)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const arrowX = baseX + 42;
        ctx.moveTo(arrowX, cy - 36);
        ctx.lineTo(arrowX, cy + 36);
        ctx.stroke();
        
        // Arrowheads
        ctx.beginPath(); ctx.moveTo(arrowX - 3, cy - 36 + 5); ctx.lineTo(arrowX, cy - 36); ctx.lineTo(arrowX + 3, cy - 36 + 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(arrowX - 3, cy + 36 - 5); ctx.lineTo(arrowX, cy + 36); ctx.lineTo(arrowX + 3, cy + 36 - 5); ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('W', arrowX + 6, cy + 3);
        
        // Dynamic horizontal parallel connection lines (Y-coords align exactly at 84px and 156px)
        ctx.save();
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        const pulseOpacity = 0.25 + 0.15 * Math.sin(t * 5.0);
        
        // 1. Blue straight line (Top / Approaching side to Top / Blue peak)
        ctx.strokeStyle = 'rgba(102, 187, 255, ' + pulseOpacity + ')';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 36);
        ctx.lineTo(baseX + 35, cy - 36);
        ctx.stroke();
        
        // 2. Red straight line (Bottom / Receding side to Bottom / Red peak)
        ctx.strokeStyle = 'rgba(255, 102, 68, ' + pulseOpacity + ')';
        ctx.beginPath();
        ctx.moveTo(cx, cy + 36);
        ctx.lineTo(baseX + 35, cy + 36);
        ctx.stroke();
        ctx.restore();
        
        // Bottom explanation text
        ctx.fillStyle = '#aaa';
        ctx.font = '9px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Faster rotation → wider W → brighter galaxy', w * 0.66 + specW / 2, specY + specH + 18);
        
    } else {
        // === ROTATED ELLIPTICAL GALAXY: Vertical star swarm ===
        // Fuzzy elliptical glow
        const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, galRadius * 1.3);
        glowGrad.addColorStop(0, 'rgba(255, 230, 180, 0.2)');
        glowGrad.addColorStop(0.5, 'rgba(255, 200, 120, 0.08)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, galRadius * 0.7 * 1.3, galRadius * 1.0, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Stars in chaotic random orbits
        const starCount = 60;
        for (let i = 0; i < starCount; i++) {
            const orbitPhase = t * (0.3 + Math.sin(i * 1.7) * 0.15);
            const orbitA = (0.2 + (Math.sin(i * 3.7) * 0.5 + 0.5) * 0.8) * galRadius;
            const orbitB = (0.2 + (Math.cos(i * 2.3) * 0.5 + 0.5) * 0.8) * galRadius;
            const orbitTilt = (i * 2.399) + Math.sin(i) * 1.5;
            
            const angle = orbitPhase + i * 1.234;
            const sx = Math.cos(angle) * orbitA;
            const sy = Math.sin(angle) * orbitB;
            
            const rx = sx * Math.cos(orbitTilt) - sy * Math.sin(orbitTilt);
            const ry = sx * Math.sin(orbitTilt) + sy * Math.cos(orbitTilt);
            
            const projX = cx + rx * 0.7; // horizontal compression
            const projY = cy + ry;
            
            // Doppler radial velocity maps to vertical coordinate
            const vRadial = (projY - cy) / galRadius;
            
            let starColor;
            if (vRadial < -0.25) {
                const intensity = Math.min(1, Math.abs(vRadial) * 1.2);
                starColor = 'rgb(' + Math.round(100 * (1 - intensity)) + ',' + Math.round(150 + 105 * intensity) + ',255)';
            } else if (vRadial > 0.25) {
                const intensity = Math.min(1, Math.abs(vRadial) * 1.2);
                starColor = 'rgb(255,' + Math.round(200 * (1 - intensity)) + ',' + Math.round(100 * (1 - intensity)) + ')';
            } else {
                starColor = 'rgba(255, 230, 200, 0.7)';
            }
            
            ctx.fillStyle = starColor;
            ctx.beginPath();
            ctx.arc(projX, projY, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw short velocity trail
            const trailLen = Math.abs(vRadial) * 8;
            if (trailLen > 2) {
                ctx.strokeStyle = starColor;
                ctx.lineWidth = 0.5;
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.moveTo(projX, projY);
                ctx.lineTo(projX, projY + (vRadial > 0 ? trailLen : -trailLen));
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }
        }
        
        // Bright core
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, galRadius * 0.12);
        coreGrad.addColorStop(0, 'rgba(255, 240, 200, 0.9)');
        coreGrad.addColorStop(1, 'rgba(255, 240, 200, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, galRadius * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        // Labels placed safely on the LEFT side of the canvas (x = 15) to prevent cropping!
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#66bbff';
        ctx.fillText('BLUESHIFTED (Approaching)', 15, cy - galRadius * 0.6);
        
        ctx.fillStyle = '#ff6644';
        ctx.fillText('REDSHIFTED (Receding)', 15, cy + galRadius * 0.6);
        
        // Observer icon on the OTHER side (Right side, in the gap)
        const obsX = w * 0.51;
        ctx.fillStyle = '#00ffaa';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🔭 Observer', obsX, cy - 10);
        
        // Horizontal sightline
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(obsX - 35, cy);
        ctx.lineTo(cx + galRadius * 0.3 * 0.7, cy);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // === ROTATED SPECTRUM ===
        const baseX = specX + specW * 0.8;
        
        // Background box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(specX - 5, specY - 5, specW + 10, specH + 10, 4);
        ctx.fill();
        ctx.stroke();
        
        // Draw vertical narrow absorption line (no dispersion, dashed)
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        for (let py = 0; py < specH; py++) {
            const v = ((py - specH / 2) / (specH / 2)) * 400;
            const dip = 45 * Math.exp(-Math.pow(v, 2) / 800);
            const x = baseX - dip;
            const y = specY + py;
            if (py === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw vertical broadened absorption line
        const specGrad = ctx.createLinearGradient(0, specY, 0, specY + specH);
        specGrad.addColorStop(0, '#66bbff');     // Top tail (blue)
        specGrad.addColorStop(0.32, '#66bbff');   // Top wing (blueshifted - blue)
        specGrad.addColorStop(0.5, '#ffcc66');    // Mid (unshifted dip center)
        specGrad.addColorStop(0.68, '#ff6644');   // Bottom wing (redshifted - red!)
        specGrad.addColorStop(1, '#ff6644');     // Bottom tail (red)
        
        ctx.strokeStyle = specGrad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let py = 0; py < specH; py++) {
            const v = ((py - specH / 2) / (specH / 2)) * 400;
            const dip = 45 * Math.exp(-Math.pow(v, 2) / 8000);
            const x = baseX - dip;
            const y = specY + py;
            if (py === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Plot Title centered at the top of the spectrum box
        ctx.fillStyle = '#eeccaa';
        ctx.font = '9px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Absorption Profile (Stellar Lines)', specX + specW / 2, specY + 12);
        
        // Labels
        ctx.fillStyle = 'rgba(255, 200, 100, 0.5)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Narrow (cold)', specX + 2, specY + 24);
        
        ctx.fillStyle = '#ffcc66';
        ctx.fillText('Broadened (hot)', specX + 2, specY + 36);
        
        // Vertical Sigma arrow (exactly aligned to the wings at Y = cy - 27 and cy + 27)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const arrowX = baseX - 55;
        ctx.moveTo(arrowX, cy - 27);
        ctx.lineTo(arrowX, cy + 27);
        ctx.stroke();
        
        // Arrowheads
        ctx.beginPath(); ctx.moveTo(arrowX - 3, cy - 27 + 5); ctx.lineTo(arrowX, cy - 27); ctx.lineTo(arrowX + 3, cy - 27 + 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(arrowX - 3, cy + 27 - 5); ctx.lineTo(arrowX, cy + 27); ctx.lineTo(arrowX + 3, cy + 27 - 5); ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('σ', arrowX + 5, cy + 3);
        
        // Dynamic horizontal parallel connection lines for the dispersion wings!
        ctx.save();
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        const pulseOpacity = 0.25 + 0.15 * Math.sin(t * 5.0);
        
        // 1. Blue line (Top / Approaching wing)
        ctx.strokeStyle = 'rgba(102, 187, 255, ' + pulseOpacity + ')';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 27);
        ctx.lineTo(baseX - 45, cy - 27);
        ctx.stroke();
        
        // 2. Red line (Bottom / Receding wing)
        ctx.strokeStyle = 'rgba(255, 102, 68, ' + pulseOpacity + ')';
        ctx.beginPath();
        ctx.moveTo(cx, cy + 27);
        ctx.lineTo(baseX - 45, cy + 27);
        ctx.stroke();
        ctx.restore();
        
        // Bottom explanation text
        ctx.fillStyle = '#aaa';
        ctx.font = '9px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Faster random motions → wider σ → brighter galaxy', w * 0.66 + specW / 2, specY + specH + 18);
    }
}
function drawR12Viewfinder() {
    const canvas = document.getElementById('r12-viewfinder-canvas');
    if (!canvas) return;
    
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Draw sky backdrop (dark gradient)
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#02040b');
    grad.addColorStop(1, '#000002');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    // Draw background stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const starCount = 30;
    const seed = 500;
    for (let i = 0; i < starCount; i++) {
        const x = (Math.sin(i * 13 + seed) * 0.5 + 0.5) * w;
        const y = (Math.cos(i * 7 + seed * 2) * 0.5 + 0.5) * h;
        const r = (Math.sin(i * 3) > 0.5) ? 1 : 0.6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw Galaxy representations
    r12Viewfinder.targets.forEach((t, i) => {
        const galState = r12State.galaxies[i];
        
        ctx.save();
        ctx.translate(t.x, t.y);
        
        // Faint glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = t.type === 'spiral' ? 'rgba(0, 212, 255, 0.6)' : 'rgba(255, 200, 100, 0.5)';
        
        if (t.type === 'spiral') {
            // Draw a cute tilted spiral core
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.ellipse(0, 0, t.size * 0.3, t.size * 0.1, Math.PI/6, 0, Math.PI*2);
            ctx.fill();
            
            // Spiral arms (ellipses surrounding core)
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(0, 0, t.size * 0.6, t.size * 0.2, Math.PI/6, 0, Math.PI*2);
            ctx.stroke();
        } else {
            // Draw a fuzzy elliptical glow
            const ellGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, t.size * 0.7);
            ellGrad.addColorStop(0, 'rgba(255, 230, 180, 0.9)');
            ellGrad.addColorStop(0.4, 'rgba(255, 200, 120, 0.4)');
            ellGrad.addColorStop(1, 'rgba(255, 200, 120, 0)');
            ctx.fillStyle = ellGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, t.size * 0.7, t.size * 0.5, -Math.PI/6, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
        ctx.shadowBlur = 0;
        
        // Target text & calibrated status
        ctx.fillStyle = galState.verified ? '#00ffaa' : '#999';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.name.split(' ')[0], t.x, t.y + t.size * 0.75 + 4);
        if (galState.verified) {
            ctx.fillStyle = '#00ffaa';
            ctx.font = '8px monospace';
            ctx.fillText('✓', t.x, t.y - t.size * 0.5 - 4);
        }
    });
    
    // Draw selector viewfinder crosshairs over current reticle pos
    const rx = r12Viewfinder.currentX;
    const ry = r12Viewfinder.currentY;
    const currentTarget = r12Viewfinder.targets[r12Viewfinder.targetIdx];
    
    // Determine lock state to change reticle color
    const dx = currentTarget.x - rx;
    const dy = currentTarget.y - ry;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const isLocked = dist < 2.0;
    const reticleColor = isLocked ? '#00ffaa' : '#00ffcc';
    
    // Reticle box/rings
    ctx.strokeStyle = reticleColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(rx, ry, currentTarget.size * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    
    // Crosshair ticks
    ctx.strokeStyle = reticleColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Top tick
    ctx.moveTo(rx, ry - currentTarget.size * 1.1);
    ctx.lineTo(rx, ry - currentTarget.size * 0.8);
    // Bottom tick
    ctx.moveTo(rx, ry + currentTarget.size * 0.8);
    ctx.lineTo(rx, ry + currentTarget.size * 1.1);
    // Left tick
    ctx.moveTo(rx - currentTarget.size * 1.1, ry);
    ctx.lineTo(rx - currentTarget.size * 0.8, ry);
    // Right tick
    ctx.moveTo(rx + currentTarget.size * 0.8, ry);
    ctx.lineTo(rx + currentTarget.size * 1.1, ry);
    ctx.stroke();
    
    // Target LockedHUD Box text
    ctx.fillStyle = reticleColor;
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    if (isLocked) {
        ctx.fillText('TARGET LOCKED: ' + currentTarget.name, 10, 18);
    } else {
        ctx.fillText('SLEWING TARGET: ' + currentTarget.name, 10, 18);
    }
}

function drawR12Spectrometer() {
    const canvas = document.getElementById('r12-spectrometer-canvas');
    if (!canvas) return;
    
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Grid
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < w; x += 20) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 0; y < h; y += 20) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();

    // Use targetIdx to show the targeted galaxy's spectrum during slewing!
    const gal = r12State.galaxies[r12Viewfinder.targetIdx];
    const trueW = gal.trueWidth;
    
    // Get current slider value (only match if active is target, else default W)
    const widthInput = document.getElementById('input-spectral_width');
    const userW = (r12Viewfinder.targetIdx === r12State.activeGalaxyIndex && widthInput) ? parseFloat(widthInput.value) : gal.W;
    
    const maxVelocity = 800;
    const midX = w / 2;
    const midY = h * 0.72;
    
    // Calculate reticle signal lock strength based on telescope distance
    const target = r12Viewfinder.targets[r12Viewfinder.targetIdx];
    const dx = target.x - r12Viewfinder.currentX;
    const dy = target.y - r12Viewfinder.currentY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const signalStrength = Math.max(0.05, 1 - dist / 120); // Emerges smoothly
    
    // Axis line
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();
    
    // Axis labels
    ctx.fillStyle = '#666';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0', midX, midY + 12);
    ctx.fillText('-400', midX - (400/maxVelocity)*(w/2), midY + 12);
    ctx.fillText('+400', midX + (400/maxVelocity)*(w/2), midY + 12);
    ctx.fillText('Radial Velocity (km/s)', midX, h - 4);

    // Use deterministic noise (seeded by target index)
    const seed = r12Viewfinder.targetIdx * 1000;

    if (gal.type === 'spiral') {
        // Double-horned 21cm HI profile using blue-to-red Doppler gradient!
        const specGrad = ctx.createLinearGradient(0, 0, w, 0);
        specGrad.addColorStop(0, '#66bbff');     // Blueshifted tail
        specGrad.addColorStop(0.40, '#66bbff');   // Approaching peak (blueshifted - fully blue!)
        specGrad.addColorStop(0.48, '#00d4ff');   // Central transition
        specGrad.addColorStop(0.52, '#00d4ff');
        specGrad.addColorStop(0.60, '#ff6644');   // Receding peak (redshifted - fully red!)
        specGrad.addColorStop(1, '#ff6644');     // Redshifted tail
        
        ctx.strokeStyle = specGrad;
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0, 212, 255, 0.4)';
        ctx.shadowBlur = 4;
        
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const v = ((x - midX) / (w / 2)) * maxVelocity;
            let intensity = 0;
            if (Math.abs(v) < trueW / 2 + 60) {
                intensity += Math.max(0, 25 - 0.0008 * Math.pow(v, 2)) * signalStrength;
                intensity += 70 * Math.exp(-Math.pow(v - (trueW / 2), 2) / 900) * signalStrength;
                intensity += 70 * Math.exp(-Math.pow(v + (trueW / 2), 2) / 900) * signalStrength;
            }
            // Deterministic noise: gets static-heavy when signalStrength is low
            const noiseAmp = 5 + (1 - signalStrength) * 12;
            intensity += (Math.sin(x * 0.7 + seed) * 3 + Math.sin(x * 1.3 + seed * 0.7) * 2) * (noiseAmp / 5);
            
            const y = midY - intensity;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // User measurement calipers
        const caliperOffset = (userW / 2 / maxVelocity) * (w / 2);
        const isCorrect = Math.abs(userW - trueW) < (trueW * 0.08);
        const cColor = isCorrect ? '#00ffaa' : '#ff0055';
        
        ctx.strokeStyle = cColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(midX - caliperOffset, 15); ctx.lineTo(midX - caliperOffset, midY - 5);
        ctx.moveTo(midX + caliperOffset, 15); ctx.lineTo(midX + caliperOffset, midY - 5);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Dimension bar
        ctx.strokeStyle = cColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(midX - caliperOffset, 28); ctx.lineTo(midX + caliperOffset, 28);
        ctx.stroke();
        // Arrowheads
        ctx.beginPath(); ctx.moveTo(midX - caliperOffset + 4, 24); ctx.lineTo(midX - caliperOffset, 28); ctx.lineTo(midX - caliperOffset + 4, 32); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(midX + caliperOffset - 4, 24); ctx.lineTo(midX + caliperOffset, 28); ctx.lineTo(midX + caliperOffset - 4, 32); ctx.stroke();
        
        ctx.fillStyle = cColor;
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('W = ' + userW + ' km/s', midX, 22);

    } else {
        // Absorption-line profile (Faber-Jackson) with blue-to-red velocity gradient!
        const contY = h * 0.3;
        const specGrad = ctx.createLinearGradient(0, 0, w, 0);
        specGrad.addColorStop(0, '#66bbff');     // Blueshifted wing
        specGrad.addColorStop(0.40, '#66bbff');   // Approaching side (fully blue!)
        specGrad.addColorStop(0.48, '#ffcc66');   // Central unshifted absorption dip
        specGrad.addColorStop(0.52, '#ffcc66');
        specGrad.addColorStop(0.60, '#ff6644');   // Receding side (fully red!)
        specGrad.addColorStop(1, '#ff6644');     // Redshifted wing
        
        ctx.strokeStyle = specGrad;
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(255, 204, 102, 0.3)';
        ctx.shadowBlur = 4;
        
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const v = ((x - midX) / (w / 2)) * maxVelocity;
            let dip = 120 * Math.exp(-Math.pow(v, 2) / (2 * Math.pow(trueW, 2))) * signalStrength;
            const noiseAmp = 7 + (1 - signalStrength) * 15;
            const noise = (Math.sin(x * 0.7 + seed) * 4 + Math.sin(x * 1.3 + seed * 0.7) * 3) * (noiseAmp / 7);
            const y = contY + dip + noise;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // User fitted Gaussian
        const isCorrect = Math.abs(userW - trueW) < (trueW * 0.08);
        const cColor = isCorrect ? '#00ffaa' : '#00ffcc';
        ctx.strokeStyle = cColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const v = ((x - midX) / (w / 2)) * maxVelocity;
            let dip = 120 * Math.exp(-Math.pow(v, 2) / (2 * Math.pow(userW, 2)));
            const y = contY + dip;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = cColor;
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('&sigma; = ' + userW + ' km/s', midX, contY + 140);
    }
}

function drawR12Chart() {
    const canvas = document.getElementById('r12-chart-canvas');
    if (!canvas) return;
    
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const pad = { top: 25, right: 15, bottom: 30, left: 45 };
    const gW = width - pad.left - pad.right;
    const gH = height - pad.top - pad.bottom;
    
    const gal = r12State.galaxies[r12State.activeGalaxyIndex];
    const isSpiral = gal.type === 'spiral';
    
    // Axis ranges
    const logMin = 2.0, logMax = 3.0;   // log10(W) = 100..1000
    const mMin = -15, mMax = -25;       // Mag (brighter = more negative = top)
    
    function px(logW) { return pad.left + ((logW - logMin) / (logMax - logMin)) * gW; }
    function py(M) { return pad.top + ((M - mMax) / (mMin - mMax)) * gH; }

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, height - pad.bottom);
    ctx.lineTo(width - pad.right, height - pad.bottom);
    ctx.stroke();
    
    // Y labels
    ctx.fillStyle = '#777';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    for (let m = -16; m >= -24; m -= 2) {
        const y = py(m);
        ctx.fillText(m.toString(), pad.left - 4, y + 3);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
    }
    
    // X labels
    ctx.textAlign = 'center';
    [100, 200, 300, 500, 800].forEach(v => {
        const x = px(Math.log10(v));
        ctx.fillStyle = '#777';
        ctx.fillText(v.toString(), x, height - pad.bottom + 12);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, height - pad.bottom); ctx.stroke();
    });
    
    // Axis titles
    ctx.fillStyle = '#00d4ff';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isSpiral ? 'W (km/s)' : '&sigma; (km/s)', width / 2, height - 4);
    
    ctx.save();
    ctx.translate(12, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Abs. Mag (M)', 0, 0);
    ctx.restore();
    
    // Correlation line
    const lineColor = isSpiral ? 'rgba(0,212,255,0.5)' : 'rgba(255,200,0,0.5)';
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let lw = logMin; lw <= logMax; lw += 0.02) {
        const M = isSpiral ? (-10.2 * lw + 6.25) : (-9.0 * lw + 0.70);
        const x = px(lw); const y = py(M);
        if (lw === logMin) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Scatter points (deterministic)
    const dotColor = isSpiral ? 'rgba(0,212,255,0.25)' : 'rgba(255,200,0,0.25)';
    ctx.fillStyle = dotColor;
    for (let i = 0; i < 50; i++) {
        const lw = 2.05 + (i * 0.018);
        if (lw > 2.95) break;
        const baseM = isSpiral ? (-10.2 * lw + 6.25) : (-9.0 * lw + 0.70);
        const noise = Math.sin(i * 7.3) * 0.5 + Math.cos(i * 3.1) * 0.3;
        ctx.beginPath();
        ctx.arc(px(lw), py(baseM + noise), 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Current user point (live tracking or preview)
    const widthInput = document.getElementById('input-spectral_width');
    const userW = widthInput ? parseFloat(widthInput.value) : 300;
    const userLogW = Math.log10(userW);
    const userM = isSpiral ? (-10.2 * userLogW + 6.25) : (-9.0 * userLogW + 0.70);
    const ux = px(userLogW);
    const uy = py(userM);
    
    const isCorrect = Math.abs(userW - gal.trueWidth) < (gal.trueWidth * 0.08);
    
    // Draw coordinates & dot
    ctx.strokeStyle = isCorrect ? 'rgba(0, 255, 170, 0.6)' : 'rgba(255, 0, 85, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(ux, height - pad.bottom);
    ctx.lineTo(ux, uy);
    ctx.lineTo(pad.left, uy);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = isCorrect ? '#00ffaa' : '#ff0055';
    ctx.beginPath();
    ctx.arc(ux, uy, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = isCorrect ? '#00ffaa' : '#ff6688';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('M = ' + userM.toFixed(2), pad.left + 5, uy - 8);
    
    // Mark verified galaxies
    r12State.galaxies.forEach((g, i) => {
        if (g.verified && g.type === gal.type) {
            const vLogW = Math.log10(g.trueWidth);
            const vM = isSpiral ? (-10.2 * vLogW + 6.25) : (-9.0 * vLogW + 0.70);
            ctx.fillStyle = 'rgba(0,255,170,0.6)';
            ctx.beginPath();
            ctx.arc(px(vLogW), py(vM), 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#00ffaa';
            ctx.font = '8px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(g.name.split(' ')[0], px(vLogW) + 7, py(vM) + 3);
        }
    });
}

function updateR12UIState() {
    syncR12UI();
}

function updateR12Selection3D() {
    if (typeof rung12Group === 'undefined' || typeof r12SelectionRing === 'undefined') return;
    if (currentRung !== 12) return;
    
    const activeIdx = r12State.activeGalaxyIndex;
    if (window.r12GalaxyModels && window.r12GalaxyModels[activeIdx]) {
        const targetPos = window.r12GalaxyModels[activeIdx].group.position;
        r12SelectionRing.position.copy(targetPos);
        
        if (typeof r12Sightline !== 'undefined') {
            const pts = [new THREE.Vector3(0,0,0), targetPos];
            r12Sightline.geometry.setFromPoints(pts);
            r12Sightline.computeLineDistances();
            
            if (r12State.galaxies[activeIdx].verified) {
                r12Sightline.material.dashSize = 1000;
                r12Sightline.material.gapSize = 0;
            } else {
                r12Sightline.material.dashSize = 2;
                r12Sightline.material.gapSize = 2;
            }
            r12Sightline.material.needsUpdate = true;
        }
    }
}

function handle2DPointerDown(x, y) {
    if (currentRung === 2) {
        const cy = canvas2d.height / 2 - 30;
        const r = 45; // moonRadius2d
        const curX = r2MoonX !== null ? r2MoonX : (canvas2d.width / 2 - 80);
        const dx = x - curX;
        const dy = y - cy;
        if (Math.sqrt(dx*dx + dy*dy) < r) {
            r2IsDragging = true;
            r2DragOffset = x - curX;
            canvas2d.style.cursor = 'grabbing';
        }
    }
}

function handle2DPointerMove(x, y) {
    if (currentRung === 10) {
        handle2DMouseMove(x, y);
    } else if (currentRung === 2) {
        const cy = canvas2d.height / 2 - 30;
        const r = 45;
        const curX = r2MoonX !== null ? r2MoonX : (canvas2d.width / 2 - 80);
        
        if (r2IsDragging) {
            r2MoonX = Math.max(r, Math.min(canvas2d.width - r, x - r2DragOffset));
            canvas2d.style.cursor = 'grabbing';
        } else {
            const dx = x - curX;
            const dy = y - cy;
            if (Math.sqrt(dx*dx + dy*dy) < r) {
                canvas2d.style.cursor = 'grab';
            } else {
                canvas2d.style.cursor = 'default';
            }
        }
    } else {
        canvas2d.style.cursor = 'default';
    }
}

function handle2DPointerUp() {
    if (currentRung === 2 && r2IsDragging) {
        r2IsDragging = false;
        canvas2d.style.cursor = 'grab';
    }
}

function handle2DClick(x, y) {
    // Rung 9 legacy canvas clicks handled via DOM buttons now.
}

function handle2DMouseMove(x, y) {
    // Deprecated for Rung 9, keeping function signature
}

// ---------------------------------------------------------
// RUNG 13: TYPE IA SUPERNOVAE
// ---------------------------------------------------------
function initRung13UI() {
    const viewport = document.getElementById('viewport-container');
    let ui = document.getElementById('r13-ui-container');
    
    if (!ui) {
        ui = document.createElement('div');
        ui.id = 'r13-ui-container';
        
        ui.innerHTML = `
            <div class="r13-flex-container">
                <!-- Left panel: Controls and Supernova details -->
                <div class="r13-left-panel">
                    <div class="r9-panel" style="flex: 1; display: flex; flex-direction: column; background: rgba(2, 16, 52, 0.85); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                        <div class="r9-panel-header" style="font-size: 11px; padding: 8px 12px;">
                            TYPE IA SUPERNOVAE TARGETS
                        </div>
                        <div style="padding: 12px; display: flex; flex-direction: column; gap: 12px; flex: 1; min-height: 0;">
                            <div class="r13-tabs">
                                <button id="r13-tab-0" class="r13-tab active">SN 2011fe</button>
                                <button id="r13-tab-1" class="r13-tab">SN 1994D</button>
                                <button id="r13-tab-2" class="r13-tab">SN 2005cf</button>
                            </div>
                            
                            <div class="r13-details-box">
                                <h4 id="r13-event-name">SN 2011fe</h4>
                                <p id="r13-event-type" style="color: #00ffaa; font-weight: bold; margin: 2px 0; font-size: 11.5px;"></p>
                                <p id="r13-event-desc" style="font-size: 11.5px; opacity: 0.85; line-height: 1.45;"></p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Right panel: Light Curve Canvas -->
                <div class="r13-right-panel">
                    <div class="r9-panel" style="flex: 1; display: flex; flex-direction: column; background: rgba(2, 16, 52, 0.85); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                        <div class="r9-panel-header" style="font-size: 11px; padding: 8px 12px;">
                            SUPERNOVA LIGHT CURVE (V-BAND APPARENT MAGNITUDE)
                        </div>
                        <div class="r13-canvas-wrapper">
                            <canvas id="r13-lightcurve-canvas"></canvas>
                        </div>
                        <!-- Dynamic Physics Explanation Box -->
                        <div id="r13-explanation-box" style="padding:10px 12px; background:rgba(2, 10, 30, 0.95); border-top:1px solid rgba(0,212,255,0.25); color:#fff; font-family:'Outfit',sans-serif; font-size:11.5px; line-height:1.45;">
                        </div>
                        <!-- Bottom Info Bar -->
                        <div id="r13-info-bar" style="display:flex; gap:15px; padding:8px 12px; background:rgba(2,16,52,0.9); border-top:1px solid rgba(0,212,255,0.2); font-family:'JetBrains Mono',monospace; font-size:11px;">
                            <span style="color:#888;">TARGET: <span id="r13-info-name" style="color:#fff;">SN 2011fe</span></span>
                            <span style="color:#888;">HOST GALAXY: <span id="r13-info-host-val" style="color:#00d4ff;">M101</span></span>
                            <span style="color:#888;">PEAK APPARENT MAG: <span id="r13-info-peak" style="color:#ff0055;">—</span></span>
                            <span style="color:#888;">DISTANCE: <span id="r13-info-d" style="color:#00ffaa;">—</span></span>
                            <span id="r13-info-status" style="margin-left:auto; color:#888;">0 / 3 calibrated</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        viewport.appendChild(ui);
        
        // Add tab listeners
        for (let i = 0; i < 3; i++) {
            const btn = document.getElementById(`r13-tab-${i}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    selectRung13Supernova(i);
                });
            }
        }
        
        // Resize listener
        window.addEventListener('resize', () => {
            if (currentRung === 13) {
                drawRung13LightCurve();
            }
        });
    }
    
    // Position layout below the main header bar to avoid text overlap!
    ui.style.display = 'flex';
    ui.style.flexDirection = 'column';
    ui.style.position = 'absolute';
    ui.style.top = '60px'; // Shifted down to clear "THE OBSERVATORY" title
    ui.style.left = '10px';
    ui.style.right = '10px';
    ui.style.bottom = '10px';
    ui.style.zIndex = '5';
    ui.style.overflowY = 'auto'; // Safe scrolling for smaller dimensions
    
    // Set initial values
    const sn = r13State.supernovae[r13State.activeSupernovaIndex];
    const peakInput = document.getElementById('input-peak_mag');
    if (peakInput && sn) {
        peakInput.value = sn.verified ? sn.truePeak : 12.0;
        const peakVal = document.getElementById('val-peak_mag');
        if (peakVal) peakVal.textContent = parseFloat(peakInput.value).toFixed(2) + ' mag';
    }
    
    syncRung13UI();
}

function selectRung13Supernova(idx) {
    r13State.activeSupernovaIndex = idx;
    
    // Update tabs
    for (let i = 0; i < 3; i++) {
        const btn = document.getElementById(`r13-tab-${i}`);
        if (btn) {
            if (i === idx) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    }
    
    const sn = r13State.supernovae[idx];
    const peakInput = document.getElementById('input-peak_mag');
    if (peakInput) {
        peakInput.value = sn.verified ? sn.truePeak : 12.0;
        const peakVal = document.getElementById('val-peak_mag');
        if (peakVal) peakVal.textContent = parseFloat(peakInput.value).toFixed(2) + ' mag';
    }
    
    // Clear feedback
    if (els.feedback) {
        els.feedback.className = 'verification-feedback';
        els.feedback.textContent = '';
    }
    
    updateCalculation();
}

function syncRung13UI() {
    const sn = r13State.supernovae[r13State.activeSupernovaIndex];
    if (!sn) return;
    
    // Tab verification indicator
    r13State.supernovae.forEach((s, i) => {
        const tab = document.getElementById(`r13-tab-${i}`);
        if (tab) {
            if (s.verified) {
                tab.classList.add('verified');
            } else {
                tab.classList.remove('verified');
            }
        }
    });
    
    // Header & Details
    const nameEl = document.getElementById('r13-event-name');
    const typeEl = document.getElementById('r13-event-type');
    const descEl = document.getElementById('r13-event-desc');
    
    if (nameEl) nameEl.textContent = sn.name;
    if (typeEl) typeEl.textContent = "Host Galaxy: " + sn.host;
    
    let desc = "";
    if (sn.name === "SN 2011fe") {
        desc = "Discovered in the Pinwheel Galaxy (M101) on August 24, 2011. Being one of the closest supernovae discovered in decades, it became a crucial benchmark for standard candle calibration.";
    } else if (sn.name === "SN 1994D") {
        desc = "A prominent Type Ia supernova in the lenticular galaxy NGC 4526, widely photographed by the Hubble Space Telescope to refine our measurements of the Hubble constant.";
    } else if (sn.name === "SN 2005cf") {
        desc = "An exceptionally well-observed supernova in the host galaxy MCG -01-39-003, serving as a golden standard for testing white dwarf merger models.";
    }
    if (descEl) descEl.textContent = desc;
    
    // Sliders & Calculation values
    const peakInput = document.getElementById('input-peak_mag');
    const userPeak = peakInput ? parseFloat(peakInput.value) : 12.0;
    
    const peakError = Math.abs(userPeak - sn.truePeak);
    const isCorrect = peakError < 0.05;
    
    const distMpc = Math.pow(10, (userPeak - 5.7) / 5);
    
    // Update labels
    const infoName = document.getElementById('r13-info-name');
    const infoHost = document.getElementById('r13-info-host-val');
    const infoPeak = document.getElementById('r13-info-peak');
    const infoD = document.getElementById('r13-info-d');
    const infoStatus = document.getElementById('r13-info-status');
    
    if (infoName) infoName.textContent = sn.name;
    if (infoHost) infoHost.textContent = sn.host.split(" ")[0];
    if (infoPeak) {
        infoPeak.textContent = userPeak.toFixed(2) + " mag";
        infoPeak.style.color = isCorrect ? '#00ffaa' : '#ff0055';
    }
    if (infoD) {
        infoD.textContent = distMpc.toFixed(1) + " Mpc";
        infoD.style.color = isCorrect ? '#00ffaa' : '#ff0055';
    }
    if (infoStatus) {
        const count = r13State.supernovae.filter(s => s.verified).length;
        infoStatus.textContent = count + " / 3 calibrated";
        infoStatus.style.color = count === 3 ? '#00ffaa' : '#888';
    }
    
    // Explanation box
    const explanation = document.getElementById('r13-explanation-box');
    if (explanation) {
        if (isCorrect) {
            explanation.innerHTML = `<span style="color:#00ffaa; font-weight:bold;">LIGHT CURVE FITTED:</span> The caliper aligns with the maximum peak apparent magnitude of <strong>m_V = ${sn.truePeak.toFixed(2)} mag</strong>. Using standard candles, the calculated distance modulus reveals a host galaxy distance of <strong>d = ${sn.trueDistMpc} Mpc</strong>. Click <strong>Verify</strong> to calibrate this target.`;
            if (window.MathJax) window.MathJax.typesetPromise([explanation]).catch(err => console.error(err));
        } else {
            explanation.innerHTML = `<strong>Calibrating Supernova:</strong> Adjust the Peak Apparent Magnitude slider to align the horizontal caliper line with the peak brightness of the observed V-band light curve data points.`;
        }
    }
    
    drawRung13LightCurve();
}

function drawRung13LightCurve() {
    const canvas = document.getElementById('r13-lightcurve-canvas');
    if (!canvas) return;
    
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    
    const sn = r13State.supernovae[r13State.activeSupernovaIndex];
    if (!sn) return;
    
    const peakInput = document.getElementById('input-peak_mag');
    const userPeak = peakInput ? parseFloat(peakInput.value) : 12.0;
    const isCorrect = Math.abs(userPeak - sn.truePeak) < 0.05;

    // Time on X axis: -15 days to +45 days
    // Magnitude on Y axis: userPeak-1.2 (top) to userPeak+3.8 (bottom)
    const minTime = -15, maxTime = 45;
    const minMag = userPeak - 1.2, maxMag = userPeak + 3.8;
    
    function toX(t) {
        return 50 + ((t - minTime) / (maxTime - minTime)) * (w - 80);
    }
    function toY(mag) {
        return 30 + ((mag - minMag) / (maxMag - minMag)) * (h - 60);
    }
    
    // V-band Light Curve template shape
    function getSupernovaMag(t, peakMag) {
        if (t < 0) {
            return peakMag + 0.03 * t * t;
        } else if (t < 15) {
            return peakMag + 1.1 * Math.pow(t / 15, 1.25);
        } else {
            return peakMag + 1.1 + 0.028 * (t - 15);
        }
    }
    
    // Observed data points (noisy scatter plot around sn.truePeak)
    const dataPoints = [];
    const seed = sn.truePeak * 100;
    const days = [-12, -9, -6, -3, 0, 2, 5, 8, 11, 15, 20, 25, 30, 35, 40];
    
    days.forEach((day, i) => {
        const rand = Math.sin(seed + i * 1.7) * 0.12;
        const trueMag = getSupernovaMag(day, sn.truePeak);
        dataPoints.push({ t: day, m: trueMag + rand });
    });
    
    // Plot data points
    ctx.fillStyle = '#00d4ff';
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
    ctx.lineWidth = 1;
    
    dataPoints.forEach(pt => {
        const px = toX(pt.t);
        const py = toY(pt.m);
        
        // Draw error bar
        ctx.beginPath();
        ctx.moveTo(px, py - 6);
        ctx.lineTo(px, py + 6);
        ctx.stroke();
        
        // Draw dot
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw template curve based on user's peak magnitude slider
    const templateColor = isCorrect ? '#00ffaa' : '#ff3366';
    ctx.strokeStyle = templateColor;
    ctx.lineWidth = isCorrect ? 2.5 : 1.8;
    
    if (isCorrect) {
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 8;
    }
    
    ctx.beginPath();
    for (let t = minTime; t <= maxTime; t += 0.5) {
        const mag = getSupernovaMag(t, userPeak);
        const px = toX(t);
        const py = toY(mag);
        if (t === minTime) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // reset
    
    // Draw Horizontal Caliper Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    
    const peakY = toY(userPeak);
    ctx.beginPath();
    ctx.moveTo(35, peakY);
    ctx.lineTo(w - 20, peakY);
    ctx.stroke();
    ctx.setLineDash([]); // reset
    
    // Caliper peak label
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Peak: ${userPeak.toFixed(2)} mag`, 40, peakY - 6);
    
    // Draw peak V-band marker
    ctx.fillStyle = templateColor;
    ctx.beginPath();
    ctx.arc(toX(0), toY(userPeak), 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Titles & axes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Apparent Magnitude (m_V) - brighter is up', 10, 20);
    ctx.textAlign = 'right';
    ctx.fillText('Days since peak brightness (days)', w - 10, h - 8);
}

// ---------------------------------------------------------
// RUNG 14: GRAVITATIONAL WAVE STANDARD SIRENS
// ---------------------------------------------------------
function initRung14UI() {
    const viewport = document.getElementById('viewport-container');
    let ui = document.getElementById('r14-ui-container');
    
    if (!ui) {
        ui = document.createElement('div');
        ui.id = 'r14-ui-container';
        
        ui.innerHTML = `
            <div class="r14-flex-container">
                <!-- Left panel: Controls and Event details -->
                <div class="r14-left-panel">
                    <div class="r9-panel" style="flex: 1; display: flex; flex-direction: column; background: rgba(2, 16, 52, 0.85); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                        <div class="r9-panel-header" style="font-size: 11px; padding: 8px 12px;">
                            GRAVITATIONAL WAVE EVENTS
                        </div>
                        <div style="padding: 12px; display: flex; flex-direction: column; gap: 12px; flex: 1; min-height: 0;">
                            <div class="r14-tabs">
                                <button id="r14-tab-0" class="r14-tab active">GW150914</button>
                                <button id="r14-tab-1" class="r14-tab">GW170817</button>
                                <button id="r14-tab-2" class="r14-tab">GW190521</button>
                            </div>
                            
                            <div class="r14-details-box">
                                <h4 id="r14-event-name">GW150914</h4>
                                <p id="r14-event-type" style="color: #00ffaa; font-weight: bold; margin: 2px 0; font-size: 11.5px;"></p>
                                <p id="r14-event-desc" style="font-size: 11.5px; opacity: 0.85; line-height: 1.45;"></p>
                            </div>
                            
                            <div class="r14-snr-container">
                                <div class="r14-snr-title">Detector SNR</div>
                                <div class="r14-snr-bar-bg">
                                    <div class="r14-snr-bar-fill" id="r14-snr-fill"></div>
                                </div>
                                <div class="r14-snr-value" id="r14-snr-val">SNR: 0.0</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Right panel: Waveform Canvas -->
                <div class="r14-right-panel">
                    <div class="r9-panel" style="flex: 1; display: flex; flex-direction: column; background: rgba(2, 16, 52, 0.85); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                        <div class="r9-panel-header" style="font-size: 11px; padding: 8px 12px;">
                            INTERFEROMETER DETECTOR STRAIN (h(t) vs TIME)
                        </div>
                        <div class="r14-canvas-wrapper">
                            <canvas id="r14-wave-canvas"></canvas>
                        </div>
                        <!-- Dynamic Physics Explanation Box -->
                        <div id="r14-explanation-box" style="padding:10px 12px; background:rgba(2, 10, 30, 0.95); border-top:1px solid rgba(0,212,255,0.25); color:#fff; font-family:'Outfit',sans-serif; font-size:11.5px; line-height:1.45;">
                        </div>
                        <!-- Bottom Info Bar -->
                        <div id="r14-info-bar" style="display:flex; gap:15px; padding:8px 12px; background:rgba(2,16,52,0.9); border-top:1px solid rgba(0,212,255,0.2); font-family:'JetBrains Mono',monospace; font-size:11px;">
                            <span style="color:#888;">EVENT: <span id="r14-info-name" style="color:#fff;">GW150914</span></span>
                            <span style="color:#888;">TYPE: <span id="r14-info-type-val" style="color:#00d4ff;">Binary Black Hole</span></span>
                            <span style="color:#888;">CHIRP MASS: <span id="r14-info-mass" style="color:#ff0055;">—</span></span>
                            <span style="color:#888;">DISTANCE: <span id="r14-info-d" style="color:#00ffaa;">—</span></span>
                            <span id="r14-info-status" style="margin-left:auto; color:#888;">0 / 3 calibrated</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        viewport.appendChild(ui);
        
        // Add tab listeners
        for (let i = 0; i < 3; i++) {
            const btn = document.getElementById(`r14-tab-${i}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    selectRung14Event(i);
                });
            }
        }
        
        // Resize listener
        window.addEventListener('resize', () => {
            if (currentRung === 14) {
                drawRung14Waveform();
            }
        });
    }
    
    // Position layout
    ui.style.display = 'flex';
    ui.style.flexDirection = 'column';
    ui.style.position = 'absolute';
    ui.style.top = '60px';
    ui.style.left = '10px';
    ui.style.right = '10px';
    ui.style.bottom = '10px';
    ui.style.zIndex = '5';
    ui.style.overflowY = 'auto';
    
    // Set initial values
    const ev = r14State.events[r14State.activeEventIndex];
    const massInput = document.getElementById('input-chirp_mass');
    const distInput = document.getElementById('input-gw_distance');
    if (massInput && distInput) {
        massInput.value = ev.verified ? ev.trueChirpMass : 15.0;
        distInput.value = ev.verified ? ev.trueDistMpc : 600;
        
        const massVal = document.getElementById('val-chirp_mass');
        const distVal = document.getElementById('val-gw_distance');
        if (massVal) massVal.textContent = massInput.value + ' M☉';
        if (distVal) distVal.textContent = distInput.value + ' Mpc';
    }
    
    syncRung14UI();
}

function selectRung14Event(idx) {
    r14State.activeEventIndex = idx;
    
    // Update tabs
    for (let i = 0; i < 3; i++) {
        const btn = document.getElementById(`r14-tab-${i}`);
        if (btn) {
            if (i === idx) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    }
    
    const ev = r14State.events[idx];
    const massInput = document.getElementById('input-chirp_mass');
    const distInput = document.getElementById('input-gw_distance');
    if (massInput && distInput) {
        massInput.value = ev.verified ? ev.trueChirpMass : 15.0;
        distInput.value = ev.verified ? ev.trueDistMpc : 600;
        
        const massVal = document.getElementById('val-chirp_mass');
        const distVal = document.getElementById('val-gw_distance');
        if (massVal) massVal.textContent = massInput.value + ' M☉';
        if (distVal) distVal.textContent = distInput.value + ' Mpc';
    }
    
    // Clear feedback
    if (els.feedback) {
        els.feedback.className = 'verification-feedback';
        els.feedback.textContent = '';
    }
    
    updateCalculation();
}

function syncRung14UI() {
    const ev = r14State.events[r14State.activeEventIndex];
    if (!ev) return;
    
    // Tab verification indicator
    r14State.events.forEach((e, i) => {
        const tab = document.getElementById(`r14-tab-${i}`);
        if (tab) {
            if (e.verified) {
                tab.classList.add('verified');
            } else {
                tab.classList.remove('verified');
            }
        }
    });
    
    // Header & Details
    const nameEl = document.getElementById('r14-event-name');
    const typeEl = document.getElementById('r14-event-type');
    const descEl = document.getElementById('r14-event-desc');
    
    if (nameEl) nameEl.textContent = ev.name;
    if (typeEl) typeEl.textContent = ev.type;
    
    let desc = "";
    if (ev.name === "GW150914") {
        desc = "The historic first direct detection of gravitational waves, originating from the merger of two stellar-mass black holes (~36 and 29 solar masses) located approximately 410 Megaparsecs away.";
    } else if (ev.name === "GW170817") {
        desc = "The famous binary neutron star merger that initiated multi-messenger astronomy. Its electromagnetic counterpart (gamma-ray burst and kilonova) was observed within seconds, located in the galaxy NGC 4993 at 40 Megaparsecs.";
    } else if (ev.name === "GW190521") {
        desc = "An exceptionally high-mass merger of two black holes (~85 and 66 solar masses) that formed an intermediate-mass black hole, detected at a cosmological distance of 5,300 Megaparsecs.";
    }
    if (descEl) descEl.textContent = desc;
    
    // Sliders & Calculation values
    const massInput = document.getElementById('input-chirp_mass');
    const distInput = document.getElementById('input-gw_distance');
    
    const chirpMass = massInput ? parseFloat(massInput.value) : 10.0;
    const distance = distInput ? parseFloat(distInput.value) : 200;
    
    // Fit errors
    const massError = Math.abs(chirpMass - ev.trueChirpMass) / ev.trueChirpMass;
    const distError = Math.abs(distance - ev.trueDistMpc) / ev.trueDistMpc;
    
    const massCorrect = massError < 0.05;
    const distCorrect = distError < 0.10;
    const isCorrect = massCorrect && distCorrect;
    
    // SNR Calculation: base noise plus peaked match
    let snr = 1.2 + Math.sin(Date.now() * 0.005) * 0.1;
    if (massCorrect && distCorrect) {
        snr = 25.0 - (massError * 100) - (distError * 50);
        snr = Math.max(18, Math.min(25, snr));
    } else {
        const overlap = Math.max(0, 1 - massError * 2) * Math.max(0, 1 - distError * 1.5);
        snr += overlap * 12.0;
    }
    
    const snrFill = document.getElementById('r14-snr-fill');
    const snrVal = document.getElementById('r14-snr-val');
    if (snrFill) {
        snrFill.style.width = Math.min(100, (snr / 25.0) * 100) + '%';
    }
    if (snrVal) {
        snrVal.textContent = "SNR: " + snr.toFixed(1);
        snrVal.style.color = isCorrect ? '#00ffaa' : snr > 10 ? '#ffcc00' : '#ff0055';
    }
    
    // Info bar
    const infoName = document.getElementById('r14-info-name');
    const infoType = document.getElementById('r14-info-type-val');
    const infoMass = document.getElementById('r14-info-mass');
    const infoD = document.getElementById('r14-info-d');
    const infoStatus = document.getElementById('r14-info-status');
    
    if (infoName) infoName.textContent = ev.name;
    if (infoType) infoType.textContent = ev.type;
    if (infoMass) {
        infoMass.textContent = chirpMass.toFixed(2) + " M☉";
        infoMass.style.color = massCorrect ? '#00ffaa' : '#ff0055';
    }
    if (infoD) {
        infoD.textContent = distance + " Mpc";
        infoD.style.color = distCorrect ? '#00ffaa' : '#ff0055';
    }
    if (infoStatus) {
        const count = r14State.events.filter(e => e.verified).length;
        infoStatus.textContent = count + " / 3 calibrated";
        infoStatus.style.color = count === 3 ? '#00ffaa' : '#888';
    }
    
    // Dynamic Explanation
    const explanation = document.getElementById('r14-explanation-box');
    if (explanation) {
        if (isCorrect) {
            explanation.innerHTML = `<span style="color:#00ffaa; font-weight:bold;">TEMPLATE WAVE MATCHED:</span> The templates match the raw detector strain perfectly. By modeling the frequency chirp rate, we determined the system Chirp Mass is <strong>\\(\\mathcal{M}\\) = ${ev.trueChirpMass.toFixed(2)} M☉</strong>. Using standard siren cosmology, the wave strain amplitude reveals an absolute luminosity distance of <strong>d_L = ${ev.trueDistMpc} Mpc</strong> (SNR = ${snr.toFixed(1)}). Click <strong>Verify</strong> to calibrate this event.`;
            if (window.MathJax) window.MathJax.typesetPromise([explanation]).catch(err => console.error(err));
        } else {
            explanation.innerHTML = `<strong>Fitting Gravitational Wave Template:</strong> Use the sliders to adjust Chirp Mass (frequency chirp rate) and Distance (strain amplitude). Match the red user template wave with the noisy blue/cyan interferometer detector readings.`;
        }
    }
    
    drawRung14Waveform();
}

function drawRung14Waveform() {
    const canvas = document.getElementById('r14-wave-canvas');
    if (!canvas) return;
    
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    
    const ev = r14State.events[r14State.activeEventIndex];
    if (!ev) return;
    
    const massInput = document.getElementById('input-chirp_mass');
    const distInput = document.getElementById('input-gw_distance');
    
    const userMass = massInput ? parseFloat(massInput.value) : 10.0;
    const userDist = distInput ? parseFloat(distInput.value) : 200;
    
    const massError = Math.abs(userMass - ev.trueChirpMass) / ev.trueChirpMass;
    const distError = Math.abs(userDist - ev.trueDistMpc) / ev.trueDistMpc;
    const isCorrect = massError < 0.05 && distError < 0.10;
    
    const midY = h / 2;
    
    // Generate raw noisy data (blue/cyan)
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    // Seed for deterministic noise based on event and pixel coordinate
    const noiseSeed = ev.name === "GW150914" ? 10 : ev.name === "GW170817" ? 50 : 90;
    
    for (let x = 0; x < w; x++) {
        // Real signal component
        const signal = calculateGWStrain(x, w, h, ev.trueChirpMass, ev.trueDistMpc, ev);
        
        // High frequency laser cavity optical cavity noise
        const n1 = Math.sin(x * 0.95 + noiseSeed) * 4;
        const n2 = Math.cos(x * 2.13 + noiseSeed * 0.4) * 3;
        const n3 = Math.sin(x * 4.71 + noiseSeed * 1.5) * 1.5;
        
        const y = midY + signal + n1 + n2 + n3;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Generate template signal (red or green)
    const templateColor = isCorrect ? '#00ffaa' : '#ff3366';
    ctx.strokeStyle = templateColor;
    ctx.lineWidth = isCorrect ? 2.5 : 1.8;
    
    // Glow effect for matching template
    if (isCorrect) {
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 8;
    }
    
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
        const signal = calculateGWStrain(x, w, h, userMass, userDist, ev);
        const y = midY + signal;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // reset
    
    // Titles & axes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Interferometer Strain amplitude h(t)', 10, 20);
    ctx.textAlign = 'right';
    ctx.fillText('Time (milliseconds)', w - 10, h - 8);
}

function calculateGWStrain(x, width, canvasHeight, chirpMass, distance, eventInfo) {
    const mergerX = width - 80;
    if (x < mergerX) {
        // Time left to coalescence
        const tau = (mergerX - x) / (width * 0.8) + 0.005;
        
        // Frequency increases as tau decreases
        // f = base * tau^(-3/8) * mass^(3/8)
        const freqFactor = Math.pow(chirpMass / 28.2, 0.375);
        const phase = 30 - 32 * Math.pow(tau, 0.625) * freqFactor;
        
        // Strain amplitude is inversely proportional to distance and increases towards merger
        // Amplitude ~ Mass^(5/3) / distance * tau^(-1/4)
        const ampFactor = Math.pow(chirpMass, 1.67) / distance;
        
        // Normalize so the amplitude stays visually standard on canvas
        const baseNorm = eventInfo.name === "GW150914" ? 1800 : eventInfo.name === "GW170817" ? 500 : 25000;
        const amp = ampFactor * Math.pow(tau, -0.25) * eventInfo.amplitudeScale * baseNorm;
        
        // Clamp to prevent huge spike at merger
        const clampedAmp = Math.min(amp, canvasHeight / 2.3);
        
        return Math.sin(phase) * clampedAmp;
    } else {
        // Post-merger ringdown (exponential decay)
        const dx = x - mergerX;
        
        const ampFactor = Math.pow(chirpMass, 1.67) / distance;
        const baseNorm = eventInfo.name === "GW150914" ? 1800 : eventInfo.name === "GW170817" ? 500 : 25000;
        const ampAtMerger = ampFactor * Math.pow(0.005, -0.25) * eventInfo.amplitudeScale * baseNorm;
        const clampedAmpMerger = Math.min(ampAtMerger, canvasHeight / 2.3);
        
        const decay = Math.exp(-dx / 12);
        
        // Ringdown frequency is higher
        const ringdownFreq = eventInfo.name === "GW150914" ? 0.3 : eventInfo.name === "GW170817" ? 0.5 : 0.2;
        return Math.sin(dx * ringdownFreq) * clampedAmpMerger * decay;
    }
}

// ==========================================
// WIKI CONTENT & PROGRAMMATIC BINDING
// ==========================================

// Bind wiki property to RUNGS using global WIKI_CONTENT
RUNGS.forEach(rung => {
    if (typeof WIKI_CONTENT !== 'undefined' && WIKI_CONTENT[rung.id]) {
        rung.wiki = WIKI_CONTENT[rung.id];
    } else {
        rung.wiki = `
## ${rung.title}
*Content coming soon.*
`;
    }
});
