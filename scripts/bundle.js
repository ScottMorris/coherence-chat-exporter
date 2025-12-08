
import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';

const distDir = 'dist';
const bundleFile = path.join(distDir, 'coherence.bundle.mjs');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

console.log('📦 Bundling with esbuild (ESM)...');

try {
    await esbuild.build({
        entryPoints: ['src/cli.ts'],
        bundle: true,
        platform: 'node',
        target: 'node24',
        outfile: bundleFile,
        format: 'esm', // Keeping it ESM to support TLA in Ink/Yoga
        external: [
             // Native modules or things that behave badly when bundled
             '@huggingface/transformers', // Often better to leave external if it relies on filesystem assets or native bindings
             'sharp',
             'onnxruntime-node',
             'react-devtools-core', // Optional dev dependency for Ink
             // 'ink' and 'react' can often be bundled, but if we run into issues, we can externalize them.
             // For a "portable" script, we want as much as possible inside.
        ],
        sourcemap: true,
        minify: false, // Keep it readable for now
        banner: {
            js: '#!/usr/bin/env node',
        },
    });
    console.log(`✔ Bundle created at ${bundleFile}`);
} catch (e) {
    console.error('✖ Bundling failed:', e);
    process.exit(1);
}
