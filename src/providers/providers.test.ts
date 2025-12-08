import { ClaudeProvider } from '../providers/claude';
import { ChatGPTProvider } from '../providers/chatgpt';

describe('ClaudeProvider', () => {
  const provider = new ClaudeProvider();

  it('parses conversation correctly', async () => {
    const mockData = {
      conversations: [{
        uuid: '123',
        name: 'Test Chat',
        summary: 'A summary',
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T11:00:00Z',
        chat_messages: [
          {
            uuid: 'm1',
            text: 'Hello',
            sender: 'human',
            created_at: '2023-01-01T10:00:00Z'
          },
          {
            uuid: 'm2',
            text: 'Hi there',
            sender: 'assistant',
            created_at: '2023-01-01T10:01:00Z'
          }
        ]
      }]
    };

    const result = await provider.normalize(mockData);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Test Chat');
    expect(result[0].messages).toHaveLength(2);
    expect(result[0].messages[0].sender).toBe('human');
    expect(result[0].messages[1].text).toBe('Hi there');
  });

  it('links projects correctly', async () => {
      const mockData = {
          conversations: [{
              uuid: '123',
              name: 'Project Chat',
              summary: '',
              created_at: '2023-01-01T10:00:00Z',
              updated_at: '2023-01-01T11:00:00Z',
              project_uuid: 'p1',
              chat_messages: []
          }],
          projects: [{
              uuid: 'p1',
              name: 'My Cool Project',
              created_at: '2023-01-01T09:00:00Z'
          }]
      };

      const result = await provider.normalize(mockData);
      expect(result[0].project_name).toBe('My Cool Project');
  });
});

describe('ChatGPTProvider', () => {
    const provider = new ChatGPTProvider();

    it('parses conversation correctly', async () => {
        const mockData = {
            conversations: [{
                id: '123',
                title: 'GPT Chat',
                create_time: 1672567200, // 2023-01-01 10:00:00 UTC
                update_time: 1672570800,
                current_node: 'node3',
                mapping: {
                    'node1': {
                        id: 'node1',
                        message: {
                            id: 'msg1',
                            author: { role: 'user' },
                            content: { content_type: 'text', parts: ['Hello'] },
                            create_time: 1672567200
                        },
                        parent: null,
                        children: ['node2']
                    },
                    'node2': {
                         id: 'node2',
                         message: {
                             id: 'msg2',
                             author: { role: 'assistant' },
                             content: { content_type: 'text', parts: ['Hi there'] },
                             create_time: 1672567260
                         },
                         parent: 'node1',
                         children: ['node3']
                    },
                    'node3': {
                        id: 'node3',
                        message: {
                            id: 'msg3',
                            author: { role: 'user' },
                            content: { content_type: 'text', parts: ['Thanks'] },
                            create_time: 1672567320
                        },
                        parent: 'node2',
                        children: []
                    }
                }
            }]
        };

        const result = await provider.normalize(mockData);
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('GPT Chat');
        expect(result[0].messages).toHaveLength(3);
        expect(result[0].messages[0].text).toBe('Hello');
        expect(result[0].messages[1].sender).toBe('assistant');
        expect(result[0].messages[2].text).toBe('Thanks');
    });
});
