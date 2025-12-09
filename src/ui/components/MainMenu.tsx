import React, { useMemo } from 'react';
import { Box, Text, useStdout } from 'ink';
import SelectInput from 'ink-select-input';
import figlet from 'figlet';
import gradient from 'gradient-string';

interface Props {
  onSelect: (value: string) => void;
}

// A simple ASCII brain inspired by Noto Emoji style (side view)
// Using a pinkish color hex: #FF9999 or similar
const BRAIN_ASCII = `
      , - - ,
    / ' ' \` \\
   | ' ' ' ' |
    \\ ' ' ' /
      \` - - \`
`;

export const MainMenu: React.FC<Props> = ({ onSelect }) => {
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;

  // Generate the rainbow logo once
  const logo = useMemo(() => {
    const ascii = figlet.textSync('Coherence', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    });
    return gradient.rainbow.multiline(ascii);
  }, []);

  const items = [
    { label: '📦 Select Export Source', value: 'source' },
    { label: '📂 Browse & Export', value: 'browse' },
    { label: '📊 Stats Dashboard', value: 'stats' },
    { label: '🏷️  Configure Tagging', value: 'tagging' },
    { label: '⚙️  Settings', value: 'settings' },
    { label: '🚪 Exit', value: 'exit' }
  ];

  // Threshold to hide the brain if terminal is too narrow
  // Coherence logo is roughly ~55 chars wide.
  // Menu is ~30 chars. Brain is ~15 chars.
  // We'll hide brain if width < 75 just to be safe.
  const showBrain = width >= 75;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Top Logo */}
      <Box marginBottom={1}>
        <Text>{logo}</Text>
      </Box>

      {/* Content Area */}
      <Box flexDirection="row">
        {/* Left Column: Menu */}
        <Box flexDirection="column" marginRight={4}>
          <SelectInput items={items} onSelect={(item) => onSelect(item.value)} />
        </Box>

        {/* Right Column: Brain */}
        {showBrain && (
          <Box flexDirection="column" justifyContent="center">
            {/* Using a Hex color closest to the pink brain emoji */}
            <Text color="#F48FB1">{BRAIN_ASCII}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
