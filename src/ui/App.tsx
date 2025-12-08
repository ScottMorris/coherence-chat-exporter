import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { MainMenu } from './components/MainMenu.js';
import { ProviderSelect } from './components/ProviderSelect.js';
import { ProgressBar } from './components/ProgressBar.js';
import { PathInput } from './components/PathInput.js';
import { TaggingSetup } from './components/TaggingSetup.js';
import { Settings } from './components/Settings.js';
import { Browser } from './components/browser/Browser.js';
import { ClaudeProvider } from '../providers/claude.js';
import { ChatGPTProvider } from '../providers/chatgpt.js';
import { ExportPipeline } from '../export/pipeline.js';
import { MarkdownTransformer } from '../export/transformer.js';
import { Organizer } from '../export/organizer.js';
import { Writer } from '../export/writer.js';
import { ConversationTagger } from '../tagging/classifier.js';
import { configManager } from '../config-manager.js';
import { InputResolver } from '../utils/input-resolver.js';
import { Conversation } from '../providers/types.js';

type View = 'menu' | 'select-provider' | 'input-path' | 'loading' | 'browser' | 'exporting' | 'complete' | 'tagging-setup' | 'settings';

enum AppMode {
  Export = 'export',
  Browse = 'browse'
}

export const App = () => {
  const [view, setView] = useState<View>('menu');
  const [mode, setMode] = useState<AppMode>(AppMode.Export); // Track if we are in direct export or browse mode
  const [providerName, setProviderName] = useState<'claude' | 'chatgpt' | null>(null);
  const [status, setStatus] = useState('');
  const [exportCount, setExportCount] = useState(0);

  // Data state
  const [loadedConversations, setLoadedConversations] = useState<Conversation[]>([]);

  // Load config on mount
  useEffect(() => {
      configManager.loadConfig();
  }, []);

  const handleMenuSelect = (value: string) => {
    if (value === 'exit') process.exit(0);
    if (value === 'source') {
        setMode(AppMode.Export);
        setView('select-provider');
    }
    if (value === 'browse') {
        setMode(AppMode.Browse);
        setView('select-provider');
    }
    if (value === 'tagging') setView('tagging-setup');
    if (value === 'settings') setView('settings');
  };

  const handleProviderSelect = (provider: 'claude' | 'chatgpt') => {
    setProviderName(provider);
    setView('input-path');
  };

  const handlePathSubmit = async (pathStr: string) => {
      if (mode === AppMode.Export) {
        setView('exporting');
        setStatus('Initializing export...');
        try {
            await runDirectExport(pathStr);
        } catch (e: any) {
            setStatus(`Error: ${e.message}`);
        }
      } else {
          // Browse mode
          setView('loading');
          setStatus('Loading conversations...');
          try {
              await loadDataForBrowsing(pathStr);
          } catch (e: any) {
              setStatus(`Error: ${e.message}`);
          }
      }
  };

  const loadDataForBrowsing = async (pathStr: string) => {
    if (!providerName) return;
    const provider = providerName === 'claude' ? new ClaudeProvider() : new ChatGPTProvider();
    const resolver = new InputResolver();

    setStatus('Resolving input...');
    const rawData = await resolver.resolve(pathStr);

    setStatus('Parsing data...');
    const conversations = await provider.normalize(rawData);

    setLoadedConversations(conversations);
    setView('browser');
  };

  const runDirectExport = async (pathStr: string) => {
      if (!providerName) return;
      const resolver = new InputResolver();
      const rawData = await resolver.resolve(pathStr);

      // For direct export, we normalize inside the pipeline usually, but our pipeline expects normalized data now?
      // Let's check pipeline.export signature. It expects "any".
      // Actually, looking at previous code: pipeline.export(exportData...) where exportData is from resolver.
      // So pipeline handles normalization internally if we pass raw data?
      // Wait, pipeline.ts: export(data: any, ...) -> calls provider.normalize(data).
      // So yes, we pass raw data to pipeline.export.

      await executeExport(rawData);
  };

  const executeExport = async (data: any, specificConversations?: Conversation[]) => {
      if (!providerName) return;

      const config = configManager.getConfig();
      const provider = providerName === 'claude' ? new ClaudeProvider() : new ChatGPTProvider();
      const transformer = new MarkdownTransformer();
      const organizer = new Organizer(config.outputPath);
      const writer = new Writer();

      let tagger: ConversationTagger | undefined;
      if (config.tagging.enabled) {
          setStatus('Loading AI Model...');
          tagger = new ConversationTagger();
          await tagger.initialize();
      }

      // If we have specific conversations (from Browser), we need a way to pass them.
      // The current pipeline.export takes `data: any`.
      // If we pass already normalized conversations, the provider.normalize might fail or double-process?
      // We should check pipeline.ts implementation.
      // Hack: If we have specificConversations, we can skip provider.normalize in the pipeline
      // OR we can create a simple "PreNormalizedProvider" wrapper.
      // Let's modify the pipeline call or logic.

      // Actually, cleaner way:
      // If specificConversations is set, we bypass the provider.normalize step in logic below.

      const pipeline = new ExportPipeline(provider, transformer, organizer, writer, tagger);

      setStatus(`Exporting...`);

      // pipeline.export now accepts specificConversations (Conversation[]) or raw data
      const inputData = specificConversations || data;

      const results = await pipeline.export(inputData, {
          enableTagging: config.tagging.enabled,
          tagThreshold: config.tagging.threshold
      });

      setExportCount(results.length);
      setView('complete');
  };

  const handleBrowserExport = async (selectedConversations: Conversation[]) => {
      if (selectedConversations.length === 0) return;
      setView('exporting');
      setStatus(`Exporting ${selectedConversations.length} conversations...`);

      try {
        await executeExport(null, selectedConversations);
      } catch (e: any) {
        setStatus(`Error: ${e.message}`);
      }
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
      {view === 'loading' && <ProgressBar status={status} />}

      {view === 'browser' && (
          <Browser
            conversations={loadedConversations}
            onExport={handleBrowserExport}
            onBack={() => setView('menu')}
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
