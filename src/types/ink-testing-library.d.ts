declare module 'ink-testing-library' {
  import { ReactElement } from 'react';

  export interface RenderResponse {
      rerender: (tree: ReactElement) => void;
      unmount: () => void;
      cleanup: () => void;
      stdin: {
          write: (data: string) => boolean;
      };
      frames: string[];
      lastFrame: () => string;
  }

  export function render(tree: ReactElement): RenderResponse;
}
