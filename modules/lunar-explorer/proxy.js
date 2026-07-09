const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;

// Upstream WMS endpoints
const ROUTES = {
    '/lroc': {
        base: 'https://wms.lroc.asu.edu/lroc',
        referer: 'https://wms.lroc.asu.edu/',
        label: 'LROC WAC WMS'
    },
    '/usgs': {
        base: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv',
        referer: 'https://planetarymaps.usgs.gov/',
        label: 'USGS Astrogeology WMS'
    },
    '/nac': {
        base: 'https://quickmap.lroc.im-ldi.com/mapnik/3314',
        referer: 'https://quickmap.lroc.im-ldi.com/',
        label: 'QuickMap NAC Tiles'
    }
};

http.createServer((req, res) => {
    // CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/favicon.ico') {
        res.writeHead(404);
        res.end();
        return;
    }

    // Health check
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            routes: Object.keys(ROUTES).map(r => `http://localhost:${PORT}${r}`)
        }));
        return;
    }

    // Find the matching route
    const parsed = url.parse(req.url);
    const matchedRoute = Object.keys(ROUTES).find(prefix => parsed.pathname.startsWith(prefix));

    if (!matchedRoute) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`Unknown route. Available: ${Object.keys(ROUTES).join(', ')}`);
        return;
    }

    const route = ROUTES[matchedRoute];
    
    // For /lroc and /usgs: pass the query string through to the WMS server
    // For /nac: append the path after the route prefix
    let targetUrl;
    if (matchedRoute === '/nac') {
        const subPath = parsed.pathname.replace(matchedRoute, '');
        targetUrl = route.base + subPath;
    } else {
        // WMS: forward the query string
        targetUrl = route.base + (parsed.search || '');
    }

    console.log(`[${route.label}] → ${targetUrl.substring(0, 120)}...`);

    https.get(targetUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Referer': route.referer
        }
    }, (proxyRes) => {
        if (proxyRes.statusCode !== 200) {
            console.error(`  [ERROR] ${proxyRes.statusCode}`);
            res.writeHead(proxyRes.statusCode);
            res.end();
            return;
        }

        res.writeHead(200, {
            'Content-Type': proxyRes.headers['content-type'] || 'image/png',
            'Cache-Control': 'public, max-age=86400' // 24h browser cache
        });

        proxyRes.pipe(res);

    }).on('error', (err) => {
        console.error(`  [ERROR] Network: ${err.message}`);
        if (!res.headersSent) {
            res.writeHead(500);
            res.end('Proxy Error');
        }
    });

}).listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🌙 Lunar Multi-Resolution Tile Proxy`);
    console.log(`   Running on http://localhost:${PORT}`);
    console.log(`======================================================`);
    console.log(`\nRoutes:`);
    Object.entries(ROUTES).forEach(([path, cfg]) => {
        console.log(`  http://localhost:${PORT}${path}  →  ${cfg.label}`);
    });
    console.log(`\nReady to serve tiles!\n`);
});
