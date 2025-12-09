import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { Conversation } from '../../../providers/types.js';

interface ConversationPreviewProps {
  conversation: Conversation;
  onBack: () => void;
}

export const ConversationPreview: React.FC<ConversationPreviewProps> = ({ conversation, onBack }) => {
  const { stdout } = useStdout();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [terminalRows, setTerminalRows] = useState(stdout?.rows || 24);

  useEffect(() => {
    if (!stdout) return;
    const onResize = () => setTerminalRows(stdout.rows);
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  // Header (~5) + Footer (~3) + Padding (~2) = ~10 overhead
  const viewHeight = Math.max(5, terminalRows - 10);

  // Simple flatten of messages to lines for scrolling
  // In a real TUI this is complex, we'll do a simplified line-based approach
  const lines = React.useMemo(() => {
    const allLines: string[] = [];
    conversation.messages.forEach(msg => {
       const role = msg.sender.toUpperCase();
       const date = msg.created_at ? new Date(msg.created_at).toLocaleString() : '';
       allLines.push(`--- ${role} (${date}) ---`);
       // Split message text by newlines
       const textLines = msg.text.split('\n');
       textLines.forEach(l => allLines.push(l));
       allLines.push(''); // Empty line between messages
    });
    return allLines;
  }, [conversation]);

  useInput((input, key) => {
    if (key.upArrow) {
      setScrollOffset(prev => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setScrollOffset(prev => Math.min(Math.max(0, lines.length - viewHeight), prev + 1));
    }
    if (key.escape || key.backspace) {
      onBack();
    }
  });

  const visibleLines = lines.slice(scrollOffset, scrollOffset + viewHeight);

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Box marginBottom={1} borderStyle="single" borderColor="gray">
          <Text bold>{conversation.title}</Text>
      </Box>

      <Box flexDirection="column" height={viewHeight}>
        {visibleLines.map((line, idx) => (
          <Text key={idx} wrap="truncate-end">{line}</Text>
        ))}
        {lines.length === 0 && <Text italic>No messages to display.</Text>}
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="gray">
          <Text>
              Line {scrollOffset + 1} of {lines.length} | <Text bold>Esc/Backspace</Text> to back
          </Text>
      </Box>
    </Box>
  );
};
