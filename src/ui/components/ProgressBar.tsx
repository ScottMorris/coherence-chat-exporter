import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface Props {
  status: string;
}

export const ProgressBar: React.FC<Props> = ({ status }) => {
  return (
    <Box flexDirection="row" padding={1}>
      <Text color="green">
        <Spinner type="dots" />
      </Text>
      <Box marginLeft={1}>
        <Text>{status}</Text>
      </Box>
    </Box>
  );
};
