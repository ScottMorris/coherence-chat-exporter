# ChatGPT Export Structure

Based on export from chat.openai.com

## Files
- `conversations.json` - All data in one file

## Schema

```typescript
// ChatGPT exports as conversations.json (different structure)
interface ChatGPTExport {
  conversations: ChatGPTConversation[];
}

interface ChatGPTConversation {
  id: string;
  title: string;
  create_time: number; // Unix timestamp
  update_time: number;
  mapping: { [key: string]: MessageNode };
  current_node?: string;
}

interface MessageNode {
  id: string;
  message?: {
    id: string;
    author: { role: 'user' | 'assistant' | 'system' };
    content: { content_type: string; parts: string[] };
    create_time: number;
  };
  parent?: string;
  children: string[];
}
```

## Notes
- Uses tree structure (mapping + nodes)
- Requires traversal from root node
