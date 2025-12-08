import React from 'react';
import { Box, Text } from 'ink';

interface ChartItem {
  label: string;
  value: number;
}

interface Props {
  data: ChartItem[];
  title?: string;
  maxBarWidth?: number;
}

export const AsciiChart: React.FC<Props> = ({ data, title, maxBarWidth = 40 }) => {
  if (!data || data.length === 0) {
    return (
        <Box flexDirection="column" marginBottom={1}>
            {title && <Text bold>{title}</Text>}
            <Text color="gray">No data available</Text>
        </Box>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const maxLabelLength = Math.max(...data.map(d => d.label.length));

  return (
    <Box flexDirection="column" marginBottom={1}>
      {title && <Box marginBottom={0}><Text bold>{title}</Text></Box>}
      {data.map((item, index) => {
        const barLength = maxValue > 0 ? Math.round((item.value / maxValue) * maxBarWidth) : 0;
        const bar = '█'.repeat(barLength);

        return (
          <Box key={`${item.label}-${index}`}>
            <Box width={maxLabelLength + 2}>
              <Text>{item.label}</Text>
            </Box>
            <Box marginRight={1}>
              <Text color="cyan">{bar}</Text>
            </Box>
            <Text color="gray">{item.value}</Text>
          </Box>
        );
      })}
    </Box>
  );
};
