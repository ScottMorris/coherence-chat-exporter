import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

interface Props {
  onSelect: (provider: 'claude' | 'chatgpt') => void;
  onBack: () => void;
}

export const ProviderSelect: React.FC<Props> = ({ onSelect, onBack }) => {
  const items = [
    { label: 'Claude', value: 'claude' },
    { label: 'ChatGPT', value: 'chatgpt' },
    { label: '🔙 Back', value: 'back' }
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Select Provider:</Text>
      <SelectInput
        items={items}
        onSelect={(item) => {
            if (item.value === 'back') onBack();
            else onSelect(item.value as 'claude' | 'chatgpt');
        }}
      />
    </Box>
  );
};
