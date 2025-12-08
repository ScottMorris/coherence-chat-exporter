import React from 'react';
import { render } from 'ink-testing-library';
import { MainMenu } from '../src/ui/components/MainMenu.js';
import { TaggingSetup } from '../src/ui/components/TaggingSetup.js';
import { ProgressBar } from '../src/ui/components/ProgressBar.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import stripAnsi from 'strip-ansi';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const saveFrame = (name: string, content: string) => {
    // Save raw for potential use (if ANSI viewers become available)
    const rawPath = path.resolve(__dirname, `../samples/frames/${name}.raw.txt`);
    fs.writeFileSync(rawPath, content);

    // Save clean for README
    const cleanContent = stripAnsi(content);
    const outputPath = path.resolve(__dirname, `../samples/frames/${name}.txt`);
    fs.writeFileSync(outputPath, cleanContent);
    console.log(`Saved ${name} to ${outputPath}`);
};

const captureMainMenu = () => {
    const { lastFrame, unmount } = render(<MainMenu onSelect={() => {}} />);
    saveFrame('main_menu', lastFrame());
    unmount();
};

const captureTaggingSetup = () => {
    const { lastFrame, unmount } = render(<TaggingSetup onBack={() => {}} />);
    saveFrame('tagging_setup', lastFrame());
    unmount();
};

const captureProgress = () => {
    // Mock a progress state
    const { lastFrame, unmount } = render(<ProgressBar status="Exporting conversation: Designing the Chat Archive Tool..." />);
    saveFrame('export_progress', lastFrame());
    unmount();
};

const run = async () => {
    captureMainMenu();
    captureTaggingSetup();
    captureProgress();
};

run();
