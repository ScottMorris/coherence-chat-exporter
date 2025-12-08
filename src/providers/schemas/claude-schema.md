# Claude Export Structure

Based on export from Claude.ai (December 2024)

## Files
- `conversations.json` - Main conversation data
- `projects.json` - Project organization
- `memories.json` - User memory data
- `users.json` - User profile data

## Schema

```typescript
interface ClaudeExport {
  conversations: ClaudeConversation[];
  memories?: Memory[];
  projects?: Project[];
  users?: User[];
}

interface ClaudeConversation {
  uuid: string;
  name: string;
  summary: string;
  created_at: string; // ISO timestamp
  updated_at: string;
  project_uuid?: string;
  chat_messages: ChatMessage[];
}

interface ChatMessage {
  uuid: string;
  text: string;
  sender: 'human' | 'assistant';
  created_at: string;
  attachments?: Attachment[];
  files?: File[];
}

interface Project {
  uuid: string;
  name: string;
  description?: string;
  created_at: string;
}

interface Memory {
  // Structure TBD - can extract from memories.json
}

interface User {
  // Structure TBD - can extract from users.json
}
```

## Sample Data
(Anonymized example would go here)
