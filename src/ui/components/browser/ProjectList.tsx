import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Conversation } from '../../../providers/types.js';

interface ProjectListProps {
  conversations: Conversation[];
  onSelectProject: (projectName: string | null) => void;
  onSearch: () => void;
  onBack: () => void;
  onViewStats?: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ conversations, onSelectProject, onSearch, onBack, onViewStats }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Extract unique projects
  const projects = React.useMemo(() => {
    const uniqueProjects = new Set<string>();
    conversations.forEach(c => {
      if (c.project_name) {
        uniqueProjects.add(c.project_name);
      }
    });
    return Array.from(uniqueProjects).sort();
  }, [conversations]);

  // Items to display: "All Conversations" + projects
  const items = [
    { label: 'All Conversations', value: null },
    ...projects.map(p => ({ label: `Project: ${p}`, value: p }))
  ];

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setSelectedIndex(prev => Math.min(items.length - 1, prev + 1));
    }
    if (key.return) {
      onSelectProject(items[selectedIndex].value);
    }
    // Conflict: 's' was used for both search (my change) and stats (upstream change).
    // I will remap Search to 'f' (Find) to avoid conflict, or 'S' (shift+s).
    // Or I will remap Stats to 't'.
    // Let's use 'f' for Search (Find) since '/' is also common but usually reserved for command inputs.
    // Wait, Main Menu has "Stats" and "Search" separately.
    // In Browser, let's use:
    // 's' -> Stats
    // '/' -> Search

    if (input === '/') {
        onSearch();
    }
    if (input === 's' && onViewStats) {
        onViewStats();
    }
    if (key.escape || key.backspace) {
        onBack();
    }
    if (input === 's' && onViewStats) {
        onViewStats();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}><Text bold>Select Project / Group</Text></Box>
      {items.map((item, index) => (
        <Box key={index}>
          <Text color={index === selectedIndex ? 'green' : 'white'}>
            {index === selectedIndex ? '> ' : '  '}
            {item.label}
          </Text>
        </Box>
      ))}
      <Box marginTop={1} borderStyle="single" borderColor="gray">
          <Text>
              <Text bold color="green">Enter</Text>: Select |
              <Text bold color="green"> s</Text>: Stats |
              <Text bold color="green"> /</Text>: Search |
              <Text bold color="green"> Esc</Text>: Back
          </Text>
      </Box>
    </Box>
  );
};
