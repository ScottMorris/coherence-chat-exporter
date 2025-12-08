import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

interface Props {
  onSelect: (value: string) => void;
}

export const MainMenu: React.FC<Props> = ({ onSelect }) => {
  const items = [
    { label: '📦 Select Export Source', value: 'source' },
    { label: '📂 Browse & Export', value: 'browse' },
    { label: '🏷️  Configure Tagging', value: 'tagging' },
    { label: '⚙️  Settings', value: 'settings' },
    { label: '🚪 Exit', value: 'exit' }
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Chat Archive Tool</Text>
      <Box marginTop={1}>
        <SelectInput items={items} onSelect={(item) => onSelect(item.value)} />
      </Box>
    </Box>
  );
};
