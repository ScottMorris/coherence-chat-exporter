import React, { useState, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';

interface FullScreenLayoutProps {
  children: React.ReactNode;
}

export const FullScreenLayout: React.FC<FullScreenLayoutProps> = ({ children }) => {
  const { stdout } = useStdout();
  const [size, setSize] = useState({
    columns: stdout?.columns || 80,
    rows: stdout?.rows || 24
  });

  useEffect(() => {
    if (!stdout) return;
    const onResize = () => {
      setSize({
        columns: stdout.columns,
        rows: stdout.rows
      });
    };
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  return (
    <Box
      width={size.columns}
      height={size.rows}
      borderStyle="single"
      borderColor="cyan"
      flexDirection="column"
    >
      {/*
        Title integrated into the top border.
        Using absolute positioning with marginTop={-1} places it on the top border line.
        Background color black ensures it masks the border line if they overlap.
      */}
      <Box position="absolute" marginTop={-1} width="100%" justifyContent="center">
          <Text color="cyan" backgroundColor="black"> Coherence </Text>
      </Box>

      {/* Main Content Area */}
      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {children}
      </Box>
    </Box>
  );
};
