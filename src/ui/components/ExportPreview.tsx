import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { Conversation } from '../../providers/types.js';

interface ExportPreviewProps {
  selectedConversations: Conversation[];
  outputPath: string;
  taggingEnabled: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

export const ExportPreview: React.FC<ExportPreviewProps> = ({
  selectedConversations,
  outputPath,
  taggingEnabled,
  onConfirm,
  onBack
}) => {
  const items = [
    { label: '✅ Confirm Export', value: 'confirm' },
    { label: '❌ Cancel', value: 'cancel' }
  ];

  const handleSelect = (item: any) => {
    if (item.value === 'confirm') onConfirm();
    if (item.value === 'cancel') onBack();
  };

  return (
    <Box flexDirection="column" padding={1} borderStyle="single" borderColor="yellow">
      <Text bold color="cyan">Export Preview</Text>
      <Box marginY={1} flexDirection="column">
        <Text>Selected Conversations: <Text bold color="green">{selectedConversations.length}</Text></Text>
        <Text>Output Destination: <Text color="gray">{outputPath}</Text></Text>
        <Text>AI Tagging: <Text color={taggingEnabled ? 'green' : 'red'}>{taggingEnabled ? 'Enabled' : 'Disabled'}</Text></Text>
      </Box>
      <Text>Are you sure you want to proceed?</Text>
      <Box marginTop={1}>
        <SelectInput items={items} onSelect={handleSelect} />
      </Box>
    </Box>
  );
};
