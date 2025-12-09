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
  const [dims, setDims] = useState({
    rows: stdout?.rows || 24,
    columns: stdout?.columns || 80
  });

  useEffect(() => {
    if (!stdout) return;
    const onResize = () => setDims({ rows: stdout.rows, columns: stdout.columns });
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  // Header (~5) + Footer (~3) + Padding (~2) = ~10 overhead
  // Plus Global Layout Border (~2) = ~12 overhead
  const viewHeight = Math.max(5, dims.rows - 12);
  const maxWidth = Math.max(20, dims.columns - 6); // Border/Padding safety

  // Simple flatten of messages to lines for scrolling with wrapping
  const lines = React.useMemo(() => {
    const allLines: string[] = [];
    conversation.messages.forEach(msg => {
       const role = msg.sender.toUpperCase();
       const date = msg.created_at ? new Date(msg.created_at).toLocaleString() : '';
       allLines.push(`--- ${role} (${date}) ---`);

       msg.text.split('\n').forEach(line => {
           if (line.length <= maxWidth) {
               allLines.push(line);
           } else {
               // Wrap long lines
               const chunks = line.match(new RegExp(`.{1,${maxWidth}}`, 'g')) || [line];
               chunks.forEach(c => allLines.push(c));
           }
       });
       allLines.push(''); // Empty line between messages
    });
    return allLines;
  }, [conversation, maxWidth]);

  useInput((input, key) => {
    if (key.upArrow) {
      setScrollOffset(prev => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setScrollOffset(prev => Math.min(Math.max(0, lines.length - viewHeight), prev + 1));
    }
    if (key.escape || key.backspace || key.delete) {
      onBack();
    }
  });

  const visibleLines = lines.slice(scrollOffset, scrollOffset + viewHeight);

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Box marginBottom={1} borderStyle="single" borderColor="gray">
          <Text bold wrap="truncate-end">{conversation.title}</Text>
      </Box>

      <Box flexDirection="column" height={viewHeight}>
        {visibleLines.map((line, idx) => (
          <Text key={idx}>{line}</Text>
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
