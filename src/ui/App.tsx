import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { MainMenu } from './components/MainMenu.js';
import { ProviderSelect } from './components/ProviderSelect.js';
import { ProgressBar } from './components/ProgressBar.js';
import { PathInput } from './components/PathInput.js';
import { TaggingSetup } from './components/TaggingSetup.js';
import { Settings } from './components/Settings.js';
import { ClaudeProvider } from '../providers/claude.js';
import { ChatGPTProvider } from '../providers/chatgpt.js';
import { ExportPipeline } from '../export/pipeline.js';
import { MarkdownTransformer } from '../export/transformer.js';
import { Organizer } from '../export/organizer.js';
import { Writer } from '../export/writer.js';
import { ConversationTagger } from '../tagging/classifier.js';
import { configManager } from '../config-manager.js';
import { InputResolver } from '../utils/input-resolver.js';

type View = 'menu' | 'select-provider' | 'input-path' | 'exporting' | 'complete' | 'tagging-setup' | 'settings';

export const App = () => {
  const [view, setView] = useState<View>('menu');
  const [providerName, setProviderName] = useState<'claude' | 'chatgpt' | null>(null);
  const [inputPath, setInputPath] = useState('');
  const [status, setStatus] = useState('');
  const [exportCount, setExportCount] = useState(0);

  // Load config on mount
  useEffect(() => {
      configManager.loadConfig();
  }, []);

  const handleMenuSelect = (value: string) => {
    if (value === 'exit') process.exit(0);
    if (value === 'source') setView('select-provider');
    if (value === 'browse') setView('select-provider');
    if (value === 'tagging') setView('tagging-setup');
    if (value === 'settings') setView('settings');
  };

  const handleProviderSelect = (provider: 'claude' | 'chatgpt') => {
    setProviderName(provider);
    setView('input-path');
  };

  const handlePathSubmit = async (pathStr: string) => {
      setInputPath(pathStr);
      setView('exporting');
      setStatus('Initializing export...');

      try {
        await runExport(pathStr);
      } catch (e: any) {
          setStatus(`Error: ${e.message}`);
      }
  };

  const runExport = async (pathStr: string) => {
      if (!providerName) return;

      const config = configManager.getConfig();
      const provider = providerName === 'claude' ? new ClaudeProvider() : new ChatGPTProvider();
      const transformer = new MarkdownTransformer();
      const organizer = new Organizer(config.outputPath);
      const writer = new Writer();
      const resolver = new InputResolver();

      let tagger: ConversationTagger | undefined;
      if (config.tagging.enabled) {
          setStatus('Loading AI Model...');
          tagger = new ConversationTagger();
          await tagger.initialize();
      }

      const pipeline = new ExportPipeline(provider, transformer, organizer, writer, tagger);

      setStatus(`Resolving input...`);
      // We need to resolve input before passing to pipeline.export,
      // OR we update pipeline to use resolver.
      // But pipeline.export expects 'rawData' which provider.normalize consumes.
      // The updated provider now expects the output of resolver OR raw array.
      // So we should resolve here.

      const exportData = await resolver.resolve(pathStr);

      setStatus(`Parsing ${providerName} data...`);
      const results = await pipeline.export(exportData, {
          enableTagging: config.tagging.enabled,
          tagThreshold: config.tagging.threshold
      });

      setExportCount(results.length);
      setView('complete');
  };

  const config = configManager.getConfig();

  return (
    <Box>
      {view === 'menu' && <MainMenu onSelect={handleMenuSelect} />}
      {view === 'select-provider' && (
          <ProviderSelect onSelect={handleProviderSelect} onBack={() => setView('menu')} />
      )}
      {view === 'input-path' && (
          <PathInput
            prompt={`Enter path to ${providerName} export directory (or .zip/.json):`}
            onSubmit={handlePathSubmit}
            onCancel={() => setView('select-provider')}
          />
      )}
      {view === 'tagging-setup' && (
          <TaggingSetup onBack={() => setView('menu')} />
      )}
      {view === 'settings' && (
          <Settings onBack={() => setView('menu')} />
      )}
      {view === 'exporting' && <ProgressBar status={status} />}
      {view === 'complete' && (
          <Box flexDirection="column" padding={1}>
              <Text color="green">✔ Export Complete!</Text>
              <Text>Processed {exportCount} conversations.</Text>
              <Text>Output saved to {config.outputPath}</Text>
          </Box>
      )}
    </Box>
  );
};
