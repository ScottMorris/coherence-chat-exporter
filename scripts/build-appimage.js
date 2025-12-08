
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const appDir = path.join(rootDir, 'AppDir');
const outputDir = path.join(rootDir, 'out');
const stagingDir = path.join(rootDir, 'staging_temp');

// Ensure output directories exist
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
if (fs.existsSync(appDir)) fs.rmSync(appDir, { recursive: true, force: true });
fs.mkdirSync(appDir);

// 1. Create Directory Structure
const dirs = [
    path.join(appDir, 'usr/bin'),
    path.join(appDir, 'usr/lib'),
    path.join(appDir, 'usr/share/icons/hicolor/256x256/apps'),
];
dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

console.log('📂 Created AppDir structure');

// 2. Prepare Production Dependencies
console.log('📦 Installing production dependencies for packaging...');
if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
fs.mkdirSync(stagingDir);
fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(stagingDir, 'package.json'));
fs.copyFileSync(path.join(rootDir, 'package-lock.json'), path.join(stagingDir, 'package-lock.json'));

try {
    execSync('npm ci --omit=dev', { cwd: stagingDir, stdio: 'inherit' });
} catch (e) {
    console.error('❌ Failed to install production dependencies');
    process.exit(1);
}

// Copy node_modules to AppDir/usr/lib/node_modules
console.log('🚚 Copying node_modules...');
fs.cpSync(path.join(stagingDir, 'node_modules'), path.join(appDir, 'usr/lib/node_modules'), { recursive: true });

// Cleanup staging
fs.rmSync(stagingDir, { recursive: true, force: true });


// 3. Copy Bundle
const bundlePath = path.join(distDir, 'coherence.bundle.mjs');
if (!fs.existsSync(bundlePath)) {
    console.error('❌ Bundle not found. Run npm run bundle first.');
    process.exit(1);
}
fs.copyFileSync(bundlePath, path.join(appDir, 'usr/lib/coherence.mjs'));

// 4. Download/Copy Node.js Binary
const nodeVersion = 'v18.19.0';
const nodeArch = 'linux-x64';
const nodeUrl = `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-${nodeArch}.tar.xz`;

console.log(`⬇️  Downloading Node.js ${nodeVersion}...`);
execSync(`curl -L ${nodeUrl} | tar -xJ -C ${appDir}/usr/bin --strip-components=2 node-${nodeVersion}-${nodeArch}/bin/node`);

console.log('✅ Node.js bundled');

// 5. Create AppRun
// We set NODE_PATH to ensure it finds the modules.
// But standard resolution: if script is in /usr/lib/coherence.js, it looks in /usr/lib/node_modules.
// Our structure matches that.
const appRunContent = `#!/bin/sh
export SELF=$(readlink -f "$0")
export HERE=\${SELF%/*}
export PATH="\${HERE}/usr/bin:\${PATH}"
export LD_LIBRARY_PATH="\${HERE}/usr/lib:\${LD_LIBRARY_PATH}"
export NODE_PATH="\${HERE}/usr/lib/node_modules"

exec "\${HERE}/usr/bin/node" "\${HERE}/usr/lib/coherence.mjs" "$@"
`;

fs.writeFileSync(path.join(appDir, 'AppRun'), appRunContent);
fs.chmodSync(path.join(appDir, 'AppRun'), '755');

// 6. Create .desktop file
const desktopContent = `[Desktop Entry]
Name=Coherence Chat Exporter
Exec=AppRun
Icon=coherence
Type=Application
Categories=Utility;
Terminal=true
`;
fs.writeFileSync(path.join(appDir, 'coherence.desktop'), desktopContent);

// 7. Create Icon (Placeholder)
const iconUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Faenza-system-search-terminal.svg/256px-Faenza-system-search-terminal.svg.png';
execSync(`curl -L ${iconUrl} -o ${path.join(appDir, 'coherence.png')}`);
fs.copyFileSync(path.join(appDir, 'coherence.png'), path.join(appDir, '.DirIcon'));
fs.copyFileSync(path.join(appDir, 'coherence.png'), path.join(appDir, 'usr/share/icons/hicolor/256x256/apps/coherence.png'));


console.log('📦 Building AppImage...');
// 8. Run appimagetool
// Check if appimagetool exists
try {
    execSync('which appimagetool');
} catch (e) {
    if (!fs.existsSync('appimagetool-x86_64.AppImage')) {
        console.log('⬇️  Downloading appimagetool...');
        execSync('curl -L -o appimagetool-x86_64.AppImage https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-x86_64.AppImage');
        execSync('chmod +x appimagetool-x86_64.AppImage');
    }
}

// Run it
const toolCmd = fs.existsSync('appimagetool-x86_64.AppImage')
    ? './appimagetool-x86_64.AppImage --appimage-extract-and-run'
    : 'appimagetool';

try {
    // Need to make sure ARCH is set if running in CI sometimes, but usually autodetects.
    // Forcing x86_64 for this script since we downloaded x64 node.
    execSync(`ARCH=x86_64 ${toolCmd} ${appDir} ${path.join(outputDir, 'Coherence-x86_64.AppImage')}`, { stdio: 'inherit' });
    console.log(`🎉 AppImage created at ${path.join(outputDir, 'Coherence-x86_64.AppImage')}`);
} catch (e) {
    console.error('❌ Failed to create AppImage');
    process.exit(1);
}
