import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface Props {
  prompt: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export const PathInput: React.FC<Props> = ({ prompt, onSubmit, onCancel }) => {
    const [path, setPath] = useState('');

    return (
        <Box flexDirection="column" padding={1}>
            <Text>{prompt}</Text>
            <Box>
                <Text color="green">➜ </Text>
                <TextInput value={path} onChange={setPath} onSubmit={onSubmit} />
            </Box>
            <Text color="gray">(Press Enter to confirm, Ctrl+C to exit)</Text>
        </Box>
    );
};
