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
    conversations_memory: string;
    project_memories: { [key: string]: string };
    account_uuid: string;
}

interface User {
    uuid: string;
    full_name: string;
    email_address: string;
    verified_phone_number: string | null;
}
```

## Sample Data

### Memories

```json
[
  {
    "conversations_memory": "markdown string of memory text",
    "project_memories": {
      "019a5b6e-d1b2-77cd-b85e-ed252b55f9b3": "markdown string of memory text",
      "019aa7ba-e917-7783-8525-5aa5f5b7cff0": "markdown string of memory text"
    },
    "account_uuid": "7b08e9b7-54ef-482e-8235-964e144a5aa9"
  }
]
```

### Users

```json
[
  {
    "uuid": "7b08e9b7-54ef-482e-8235-964e144a5aa9",
    "full_name": "User's Name",
    "email_address": "email@domain.com",
    "verified_phone_number": null
  }
]
```
