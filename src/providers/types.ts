export interface Conversation {
  uuid: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  messages: Message[];
  tags?: string[];
  project_name?: string;
  original_data?: any;
}

export interface Message {
  uuid: string;
  sender: 'human' | 'assistant' | 'system';
  text: string;
  created_at: Date;
  attachments?: Attachment[];
}

export interface Attachment {
  name: string;
  type: string;
  data?: string;
}

export enum ProviderType {
  Claude = 'claude',
  ChatGPT = 'chatgpt'
}

export interface Provider {
  name: string;
  normalize(data: any): Promise<Conversation[]>;
}

export interface TaggingConfig {
    enabled: boolean;
    model: string;
    threshold: number;
    categories: string[];
}
