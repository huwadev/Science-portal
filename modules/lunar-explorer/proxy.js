const http = require('http');
const https = require('https');

const PORT = 3000;

http.createServer((req, res) => {
    // Inject CORS headers so the browser's WebGL canvas accepts the images
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
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

    const targetUrl = `https://quickmap.lroc.im-ldi.com/mapnik/3314${req.url}`;
    
    console.log(`[PROXY] Fetching: ${targetUrl}`);

    https.get(targetUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Referer': 'https://quickmap.lroc.im-ldi.com/'
        }
    }, (proxyRes) => {
        if (proxyRes.statusCode !== 200) {
            console.error(`[ERROR] ${proxyRes.statusCode} for ${targetUrl}`);
            res.writeHead(proxyRes.statusCode);
            res.end();
            return;
        }

        res.writeHead(200, {
            'Content-Type': proxyRes.headers['content-type'] || 'image/png',
            'Cache-Control': 'public, max-age=86400'
        });

        // Pipe the image buffer directly to the client
        proxyRes.pipe(res);

    }).on('error', (err) => {
        console.error(`[ERROR] Network error for ${targetUrl}:`, err.message);
        if (!res.headersSent) {
            res.writeHead(500);
            res.end('Proxy Error');
        }
    });

}).listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 LROC NAC Tile Proxy running on http://localhost:${PORT}`);
    console.log(`======================================================\n`);
    console.log(`Cesium is now unlocked to stream QuickMap's Ultra-HD NAC Stitched Layers!\n`);
});
