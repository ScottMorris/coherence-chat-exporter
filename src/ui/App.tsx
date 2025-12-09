import React from 'react';
import { Box, Text } from 'ink';
import { MainMenu } from './components/MainMenu.js';
import { ProviderSelect } from './components/ProviderSelect.js';
import { ProgressBar } from './components/ProgressBar.js';
import { PathInput } from './components/PathInput.js';
import { TaggingSetup } from './components/TaggingSetup.js';
import { Settings } from './components/Settings.js';
import { Browser } from './components/browser/Browser.js';
import { ExportPreview } from './components/ExportPreview.js';
import { StatsDashboard } from './components/stats/StatsDashboard.js';
import { ClaudeProvider } from '../providers/claude.js';
import { ChatGPTProvider } from '../providers/chatgpt.js';
import { configManager } from '../config-manager.js';
import { InputResolver } from '../utils/input-resolver.js';
import { AppView, AppMode } from './types.js';
import { useAppLogic } from './hooks/useAppLogic.js';
import { ExportManager } from '../export/manager.js';

export const App = () => {
  const {
      view, setView,
      mode,
      providerName,
      status, setStatus,
      exportCount, setExportCount,
      loadedConversations, setLoadedConversations,
      selectedForExport, setSelectedForExport,
      handleMenuSelect,
      handleProviderSelect
  } = useAppLogic();

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

  const executeExport = async (data: any) => {
      if (!providerName) return;
      const config = configManager.getConfig();
      const provider = providerName === 'claude' ? new ClaudeProvider() : new ChatGPTProvider();

      const results = await ExportManager.executeExport(data, {
          provider,
          taggingEnabled: config.tagging.enabled,
          taggingThreshold: config.tagging.threshold,
          outputPath: config.outputPath,
          onStatusUpdate: setStatus
      });

      setExportCount(results.length);
      setView(AppView.Complete);
  };

  const handleBrowserExport = (selectedConversations: any[]) => {
      if (selectedConversations.length === 0) return;
      setSelectedForExport(selectedConversations);
      setView(AppView.Preview);
  };

  const handleExportConfirm = async () => {
      setView(AppView.Exporting);
      setStatus(`Exporting ${selectedForExport.length} conversations...`);
      try {
        await executeExport(selectedForExport);
      } catch (e: any) {
        setStatus(`Error: ${e.message}`);
      }
  };

  const config = configManager.getConfig();

  return (
    <Box>
      {view === AppView.Menu && <MainMenu onSelect={handleMenuSelect} />}
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

      {view === AppView.Preview && (
          <ExportPreview
            selectedConversations={selectedForExport}
            outputPath={config.outputPath}
            taggingEnabled={config.tagging.enabled}
            onConfirm={handleExportConfirm}
            onBack={() => setView(AppView.Browser)}
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
    </Box>
  );
};
