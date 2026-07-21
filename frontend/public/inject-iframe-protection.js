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
  
  // Clean up any existing version of the guard script first
  content = content.replace(/<script>\s*if\s*\(window\.self\s*===\s*window\.top\)[\s\S]*?<\/script>/g, '');

  // Guard script to inject (handles frame-busting AND back button click interception inside iframe)
  const guardScript = `<script>
    if (window.self === window.top) {
        window.location.replace('/');
    } else {
        // Intercept back button clicks inside iframe to navigate parent window instead of iframe
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('a[href*="index.html"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.parent && window.parent !== window) {
                        window.parent.location.href = '/';
                    } else {
                        window.location.href = '/';
                    }
                });
            });
        });
    }
  </script>`;

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
