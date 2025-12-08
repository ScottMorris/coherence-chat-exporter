import { Provider, Conversation, Message } from './types.js';

interface ClaudeConversation {
  uuid: string;
  name: string;
  summary: string;
  created_at: string;
  updated_at: string;
  project_uuid?: string;
  chat_messages: ChatMessage[];
}

interface ChatMessage {
  uuid: string;
  text: string;
  sender: 'human' | 'assistant';
  created_at: string;
  attachments?: any[];
  files?: any[];
}

interface Project {
  uuid: string;
  name: string;
  description?: string;
  created_at: string;
}

export class ClaudeProvider implements Provider {
  name = 'Claude';

  async normalize<T = any>(data: T): Promise<Conversation[]> {
    let conversationsData: ClaudeConversation[] = [];
    let projectsData: Project[] = [];
    const typedData = data as any;

    // 'data' is now expected to be either the resolved ExportData object
    // OR (legacy) a direct array or object for testing

    // Normalize if 'conversations' property is the wrapper object { conversations: [] }
    if (typedData.conversations && !Array.isArray(typedData.conversations) && typedData.conversations.conversations) {
        // This handles case where input resolver returned { conversations: { conversations: [...] } }
        typedData.conversations = typedData.conversations.conversations;
    }

    if (typedData.conversations) {
        // Handle wrapped object (ExportData or raw export)
        const rawConv = typedData.conversations;

        if (Array.isArray(rawConv)) {
            conversationsData = rawConv;
        }

        if (typedData.projects && Array.isArray(typedData.projects)) {
            projectsData = typedData.projects;
        }
    } else if (Array.isArray(typedData)) {
        conversationsData = typedData;
    }

    const projectMap = new Map<string, string>();
    for (const proj of projectsData) {
        projectMap.set(proj.uuid, proj.name);
    }

    return conversationsData.map(c => this.convertConversation(c, projectMap));
  }

  private convertConversation(c: ClaudeConversation, projectMap: Map<string, string>): Conversation {
    const messages: Message[] = c.chat_messages.map(m => ({
      uuid: m.uuid,
      sender: m.sender === 'human' ? 'human' : 'assistant', // Map to shared type
      text: m.text,
      created_at: new Date(m.created_at),
      attachments: m.attachments // Pass through for now, can be refined
    }));

    return {
      uuid: c.uuid,
      title: c.name || 'Untitled Conversation',
      created_at: new Date(c.created_at),
      updated_at: new Date(c.updated_at),
      messages,
      project_name: c.project_uuid ? projectMap.get(c.project_uuid) : undefined,
      original_data: c
    };
  }
}
