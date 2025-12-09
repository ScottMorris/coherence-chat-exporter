import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { ProviderType } from '../../providers/types.js';

interface Props {
  onSelect: (provider: ProviderType) => void;
  onBack: () => void;
}

export const ProviderSelect: React.FC<Props> = ({ onSelect, onBack }) => {
  const items = [
    { label: 'Claude', value: ProviderType.Claude },
    { label: 'ChatGPT', value: ProviderType.ChatGPT },
    { label: '🔙 Back', value: 'back' }
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Select Provider:</Text>
      <SelectInput
        items={items}
        onSelect={(item) => {
            if (item.value === 'back') onBack();
            else onSelect(item.value as ProviderType);
        }}
      />
    </Box>
  );
};
