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
        constructor(lonOffset = 0.0, latOffset = 0.0) {
            this.ellipsoid = Cesium.Ellipsoid.MOON;
            this.projection = new Cesium.GeographicProjection(this.ellipsoid);
            this.rectangle = Cesium.Rectangle.MAX_VALUE;
            
            // Base constant offset between QuickMap and Moon Trek
            const baseLonOffsetDeg = 0.0075;
            const baseLatOffsetDeg = -0.0066;
            
            this.lonOffsetDeg = baseLonOffsetDeg + lonOffset;
            this.latOffsetDeg = baseLatOffsetDeg + latOffset;
            
            this.lonOffsetRad = this.lonOffsetDeg * Math.PI / 180.0;
            this.latOffsetRad = this.latOffsetDeg * Math.PI / 180.0;
        }
        
        getNumberOfXTilesAtLevel(level) {
            return 2 * Math.pow(2, level);
        }
        
        getNumberOfYTilesAtLevel(level) {
            const standardY = Math.pow(2, level);
            const latHeightDeg = 180.0 / standardY;
            // Add extra rows at the bottom to cover the South Pole when shifted Northward
            const extraRows = Math.ceil(Math.abs(this.latOffsetDeg) / latHeightDeg);
            return standardY + extraRows;
        }
        
        tileXYToRectangle(x, y, level, result) {
            const totalX = this.getNumberOfXTilesAtLevel(level);
            const totalY = this.getNumberOfYTilesAtLevel(level);
            
            const lonWidth = (2.0 * Math.PI) / totalX;
            const standardY = Math.pow(2, level);
            const latHeight = Math.PI / standardY;
            
            // Standard Plate Carrée boundaries
            const west = -Math.PI + x * lonWidth;
            const south = Math.PI / 2.0 - (y + 1) * latHeight;
            const north = Math.PI / 2.0 - y * latHeight;
            
            // Shift smoothly in radians
            let shiftedWest = west + this.lonOffsetRad;
            let shiftedSouth = south + this.latOffsetRad;
            let shiftedNorth = north + this.latOffsetRad;
            
            // Wrap longitude to [-Math.PI, Math.PI]
            let w = (shiftedWest + Math.PI) % (2.0 * Math.PI);
            if (w < 0) w += 2.0 * Math.PI;
            shiftedWest = w - Math.PI;
            
            let shiftedEast = shiftedWest + lonWidth;
            if (shiftedEast > Math.PI) {
                shiftedEast -= 2.0 * Math.PI;
            }
            
            // Clamp latitude strictly to prevent rendering seam gaps or polar errors
            shiftedSouth = Math.max(-Math.PI / 2.0, Math.min(Math.PI / 2.0, shiftedSouth));
            shiftedNorth = Math.max(-Math.PI / 2.0, Math.min(Math.PI / 2.0, shiftedNorth));
            
            if (!Cesium.defined(result)) {
                result = new Cesium.Rectangle(shiftedWest, shiftedSouth, shiftedEast, shiftedNorth);
            } else {
                result.west = shiftedWest;
                result.south = shiftedSouth;
                result.east = shiftedEast;
                result.north = shiftedNorth;
            }
            return result;
        }
        
        tileXYToNativeRectangle(x, y, level, result) {
            return this.tileXYToRectangle(x, y, level, result);
        }
        
        positionToTileXY(position, level, result) {
            const totalX = this.getNumberOfXTilesAtLevel(level);
            const totalY = this.getNumberOfYTilesAtLevel(level);
            
            // Apply inverse shift to incoming positions to locate tile coordinates
            let lon = position.longitude - this.lonOffsetRad;
            let lat = position.latitude - this.latOffsetRad;
            
            // Wrap longitude smoothly
            lon = (lon + Math.PI) % (2.0 * Math.PI);
            if (lon < 0) lon += 2.0 * Math.PI;
            lon -= Math.PI;
            
            // Clamp latitude
            lat = Math.max(-Math.PI / 2.0, Math.min(Math.PI / 2.0, lat));
            
            const standardY = Math.pow(2, level);
            let tileX = Math.floor((lon + Math.PI) / ((2.0 * Math.PI) / totalX));
            let tileY = Math.floor((Math.PI / 2.0 - lat) / (Math.PI / standardY));
            
            tileX = Math.max(0, Math.min(totalX - 1, tileX));
            tileY = Math.max(0, Math.min(totalY - 1, tileY));
            
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
                return (x % cols + cols) % cols;
            },
            shiftedReverseY: function(imageryProvider, x, y, level) {
                const rows = Math.pow(2, level);
                return Math.max(0, Math.min(rows - 1, y));
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

    // --- Layer 2: QuickMap Higher Res (Layer 3, z0-z12) ---
    // Loaded from 15km to 4km altitude. Uses independent Layer 3 offsets.
    const latOffset3 = 0.0;
    const lonOffset3 = 0.0;

    const quickMapHigherRes = new Cesium.UrlTemplateImageryProvider({
        url: 'https://lroc-tiles.quickmap.io/tiles/wac_nac_nacroi/lunar-fulleqc/{shiftedZ}/{x}/{y}.jpg',
        tilingScheme: new QuickMapTilingScheme(lonOffset3, latOffset3),
        minimumLevel: 0,
        maximumLevel: 18,
        tileWidth: 512,
        tileHeight: 512,
        credit: 'NASA/LROC / ACT / QuickMap',
        customTags: {
            shiftedZ: function(imageryProvider, x, y, level) {
                return level + 1;
            }
        }
    });

    const latOffset4 = 0.0;
    const lonOffset4 = 0.0;

    const quickMapUltraRes = new Cesium.UrlTemplateImageryProvider({
        url: 'https://lroc-tiles.quickmap.io/tiles/wac_nac_nacroi/lunar-fulleqc/{shiftedZ}/{x}/{y}.jpg',
        tilingScheme: new QuickMapTilingScheme(lonOffset4, latOffset4),
        minimumLevel: 0,
        maximumLevel: 18,
        tileWidth: 512,
        tileHeight: 512,
        credit: 'NASA/LROC / ACT / QuickMap',
        customTags: {
            shiftedZ: function(imageryProvider, x, y, level) {
                return level + 1;
            }
        }
    });

    // Add layers on top of base map (initially transparent/hidden)
    let hiResLayer = viewer.imageryLayers.addImageryProvider(moonTrekHiRes, 1);
    hiResLayer.alpha = 0.0;
    hiResLayer.show = false;

    let higherResLayer = viewer.imageryLayers.addImageryProvider(quickMapHigherRes, 2);
    higherResLayer.alpha = 0.0;
    higherResLayer.show = false;

    let ultraResLayer = viewer.imageryLayers.addImageryProvider(quickMapUltraRes, 3);
    ultraResLayer.alpha = 0.0;
    ultraResLayer.show = false;

    // --- Dynamic Quad-Layer Switcher & Crossfader ---
    let lastHiResAlpha = -1;
    let lastHigherResAlpha = -1;
    let lastUltraResAlpha = -1;

    viewer.scene.preRender.addEventListener(() => {
        let hiResAlpha = 0.0;
        let higherResAlpha = 0.0;
        let ultraResAlpha = 0.0;

        const width = viewer.canvas.clientWidth;
        const height = viewer.canvas.clientHeight;
        
        // Calculate physical distance represented by 100 pixels at the screen center
        const left = viewer.camera.getPickRay(new Cesium.Cartesian2((width / 2) - 50, height / 2));
        const right = viewer.camera.getPickRay(new Cesium.Cartesian2((width / 2) + 50, height / 2));
        
        const globe = viewer.scene.globe;
        const leftPosition = globe.pick(left, viewer.scene);
        const rightPosition = globe.pick(right, viewer.scene);
        
        if (Cesium.defined(leftPosition) && Cesium.defined(rightPosition)) {
            const distance = Cesium.Cartesian3.distance(leftPosition, rightPosition);
            
            if (distance > 70000) {
                hiResAlpha = 0.0;
                higherResAlpha = 0.0;
                ultraResAlpha = 0.0;
            } else if (distance > 15000) {
                // Fade in Moon Trek (Layer 2) from 70km to 50km
                hiResAlpha = Math.min(1.0, Math.max(0.0, (70000 - distance) / 20000));
                higherResAlpha = 0.0;
                ultraResAlpha = 0.0;
            } else {
                // Fade in QuickMap L3 (Layer 3) and fade out Moon Trek L2 (Layer 2) from 15km to 10km
                if (distance > 10000) {
                    higherResAlpha = Math.min(1.0, Math.max(0.0, (15000 - distance) / 5000));
                    hiResAlpha = 1.0 - higherResAlpha;
                    ultraResAlpha = 0.0;
                } else if (distance > 6000) {
                    // Layer 3 fully visible from 10km to 6km
                    hiResAlpha = 0.0;
                    higherResAlpha = 1.0;
                    ultraResAlpha = 0.0;
                } else if (distance > 4000) {
                    // Crossfade Layer 3 to Layer 4 from 6km to 4km
                    ultraResAlpha = Math.min(1.0, Math.max(0.0, (6000 - distance) / 2000));
                    higherResAlpha = 1.0 - ultraResAlpha;
                    hiResAlpha = 0.0;
                } else {
                    // Layer 4 fully visible below 4km
                    hiResAlpha = 0.0;
                    higherResAlpha = 0.0;
                    ultraResAlpha = 1.0;
                }
            }
        }
        
        if (Math.abs(hiResAlpha - lastHiResAlpha) > 0.005) {
            lastHiResAlpha = hiResAlpha;
            hiResLayer.show = (hiResAlpha > 0.01);
            hiResLayer.alpha = hiResAlpha;
        }
        
        if (Math.abs(higherResAlpha - lastHigherResAlpha) > 0.005) {
            lastHigherResAlpha = higherResAlpha;
            higherResLayer.show = (higherResAlpha > 0.01);
            higherResLayer.alpha = higherResAlpha;
        }
        
        if (Math.abs(ultraResAlpha - lastUltraResAlpha) > 0.005) {
            lastUltraResAlpha = ultraResAlpha;
            ultraResLayer.show = (ultraResAlpha > 0.01);
            ultraResLayer.alpha = ultraResAlpha;
        }
    });

    // Make the background space dark
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    viewer.scene.globe.depthTestAgainstTerrain = false;
    
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
            appSubtitle: "Interactive 3D Moon · NASA LROC Deep Zoom",
            backToPortal: "&larr; Back to Portal",
            credits: 'Map Data: <a href="https://www.openplanetary.org/" target="_blank" rel="noopener">OpenPlanetary</a> (Base) &bull; <a href="https://trek.nasa.gov/moon/" target="_blank" rel="noopener">NASA Moon Trek</a> (Medium) &bull; <a href="https://quickmap.lroc.asu.edu/" target="_blank" rel="noopener">LROC / QuickMap</a> (Ultra) &bull; <a href="https://www.wikipedia.org/" target="_blank" rel="noopener">Wikipedia</a> (Extracts)',
            layersTitle: "Layers",
            layerMission: "Missions",
            layerCrater: "Craters",
            layerMare: "Maria",
            layerMountain: "Mountains",
            layerPlanned: "Planned",
            wikiLinkText: "Read more on Wikipedia",
            searchPlaceholder: "Search landmarks...",
            measurePrompt: "Click two points to measure",
            measureFirst: "Click first point",
            measureSecond: "Click second point",
            englishOnly: "English only",
            toolSearch: "Search Landmarks",
            toolMeasure: "Measure Distance",
            toolCoords: "Cursor Coordinates",
            toolHome: "Reset View",
            toolFullscreen: "Fullscreen"
        },
        am: {
            appTitle: "የጨረቃ ማሰሻ",
            appSubtitle: "ተለዋዋጭ 3D ጨረቃ · NASA LROC ጥልቅ ማጉላት",
            backToPortal: "&larr; ወደ ፖርታል ተመለስ",
            credits: 'የካርታ መረጃ: <a href="https://www.openplanetary.org/" target="_blank" rel="noopener">OpenPlanetary</a> (መሰረታዊ) &bull; <a href="https://trek.nasa.gov/moon/" target="_blank" rel="noopener">NASA Moon Trek</a> (መካከለኛ) &bull; <a href="https://quickmap.lroc.asu.edu/" target="_blank" rel="noopener">LROC / QuickMap</a> (ከፍተኛ) &bull; <a href="https://www.wikipedia.org/" target="_blank" rel="noopener">Wikipedia</a> (መግለጫዎች)',
            layersTitle: "ንብርብሮች",
            layerMission: "ተልዕኮዎች",
            layerCrater: "ቆሬዎች",
            layerMare: "የጨረቃ ባህሮች",
            layerMountain: "ተራሮች",
            layerPlanned: "የታቀዱ",
            wikiLinkText: "በዊኪፔዲያ ላይ ተጨማሪ ያንብቡ",
            searchPlaceholder: "ምልክቶችን ፈልግ...",
            measurePrompt: "ርቀት ለመለካት ሁለት ነጥቦችን ይምረጡ",
            measureFirst: "የመጀመሪያውን ነጥብ ይምረጡ",
            measureSecond: "ሁለተኛውን ነጥብ ይምረጡ",
            englishOnly: "በእንግሊዝኛ ብቻ",
            toolSearch: "ምልክቶች ፍለጋ",
            toolMeasure: "ርቀት መለኪያ",
            toolCoords: "የጠቋሚ መጋጠሚያዎች",
            toolHome: "ዕይታን መልስ",
            toolFullscreen: "ሙሉ ማያ"
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
        if (!langBtn) return;
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
        
        // Update Wikipedia link text
        const wikiLinkText = document.getElementById('wiki-link-text');
        if (wikiLinkText) wikiLinkText.innerText = t.wikiLinkText;
        
        // Update search placeholder
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.placeholder = t.searchPlaceholder;
        
        // Update toolbar tooltips
        const toolSearch = document.getElementById('tool-search');
        if (toolSearch) toolSearch.title = t.toolSearch;
        const toolMeasure = document.getElementById('tool-measure');
        if (toolMeasure) toolMeasure.title = t.toolMeasure;
        const toolCoords = document.getElementById('tool-coords');
        if (toolCoords) toolCoords.title = t.toolCoords;
        const toolHome = document.getElementById('tool-home');
        if (toolHome) toolHome.title = t.toolHome;
        const toolFs = document.getElementById('tool-fullscreen');
        if (toolFs) toolFs.title = t.toolFullscreen;
        
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
        
        // Update search results list if search overlay is open
        if (activeTool === 'search') {
            const si = document.getElementById('search-input');
            populateSearchResults(si ? si.value : '');
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
            // Place points directly on the surface of the moon
            position: Cesium.Cartesian3.fromDegrees(site.lon, site.lat, 0.0, Cesium.Ellipsoid.MOON),
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
            
            // Fly to the clicked location, but never zoom OUT if already closer
            const cameraPosition = viewer.camera.positionCartographic;
            const currentAltitude = cameraPosition.height;
            const defaultAltitude = 2000000; // 2000 km
            const targetAltitude = Math.min(currentAltitude, defaultAltitude);
            
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(site.lon, site.lat, targetAltitude, Cesium.Ellipsoid.MOON),
                duration: 1.5,
                easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
            });
        } else {
            // Clicked empty space — close the sidebar
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
        const latStr = Math.abs(site.lat).toFixed(2) + '°' + (site.lat >= 0 ? 'N' : 'S');
        const lonStr = Math.abs(site.lon).toFixed(2) + '°' + (site.lon >= 0 ? 'E' : 'W');
        coords.innerHTML = `<span style="opacity:0.7">📍</span> ${latStr}, ${lonStr}`;
        
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
                
                let extractHtml = `<p style="margin: 0 0 12px 0; line-height: 1.7;">${localDesc}</p>`;
                
                if (longExtract) {
                    extractHtml += '<div style="margin-top: 0; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); color: rgba(222, 235, 255, 0.85); line-height: 1.7; font-size: 13.5px;">';
                    if (isFallback) {
                        const fallbackLabel = translations[currentLang].englishOnly || 'English only';
                        extractHtml += `<div style="display: inline-block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: rgba(255,204,0,0.85); margin-bottom: 10px; padding: 3px 8px; border-radius: 4px; background: rgba(255,204,0,0.08); border: 1px solid rgba(255,204,0,0.15);">${fallbackLabel}</div>`;
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
                    const wikiLinkText = document.getElementById('wiki-link-text');
                    if (wikiLinkText) wikiLinkText.innerText = translations[currentLang].wikiLinkText;
                }
            } else {
                extract.innerHTML = `<p style="margin: 0; line-height: 1.7;">${localDesc}</p>`;
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

    // =============================================
    // === MAP TOOLS ===
    // =============================================
    
    let activeTool = null; // 'search' | 'measure' | 'coords' | null
    
    function setActiveTool(toolName) {
        // Deactivate previous
        document.querySelectorAll('.toolbar-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('search-overlay').style.display = 'none';
        document.getElementById('coord-readout').style.display = 'none';
        document.getElementById('measure-tooltip').style.display = 'none';
        
        // Clear measure state
        if (activeTool === 'measure') {
            clearMeasure();
        }
        
        if (activeTool === toolName) {
            activeTool = null;
            if (viewer && viewer.scene && viewer.scene.canvas) {
                viewer.scene.canvas.style.cursor = 'default';
            }
            return; // Toggle off
        }
        
        activeTool = toolName;
        
        if (viewer && viewer.scene && viewer.scene.canvas) {
            if (toolName === 'coords' || toolName === 'measure') {
                viewer.scene.canvas.style.cursor = 'crosshair';
            } else {
                viewer.scene.canvas.style.cursor = 'default';
            }
        }
        
        if (toolName === 'search') {
            document.getElementById('tool-search').classList.add('active');
            document.getElementById('search-overlay').style.display = 'block';
            const si = document.getElementById('search-input');
            si.value = '';
            si.focus();
            populateSearchResults('');
        } else if (toolName === 'measure') {
            document.getElementById('tool-measure').classList.add('active');
            document.getElementById('measure-tooltip').style.display = 'block';
            const t = translations[currentLang];
            document.getElementById('measure-tooltip-text').innerText = t.measureFirst;
            measureState = { point1: null, point2: null, entities: [], tempLine: null, mousePosition: null };
        } else if (toolName === 'coords') {
            document.getElementById('tool-coords').classList.add('active');
            document.getElementById('coord-readout').style.display = 'block';
        }
    }
    
    // --- SEARCH TOOL ---
    document.getElementById('tool-search').addEventListener('click', () => setActiveTool('search'));
    
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    function populateSearchResults(query) {
        searchResults.innerHTML = '';
        const q = query.toLowerCase().trim();
        
        const matches = lunarSites.filter(site => {
            const engName = site.name.toLowerCase();
            const amName = siteTranslations[site.name] ? siteTranslations[site.name].toLowerCase() : '';
            const engDesc = site.description ? site.description.toLowerCase() : '';
            const amDesc = site.descriptionAm ? site.descriptionAm.toLowerCase() : '';
            const type = site.type.toLowerCase();
            
            return q === '' || 
                   engName.includes(q) || 
                   amName.includes(q) || 
                   engDesc.includes(q) || 
                   amDesc.includes(q) || 
                   type.includes(q);
        });
        
        if (matches.length === 0) {
            searchResults.innerHTML = '<div style="padding: 10px; color: rgba(222,235,255,0.4); font-size: 12px; text-align: center;">No results</div>';
            return;
        }
        
        matches.forEach(site => {
            const div = document.createElement('div');
            div.className = 'search-item';
            const displayName = (currentLang === 'am' && siteTranslations[site.name]) ? siteTranslations[site.name] : site.name;
            div.innerHTML = `<img class="search-icon" src="${icons[site.type] || icons.crater}" style="width:16px; height:16px; flex-shrink:0; vertical-align:middle;" alt=""><span class="search-name">${displayName}</span>`;
            div.addEventListener('click', () => {
                setActiveTool(null); // close search
                openWikiSidebar(site);
                
                // Turn on the layer if it was hidden
                const checkbox = document.querySelector(`.layer-toggle[data-layer="${site.type}"]`);
                if (checkbox && !checkbox.checked) {
                    checkbox.checked = true;
                    if (typeof viewer !== 'undefined' && viewer.entities) {
                        viewer.entities.values.forEach(entity => {
                            if (entity._layerType === site.type) {
                                entity.show = true;
                            }
                        });
                    }
                }
                
                const cameraPosition = viewer.camera.positionCartographic;
                const currentAltitude = cameraPosition.height;
                const targetAltitude = Math.min(currentAltitude, 2000000);
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(site.lon, site.lat, targetAltitude, Cesium.Ellipsoid.MOON),
                    duration: 1.5,
                    easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
                });
            });
            searchResults.appendChild(div);
        });
    }
    
    searchInput.addEventListener('input', (e) => {
        populateSearchResults(e.target.value);
    });
    
    // Close search on Escape
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setActiveTool(null);
    });
    
    // --- MEASURE TOOL ---
    let measureState = { point1: null, point2: null, entities: [], tempLine: null, mousePosition: null };
    
    document.getElementById('tool-measure').addEventListener('click', () => setActiveTool('measure'));
    
    function clearMeasure() {
        if (measureState.entities) {
            measureState.entities.forEach(e => viewer.entities.remove(e));
        }
        measureState = { point1: null, point2: null, entities: [], tempLine: null, mousePosition: null };
    }
    
    function getMoonSurfacePosition(screenPosition) {
        const ray = viewer.camera.getPickRay(screenPosition);
        if (!ray) return null;
        return viewer.scene.globe.pick(ray, viewer.scene);
    }
    
    function formatDistance(meters) {
        if (meters >= 1000) {
            return (meters / 1000).toFixed(1) + ' km';
        }
        return meters.toFixed(0) + ' m';
    }
    
    // Measure click handler (runs inside the main LEFT_CLICK handler)
    function handleMeasureClick(position) {
        const worldPos = getMoonSurfacePosition(position);
        if (!worldPos) return;
        
        const t = translations[currentLang];
        
        if (!measureState.point1) {
            // First point
            measureState.point1 = worldPos;
            const dot = viewer.entities.add({
                position: worldPos,
                point: { pixelSize: 8, color: Cesium.Color.YELLOW, outlineColor: Cesium.Color.BLACK, outlineWidth: 1 }
            });
            measureState.entities.push(dot);
            
            // Add temp construction line that dynamic-follows cursor
            measureState.tempLine = viewer.entities.add({
                polyline: {
                    positions: new Cesium.CallbackProperty(function() {
                        if (measureState.point1 && measureState.mousePosition) {
                            return [measureState.point1, measureState.mousePosition];
                        }
                        return [measureState.point1, measureState.point1];
                    }, false),
                    width: 2,
                    material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.YELLOW, dashLength: 8 }),
                    clampToGround: true
                }
            });
            measureState.entities.push(measureState.tempLine);
            
            document.getElementById('measure-tooltip-text').innerText = t.measureSecond;
        } else if (!measureState.point2) {
            // Second point
            measureState.point2 = worldPos;
            measureState.mousePosition = worldPos;
            
            // Remove temp dynamic line
            if (measureState.tempLine) {
                viewer.entities.remove(measureState.tempLine);
            }
            
            const dot = viewer.entities.add({
                position: worldPos,
                point: { pixelSize: 8, color: Cesium.Color.YELLOW, outlineColor: Cesium.Color.BLACK, outlineWidth: 1 }
            });
            measureState.entities.push(dot);
            
            // Draw clean static line
            const line = viewer.entities.add({
                polyline: {
                    positions: [measureState.point1, measureState.point2],
                    width: 2,
                    material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.YELLOW, dashLength: 8 }),
                    clampToGround: true
                }
            });
            measureState.entities.push(line);
            
            // Compute geodesic distance on the Moon ellipsoid
            const carto1 = Cesium.Cartographic.fromCartesian(measureState.point1, Cesium.Ellipsoid.MOON);
            const carto2 = Cesium.Cartographic.fromCartesian(measureState.point2, Cesium.Ellipsoid.MOON);
            const geodesic = new Cesium.EllipsoidGeodesic(carto1, carto2, Cesium.Ellipsoid.MOON);
            const distance = geodesic.surfaceDistance;
            
            document.getElementById('measure-tooltip-text').innerText = `📏 ${formatDistance(distance)}`;
        } else {
            // Reset and start over
            clearMeasure();
            document.getElementById('measure-tooltip-text').innerText = t.measureFirst;
        }
    }
    
    // --- COORDINATE READOUT & TRACKING MOVE HANDLER ---
    document.getElementById('tool-coords').addEventListener('click', () => setActiveTool('coords'));
    
    const coordMoveHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    coordMoveHandler.setInputAction(function(movement) {
        const worldPos = getMoonSurfacePosition(movement.endPosition);
        
        // Dynamic measure tracking
        if (activeTool === 'measure' && measureState.point1 && !measureState.point2) {
            if (worldPos) {
                measureState.mousePosition = worldPos;
                
                // Dynamic distance calculation
                const carto1 = Cesium.Cartographic.fromCartesian(measureState.point1, Cesium.Ellipsoid.MOON);
                const carto2 = Cesium.Cartographic.fromCartesian(worldPos, Cesium.Ellipsoid.MOON);
                const geodesic = new Cesium.EllipsoidGeodesic(carto1, carto2, Cesium.Ellipsoid.MOON);
                const distance = geodesic.surfaceDistance;
                document.getElementById('measure-tooltip-text').innerText = `📏 ${formatDistance(distance)}`;
            }
        }
        
        // Coordinate readout
        if (activeTool === 'coords') {
            const readoutText = document.getElementById('coord-readout-text');
            if (worldPos) {
                const carto = Cesium.Cartographic.fromCartesian(worldPos, Cesium.Ellipsoid.MOON);
                const lat = Cesium.Math.toDegrees(carto.latitude);
                const lon = Cesium.Math.toDegrees(carto.longitude);
                const latStr = Math.abs(lat).toFixed(3) + '°' + (lat >= 0 ? 'N' : 'S');
                const lonStr = Math.abs(lon).toFixed(3) + '°' + (lon >= 0 ? 'E' : 'W');
                readoutText.innerText = `${latStr}, ${lonStr}`;
            } else {
                readoutText.innerText = '--';
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    
    // --- RESET VIEW (HOME) TOOL ---
    document.getElementById('tool-home').addEventListener('click', () => {
        setActiveTool(null);
        document.getElementById('wiki-sidebar').classList.remove('active');
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(0, 0, 7000000, Cesium.Ellipsoid.MOON),
            duration: 1.5,
            easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
        });
    });
    
    // --- FULLSCREEN TOOL ---
    document.getElementById('tool-fullscreen').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    });
    
    // Wire measure clicks into the main click handler
    const measureClickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    measureClickHandler.setInputAction(function(click) {
        if (activeTool === 'measure') {
            handleMeasureClick(click.position);
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

});
