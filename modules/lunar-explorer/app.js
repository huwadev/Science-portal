// modules/lunar-explorer/app.js

// Application state
let currentLang = 'en'; // Default language
let selectedLayer = null;
let viewer = null;

// Global translations XML document
let translationsXml = null;

document.addEventListener('DOMContentLoaded', () => {
    
    // ===== TRIPLE-LAYER IMAGERY SYSTEM =====
    // Layer 0 (Base): OpenPlanetary WAC+DEM composite — real data z0–z12, fast CDN
    // Layer 1 (Medium): NASA Moon Trek LRO WAC 303ppd v02 — real data z0–z8, ~30m/px
    // Layer 2 (Ultra-Res): LROC WAC+NAC+NAC_ROI_MOSAIC composite — real sub-meter data z0–z17+ via QuickMap
    
    const resolutions = [
        32000.0, 16000.0, 8000.0, 4000.0, 2000.0, 1000.0, 500.0, 250.0, 
        125.0, 64.0, 32.0, 16.0, 8.0, 4.0, 2.0, 1.0, 0.5, 0.25, 
        0.175, 0.0875, 0.04375, 0.021875, 0.0109375
    ];

    class QuickMapTilingScheme {
        constructor() {
            this.ellipsoid = Cesium.Ellipsoid.MOON;
            this.projection = new Cesium.GeographicProjection(this.ellipsoid);
            this.rectangle = Cesium.Rectangle.MAX_VALUE;
        }
        
        getNumberOfXTilesAtLevel(level) {
            const res = resolutions[level] || resolutions[resolutions.length - 1];
            const tileSizeMeters = 256.0 * res;
            const circumference = 2.0 * Math.PI * 1737400.0;
            return Math.ceil(circumference / tileSizeMeters);
        }
        
        getNumberOfYTilesAtLevel(level) {
            const res = resolutions[level] || resolutions[resolutions.length - 1];
            const tileSizeMeters = 256.0 * res;
            const heightMeters = Math.PI * 1737400.0;
            return Math.ceil(heightMeters / tileSizeMeters);
        }
        
        tileXYToRectangle(x, y, level, result) {
            const res = resolutions[level] || resolutions[resolutions.length - 1];
            const tileSizeMeters = 256.0 * res;
            const R = 1737400.0;
            
            const originX = -R * Math.PI;
            const originY = R * Math.PI / 2.0;
            
            const west = (originX + x * tileSizeMeters) / R;
            const east = (originX + (x + 1) * tileSizeMeters) / R;
            const south = (originY - (y + 1) * tileSizeMeters) / R;
            const north = (originY - y * tileSizeMeters) / R;
            
            if (!Cesium.defined(result)) {
                result = new Cesium.Rectangle(west, south, east, north);
            } else {
                result.west = west;
                result.south = south;
                result.east = east;
                result.north = north;
            }
            return result;
        }
        
        positionToTileXY(position, level, result) {
            const res = resolutions[level] || resolutions[resolutions.length - 1];
            const tileSizeMeters = 256.0 * res;
            const R = 1737400.0;
            
            const originX = -R * Math.PI;
            const originY = R * Math.PI / 2.0;
            
            const xMeters = R * position.longitude;
            const yMeters = R * position.latitude;
            
            const tileX = Math.floor((xMeters - originX) / tileSizeMeters);
            const tileY = Math.floor((originY - yMeters) / tileSizeMeters);
            
            if (!Cesium.defined(result)) {
                result = new Cesium.Cartesian2(tileX, tileY);
            } else {
                result.x = tileX;
                result.y = tileY;
            }
            return result;
        }
    }

    // --- Layer 0: OpenPlanetary Basemap ---
    const opmBasemap = new Cesium.UrlTemplateImageryProvider({
        url: 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{z}/{x}/{y}.png',
        tilingScheme: new Cesium.WebMercatorTilingScheme({ ellipsoid: Cesium.Ellipsoid.MOON }),
        maximumLevel: 6, // Prevents OPM from switching to vector contour lines at z7+
        credit: 'NASA LROC / OpenPlanetary'
    });

    // --- Layer 1: NASA Moon Trek LRO WAC 303ppd v02 (higher resolution) ---
    // WMTS REST format: /tiles/Moon/EQ/{Layer}/1.0.0/default/default028mm/{z}/{y}/{x}.png
    // Note: WMTS uses {TileRow}/{TileCol} = {y}/{x}, which matches Cesium's {reverseY}/{x}
    const moonTrekHiRes = new Cesium.UrlTemplateImageryProvider({
        url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{z}/{shiftedReverseY}/{shiftedX}.png',
        tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid: Cesium.Ellipsoid.MOON }),
        minimumLevel: 0,
        maximumLevel: 8,
        tileWidth: 256,
        tileHeight: 256,
        credit: 'NASA/GSFC/ASU — LRO WAC 303ppd via Moon Trek',
        customTags: {
            shiftedX: function(imageryProvider, x, y, level) {
                const cols = Math.pow(2, level + 1);
                const tileWidthDegrees = 360.0 / cols;
                const dx = lonOffset / tileWidthDegrees;
                let shifted = Math.round(x - dx);
                const res = (shifted % cols + cols) % cols;
                console.log(`[Tile Request] L${level} X:${x} Y:${y} -> shiftedX:${res} (lonOffset:${lonOffset})`);
                return res;
            },
            shiftedReverseY: function(imageryProvider, x, y, level) {
                const rows = Math.pow(2, level);
                const tileHeightDegrees = 180.0 / rows;
                const dy = latOffset / tileHeightDegrees;
                let shifted = Math.round(y - dy);
                const res = Math.max(0, Math.min(rows - 1, shifted));
                console.log(`[Tile Request] L${level} X:${x} Y:${y} -> shiftedY:${res} (latOffset:${latOffset})`);
                return res;
            }
        }
    });

    // Initialize Cesium Viewer configured for the Moon
    viewer = new Cesium.Viewer('canvas-container', {
        globe: new Cesium.Globe(Cesium.Ellipsoid.MOON), // Custom globe shape remains Moon
        mapProjection: new Cesium.GeographicProjection(Cesium.Ellipsoid.MOON),
        baseLayerPicker: false,
        baseLayer: new Cesium.ImageryLayer(opmBasemap),
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

    // --- Layer 2: QuickMap WAC+NAC+NAC_ROI_MOSAIC (ultra high resolution) ---
    const quickMapUltraRes = new Cesium.UrlTemplateImageryProvider({
        url: 'https://lroc-tiles.quickmap.io/tiles/wac_nac_nacroi/lunar-fulleqc/{z}/{shiftedX}/{shiftedY}.jpg',
        tilingScheme: new QuickMapTilingScheme(),
        minimumLevel: 0,
        maximumLevel: 17,
        tileWidth: 256,
        tileHeight: 256,
        credit: 'NASA/LROC / ACT / QuickMap',
        customTags: {
            shiftedX: function(imageryProvider, x, y, level) {
                const res = resolutions[level] || resolutions[resolutions.length - 1];
                const tileSizeMeters = 256.0 * res;
                const R = 1737400.0;
                const dx = (lonOffset * Math.PI / 180.0) * R / tileSizeMeters;
                let shifted = Math.round(x - dx);
                const totalX = imageryProvider.tilingScheme.getNumberOfXTilesAtLevel(level);
                return (shifted % totalX + totalX) % totalX;
            },
            shiftedY: function(imageryProvider, x, y, level) {
                const res = resolutions[level] || resolutions[resolutions.length - 1];
                const tileSizeMeters = 256.0 * res;
                const R = 1737400.0;
                const dy = (latOffset * Math.PI / 180.0) * R / tileSizeMeters;
                let shifted = Math.round(y + dy);
                const totalY = imageryProvider.tilingScheme.getNumberOfYTilesAtLevel(level);
                return Math.max(0, Math.min(totalY - 1, shifted));
            }
        }
    });

    // Add layers on top of base map (initially transparent/hidden)
    let hiResLayer = viewer.imageryLayers.addImageryProvider(moonTrekHiRes, 1);
    hiResLayer.alpha = 0.0;
    hiResLayer.show = false;

    let ultraResLayer = viewer.imageryLayers.addImageryProvider(quickMapUltraRes, 2);
    ultraResLayer.alpha = 0.0;
    ultraResLayer.show = false;

    // --- Dynamic Triple-Layer Switcher & Crossfader ---
    let lastHiResAlpha = -1;
    let lastUltraResAlpha = -1;

    viewer.scene.preRender.addEventListener(() => {
        const width = viewer.canvas.clientWidth;
        const height = viewer.canvas.clientHeight;
        
        // Calculate physical distance represented by 100 pixels at the screen center
        const left = viewer.camera.getPickRay(new Cesium.Cartesian2((width / 2) - 50, height / 2));
        const right = viewer.camera.getPickRay(new Cesium.Cartesian2((width / 2) + 50, height / 2));
        
        const globe = viewer.scene.globe;
        const leftPosition = globe.pick(left, viewer.scene);
        const rightPosition = globe.pick(right, viewer.scene);
        
        let hiResAlpha = 0.0;
        let ultraResAlpha = 0.0;
        
        if (Cesium.defined(leftPosition) && Cesium.defined(rightPosition)) {
            const distance = Cesium.Cartesian3.distance(leftPosition, rightPosition);
            
            if (distance > 70000) {
                hiResAlpha = 0.0;
                ultraResAlpha = 0.0;
            } else if (distance > 15000) {
                // Fade in Moon Trek (Layer 1) from 70km to 50km
                hiResAlpha = Math.min(1.0, Math.max(0.0, (70000 - distance) / 20000));
                ultraResAlpha = 0.0;
            } else {
                // Fade in QuickMap (Layer 2) and fade out Moon Trek (Layer 1) from 15km to 3km
                ultraResAlpha = Math.min(1.0, Math.max(0.0, (15000 - distance) / 12000));
                hiResAlpha = 1.0 - ultraResAlpha;
            }
        }
        
        if (Math.abs(hiResAlpha - lastHiResAlpha) > 0.005) {
            lastHiResAlpha = hiResAlpha;
            hiResLayer.show = (hiResAlpha > 0.01);
            hiResLayer.alpha = hiResAlpha;
        }
        
        if (Math.abs(ultraResAlpha - lastUltraResAlpha) > 0.005) {
            lastUltraResAlpha = ultraResAlpha;
            ultraResLayer.show = (ultraResAlpha > 0.01);
            ultraResLayer.alpha = ultraResAlpha;
        }
    });

    // --- Manual Alignment Controls ---
    let latOffset = 0.0;
    let lonOffset = 0.0;

    const latSlider = document.getElementById('lat-offset');
    const lonSlider = document.getElementById('lon-offset');
    const latVal = document.getElementById('lat-val');
    const lonVal = document.getElementById('lon-val');

    function rebuildLayers() {
        if (hiResLayer) {
            viewer.imageryLayers.remove(hiResLayer);
        }
        if (ultraResLayer) {
            viewer.imageryLayers.remove(ultraResLayer);
        }

        const newMoonTrekHiRes = new Cesium.UrlTemplateImageryProvider({
            url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{z}/{shiftedReverseY}/{shiftedX}.png',
            tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid: Cesium.Ellipsoid.MOON }),
            minimumLevel: 0,
            maximumLevel: 8,
            tileWidth: 256,
            tileHeight: 256,
            credit: 'NASA/GSFC/ASU — LRO WAC 303ppd via Moon Trek',
            customTags: {
                shiftedX: function(imageryProvider, x, y, level) {
                    const cols = Math.pow(2, level + 1);
                    const tileWidthDegrees = 360.0 / cols;
                    const dx = lonOffset / tileWidthDegrees;
                    let shifted = Math.round(x - dx);
                    const res = (shifted % cols + cols) % cols;
                    return res;
                },
                shiftedReverseY: function(imageryProvider, x, y, level) {
                    const rows = Math.pow(2, level);
                    const tileHeightDegrees = 180.0 / rows;
                    const dy = latOffset / tileHeightDegrees;
                    let shifted = Math.round(y - dy);
                    const res = Math.max(0, Math.min(rows - 1, shifted));
                    return res;
                }
            }
        });

        const newQuickMapUltraRes = new Cesium.UrlTemplateImageryProvider({
            url: 'https://lroc-tiles.quickmap.io/tiles/wac_nac_nacroi/lunar-fulleqc/{z}/{shiftedX}/{shiftedY}.jpg',
            tilingScheme: new QuickMapTilingScheme(),
            minimumLevel: 0,
            maximumLevel: 17,
            tileWidth: 256,
            tileHeight: 256,
            credit: 'NASA/LROC / ACT / QuickMap',
            customTags: {
                shiftedX: function(imageryProvider, x, y, level) {
                    const res = resolutions[level] || resolutions[resolutions.length - 1];
                    const tileSizeMeters = 256.0 * res;
                    const R = 1737400.0;
                    const dx = (lonOffset * Math.PI / 180.0) * R / tileSizeMeters;
                    let shifted = Math.round(x - dx);
                    const totalX = imageryProvider.tilingScheme.getNumberOfXTilesAtLevel(level);
                    return (shifted % totalX + totalX) % totalX;
                },
                shiftedY: function(imageryProvider, x, y, level) {
                    const res = resolutions[level] || resolutions[resolutions.length - 1];
                    const tileSizeMeters = 256.0 * res;
                    const R = 1737400.0;
                    const dy = (latOffset * Math.PI / 180.0) * R / tileSizeMeters;
                    let shifted = Math.round(y + dy);
                    const totalY = imageryProvider.tilingScheme.getNumberOfYTilesAtLevel(level);
                    return Math.max(0, Math.min(totalY - 1, shifted));
                }
            }
        });

        hiResLayer = viewer.imageryLayers.addImageryProvider(newMoonTrekHiRes, 1);
        hiResLayer.alpha = lastHiResAlpha >= 0 ? lastHiResAlpha : 0.0;
        hiResLayer.show = (lastHiResAlpha > 0.01);

        ultraResLayer = viewer.imageryLayers.addImageryProvider(newQuickMapUltraRes, 2);
        ultraResLayer.alpha = lastUltraResAlpha >= 0 ? lastUltraResAlpha : 0.0;
        ultraResLayer.show = (lastUltraResAlpha > 0.01);
    }

    if (latSlider && lonSlider) {
        latSlider.addEventListener('input', (e) => {
            latOffset = parseFloat(e.target.value);
            latVal.textContent = (latOffset >= 0 ? '+' : '') + latOffset.toFixed(2) + '°';
            rebuildLayers();
        });

        lonSlider.addEventListener('input', (e) => {
            lonOffset = parseFloat(e.target.value);
            lonVal.textContent = (lonOffset >= 0 ? '+' : '') + lonOffset.toFixed(2) + '°';
            rebuildLayers();
        });
    }

    // Make the background space dark
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    viewer.scene.globe.depthTestAgainstTerrain = true;
    
    // Load Translations XML
    fetch('translations.xml')
        .then(res => {
            if (!res.ok) throw new Error('Failed to load translations.xml');
            return res.text();
        })
        .then(str => {
            const parser = new DOMParser();
            translationsXml = parser.parseFromString(str, "application/xml");
        })
        .catch(err => console.error(err));

    // Translations Dictionary
    const translations = {
        en: {
            appTitle: "Lunar Explorer",
            appSubtitle: "Deep Zoom LROC Tile Streaming",
            backToPortal: "&larr; Back to Portal",
            credits: 'Map Data: <a href="https://www.openplanetary.org/" target="_blank" rel="noopener">OpenPlanetary</a>, NASA LROC, &amp; QuickMap',
            layersTitle: "Layers",
            layerMission: "Missions",
            layerCrater: "Craters",
            layerMare: "Maria",
            layerMountain: "Mountains",
            layerPlanned: "Planned"
        },
        am: {
            appTitle: "የጨረቃ ማሰሻ",
            appSubtitle: "ጥልቅ ማጉላት የLROC ካርታ ስርጭት",
            backToPortal: "&larr; ወደ ፖርታል ተመለስ",
            credits: 'የካርታ መረጃ: <a href="https://www.openplanetary.org/" target="_blank" rel="noopener">OpenPlanetary</a>, NASA LROC, እና QuickMap',
            layersTitle: "ማጣሪያዎች",
            layerMission: "ተልዕኮዎች",
            layerCrater: "ቆሬዎች",
            layerMare: "የጨረቃ ባህሮች",
            layerMountain: "ተራሮች",
            layerPlanned: "የታቀዱ"
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
        
        // Update layer UI
        const layersTitle = document.getElementById('layers-title');
        if (layersTitle) layersTitle.innerText = t.layersTitle;
        const lblMission = document.getElementById('label-mission');
        if (lblMission) lblMission.innerText = t.layerMission;
        const lblCrater = document.getElementById('label-crater');
        if (lblCrater) lblCrater.innerText = t.layerCrater;
        const lblMare = document.getElementById('label-mare');
        if (lblMare) lblMare.innerText = t.layerMare;
        const lblMountain = document.getElementById('label-mountain');
        if (lblMountain) lblMountain.innerText = t.layerMountain;
        const lblPlanned = document.getElementById('label-planned');
        if (lblPlanned) lblPlanned.innerText = t.layerPlanned;
        
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
        
        // Update wiki sidebar if open
        const wikiTitle = document.getElementById('wiki-title');
        if (wikiTitle && document.getElementById('wiki-sidebar').classList.contains('active')) {
            const currentTitle = wikiTitle.getAttribute('data-original-name');
            if (currentTitle) {
                const activeSite = lunarSites.find(s => s.name === currentTitle);
                if (activeSite) {
                    openWikiSidebar(activeSite);
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
    
    // Inject icons into Layer UI
    const iMission = document.getElementById('icon-mission');
    if (iMission) iMission.src = icons.mission;
    const iCrater = document.getElementById('icon-crater');
    if (iCrater) iCrater.src = icons.crater;
    const iMare = document.getElementById('icon-mare');
    if (iMare) iMare.src = icons.mare;
    const iMountain = document.getElementById('icon-mountain');
    if (iMountain) iMountain.src = icons.mountain;
    const iPlanned = document.getElementById('icon-planned');
    if (iPlanned) iPlanned.src = icons.planned;

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
            properties: site, // Store custom data for the click handler
            _layerType: site.type
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

    // Setup Close Button
    document.getElementById('close-wiki-btn').addEventListener('click', () => {
        document.getElementById('wiki-sidebar').classList.remove('active');
    });

    // Setup Click Handler for POIs
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (click) {
        const pickedObject = viewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
            const site = pickedObject.id.properties.getValue(viewer.clock.currentTime);
            openWikiSidebar(site);
            
            // Fly to the clicked location
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(site.lon, site.lat, 2000000, Cesium.Ellipsoid.MOON),
                duration: 1.5,
                easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
            });
        } else {
            // Clicked empty space
            document.getElementById('wiki-sidebar').classList.remove('active');
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    function openWikiSidebar(site) {
        const sidebar = document.getElementById('wiki-sidebar');
        const title = document.getElementById('wiki-title');
        const coords = document.getElementById('wiki-coords');
        const extract = document.getElementById('wiki-extract');
        const image = document.getElementById('wiki-image');
        const loader = document.getElementById('wiki-image-loader');
        const link = document.getElementById('wiki-link');

        // Save original name for translation
        title.setAttribute('data-original-name', site.name);
        
        // Apply translation if Amharic is active
        title.innerText = (typeof currentLang !== 'undefined' && currentLang === 'am' && siteTranslations && siteTranslations[site.name])
            ? siteTranslations[site.name] 
            : site.name;

        // Set Coordinates
        const latStr = Math.abs(site.lat).toFixed(2) + '&deg; ' + (site.lat >= 0 ? 'N' : 'S');
        const lonStr = Math.abs(site.lon).toFixed(2) + '&deg; ' + (site.lon >= 0 ? 'E' : 'W');
        coords.innerHTML = `Lat: ${latStr}, Lon: ${lonStr}`;
        
        // Set local description and placeholder for long extract
        const localDesc = (typeof currentLang !== 'undefined' && currentLang === 'am' && site.descriptionAm) 
            ? site.descriptionAm 
            : site.description;
            
        // Reset Wiki Elements
        image.style.display = 'none';
        link.style.display = 'none';
        
        if (site.wikiTitle && typeof translationsXml !== 'undefined' && translationsXml) {
            const isAm = (typeof currentLang !== 'undefined' && currentLang === 'am');
            
            const poiNode = translationsXml.querySelector(`poi[id="${site.id}"]`);
            if (poiNode) {
                const enNode = poiNode.querySelector('en extract');
                const amNode = poiNode.querySelector('am extract');
                
                const enExtract = enNode ? enNode.textContent : '';
                const amExtract = amNode ? amNode.textContent : '';
                
                let longExtract = '';
                let isFallback = false;
                
                if (isAm) {
                    if (amExtract && amExtract.trim().length > 0 && amExtract !== enExtract) {
                        longExtract = amExtract;
                    } else if (enExtract) {
                        longExtract = enExtract;
                        isFallback = true;
                    }
                } else {
                    longExtract = enExtract;
                }
                
                let extractHtml = localDesc;
                
                if (longExtract) {
                    extractHtml += '<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); color: rgba(222, 235, 255, 0.9);">';
                    if (isFallback) {
                        extractHtml += '<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #ffcc00; margin-bottom: 8px;">(Extended details available in English only)</div>';
                    }
                    extractHtml += longExtract;
                    extractHtml += '</div>';
                }
                
                extract.innerHTML = extractHtml;
                
                const imgUrl = poiNode.getAttribute('image');
                const pageUrl = poiNode.getAttribute('url');
                
                if (imgUrl) {
                    image.src = imgUrl;
                    image.style.display = 'block';
                }
                if (pageUrl) {
                    link.href = pageUrl;
                    link.style.display = 'block';
                }
            } else {
                extract.innerHTML = localDesc + '<br><br><span style="color: #ff7777; font-size: 13px;">Extended details unavailable.</span>';
            }
        } else {
            extract.innerHTML = localDesc;
        }

        sidebar.classList.add('active');
    }

    // --- Layer Toggling Logic ---
    const layerToggles = document.querySelectorAll('.layer-toggle');
    layerToggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const layerType = e.target.getAttribute('data-layer');
            const isVisible = e.target.checked;
            
            if (typeof viewer !== 'undefined' && viewer.entities) {
                viewer.entities.values.forEach(entity => {
                    if (entity._layerType === layerType) {
                        entity.show = isVisible;
                    }
                });
            }
        });
    });

    // --- Layer Collapse/Expand Logic ---
    const layerHeader = document.getElementById('layers-header-toggle');
    const layerContent = document.getElementById('layers-content');
    const layerChevron = document.getElementById('layers-chevron');
    if (layerHeader && layerContent && layerChevron) {
        layerHeader.addEventListener('click', () => {
            if (layerContent.style.display === 'none') {
                layerContent.style.display = 'block';
                layerChevron.style.transform = 'rotate(0deg)';
                layerHeader.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
                layerHeader.style.marginBottom = '10px';
                layerHeader.style.paddingBottom = '5px';
            } else {
                layerContent.style.display = 'none';
                layerChevron.style.transform = 'rotate(-90deg)';
                layerHeader.style.borderBottom = 'none';
                layerHeader.style.marginBottom = '0';
                layerHeader.style.paddingBottom = '0';
            }
        });
    }

});
