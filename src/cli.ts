#!/usr/bin/env node

import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './ui/App.js';
import { ClaudeProvider } from './providers/claude.js';
import { ChatGPTProvider } from './providers/chatgpt.js';
import { ProviderType } from './providers/types.js';
import { ExportManager } from './export/manager.js';
import { configManager } from './config-manager.js';
import { InputResolver } from './utils/input-resolver.js';
import { registerCompletionCommand } from './completion.js';
import chalk from 'chalk';

// Load config first
configManager.loadConfig();
const config = configManager.getConfig();

const program = new Command();

program
  .name('coherence')
  .description('Coherence Chat Exporter - Export Claude/ChatGPT conversations to Markdown')
  .version('1.0.0');

registerCompletionCommand(program);

program
  .command('export')
  .description('Export conversations from CLI')
  .requiredOption('-p, --provider <type>', 'Provider type (claude or chatgpt)')
  .requiredOption('-i, --input <path>', 'Input file, directory, or zip path')
  .option('-o, --output <path>', 'Output directory', config.outputPath)
  .option('--tag', 'Enable AI tagging')
  .option('--no-tag', 'Disable AI tagging')
  .action(async (options) => {
    try {
        console.log(chalk.cyan('Starting export...'));

        const provider = options.provider === ProviderType.Claude ? new ClaudeProvider() :
                         options.provider === ProviderType.ChatGPT ? new ChatGPTProvider() : null;

        if (!provider) {
            console.error(chalk.red('Invalid provider. Use "claude" or "chatgpt".'));
            process.exit(1);
        }

        // Determine tagging state: flag overrides config
        let enableTagging = config.tagging.enabled;
        if (options.tag) enableTagging = true;
        if (options.noTag) enableTagging = false;

        const resolver = new InputResolver();

        console.log(chalk.blue(`Reading from ${options.input}...`));

        // Resolve input (Zip/File/Dir)
        const exportData = await resolver.resolve(options.input);

        const results = await ExportManager.executeExport(exportData, {
            provider,
            taggingEnabled: enableTagging,
            taggingThreshold: config.tagging.threshold,
            outputPath: options.output,
            onStatusUpdate: (msg) => console.log(chalk.yellow(msg))
        });

        console.log(chalk.green(`\n✔ Export complete! Processed ${results.length} conversations.`));
        console.log(`Output: ${options.output}`);

    } catch (error: any) {
        console.error(chalk.red('\n✖ Export failed:'), error.message);
        process.exit(1);
    }
  });

// Handle interactive mode if no args provided
if (process.argv.length === 2) {
    render(React.createElement(App));
} else {
    program.parse(process.argv);
}
