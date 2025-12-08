
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const outputDir = path.join(rootDir, 'out');
const stagingDir = path.join(rootDir, 'staging_temp');

// Parse arguments
const args = process.argv.slice(2);
let targetArch = 'x64';
const archIndex = args.indexOf('--arch');
if (archIndex !== -1 && args[archIndex + 1]) {
    targetArch = args[archIndex + 1];
}

console.log(`🏗️  Building AppImage for architecture: ${targetArch}`);

const appDir = path.join(rootDir, `AppDir-${targetArch}`);

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
    // When cross-compiling, native modules might fail if not careful.
    // For now, we assume npm ci works on the host.
    // If we were strictly building native modules for ARM64 on x64, we'd need more setup.
    // But since onnxruntime-node downloads binaries at runtime/install time based on host,
    // this might package x64 binaries for arm64 target if run on x64 host.
    // However, purely JS deps are fine.
    // For this implementation, we acknowledge this limitation or try to force arch if supported by specific packages.
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
const nodeVersion = 'v24.11.1';
const nodeArch = targetArch === 'x64' ? 'linux-x64' : 'linux-arm64';
const nodeUrl = `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-${nodeArch}.tar.xz`;

console.log(`⬇️  Downloading Node.js ${nodeVersion} (${nodeArch})...`);
execSync(`curl -L ${nodeUrl} | tar -xJ -C ${appDir}/usr/bin --strip-components=2 node-${nodeVersion}-${nodeArch}/bin/node`);

console.log('✅ Node.js bundled');

// 5. Create AppRun
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

// Tool download logic
const toolArch = 'x86_64'; // We assume the build HOST is x64 for now
const toolName = `appimagetool-${toolArch}.AppImage`;

if (!fs.existsSync(toolName)) {
    try {
        execSync(`which appimagetool`);
    } catch (e) {
        console.log('⬇️  Downloading appimagetool...');
        execSync(`curl -L -o ${toolName} https://github.com/AppImage/appimagetool/releases/download/continuous/${toolName}`);
        execSync(`chmod +x ${toolName}`);
    }
}

const toolCmd = fs.existsSync(toolName)
    ? `./${toolName} --appimage-extract-and-run`
    : 'appimagetool';

// Runtime logic for cross-arch
let runtimeEnv = {};
if (targetArch === 'arm64') {
    // We need the aarch64 runtime
    const runtimeName = 'runtime-aarch64';
    if (!fs.existsSync(runtimeName)) {
        console.log('⬇️  Downloading aarch64 runtime...');
        execSync(`curl -L -o ${runtimeName} https://github.com/AppImage/type2-runtime/releases/download/continuous/${runtimeName}`);
    }
    // appimagetool uses --runtime-file to specify custom runtime
    // But depending on version, it might be an env var or flag.
    // Modern appimagetool uses --runtime-file
}

try {
    const finalName = `Coherence-${targetArch}.AppImage`;
    let buildCommand = `${toolCmd} ${appDir} ${path.join(outputDir, finalName)}`;

    if (targetArch === 'arm64') {
        buildCommand += ` --runtime-file runtime-aarch64`;
    }

    // Force ARCH env var to match target so appimagetool names things right if auto-naming (though we provide name)
    const env = { ...process.env, ARCH: targetArch === 'x64' ? 'x86_64' : 'aarch64' };

    execSync(buildCommand, { stdio: 'inherit', env });
    console.log(`🎉 AppImage created at ${path.join(outputDir, finalName)}`);
} catch (e) {
    console.error('❌ Failed to create AppImage');
    process.exit(1);
}
