import { TokenCounter, MODEL_CONTEXT_SIZES } from './token-counter';

describe('TokenCounter', () => {
  describe('countTokens', () => {
    it('should count tokens for simple text', () => {
      const counter = new TokenCounter();
      const tokens = counter.countTokens('Hello, world!');

      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(20); // Reasonable upper bound for short text
    });

    it('should return 0 for empty string', () => {
      const counter = new TokenCounter();
      expect(counter.countTokens('')).toBe(0);
    });

    it('should handle long text', () => {
      const counter = new TokenCounter();
      const longText = 'This is a test sentence. '.repeat(100);
      const tokens = counter.countTokens(longText);

      expect(tokens).toBeGreaterThan(100);
    });

    it('should count punctuation as separate tokens', () => {
      const counter = new TokenCounter();
      const withPunctuation = 'Hello! How are you? I am fine.';
      const withoutPunctuation = 'Hello How are you I am fine';

      expect(counter.countTokens(withPunctuation)).toBeGreaterThan(
        counter.countTokens(withoutPunctuation) - 5
      );
    });
  });

  describe('countMessageTokens', () => {
    it('should add overhead for role', () => {
      const counter = new TokenCounter();
      const content = 'Hello, world!';
      
      const contentTokens = counter.countTokens(content);
      const messageTokens = counter.countMessageTokens('user', content);

      expect(messageTokens).toBeGreaterThan(contentTokens);
    });
  });

  describe('countMessagesTokens', () => {
    it('should count tokens for array of messages', () => {
      const counter = new TokenCounter();
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' },
        { role: 'assistant', content: 'Hi there! How can I help you today?' },
      ];

      const tokens = counter.countMessagesTokens(messages);
      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe('getMaxContextSize', () => {
    it('should return correct size for known models', () => {
      const llama3Counter = new TokenCounter('llama3');
      expect(llama3Counter.getMaxContextSize()).toBe(8192);

      const mistralCounter = new TokenCounter('mistral');
      expect(mistralCounter.getMaxContextSize()).toBe(32768);
    });

    it('should return default size for unknown models', () => {
      const counter = new TokenCounter('unknown-model');
      expect(counter.getMaxContextSize()).toBe(MODEL_CONTEXT_SIZES['default']);
    });
  });

  describe('truncateToFit', () => {
    it('should not truncate if text fits', () => {
      const counter = new TokenCounter();
      const text = 'Short text';
      
      const result = counter.truncateToFit(text, 1000);
      expect(result).toBe(text);
    });

    it('should truncate text to fit within limit', () => {
      const counter = new TokenCounter();
      const longText = 'This is a very long text that needs to be truncated. '.repeat(20);
      
      const result = counter.truncateToFit(longText, 50);
      
      // Allow small margin for token estimation variance
      expect(counter.countTokens(result)).toBeLessThanOrEqual(60);
      expect(result.endsWith('...')).toBe(true);
      expect(result.length).toBeLessThan(longText.length);
    });
  });

  describe('model name normalization', () => {
    it('should handle model names with version tags', () => {
      const counter = new TokenCounter('llama3:latest');
      expect(counter.getMaxContextSize()).toBe(8192);
    });

    it('should handle partial model name matches', () => {
      const counter = new TokenCounter('mistral-7b-instruct');
      expect(counter.getMaxContextSize()).toBe(32768);
    });
  });
});

