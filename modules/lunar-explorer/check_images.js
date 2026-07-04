const fs = require('fs');
const https = require('https');

const content = fs.readFileSync('data.js', 'utf8');
// extract image URLs using regex
const regex = /imageUrl:\s*'([^']+)'/g;
let match;
const urls = [];
while ((match = regex.exec(content)) !== null) {
    urls.push(match[1]);
}

console.log(`Found ${urls.length} URLs to check...`);

async function checkUrl(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                resolve({url, status: 'OK'});
            } else {
                resolve({url, status: `ERROR ${res.statusCode}`});
            }
        }).on('error', (e) => {
            resolve({url, status: `FAILED ${e.message}`});
        });
    });
}

async function run() {
    for (const url of urls) {
        const result = await checkUrl(url);
        if (result.status !== 'OK') {
            console.log(`[BROKEN] ${result.url} - ${result.status}`);
        }
    }
    console.log('Done checking images.');
}

run();
