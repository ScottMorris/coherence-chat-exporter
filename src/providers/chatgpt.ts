import { Provider, Conversation, Message } from './types.js';

interface ChatGPTConversation {
  id: string;
  title: string;
  create_time: number;
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

export class ChatGPTProvider implements Provider {
  name = 'ChatGPT';

  async normalize(data: any): Promise<Conversation[]> {
    let conversationsData: ChatGPTConversation[] = [];

    // data can be:
    // 1. Array of conversations (direct from JSON parse)
    // 2. ExportData object { conversations: ... }

    if (Array.isArray(data)) {
        conversationsData = data;
    } else if (data && data.conversations) {
        if (Array.isArray(data.conversations)) {
            conversationsData = data.conversations;
        }
    }

    return conversationsData.map(c => this.convertConversation(c));
  }

  private convertConversation(c: ChatGPTConversation): Conversation {
    const messages: Message[] = [];

    let nodeId = c.current_node;
    while (nodeId) {
        const node = c.mapping[nodeId];
        if (!node) break;

        if (node.message) {
            const role = node.message.author.role;
            if (['user', 'assistant', 'system'].includes(role)) {
                 const text = node.message.content.parts.join('\n');
                 if (text.trim()) {
                    messages.push({
                        uuid: node.message.id,
                        sender: role as 'human' | 'assistant' | 'system',
                        text: text,
                        created_at: new Date(node.message.create_time * 1000)
                    });
                 }
            }
        }
        nodeId = node.parent;
    }

    messages.reverse();

    return {
      uuid: c.id,
      title: c.title || 'Untitled Chat',
      created_at: c.create_time ? new Date(c.create_time * 1000) : new Date(),
      updated_at: c.update_time ? new Date(c.update_time * 1000) : new Date(),
      messages,
      original_data: c
    };
  }
}
