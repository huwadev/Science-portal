// modules/lunar-explorer/app.js


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

    // Custom SVG Icons mapped by type
    const makeIcon = (svg) => 'data:image/svg+xml;base64,' + btoa(svg);
    const icons = {
        mission: makeIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFCC00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l4 10h-8z"/><path d="M12 22v-4"/><path d="M8 12l-4 6h16l-4-6"/></svg>`),
        crater: makeIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>`),
        mare: makeIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#88CCFF" stroke-width="2"><path d="M2 12l5-9h10l5 9-5 9H7z"/></svg>`),
        mountain: makeIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF7777" stroke-width="2"><path d="M3 20l9-16 9 16z"/></svg>`),
        planned: makeIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00FF00" stroke-width="2" stroke-dasharray="3 3"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>`)
    };

    // Add POIs to the globe
    lunarSites.forEach(site => {
        viewer.entities.add({
            // Elevate the points 50km above the surface so they don't clip into bumpy terrain
            position: Cesium.Cartesian3.fromDegrees(site.lon, site.lat, 50000, Cesium.Ellipsoid.MOON),
            billboard: {
                image: icons[site.type] || icons.crater,
                width: 24,
                height: 24,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 10000000)
            },
            label: {
                text: currentLang === 'am' && siteTranslations[site.name] ? siteTranslations[site.name] : site.name,
                font: '15px Outfit, sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 4,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -25),
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

    // --- Layer Toggling Logic ---
    const layerToggles = document.querySelectorAll('.layer-toggle');
    layerToggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const layerType = e.target.getAttribute('data-layer');
            const isVisible = e.target.checked;
            
            if (typeof viewer !== 'undefined' && viewer.entities) {
                viewer.entities.values.forEach(entity => {
                    // Check if the entity has our custom properties object and a matching type
                    if (entity.properties && entity.properties.type) {
                        const t = entity.properties.type.getValue ? entity.properties.type.getValue() : entity.properties.type;
                        if (t === layerType) {
                            entity.show = isVisible;
                        }
                    }
                });
            }
        });
    });

});
