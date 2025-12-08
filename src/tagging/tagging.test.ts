import { ConversationTagger } from './classifier';

// Mock the pipeline function
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockImplementation(() => {
    return async (text: string, categories: string[]) => {
      // Return dummy scores
      return {
        labels: categories,
        scores: categories.map(() => 0.9) // All high scores for testing
      };
    };
  })
}));

describe('ConversationTagger', () => {
  it('initializes and tags conversation', async () => {
    const tagger = new ConversationTagger(['tech', 'life'], 0.5);
    await tagger.initialize();

    const mockConv: any = {
      title: 'Tech Talk',
      messages: [{ text: 'I love programming.' }]
    };

    const tags = await tagger.tagConversation(mockConv);
    expect(tags).toContain('tech');
    expect(tags).toContain('life');
  });
});
