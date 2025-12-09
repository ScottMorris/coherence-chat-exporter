import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { MainMenu } from './components/MainMenu.js';
import { FullScreenLayout } from './components/FullScreenLayout.js';
import { ProviderSelect } from './components/ProviderSelect.js';
import { ProgressBar } from './components/ProgressBar.js';
import { PathInput } from './components/PathInput.js';
import { TaggingSetup } from './components/TaggingSetup.js';
import { Settings } from './components/Settings.js';
import { Browser } from './components/browser/Browser.js';
import { StatsDashboard } from './components/stats/StatsDashboard.js';
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

enum AppView {
  Menu = 'menu',
  SelectProvider = 'select-provider',
  InputPath = 'input-path',
  Loading = 'loading',
  Browser = 'browser',
  Stats = 'stats',
  Exporting = 'exporting',
  Complete = 'complete',
  TaggingSetup = 'tagging-setup',
  Settings = 'settings'
}

enum AppMode {
  Export = 'export',
  Browse = 'browse',
  Stats = 'stats'
}

enum MenuOption {
  Source = 'source',
  Browse = 'browse',
  Stats = 'stats',
  Search = 'search',
  Tagging = 'tagging',
  Settings = 'settings',
  Exit = 'exit'
}

interface AppProps {
  onExit?: () => void;
  initialPath?: string;
}

export const App: React.FC<AppProps> = ({ onExit, initialPath }) => {
  const [view, setView] = useState<AppView>(AppView.Menu);
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

  // Handle initial path from CLI
  useEffect(() => {
    if (initialPath) {
      setMode(AppMode.Browse);
      setView(AppView.Loading);
      setStatus(`Loading from ${initialPath}...`);
      autoDetectAndLoad(initialPath);
    }
  }, [initialPath]);

  const autoDetectAndLoad = async (pathStr: string) => {
     try {
       const resolver = new InputResolver();
       setStatus('Resolving input...');
       const rawData = await resolver.resolve(pathStr);

       // Try Claude first
       try {
         setStatus('Attempting to parse as Claude...');
         const claudeProvider = new ClaudeProvider();
         const convs = await claudeProvider.normalize(rawData);
         if (convs.length > 0) {
           setProviderName('claude');
           setLoadedConversations(convs);
           setView(AppView.Browser);
           return;
         }
       } catch (e) {
         // Ignore and try next
       }

       // Try ChatGPT
       try {
         setStatus('Attempting to parse as ChatGPT...');
         const chatgptProvider = new ChatGPTProvider();
         const convs = await chatgptProvider.normalize(rawData);
         if (convs.length > 0) {
           setProviderName('chatgpt');
           setLoadedConversations(convs);
           setView(AppView.Browser);
           return;
         }
       } catch (e) {
         // Ignore
       }

       throw new Error('Could not auto-detect provider or no conversations found.');

     } catch (e: any) {
       setStatus(`Error: ${e.message}`);
       // Give user a moment to see error then go to menu
       setTimeout(() => setView(AppView.Menu), 2000);
     }
  };

  const handleMenuSelect = (value: string) => {
    if (value === MenuOption.Exit) {
        if (onExit) onExit();
        else process.exit(0);
        return;
    }

    // If Browse or Search is selected but no data is loaded, redirect to Source selection
    if ((value === MenuOption.Browse || value === MenuOption.Search) && loadedConversations.length === 0) {
        setMode(AppMode.Browse); // Intend to browse after loading
        setView(AppView.SelectProvider);
        return;
    }
    if (value === MenuOption.Source) {
        setMode(AppMode.Export);
        setView(AppView.SelectProvider);
    }
    if (value === MenuOption.Browse) {
        setView(AppView.Browser);
    }
    if (value === MenuOption.Search) {
        // For now, go to Browser, but we might want to trigger search input directly?
        // Plan says: "start by filtering the view by searching by titles" in Browser.
        setView(AppView.Browser);
    }
    if (value === MenuOption.Stats) {
        if (loadedConversations.length === 0) {
            setMode(AppMode.Stats);
            setView(AppView.SelectProvider);
        } else {
            setView(AppView.Stats);
        }
    }
    if (value === MenuOption.Tagging) setView(AppView.TaggingSetup);
    if (value === MenuOption.Settings) setView(AppView.Settings);
  };

  const handleProviderSelect = (provider: 'claude' | 'chatgpt') => {
    setProviderName(provider);
    setView(AppView.InputPath);
  };

  const handlePathSubmit = async (pathStr: string) => {
      if (mode === AppMode.Export) {
        setView(AppView.Exporting);
        setStatus('Initializing export...');
        try {
            await runDirectExport(pathStr);
        } catch (e: any) {
            setStatus(`Error: ${e.message}`);
        }
      } else {
          // Browse or Stats mode
          setView(AppView.Loading);
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
    if (mode === AppMode.Stats) {
        setView(AppView.Stats);
    } else {
        setView(AppView.Browser);
    }
  };

  const runDirectExport = async (pathStr: string) => {
      if (!providerName) return;
      const resolver = new InputResolver();
      const rawData = await resolver.resolve(pathStr);
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

      const pipeline = new ExportPipeline(provider, transformer, organizer, writer, tagger);

      setStatus(`Exporting...`);

      const inputData = specificConversations || data;

      const results = await pipeline.export(inputData, {
          enableTagging: config.tagging.enabled,
          tagThreshold: config.tagging.threshold
      });

      setExportCount(results.length);
      setView(AppView.Complete);
  };

  const handleBrowserExport = async (selectedConversations: Conversation[]) => {
      if (selectedConversations.length === 0) return;
      setView(AppView.Exporting);
      setStatus(`Exporting ${selectedConversations.length} conversations...`);

      try {
        await executeExport(null, selectedConversations);
      } catch (e: any) {
        setStatus(`Error: ${e.message}`);
      }
  };

  const config = configManager.getConfig();

  return (
    <FullScreenLayout>
      {view === AppView.Menu && (
        <MainMenu
           onSelect={handleMenuSelect}
           hasData={loadedConversations.length > 0}
        />
      )}
      {view === AppView.SelectProvider && (
          <ProviderSelect onSelect={handleProviderSelect} onBack={() => setView(AppView.Menu)} />
      )}
      {view === AppView.InputPath && (
          <PathInput
            prompt={`Enter path to ${providerName} export directory (or .zip/.json):`}
            onSubmit={handlePathSubmit}
            onCancel={() => setView(AppView.SelectProvider)}
          />
      )}
      {view === AppView.Loading && <ProgressBar status={status} />}

      {view === AppView.Browser && (
          <Browser
            conversations={loadedConversations}
            onExport={handleBrowserExport}
            onBack={() => setView(AppView.Menu)}
            onViewStats={() => setView(AppView.Stats)}
          />
      )}

      {view === AppView.Stats && (
          <StatsDashboard
            conversations={loadedConversations}
            onBack={() => {
                if (mode === AppMode.Browse) setView(AppView.Browser);
                else setView(AppView.Menu);
            }}
          />
      )}

      {view === AppView.TaggingSetup && (
          <TaggingSetup onBack={() => setView(AppView.Menu)} />
      )}
      {view === AppView.Settings && (
          <Settings onBack={() => setView(AppView.Menu)} />
      )}
      {view === AppView.Exporting && <ProgressBar status={status} />}
      {view === AppView.Complete && (
          <Box flexDirection="column" padding={1}>
              <Text color="green">✔ Export Complete!</Text>
              <Text>Processed {exportCount} conversations.</Text>
              <Text>Output saved to {config.outputPath}</Text>
          </Box>
      )}
    </FullScreenLayout>
  );
};
