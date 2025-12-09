import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { defaultConfig } from '../../config.js';

interface Props {
  onBack: () => void;
}

export const TaggingSetup: React.FC<Props> = ({ onBack }) => {
  const [enabled, setEnabled] = useState(defaultConfig.tagging.enabled);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const startDownload = () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    // Mock download simulation
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        setDownloadProgress(progress);
        if (progress >= 100) {
            clearInterval(interval);
            setIsDownloading(false);
            // In real app, we would verify model presence here
        }
    }, 100);
  };

  const handleSelect = (item: any) => {
    if (item.value === 'toggle') {
        const newState = !enabled;
        setEnabled(newState);
        defaultConfig.tagging.enabled = newState;
    } else if (item.value === 'download') {
        startDownload();
    } else if (item.value === 'back') {
        onBack();
    }
  };

  if (isDownloading) {
      return (
          <Box flexDirection="column" padding={1} borderStyle="single" borderColor="blue">
              <Text bold>Downloading AI Model (MobileBERT)...</Text>
              <Box marginY={1}>
                <Text color="green">
                    [{'█'.repeat(Math.floor(downloadProgress / 5))}{'░'.repeat(20 - Math.floor(downloadProgress / 5))}] {downloadProgress}%
                </Text>
              </Box>
              <Text color="gray">Please wait...</Text>
          </Box>
      );
  }

  const items = [
      { label: `Enable AI Tagging: [${enabled ? 'ON' : 'OFF'}]`, value: 'toggle' },
      { label: '📥 Download Model (Offline Setup)', value: 'download' },
      { label: '🔙 Back', value: 'back' }
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="yellow">AI Tagging Configuration</Text>
      <Box marginY={1} flexDirection="column">
        <Text>
            Automatically generate semantic tags for your conversations using a local AI model.
        </Text>
        <Text color="gray">Model: Xenova/mobilebert-uncased-mnli (~25MB)</Text>
      </Box>
      <SelectInput items={items} onSelect={handleSelect} />
    </Box>
  );
};
