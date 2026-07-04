// modules/lunar-explorer/app.js

const lunarSites = [
    {
        id: 'apollo11',
        name: 'Apollo 11 Landing Site',
        lat: 0.6740,
        lon: 23.4720,
        description: 'The historic site in the Sea of Tranquility (Mare Tranquillitatis) where humans first set foot on the Moon on July 20, 1969. Neil Armstrong and Buzz Aldrin spent about two and a half hours outside the lunar module Eagle.',
        descriptionAm: 'በጁላይ 20፣ 1969 የሰው ልጅ ለመጀመሪያ ጊዜ በጨረቃ ላይ ያረፈበት ታሪካዊ ስፍራ በትራንኩሊቲ ባህር (Mare Tranquillitatis) ይገኛል። ኒል አርምስትሮንግ እና በዝ አልድሪን ከጨረቃ ሞጁል ውጭ ሁለት ሰዓት ተኩል አሳልፈዋል።',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/A_Man_on_the_Moon%2C_AS11-40-5903_%28cropped%29.jpg/960px-A_Man_on_the_Moon%2C_AS11-40-5903_%28cropped%29.jpg'
    },
    {
        id: 'tycho',
        name: 'Tycho Crater',
        lat: -43.30,
        lon: -11.22,
        description: 'A prominent lunar impact crater located in the southern lunar highlands. It is relatively young, estimated at 108 million years old, and features a brilliant ray system that is highly visible during a full moon.',
        descriptionAm: 'በደቡባዊ የጨረቃ ደጋማ አካባቢዎች የሚገኝ ታዋቂ የጨረቃ ተፅዕኖ ሸለቆ ነው። 108 ሚሊዮን ዓመት ዕድሜ እንዳለው የሚገመት ሲሆን አንጻራዊ በሆነ መልኩ ወጣት ነው፤ ሙሉ ጨረቃ በሚሆንበት ጊዜ በግልፅ የሚታይ አስደናቂ የጨረር ሥርዓት አለው።',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Tycho_LRO.png/960px-Tycho_LRO.png'
    },
    {
        id: 'copernicus',
        name: 'Copernicus Crater',
        lat: 9.62,
        lon: -20.08,
        description: 'A large, 93 km wide crater located in eastern Oceanus Procellarum. It was formed during the Copernican period and is characterized by a prominent central peak and terraced inner walls.',
        descriptionAm: 'በምስራቃዊው የኦሽኑስ ፕሮሴላረም (Oceanus Procellarum) የሚገኝ 93 ኪ.ሜ ስፋት ያለው ትልቅ ሸለቆ ነው። በኮፐርኒካን ዘመን የተፈጠረ ሲሆን፣ ታዋቂ በሆነ ማዕከላዊ ጫፍ እና እርከን ባላቸው የውስጥ ግድግዳዎች ይታወቃል።',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Copernicus_%28LRO%29_2.png/960px-Copernicus_%28LRO%29_2.png'
    },
    {
        id: 'chang-e-4',
        name: 'Chang\'e 4 (Von Kármán)',
        lat: -45.45,
        lon: 177.59,
        description: 'The landing site of China\'s Chang\'e 4 mission in 2019, the first spacecraft to soft-land on the far side of the Moon. It deployed the Yutu-2 rover to explore the South Pole-Aitken basin.',
        descriptionAm: 'በ2019 የቻይናው ቻንግ 4 (Chang\'e 4) ተልዕኮ ያረፈበት ቦታ ሲሆን፣ በጨረቃ ሩቅ/ጀርባ ክፍል ላይ በተሳካ ሁኔታ በማረፍ የመጀመሪያው የጠፈር መንኮራኩር ነው። የሳውዝ ፖል-ኤይትከን ሸለቆን (South Pole-Aitken basin) ለማሰስ ዩቱ-2 (Yutu-2) የተባለውን ሮቨር አሰማርቷል።',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/ChangE-4_-_PCAM.png/960px-ChangE-4_-_PCAM.png'
    },
    {
        id: 'mons-huygens',
        name: 'Mons Huygens',
        lat: 19.92,
        lon: -2.86,
        description: 'The tallest mountain on the Moon, rising approximately 5.5 kilometers (18,000 feet) above its base. It is part of the Montes Apenninus range, formed by the impact that created Mare Imbrium.',
        descriptionAm: 'ከመሠረቱ 5.5 ኪሎ ሜትር (18,000 ጫማ) ከፍታ ያለው እና በጨረቃ ላይ ካሉት ሁሉ ትልቁ ተራራ ነው። የማሬ ኢምብሪየም (Mare Imbrium) በተፈጠረበት ተፅዕኖ ምክንያት የተፈጠረው የሞንቴስ አፔኒኑስ (Montes Apenninus) የተራራ ሰንሰለት አካል ነው።',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Mons_Ampere_Mons_Huygens_4109_h3.jpg'
    },
    {
        id: 'apollo15',
        name: 'Apollo 15 (Hadley Rille)',
        lat: 26.13,
        lon: 3.63,
        description: 'The site where David Scott and James Irwin explored the Moon for three days in 1971, deploying the first Lunar Roving Vehicle. The area features a massive canyon-like valley called Hadley Rille.',
        descriptionAm: 'እ.ኤ.አ. በ1971 ዴቪድ ስኮት እና ጀምስ ኢርዊን ለሶስት ቀናት ጨረቃን ያሰሱበት እና የመጀመሪያውን የጨረቃ መጓጓዣ ተሽከርካሪ (Lunar Roving Vehicle) ያሰማሩበት ቦታ ነው። አካባቢው ሃድሊ ሪሌ (Hadley Rille) የተባለ ግዙፍ ገደል መሰል ሸለቆን ያካተተ ነው።',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/AS15-88-11866_-_Apollo_15_flag%2C_rover%2C_LM%2C_Irwin_-_restoration1.jpg/960px-AS15-88-11866_-_Apollo_15_flag%2C_rover%2C_LM%2C_Irwin_-_restoration1.jpg'
    },
    {
        id: 'mare-imbrium',
        name: 'Mare Imbrium (Sea of Showers)',
        lat: 32.8,
        lon: -15.6,
        description: 'One of the largest impact basins in the Solar System, filled with smooth, dark basalt. It is easily visible from Earth and forms the right eye of the "Man in the Moon".',
        descriptionAm: 'በስርዓተ-ፀሐይ ውስጥ ካሉት ትላልቅ የላቫ ሜዳዎች (impact basins) አንዱ ሲሆን፣ ለስላሳ እና ጥቁር በሆነ የባዝልት አለት የተሞላ ነው። ከመሬት ሆኖ በግልጽ የሚታይ ሲሆን "የጨረቃ ላይ ሰው" (Man in the Moon) እየተባለ ከሚጠራው ምስል የቀኝ ዓይንን ይፈጥራል።',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Mare_Imbrium_%28LRO%29.png/960px-Mare_Imbrium_%28LRO%29.png'
    },
    {
        id: 'oceanus-procellarum',
        name: 'Oceanus Procellarum (Ocean of Storms)',
        lat: 10.4,
        lon: -43.3,
        description: 'The largest of the lunar maria, located on the western edge of the near side. It covers roughly 4 million square kilometers and is the only feature called an "Ocean" rather than a "Sea".',
        descriptionAm: 'በጨረቃ ምዕራባዊ ክፍል የሚገኝ ትልቁ ማሪያ (maria) ወይም የላቫ ሜዳ ነው። ወደ 4 ሚሊዮን ካሬ ኪሎ ሜትር የሚሸፍን ሲሆን፣ "ባህር" (Sea) ከሚባሉት ሌሎች ሜዳዎች በተለየ "ውቅያኖስ" (Ocean) የሚል ስያሜ የተሰጠው ብቸኛ ስፍራ ነው።',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Oceanus_Procellarum_%28LRO%29.png/960px-Oceanus_Procellarum_%28LRO%29.png'
    },
    {
        id: 'apollo17',
        name: 'Apollo 17 (Taurus-Littrow)',
        lat: 20.1908,
        lon: 30.7717,
        description: 'The landing site of the final Apollo mission in 1972. Astronauts Eugene Cernan and Harrison Schmitt explored this valley in the lunar highlands, collecting ancient highland crust and volcanic soil.',
        descriptionAm: 'እ.ኤ.አ. በ1972 የመጨረሻው የአፖሎ ተልዕኮ ያረፈበት ቦታ ነው። የጠፈር ተመራማሪዎች ዩጂን ሰርናን እና ሃሪሰን ሽሚት ይህንን የጨረቃ ደጋማ ሸለቆ በመመርመር ጥንታዊ የደጋ ቅርፊቶችን እና የእሳተ ገሞራ አፈርን ሰብስበዋል።',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Apollo_17_Cernan_on_rover.jpg/960px-Apollo_17_Cernan_on_rover.jpg'
    },
    {
        id: 'aristarchus',
        name: 'Aristarchus Crater',
        lat: 23.7,
        lon: -47.4,
        description: 'One of the brightest formations on the lunar surface, visible to the naked eye. The crater has high albedo due to fresh, unweathered material excavated by a relatively recent impact.',
        descriptionAm: 'በጨረቃ ገጽ ላይ በዓይን ከሚታዩ በጣም ብሩህ ስፍራዎች አንዱ ነው። ይህ ሸለቆ በቅርብ ጊዜ በተፈጠረ ተፅዕኖ ምክንያት አዲስ እና ያልተሸረሸረ ቁስ ስለወጣ ከፍተኛ የብርሃን ነጸብራቅ (albedo) አለው።',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Aristarchus_Crater_-_LROC_-_WAC.jpg/960px-Aristarchus_Crater_-_LROC_-_WAC.jpg'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    
    // Since QuickMap obfuscates their raw NAC tile server behind an SPA React frontend, we must use OpenPlanetary's stable WAC + DEM composite.
    // It provides Zoom Level 12 (15m/pixel) which is the highest resolution open-source map available without a premium API token.
    const moonImagery = new Cesium.UrlTemplateImageryProvider({
        url: 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{z}/{x}/{y}.png',
        maximumLevel: 12,
        credit: 'NASA LROC / OpenPlanetary'
    });

    // Initialize Cesium Viewer configured for the Moon
    const viewer = new Cesium.Viewer('canvas-container', {
        globe: new Cesium.Globe(Cesium.Ellipsoid.MOON),
        baseLayerPicker: false,
        baseLayer: new Cesium.ImageryLayer(moonImagery), // Bypasses Cesium Ion default earth imagery (fixes 401 error)
        timeline: false,
        animation: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false, // We use our custom UI
        selectionIndicator: false,
        skyAtmosphere: false, // Moon has no atmosphere
        contextOptions: {
            webgl: {
                alpha: true
            }
        }
    });

    // Make the background space dark
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    viewer.scene.globe.depthTestAgainstTerrain = true;

    // Translations Dictionary
    const translations = {
        en: {
            appTitle: "Lunar Explorer",
            appSubtitle: "Deep Zoom LROC Tile Streaming",
            backToPortal: "&larr; Back to Portal",
            credits: 'Map Data: <a href="https://www.openplanetary.org/" target="_blank" rel="noopener">OpenPlanetary</a> &amp; NASA LROC'
        },
        am: {
            appTitle: "የጨረቃ ማሰሻ",
            appSubtitle: "ጥልቅ ማጉላት የLROC ካርታ ስርጭት",
            backToPortal: "&larr; ወደ ፖርታል ተመለስ",
            credits: 'የካርታ መረጃ: <a href="https://www.openplanetary.org/" target="_blank" rel="noopener">OpenPlanetary</a> እና NASA LROC'
        }
    };
    
    // Add translations to the sites
    const siteTranslations = {
        "Apollo 11 Landing Site": "አፖሎ 11 ማረፊያ ቦታ",
        "Tycho Crater": "ታይኮ ሸለቆ",
        "Copernicus Crater": "ኮፐርኒከስ ሸለቆ",
        "Chang'e 4 (Von Kármán)": "ቻንግ 4 (ቮን ካርማን)",
        "Mons Huygens": "ሁይገንስ ተራራ",
        "Apollo 15 (Hadley Rille)": "አፖሎ 15 (ሀድሊ ሪሌ)"
    };
    
    // --- Language Toggle Logic ---
    let currentLang = 'en';
    const langBtn = document.getElementById('lang-toggle');
    const uiTitle = document.getElementById('ui-app-title');
    const uiSubtitle = document.getElementById('ui-app-subtitle');
    const uiBackBtn = document.getElementById('ui-back-btn');
    const creditsPanel = document.getElementById('credits');
    
    function updateLanguage() {
        if (!langBtn) return; // Might not be loaded yet
        const t = translations[currentLang];
        if (uiTitle) uiTitle.innerText = t.appTitle;
        if (uiSubtitle) uiSubtitle.innerText = t.appSubtitle;
        if (uiBackBtn) uiBackBtn.innerHTML = t.backToPortal;
        if (creditsPanel) creditsPanel.innerHTML = t.credits;
        
        // Update globe labels
        if (typeof viewer !== 'undefined' && viewer.entities) {
            viewer.entities.values.forEach(entity => {
                if (entity.label && entity.properties) {
                    const originalName = entity.properties.name.getValue();
                    entity.label.text = currentLang === 'am' && siteTranslations[originalName] 
                        ? siteTranslations[originalName] 
                        : originalName;
                }
            });
        }
        
        // Update info panel if open
        const siteTitle = document.getElementById('site-title');
        const siteDesc = document.getElementById('site-description');
        if (siteTitle && !document.getElementById('info-panel').classList.contains('hidden')) {
            const currentTitle = siteTitle.getAttribute('data-original-name');
            if (currentTitle) {
                siteTitle.innerText = currentLang === 'am' && siteTranslations[currentTitle] 
                    ? siteTranslations[currentTitle] 
                    : currentTitle;
                    
                // Find the site object to get its description
                const activeSite = lunarSites.find(s => s.name === currentTitle);
                if (activeSite && siteDesc) {
                    siteDesc.innerText = currentLang === 'am' && activeSite.descriptionAm 
                        ? activeSite.descriptionAm 
                        : activeSite.description;
                }
            }
        }
    }
    
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'am' : 'en';
            updateLanguage();
        });
    }

    // Add POIs to the globe
    lunarSites.forEach(site => {
        viewer.entities.add({
            // Elevate the points 50km above the surface so they don't clip into bumpy terrain, 
            // but still occlude on the far side of the moon
            position: Cesium.Cartesian3.fromDegrees(site.lon, site.lat, 50000, Cesium.Ellipsoid.MOON),
            point: {
                pixelSize: 10,
                color: Cesium.Color.fromCssColorString('#125DFF'),
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 10000000)
            },
            label: {
                text: currentLang === 'am' && siteTranslations[site.name] ? siteTranslations[site.name] : site.name,
                font: '15px Outfit, sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 4,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -20),
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 5000000)
            },
            properties: site // Store custom data for the click handler
        });
    });

    // Zoom to view the entire moon initially
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 7000000, Cesium.Ellipsoid.MOON),
        duration: 0
    });

    // --- Camera Constraints & Scale Ruler ---
    
    // Prevent zooming too far out or panning the camera away from the moon
    viewer.scene.screenSpaceCameraController.enableTranslate = false;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 10000000;
    
    // Scale Ruler Update Logic
    const scaleText = document.getElementById('scale-text');
    const scaleBar = document.getElementById('scale-bar');
    const scaleRuler = document.getElementById('scale-ruler');
    
    viewer.scene.preRender.addEventListener(() => {
        const width = viewer.canvas.clientWidth;
        const height = viewer.canvas.clientHeight;
        
        // Calculate the physical distance represented by 100 pixels at the center of the screen
        const left = viewer.camera.getPickRay(new Cesium.Cartesian2((width / 2) - 50, height / 2));
        const right = viewer.camera.getPickRay(new Cesium.Cartesian2((width / 2) + 50, height / 2));
        
        const globe = viewer.scene.globe;
        const leftPosition = globe.pick(left, viewer.scene);
        const rightPosition = globe.pick(right, viewer.scene);
        
        if (Cesium.defined(leftPosition) && Cesium.defined(rightPosition)) {
            let distance = Cesium.Cartesian3.distance(leftPosition, rightPosition);
            
            let text = '';
            if (distance >= 1000) {
                text = (distance / 1000).toFixed(0) + ' km';
            } else {
                text = distance.toFixed(0) + ' m';
            }
            
            scaleText.textContent = text;
            scaleBar.style.width = '100px';
            scaleRuler.style.display = 'flex';
        } else {
            scaleRuler.style.display = 'none';
        }
    });

    // Setup Click Handler for POIs
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (click) {
        const pickedObject = viewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
            const site = pickedObject.id.properties.getValue(viewer.clock.currentTime);
            showInfoPanel(site);
            
            // Fly to the clicked location
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(site.lon, site.lat, 2000000, Cesium.Ellipsoid.MOON),
                duration: 1.5,
                easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
            });
        } else {
            // Clicked empty space
            document.getElementById('info-panel').classList.add('hidden');
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Setup Close Button
    document.getElementById('close-btn').addEventListener('click', () => {
        document.getElementById('info-panel').classList.add('hidden');
    });
});

function showInfoPanel(site) {
    const panel = document.getElementById('info-panel');
    const title = document.getElementById('site-title');
    const coords = document.getElementById('site-coords');
    const image = document.getElementById('site-image');
    const desc = document.getElementById('site-description');

    // Save original name for translation
    title.setAttribute('data-original-name', site.name);
    
    // Apply translation if Amharic is active
    title.innerText = (typeof currentLang !== 'undefined' && currentLang === 'am' && siteTranslations && siteTranslations[site.name])
        ? siteTranslations[site.name] 
        : site.name;

    const latStr = Math.abs(site.lat).toFixed(2) + '&deg; ' + (site.lat >= 0 ? 'N' : 'S');
    const lonStr = Math.abs(site.lon).toFixed(2) + '&deg; ' + (site.lon >= 0 ? 'E' : 'W');
    coords.innerHTML = `Lat: ${latStr}, Lon: ${lonStr}`;
    
    // Set Image
    if (site.imageUrl) {
        image.src = site.imageUrl;
        image.style.display = 'block';
    } else {
        image.style.display = 'none';
    }
    
    desc.innerText = (typeof currentLang !== 'undefined' && currentLang === 'am' && site.descriptionAm) 
        ? site.descriptionAm 
        : site.description;

    panel.classList.remove('hidden');
}
