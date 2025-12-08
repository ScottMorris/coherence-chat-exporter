import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { defaultConfig } from '../../config.js';

interface Props {
  onBack: () => void;
}

export const TaggingSetup: React.FC<Props> = ({ onBack }) => {
  const [enabled, setEnabled] = useState(defaultConfig.tagging.enabled);

  const handleSelect = (item: any) => {
    if (item.value === 'toggle') {
        const newState = !enabled;
        setEnabled(newState);
        // In a real app, we would persist this to a config file
        defaultConfig.tagging.enabled = newState;
    } else if (item.value === 'back') {
        onBack();
    }
  };

  const items = [
      { label: `Enable AI Tagging: [${enabled ? 'ON' : 'OFF'}]`, value: 'toggle' },
      { label: '🔙 Back', value: 'back' }
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="yellow">AI Tagging Configuration</Text>
      <Box marginY={1}>
        <Text>
            Automatically generate semantic tags for your conversations using a local AI model.
            {'\n'}Note: First run will download ~25MB model.
        </Text>
      </Box>
      <SelectInput items={items} onSelect={handleSelect} />
    </Box>
  );
};
