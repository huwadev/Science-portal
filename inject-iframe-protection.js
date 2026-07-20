const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'frontend/public/modules');

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else if (file === 'index.html') {
      injectProtection(filePath);
    }
  }
}

function injectProtection(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Guard script to inject
  const guardScript = `<script>
    if (window.self === window.top) {
        window.location.replace('/');
    }
  </script>`;

  if (content.includes("window.self === window.top")) {
    console.log(`[ALREADY PROTECTED] ${path.relative(modulesDir, filePath)}`);
    return;
  }

  // Inject right after <head> or at the very beginning
  if (content.includes('<head>')) {
    content = content.replace('<head>', `<head>\n  ${guardScript}`);
  } else {
    content = guardScript + '\n' + content;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[PROTECTED INJECTED] ${path.relative(modulesDir, filePath)}`);
}

if (fs.existsSync(modulesDir)) {
  console.log('Scanning modules for iframe bypass protection...');
  scanDirectory(modulesDir);
  console.log('Iframe bypass protection complete!');
} else {
  console.error(`Modules directory not found at: ${modulesDir}`);
}
