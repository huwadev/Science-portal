/* ==========================================================================
   ESSS SCIENCE PORTAL INTERACTION LOGIC
   ========================================================================== */

function initApp() {
    // Initialize Copyright Year
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 1. LANGUAGE TOGGLE STATE & LOGIC
    const langBtn = document.getElementById('lang-btn');
    const langEnSpan = document.getElementById('lang-en');
    const langAmSpan = document.getElementById('lang-am');
    const htmlElem = document.documentElement;

    const LANG_EN = 'en';
    const LANG_AM = 'am';

    const translations = {
        [LANG_EN]: {
            nav_home: "Home",
            nav_apps: "Space Apps",
            nav_labs: "Science Labs",
            nav_projects: "Space Apps",
            nav_data: "Science Labs",
            nav_about: "About",
            hero_badge: "ESSS Science & Innovation",
            hero_title: "Ethiopian Space Science Society",
            hero_subtitle: "Exploration, Innovation, and Inspiration for Africa's Space Future.",
            hero_cta: "Explore the Universe",
            hero_secondary: "View Space Apps",
            featured_tag: "Space Application",
            featured_title_main: "Walk in the Solar System",
            status_active: "Space App",
            featured_title: "Walk in the Solar System",
            featured_desc: "Experience our neighborhood in space with this interactive 3D map. Explore accurate orbital mechanics, scaled celestial bodies, and immersive physics-based simulation.",
            features_title: "Key Features:",
            feat_1: "Interactive 3D celestial navigation",
            feat_2: "Accurate orbital mechanics & scaling",
            feat_3: "Bilingual guidance & rich educational details",
            featured_button: "Launch Interactive Map",
            lunar_tag: "Space Application",
            lunar_title_main: "3D Interactive Lunar Explorer",
            status_active_lunar: "Space App",
            lunar_title: "Lunar Explorer & Topography",
            lunar_desc: "Explore the Moon in full 3D. Inspect historic landing sites, craters, and maria using high-resolution NASA topology data mapped to a realistic spherical globe.",
            lunar_features_title: "Key Features:",
            lunar_feat_1: "High-resolution 3D terrain",
            lunar_feat_2: "50+ annotated historic locations",
            lunar_feat_3: "Offline-ready bilingual encyclopedia",
            lunar_button: "Launch Lunar Explorer",
            eclipse_tag: "Space Application",
            eclipse_title_main: "Solar & Lunar Eclipse Predictor",
            status_active_eclipse: "Space App",
            eclipse_title: "Solar & Lunar Eclipse Predictor",
            eclipse_desc: "Explore past and future solar and lunar eclipses. Inspect totality paths, penumbral coverage, and local obscuration details using our high-precision simulation engine.",
            eclipse_features_title: "Key Features:",
            eclipse_feat_1: "Precision 2D/3D dynamic map views",
            eclipse_feat_2: "Custom local simulation & stats",
            eclipse_feat_3: "Kotlin integration & offline support",
            eclipse_button: "Launch Eclipse Predictor",
            future_tag: "Science Labs",
            future_title: "Science Lab Modules",
            future_subtitle: "Explore our collection of interactive science labs, physics sandboxes, and aerospace simulators.",
            coming_soon: "Coming Soon",
            project_sat_title: "Ethiopian Satellite Tracker",
            project_sat_desc: "Real-time tracking of ET-RSS1 and future Ethiopian spacecraft with orbital path visualization.",
            project_exo_title: "Exoplanet Archive",
            project_exo_desc: "Searchable index of discovered exoplanets with 3D transit visualization models.",
            project_weather_title: "Space Weather Observatory",
            project_weather_desc: "Live monitoring of solar flares, geomagnetic storms, and ionospheric perturbations over East Africa.",
            about_tag: "About the Society",
            about_title: "Ethiopian Space Science Society (ESSS)",
            about_desc: "Established in 2004, the Ethiopian Space Science Society (ESSS) is a non-governmental organization composed of members representing space science professionals, space technology enthusiasts, and interested individuals. ESSS operates with a mission to develop space science and technology capacity in Ethiopia, making the country an active contributor to space applications in East Africa.",
            stat_est: "Established",
            stat_members: "Active Members",
            stat_branches: "Regional Branches",
            footer_tagline: "Advancing astronomical sciences and space technology research in Ethiopia.",
            footer_links_title: "Quick Links",
            footer_main_site: "Official Website",
            footer_social_title: "Connect",
            in_development: "In Development",
            mod_btn_pending: "Pending",
            mod_btn_launch: "Launch Module",
            powered_by: "Powered by:",
            cat_planetary_science: "Planetary Science",
            cat_astrophysics: "Astrophysics",
            cat_cosmology___relativity: "Cosmology & Relativity",
            cat_astrobiology: "Astrobiology",
            cat_aerospace_engineering: "Aerospace Engineering",
            cat_space_weather___physics: "Space Weather & Physics",
            cat_radio_science: "Radio Science",
            cat_earth_observation___climate: "Earth Observation & Climate",
            comp_ultra: "Ultra",
            comp_high: "High",
            comp_medium: "Medium",
            comp_low: "Low",
            aud_all: "All",
            aud_students___teachers: "Students & Teachers",
            aud_students___enthusiasts: "Students & Enthusiasts",
            aud_enthusiasts___nerds: "Enthusiasts & Nerds",
            "module-eclipses-transits_title": "Eclipse & Transit Physics Lab",
            "module-eclipses-transits_concept": "Explore the optical geometry, shadow structures (umbra/penumbra), and orbital alignment physics that create eclipses and planetary transits.",
            "module-cosmic-ladder_title": "The Cosmic Distance Ladder",
            "module-cosmic-ladder_concept": "Interactive journey through history to measure the scale of the universe.",
            "module-1_title": "Exoplanet Transit Light Curve Lab",
            "module-1_concept": "Simulate a planet crossing a star to plot light dimming curves.",
            "module-2_title": "Gravitational Slingshot Sandbox",
            "module-2_concept": "Launch a probe past a moving planet to alter its heliocentric velocity.",
            "module-3_title": "Amateur Rocket Ballistics Engine",
            "module-3_concept": "Design a rocket, calculate stability, and simulate flight profiles with 2D wind drift.",
            "module-4_title": "LEO Satellite Pass & Doppler Calculator",
            "module-4_concept": "Predict satellite visibility footprints and real-time radio frequency shifts.",
            "module-5_title": "Radio Aperture Synthesis Visualizer",
            "module-5_concept": "Arrange antenna arrays to observe how layouts dictate radio image resolution.",
            "module-6_title": "Multi-Phase Orbital Mechanics Simulator",
            "module-6_concept": "Gamified physics sandbox for gravity turns, Hohmann transfers, and rendezvous.",
            "module-7_title": "Live Solar Activity & SOHO Viewer",
            "module-7_concept": "Real-time dashboard fetching live sun imagery from SOHO and GOES.",
            "module-8_title": "Virtual Wave Optics Lab",
            "module-8_concept": "Interactive lab to simulate double-slit diffraction, interference, and polarization.",
            "module-9_title": "Plasma & EM Field Simulator",
            "module-9_concept": "Visualize how charged particles interact with Earth's magnetic field.",
            footer_copyright: "Ethiopian Space Science Society (ESSS). All rights reserved."
        },
        [LANG_AM]: {
            nav_home: "መነሻ ገጽ",
            nav_apps: "የስፔስ መተግበሪያዎች",
            nav_labs: "የሳይንስ ላብራቶሪዎች",
            nav_projects: "የስፔስ መተግበሪያዎች",
            nav_data: "የሳይንስ ላብራቶሪዎች",
            nav_about: "ስለ እኛ",
            hero_badge: "የኢትዮጵያ ስፔስ ሳይንስና ፈጠራ",
            hero_title: "የኢትዮጵያ ስፔስ ሳይንስ ሶሳይቲ",
            hero_subtitle: "አሰሳ፣ ፈጠራ እና መነሳሳት ለአፍሪካ የጠፈር መፃኢ እድል ።",
            hero_cta: "ዩኒቨርስን ያስሱ",
            hero_secondary: "የስፔስ መተግበሪያዎችን ይመልከቱ",
            featured_tag: "የስፔስ መተግበሪያ",
            featured_title_main: "በስርዓተ ፀሐይ ውስጥ የሚደረግ ጉዞ",
            status_active: "የስፔስ መተግበሪያ",
            featured_title: "በስርዓተ ፀሐይ ውስጥ የሚደረግ ጉዞ",
            featured_desc: "በስርዓተ ፀሐይ ውስጥ የሚደረግ በይነተገናኝ 3-ዲ ጉዞ። ትክክለኛ የሰማይ አካላት ምህዋር፣ የተመጣጠነ መጠን እና ጥልቅ የስበት ማስመሰያዎችን ያስሱ።",
            features_title: "ዋና ዋና ባህሪያት፡",
            feat_1: "በይነተገናኝ የ3-ዲ ሰማይ አካላት አሰሳ",
            feat_2: "ትክክለኛ የሰውነት ምህዋር እና መጠን ማስተካካያ",
            feat_3: "ሁለት ቋንቋዎችን የሚደግፍና ሰፊ ትምህርታዊ መግለጫ",
            featured_button: "በይነተገናኙን ካርታ ክፈት",
            lunar_tag: "የስፔስ መተግበሪያ",
            lunar_title_main: "ባለ 3-ዲ በይነተገናኝ የጨረቃ ማሰሻ",
            status_active_lunar: "የስፔስ መተግበሪያ",
            lunar_title: "የጨረቃ ማሰሻ እና ገጽታ",
            lunar_desc: "ጨረቃን በ3-ዲ ያስሱ። ከፍተኛ ጥራት ያለው የናሳ መረጃን በመጠቀም ታሪካዊ የማረፊያ ቦታዎችን፣ ቆሬዎችን እና ሜዳዎችን በተጨባጭ ምናባዊ ሞዴል ይመልከቱ።",
            lunar_features_title: "ዋና ዋና ባህሪያት፡",
            lunar_feat_1: "ከፍተኛ ጥራት ያለው የ3-ዲ ገጽታ",
            lunar_feat_2: "ከ50 በላይ የተብራሩ ታሪካዊ ቦታዎች",
            lunar_feat_3: "ከመስመር ውጭ የሚሰራ ባለሁለት ቋንቋ መዝገበ-ዕውቀት",
            lunar_button: "የጨረቃ ማሰሻን ክፈት",
            eclipse_tag: "የስፔስ መተግበሪያ",
            eclipse_title_main: "የፀሐይና ጨረቃ ግርዶሽ መተንበያ",
            status_active_eclipse: "የስፔስ መተግበሪያ",
            eclipse_title: "የፀሐይና ጨረቃ ግርዶሽ መተንበያ",
            eclipse_desc: "ያለፉ እና የወደፊት የፀሐይ እና ጨረቃ ግርዶሾችን ያስሱ። ትክክለኛ የግርዶሽ መስመሮችን፣ የጥላ ስርጭትን እና የአካባቢውን መቶኛ በእኛ ከፍተኛ ጥራት ማስያ ይመልከቱ።",
            eclipse_features_title: "ዋና ዋና ባህሪያት፡",
            eclipse_feat_1: "ከፍተኛ ጥራት ያለው ባለ 2-ዲ እና 3-ዲ በይነተገናኝ እይታ",
            eclipse_feat_2: "የአካባቢ የግርዶሽ ማስያ እና ስታቲስቲክስ",
            eclipse_feat_3: "የኮትሊን ውህደት እና ከመስመር ውጭ ድጋፍ",
            eclipse_button: "የግርዶሽ መተንበያውን ክፈት",
            future_tag: "የሳይንስ ላብራቶሪዎች",
            future_title: "የሳይንስ ላብራቶሪ ሞጁሎች",
            future_subtitle: "በይነተገናኝ የሳይንስ ላብራቶሪዎችን፣ የፊዚክስ ማሳያዎችን እና የኤሮስፔስ ሲሙሌተሮችን ያስሱ።",
            coming_soon: "በቅርቡ የሚጠበቅ",
            project_sat_title: "የኢትዮጵያ ሳተላይት መከታተያ",
            project_sat_desc: "የኢትዮጵያ ሳተላይት ET-RSS1 እና የወደፊት መንኮራኩሮችን ትክክለኛ መገኛ እና የምህዋር መስመር መከታተያ።",
            project_exo_title: "የኤክሶፕላኔት መዝገብ",
            project_exo_desc: "የተገኙ የኤክሶፕላኔቶች ዝርዝር እና የፍለጋ መዝገብ ከባለ 3-ዲ እይታ ሞዴሎች ጋር።",
            project_weather_title: "የጠፈር አየር ሁኔታ መከታተያ",
            project_weather_desc: "የፀሐይ ነበልባሎች፣ የጂኦማግኔቲክ ማዕበሎች እና በምስራቅ አፍሪካ ላይ ያለውን የኤሌክትሮማግኔቲክ መለዋወጥ መከታተያ።",
            about_tag: "ስለ ሶሳይቲው",
            about_title: "የኢትዮጵያ ስፔስ ሳይንስ ሶሳይቲ (ኢስሳሶ)",
            about_desc: "በ2004 እ.ኤ.አ. የተመሰረተው የኢትዮጵያ ስፔስ ሳይንስ ሶሳይቲ (ESSS) የጠፈር ሳይንስ ባለሙያዎችን፣ የጠፈር ቴክኖሎጂ አፍቃሪዎችን እና ፍላጎት ያላቸውን ግለሰቦች ያቀፈ መንግስታዊ ያልሆነ ድርጅት ነው። ኢስሳሶ በኢትዮጵያ የጠፈር ሳይንስና ቴክኖሎጂ አቅምን ለማጎልበት እና ሀገሪቱን በምስራቅ አፍሪካ የጠፈር መተግበሪያዎች ላይ ንቁ ተሳትፎ እንድታደርግ ለማስቻል እየሰራ ይገኛል።",
            stat_est: "የተመሰረተበት",
            stat_members: "ንቁ አባላት",
            stat_branches: "ክልላዊ ቅርንጫፎች",
            footer_tagline: "በኢትዮጵያ ውስጥ የስነ-ኮከብ ሳይንስ እና የጠፈር ቴክኖሎጂ ምርምርን ማሳደግ።",
            footer_links_title: "ፈጣን አገናኞች",
            footer_main_site: "ዋናው ድረ-ገጽ",
            footer_social_title: "ይገናኙን",
            in_development: "በእቅድ ላይ ያሉ",
            mod_btn_pending: "በመሰራት ላይ",
            mod_btn_launch: "ሞጁሉን ክፈት",
            powered_by: "የተገነባው በ፡",
            cat_planetary_science: "የፕላኔቶች ሳይንስ",
            cat_astrophysics: "አስትሮፊዚክስ",
            cat_cosmology___relativity: "ኮስሞሎጂ እና አንጻራዊነት",
            cat_astrobiology: "አስትሮባዮሎጂ",
            cat_aerospace_engineering: "ኤሮስፔስ ኢንጂነሪንግ",
            cat_space_weather___physics: "የጠፈር አየር ሁኔታ እና ፊዚክስ",
            cat_radio_science: "የሬዲዮ ሳይንስ",
            cat_earth_observation___climate: "የመሬት ምልከታ እና የአየር ንብረት",
            comp_ultra: "እጅግ ከፍተኛ",
            comp_high: "ከፍተኛ",
            comp_medium: "መካከለኛ",
            comp_low: "ቀላል",
            aud_all: "ለሁሉም",
            aud_students___teachers: "ተማሪዎች እና መምህራን",
            aud_students___enthusiasts: "ተማሪዎች እና ወዳጆች",
            aud_enthusiasts___nerds: "የሳይንስ ወዳጆች",
            "module-eclipses-transits_title": "የግርዶሽ እና ሽግግር ፊዚክስ ቤተ-ሙከራ",
            "module-eclipses-transits_concept": "ግርዶሾችን እና የፕላኔቶች ሽግግሮችን የሚፈጥሩትን የብርሃን ጂኦሜትሪ፣ የጥላ አወቃቀሮች (የድቅድቅ እና ከፊል ጥላ) እና የምህዋር አሰላለፍ ፊዚክስን ያስሱ።",
            "module-cosmic-ladder_title": "የኮስሚክ ርቀት መሰላል",
            "module-cosmic-ladder_concept": "የዩኒቨርስን ስፋት ለመለካት የሚረዳ በይነተገናኝ ታሪካዊ ጉዞ።",
            "module-1_title": "የኤክሶፕላኔት ሽግግር የብርሃን ቅነሳ ቤተ-ሙከራ",
            "module-1_concept": "አንድ ፕላኔት በኮከብ ፊት ሲያልፍ የሚኖረውን የብርሃን መቀነስ ያስመስሉ።",
            "module-2_title": "የስበት ኃይል ወንጭፍ መለማመጃ",
            "module-2_concept": "መንኮራኩርን በሚንቀሳቀስ ፕላኔት አቅራቢያ በማሳለፍ ፍጥነቷን ይቀይሩ።",
            "module-3_title": "የሮኬት በረራ ስሌት መለማመጃ",
            "module-3_concept": "ሮኬት ይንደፉ፣ መረጋጋቱን ያሰሉ እና የንፋስ ተፅዕኖን ያካተተ የበረራ ሂደት ያስመስሉ።",
            "module-4_title": "የዝቅተኛ ምህዋር ሳተላይት እና ዶፕለር ማስያ",
            "module-4_concept": "የሳተላይት መታያ ቦታዎችን እና የሬዲዮ ድግግሞሽ ለውጦችን በቅጽበት ይተነብዩ።",
            "module-5_title": "የሬዲዮ ቴሌስኮፕ ውህደት አሳያ",
            "module-5_concept": "የአንቴናዎችን አቀማመጥ በመቀየር የሬዲዮ ምስል ጥራት እንዴት እንደሚቀየር ይመልከቱ።",
            "module-6_title": "የምህዋር ሜካኒክስ ማስመሰያ",
            "module-6_concept": "የስበት መታጠፍ እና የምህዋር ሽግግርን ለመለማመድ የሚረዳ ፊዚክሳዊ ጨዋታ።",
            "module-7_title": "የፀሐይ እንቅስቃሴ እና የ SOHO ምስሎች መከታተያ",
            "module-7_concept": "ከ SOHO እና GOES የሚገኙ የቀጥታ የፀሐይ ምስሎችን የሚያሳይ መከታተያ።",
            "module-8_title": "የሞገድ ኦፕቲክስ ምናባዊ ቤተ-ሙከራ",
            "module-8_concept": "የብርሃን ስብራት እና መተላለፍን ለማሳየት የሚረዳ በይነተገናኝ ቤተ-ሙከራ።",
            "module-9_title": "የፕላዝማ እና ኤሌክትሮማግኔቲክ መስክ ማስመሰያ",
            "module-9_concept": "ቻርጅ ያላቸው ቅንጣቶች ከመሬት መግነጢሳዊ መስክ ጋር እንዴት እንደሚገናኙ ይመልከቱ።",
            footer_copyright: "የአትዮጵያ ስፔስ ሳይንስ ሶሳይቲ (ESSS)። መብቱ በህግ የተጠበቀ ነው።"
        }
    };

    const documentTitles = {
        [LANG_EN]: "ESSS Science Portal | Ethiopian Space Science Society",
        [LANG_AM]: "የኢስሳሶ ሳይንስ ፖርታል | የኢትዮጵያ ስፔስ ሳይንስ ሶሳይቲ"
    };

    const metaDescriptions = {
        [LANG_EN]: "Explore the Ethiopian Space Science Society (ESSS) Science Portal. Access interactive tools, track satellites, search exoplanet archives, and walk in the solar system.",
        [LANG_AM]: "የኢትዮጵያ ስፔስ ሳይንስ ሶሳይቲ (ኢስሳሶ) የሳይንስ ፖርታልን ይጎብኙ። በይነተገናኝ መሳሪያዎችን ይጠቀሙ፣ ሳተላይቶችን ይከታተሉ፣ የኤክሶፕላኔት መዛግብትን ይፈልጉ እና በስርዓተ ፀሐይ ውስጥ ይጓዙ።"
    };

    let currentLang = localStorage.getItem('esss_science_lang') || LANG_EN;

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('esss_science_lang', lang);
        htmlElem.setAttribute('lang', lang);

        if (langBtn) {
            if (lang === LANG_EN) {
                langEnSpan.classList.add('active-lang');
                langAmSpan.classList.remove('active-lang');
            } else {
                langEnSpan.classList.remove('active-lang');
                langAmSpan.classList.add('active-lang');
            }
        }

        document.title = documentTitles[lang];
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', metaDescriptions[lang]);
        }

        const translatableElements = document.querySelectorAll('[data-i18n]');
        translatableElements.forEach(elem => {
            const key = elem.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                elem.textContent = translations[lang][key];
            }
        });
    }

    window.setLanguage = setLanguage;

    if (langBtn) {
        langBtn.addEventListener('click', () => {
            const nextLang = currentLang === LANG_EN ? LANG_AM : LANG_EN;
            setLanguage(nextLang);
        });
    }

    setLanguage(currentLang);

    // 2. ORBIT SYSTEM INTERACTIVE TELEMETRY HOVER EFFECT
    const telemetryData = {
        default: { speed: "1.0x (REAL)", nodes: "8/9 ACTIVE" },
        mercury: { speed: "DIST: 0.39 AU", nodes: "VEL: 47.4 KM/S" },
        venus: { speed: "DIST: 0.72 AU", nodes: "VEL: 35.0 KM/S" },
        earth: { speed: "DIST: 1.00 AU", nodes: "VEL: 29.8 KM/S" },
        mars: { speed: "DIST: 1.52 AU", nodes: "VEL: 24.1 KM/S" },
        jupiter: { speed: "DIST: 5.20 AU", nodes: "VEL: 13.1 KM/S" }
    };

    const telemetrySpeedVal = document.querySelector('.visual-panel-telemetry .telemetry-bar:nth-child(1) .val');
    const telemetryNodesVal = document.querySelector('.visual-panel-telemetry .telemetry-bar:nth-child(2) .val');
    const telemetrySpeedLbl = document.querySelector('.visual-panel-telemetry .telemetry-bar:nth-child(1) .lbl');
    const telemetryNodesLbl = document.querySelector('.visual-panel-telemetry .telemetry-bar:nth-child(2) .lbl');
    const planets = document.querySelectorAll('.schematic-planet');

    if (telemetrySpeedVal && telemetryNodesVal) {
        planets.forEach(planet => {
            planet.addEventListener('mouseenter', (e) => {
                const target = e.target;
                const planetKey = target.classList.contains('planet-mercury') ? 'mercury' :
                                  target.classList.contains('planet-venus') ? 'venus' :
                                  target.classList.contains('planet-earth') ? 'earth' :
                                  target.classList.contains('planet-mars') ? 'mars' :
                                  target.classList.contains('planet-jupiter') ? 'jupiter' : 'default';
                
                if (telemetryData[planetKey]) {
                    telemetrySpeedLbl.textContent = `${planetKey.toUpperCase()} ORBIT`;
                    telemetryNodesLbl.textContent = `${planetKey.toUpperCase()} METRIC`;
                    telemetrySpeedVal.textContent = telemetryData[planetKey].speed;
                    telemetryNodesVal.textContent = telemetryData[planetKey].nodes;
                    telemetrySpeedVal.style.color = '#DEEBFF';
                    telemetryNodesVal.style.color = '#DEEBFF';
                }
            });

            planet.addEventListener('mouseleave', () => {
                telemetrySpeedLbl.textContent = 'SIM TIME SPEED';
                telemetryNodesLbl.textContent = 'CELESTIAL NODES';
                telemetrySpeedVal.textContent = telemetryData.default.speed;
                telemetryNodesVal.textContent = telemetryData.default.nodes;
                telemetrySpeedVal.style.color = 'var(--color-cosmic-base)';
                telemetryNodesVal.style.color = 'var(--color-cosmic-base)';
            });
        });
    }

    // 3. TELEMETRY NODE DATA JITTER
    const signalValNode = document.querySelector('.telemetry-node.bottom-right .telemetry-val');
    const altitudeValNode = document.querySelector('.telemetry-node.bottom-left .telemetry-val');
    
    if (signalValNode && altitudeValNode) {
        setInterval(() => {
            const rand = Math.random();
            if (rand < 0.05) {
                signalValNode.textContent = "LOCKING";
                signalValNode.style.color = "var(--color-neutral-base)";
            } else if (rand < 0.1) {
                signalValNode.textContent = "STANDBY";
                signalValNode.style.color = "var(--color-neutral-base)";
            } else {
                signalValNode.textContent = "ACTIVE";
                signalValNode.style.color = "var(--color-cosmic-base)";
            }

            const baseAlt = 628;
            const jitter = Math.floor(Math.random() * 3) - 1;
            altitudeValNode.textContent = `${baseAlt + jitter} KM`;
        }, 4000);
    }

    // 4. INTERACTIVE DYNAMIC CANVAS STARFIELD
    const canvas = document.getElementById('space-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let stars = [];
        const numStars = 100;
        
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initStars();
        }
        
        class Star {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 1.5 + 0.4;
                this.baseAlpha = Math.random() * 0.6 + 0.2;
                this.alpha = this.baseAlpha;
                this.twinkleSpeed = Math.random() * 0.02 + 0.004;
                this.twinkleFactor = Math.random() * Math.PI;
                this.vx = (Math.random() - 0.5) * 0.05;
                this.vy = (Math.random() - 0.5) * 0.05;
            }
            
            update() {
                this.x += this.vx;
                this.y += this.vy;
                
                if (this.x < 0) this.x = canvas.width;
                if (this.x > canvas.width) this.x = 0;
                if (this.y < 0) this.y = canvas.height;
                if (this.y > canvas.height) this.y = 0;
                
                this.twinkleFactor += this.twinkleSpeed;
                this.alpha = this.baseAlpha + Math.sin(this.twinkleFactor) * 0.2;
                if (this.alpha < 0) this.alpha = 0;
                if (this.alpha > 1) this.alpha = 1;
            }
            
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(222, 235, 255, ${this.alpha})`;
                ctx.fill();
            }
        }
        
        function initStars() {
            stars = [];
            for (let i = 0; i < numStars; i++) {
                stars.push(new Star());
            }
        }
        
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach(star => {
                star.update();
                star.draw();
            });
            requestAnimationFrame(animate);
        }
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        animate();
    }

    // 5. ANIMATED 3D SPACE-TIME FABRIC
    const meshCanvas = document.getElementById('hero-mesh-canvas');
    if (meshCanvas) {
        const ctx = meshCanvas.getContext('2d');
        
        let width = 0;
        let height = 0;
        
        function resizeMeshCanvas() {
            const rect = meshCanvas.getBoundingClientRect();
            width = rect.width || 380;
            height = rect.height || 380;
            meshCanvas.width = width;
            meshCanvas.height = height;
        }
        
        const gridCols = 18;
        const gridRows = 18;
        
        let rotationTime = 0;
        let gravityOrbTime = 0;
        let kpIndex = 2.0;
        let spaceWeatherColor = '18, 93, 255';

        async function fetchSpaceWeather() {
            try {
                const response = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
                const data = await response.json();
                const latest = data[data.length - 1];
                kpIndex = parseFloat(latest[1]) || 2.0;
            } catch (err) {
                console.warn('Failed to fetch space weather, using simulated data.', err);
                kpIndex = 2.0 + Math.sin(Date.now() / 3600000) * 2.0 + Math.random() * 2.0;
                if (kpIndex < 0) kpIndex = 0;
            }

            if (kpIndex >= 5) {
                spaceWeatherColor = '255, 69, 0';
            } else if (kpIndex >= 3) {
                spaceWeatherColor = '0, 255, 128';
            } else {
                spaceWeatherColor = '18, 93, 255';
            }
            
            const swVal = document.getElementById('sw-val');
            if (swVal) {
                swVal.textContent = `Kp ${kpIndex.toFixed(1)}`;
                swVal.style.color = `rgb(${spaceWeatherColor})`;
                swVal.style.textShadow = `0 0 10px rgba(${spaceWeatherColor}, 0.8)`;
            }
        }
        
        fetchSpaceWeather();
        setInterval(fetchSpaceWeather, 300000);
        
        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        let userRotOffset = 0;
        let userTiltOffset = 0;
        let hoverGravX = null;
        let hoverGravY = null;
        
        meshCanvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            meshCanvas.style.cursor = 'grabbing';
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            meshCanvas.style.cursor = 'grab';
        });

        meshCanvas.addEventListener('mousemove', (e) => {
            const rect = meshCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (isDragging) {
                const deltaX = e.clientX - lastMouseX;
                const deltaY = e.clientY - lastMouseY;
                
                userRotOffset -= deltaX * 0.01;
                userTiltOffset -= deltaY * 0.01;
                userTiltOffset = Math.max(-0.6, Math.min(0.6, userTiltOffset));
                
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
            }
            
            hoverGravX = ((mouseX - (width / 2)) / (width / 2)) * 14;
            hoverGravY = ((mouseY - (height / 2)) / (height / 2)) * 14;
        });
        
        meshCanvas.addEventListener('mouseleave', () => {
            hoverGravX = null;
            hoverGravY = null;
            isDragging = false;
            meshCanvas.style.cursor = 'grab';
        });
        
        meshCanvas.style.cursor = 'grab';
        
        function drawMesh() {
            ctx.clearRect(0, 0, width, height);
            
            const orbitRadius = 3.6;
            const companionX = Math.cos(gravityOrbTime) * orbitRadius;
            const companionY = Math.sin(gravityOrbTime) * orbitRadius;
            
            const tilt = Math.PI / 3.2 + userTiltOffset;
            const rot = rotationTime + userRotOffset;
            
            const D = 18;
            const scale = width * 0.72;
            const centerX = width / 2;
            const centerY = height / 2 - 5;
            
            const projectedGrid = [];
            
            for (let r = 0; r <= gridRows; r++) {
                projectedGrid[r] = [];
                for (let c = 0; c <= gridCols; c++) {
                    const x = ((c / gridCols) - 0.5) * 14;
                    const y = ((r / gridRows) - 0.5) * 14;
                    
                    const distToSunSq = x * x + y * y;
                    const zSun = -4.0 / (1 + 0.18 * distToSunSq);
                    
                    const distToCompSq = (x - companionX) * (x - companionX) + (y - companionY) * (y - companionY);
                    const zComp = -1.6 / (1 + 0.45 * distToCompSq);
                    
                    const distToCenter = Math.sqrt(distToSunSq);
                    const turbulence = (kpIndex * 0.05);
                    const waveSpeed = 3.0 + (kpIndex * 0.5);
                    const waves = (0.12 + turbulence) * Math.sin(distToCenter * 2.2 - gravityOrbTime * waveSpeed) / (1 + 0.1 * distToCenter * distToCenter);
                    
                    let zHover = 0;
                    if (hoverGravX !== null && hoverGravY !== null) {
                        const unRotX = hoverGravX * Math.cos(-rot) - hoverGravY * Math.sin(-rot);
                        const unRotY = hoverGravX * Math.sin(-rot) + hoverGravY * Math.cos(-rot);
                        
                        const distToHoverSq = (x - unRotX) * (x - unRotX) + (y - unRotY) * (y - unRotY);
                        zHover = -2.0 / (1 + 0.6 * distToHoverSq);
                    }
                    
                    const z = zSun + zComp + waves + zHover;
                    
                    const xRotZ = x * Math.cos(rot) - y * Math.sin(rot);
                    const yRotZ = x * Math.sin(rot) + y * Math.cos(rot);
                    
                    const xProj = xRotZ;
                    const yProj = yRotZ * Math.cos(tilt) - z * Math.sin(tilt);
                    const zProj = yRotZ * Math.sin(tilt) + z * Math.cos(tilt);
                    
                    const screenX = centerX + (xProj * scale) / (D - zProj);
                    const screenY = centerY + (yProj * scale) / (D - zProj);
                    
                    projectedGrid[r][c] = {
                        x: screenX,
                        y: screenY,
                        depth: zProj,
                        z: z
                    };
                }
            }
            
            // Draw grid lines
            ctx.lineWidth = 1.0;
            
            for (let r = 0; r <= gridRows; r++) {
                for (let c = 0; c < gridCols; c++) {
                    const p1 = projectedGrid[r][c];
                    const p2 = projectedGrid[r][c + 1];
                    drawLine(p1, p2);
                }
            }
            
            for (let c = 0; c <= gridCols; c++) {
                for (let r = 0; r < gridRows; r++) {
                    const p1 = projectedGrid[r][c];
                    const p2 = projectedGrid[r + 1][c];
                    drawLine(p1, p2);
                }
            }
            
            function drawLine(p1, p2) {
                if (isNaN(p1.x) || isNaN(p1.y) || isNaN(p2.x) || isNaN(p2.y)) return;
                
                const avgZ = (p1.z + p2.z) / 2;
                
                let color;
                if (avgZ < -1.8) {
                    const intensity = Math.min(1.0, (avgZ + 1.8) / -3.8);
                    color = `rgba(${spaceWeatherColor}, ${0.3 + intensity * 0.5})`;
                    ctx.lineWidth = 1.2 + (kpIndex > 4 ? Math.random() * 0.5 : 0);
                } else {
                    color = document.documentElement.classList.contains('light') ? 'rgba(18, 93, 255, 0.08)' : 'rgba(222, 235, 255, 0.12)';
                    ctx.lineWidth = 0.8;
                }
                
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = color;
                ctx.stroke();
            }
            
            // Sun node
            const sunCenterZ = -4.0;
            const sunProjY = 0 * Math.cos(tilt) - sunCenterZ * Math.sin(tilt);
            const sunProjZ = 0 * Math.sin(tilt) + sunCenterZ * Math.cos(tilt);
            const sunScreenX = centerX + (0 * scale) / (D - sunProjZ);
            const sunScreenY = centerY + (sunProjY * scale) / (D - sunProjZ);
            
            ctx.beginPath();
            ctx.arc(sunScreenX, sunScreenY, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            
            // Planet node
            const compZ = -1.6;
            const compRotX = companionX * Math.cos(rot) - companionY * Math.sin(rot);
            const compRotY = companionX * Math.sin(rot) + companionY * Math.cos(rot);
            const compProjY = compRotY * Math.cos(tilt) - compZ * Math.sin(tilt);
            const compProjZ = compRotY * Math.sin(tilt) + compZ * Math.cos(tilt);
            const compScreenX = centerX + (compRotX * scale) / (D - compProjZ);
            const compScreenY = centerY + (compProjY * scale) / (D - compProjZ);
            
            ctx.beginPath();
            ctx.arc(compScreenX, compScreenY, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#DEEBFF';
            ctx.fill();
        }
        
        function animateMesh() {
            rotationTime += 0.001;
            gravityOrbTime += 0.015;
            
            drawMesh();
            requestAnimationFrame(animateMesh);
        }
        
        window.addEventListener('resize', resizeMeshCanvas);
        resizeMeshCanvas();
        animateMesh();
    }

    // 6. LIVE MOON PHASE WIDGET
    const moonWidget = document.getElementById('live-moon');
    if (moonWidget) {
        function getMoonPhase() {
            let d = new Date();
            let knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)); 
            let msSinceNew = d.getTime() - knownNewMoon.getTime();
            let synodicMonthMs = 29.53058868 * 24 * 60 * 60 * 1000;
            let phases = msSinceNew / synodicMonthMs;
            let fraction = phases - Math.floor(phases);
            return { fraction: fraction }; 
        }
        
        function updateMoonUI() {
            const phase = getMoonPhase();
            const fraction = phase.fraction;
            
            const ctx = moonWidget.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, 20, 20);
                
                ctx.fillStyle = document.documentElement.classList.contains('light') ? '#DEEBFF' : '#010614';
                ctx.beginPath();
                ctx.arc(10, 10, 10, 0, Math.PI * 2);
                ctx.fill();
                
                const isWaxing = fraction <= 0.5;
                ctx.fillStyle = document.documentElement.classList.contains('light') ? '#125DFF' : '#DEEBFF';
                ctx.beginPath();
                ctx.arc(10, 10, 10, -Math.PI / 2, Math.PI / 2, !isWaxing);
                ctx.fill();
                
                const ill = isWaxing ? (fraction * 2) : (2 - fraction * 2);
                const eWidth = Math.abs(Math.cos(ill * Math.PI)) * 10;
                
                ctx.fillStyle = ill < 0.5 
                    ? (document.documentElement.classList.contains('light') ? '#DEEBFF' : '#010614') 
                    : (document.documentElement.classList.contains('light') ? '#125DFF' : '#DEEBFF');
                
                ctx.beginPath();
                ctx.ellipse(10, 10, eWidth, 10, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            let phaseName = "";
            if (phase.fraction < 0.05 || phase.fraction > 0.95) phaseName = "New Moon";
            else if (phase.fraction < 0.25) phaseName = "Waxing Crescent";
            else if (phase.fraction < 0.35) phaseName = "First Quarter";
            else if (phase.fraction < 0.45) phaseName = "Waxing Gibbous";
            else if (phase.fraction < 0.55) phaseName = "Full Moon";
            else if (phase.fraction < 0.70) phaseName = "Waning Gibbous";
            else if (phase.fraction < 0.80) phaseName = "Last Quarter";
            else phaseName = "Waning Crescent";
            
            const wrapper = document.querySelector('.moon-widget-wrapper');
            if (wrapper) {
                wrapper.setAttribute('title', `Live Lunar Phase: ${phaseName}`);
            }
        }
        
        updateMoonUI();
        setInterval(updateMoonUI, 3600000);
    }

    // 7. "KONAMI CODE" STARGAZER EASTER EGG
    let konamiCode = ['e', 's', 's', 's'];
    let konamiIndex = 0;
    
    document.addEventListener('keydown', function(e) {
        if (e.key.toLowerCase() === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                activateStargazerMode();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
            if (e.key.toLowerCase() === konamiCode[0]) {
                konamiIndex = 1;
            }
        }
    });
    
    function activateStargazerMode() {
        document.body.classList.toggle('stargazer-mode');
        
        const toast = document.createElement('div');
        toast.className = 'stargazer-toast';
        toast.textContent = document.body.classList.contains('stargazer-mode') 
            ? "✨ Stargazer Mode Activated ✨" 
            : "Stargazer Mode Deactivated";
            
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if(document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 4000);
    }
}

window.initApp = initApp;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
