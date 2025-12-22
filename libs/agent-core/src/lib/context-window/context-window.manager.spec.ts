import { ContextWindowManager } from './context-window.manager';
import { ContextWindowConfig } from './context-window.types';

describe('ContextWindowManager', () => {
  let manager: ContextWindowManager;
  const testAgentId = 'test-agent-123';

  beforeEach(() => {
    manager = new ContextWindowManager();
  });

  describe('createWindow', () => {
    it('should create a new context window with defaults', () => {
      const window = manager.createWindow(testAgentId);

      expect(window).toBeDefined();
      expect(window.agentId).toBe(testAgentId);
      expect(window.windowNumber).toBe(1);
      expect(window.messages).toHaveLength(0);
      expect(window.totalTokens).toBe(0);
      expect(window.config.thresholdPercent).toBe(80);
    });

    it('should create a window with custom config', () => {
      const config: Partial<ContextWindowConfig> = {
        maxTokens: 8192,
        thresholdPercent: 70,
        modelName: 'llama3',
      };

      const window = manager.createWindow(testAgentId, config);

      expect(window.config.maxTokens).toBe(8192);
      expect(window.config.thresholdPercent).toBe(70);
      expect(window.config.modelName).toBe('llama3');
    });
  });

  describe('getWindow', () => {
    it('should return null for non-existent window', () => {
      const window = manager.getWindow('non-existent');
      expect(window).toBeNull();
    });

    it('should return existing window', () => {
      manager.createWindow(testAgentId);
      const window = manager.getWindow(testAgentId);

      expect(window).toBeDefined();
      expect(window?.agentId).toBe(testAgentId);
    });
  });

  describe('addMessage', () => {
    it('should add a message and track tokens', () => {
      manager.createWindow(testAgentId);

      const message = manager.addMessage(testAgentId, {
        role: 'user',
        content: 'Hello, how are you?',
      });

      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello, how are you?');
      expect(message.timestamp).toBeDefined();
      expect(message.tokenCount).toBeGreaterThan(0);

      const window = manager.getWindow(testAgentId);
      expect(window?.messages).toHaveLength(1);
      expect(window?.totalTokens).toBeGreaterThan(0);
    });

    it('should auto-create window if not exists', () => {
      const message = manager.addMessage('new-agent', {
        role: 'user',
        content: 'Test message',
      });

      expect(message).toBeDefined();
      const window = manager.getWindow('new-agent');
      expect(window).toBeDefined();
    });

    it('should handle system prompts specially', () => {
      manager.createWindow(testAgentId);

      manager.addMessage(testAgentId, {
        role: 'system',
        content: 'You are a helpful assistant.',
      });

      const window = manager.getWindow(testAgentId);
      expect(window?.systemPrompt).toBe('You are a helpful assistant.');
    });
  });

  describe('getTokenUsage', () => {
    it('should return zero usage for new window', () => {
      manager.createWindow(testAgentId);
      const usage = manager.getTokenUsage(testAgentId);

      expect(usage.current).toBe(0);
      expect(usage.percentUsed).toBe(0);
      expect(usage.shouldRotate).toBe(false);
    });

    it('should track token usage correctly', () => {
      manager.createWindow(testAgentId, { maxTokens: 100, thresholdPercent: 80 });

      // Add messages to accumulate tokens
      for (let i = 0; i < 10; i++) {
        manager.addMessage(testAgentId, {
          role: 'user',
          content: 'This is a test message with some content.',
        });
      }

      const usage = manager.getTokenUsage(testAgentId);
      expect(usage.current).toBeGreaterThan(0);
      expect(usage.percentUsed).toBeGreaterThan(0);
    });
  });

  describe('shouldRotate', () => {
    it('should return false when under threshold', () => {
      manager.createWindow(testAgentId, { maxTokens: 10000, thresholdPercent: 80 });
      
      manager.addMessage(testAgentId, {
        role: 'user',
        content: 'Short message',
      });

      expect(manager.shouldRotate(testAgentId)).toBe(false);
    });

    it('should return true when over threshold', () => {
      // Create window with very small max tokens to trigger rotation quickly
      manager.createWindow(testAgentId, { maxTokens: 50, thresholdPercent: 50 });

      // Add enough messages to exceed threshold
      for (let i = 0; i < 5; i++) {
        manager.addMessage(testAgentId, {
          role: 'user',
          content: 'This is a longer test message that should add significant tokens.',
        });
      }

      expect(manager.shouldRotate(testAgentId)).toBe(true);
    });
  });

  describe('rotateWindow', () => {
    it('should rotate window and create summary', async () => {
      manager.createWindow(testAgentId, { maxTokens: 100, thresholdPercent: 50 });

      // Add system prompt
      manager.addMessage(testAgentId, {
        role: 'system',
        content: 'You are a helpful assistant.',
      });

      // Add conversation
      manager.addMessage(testAgentId, {
        role: 'user',
        content: 'What is the capital of France?',
      });
      manager.addMessage(testAgentId, {
        role: 'assistant',
        content: 'The capital of France is Paris.',
      });
      manager.addMessage(testAgentId, {
        role: 'user',
        content: 'What is its population?',
      });

      const originalWindow = manager.getWindow(testAgentId);
      const originalWindowId = originalWindow?.id;
      const originalMessageCount = originalWindow?.messages.length || 0;

      const result = await manager.rotateWindow(testAgentId);

      expect(result.previousWindowId).toBe(originalWindowId);
      expect(result.newWindowId).not.toBe(originalWindowId);
      expect(result.messagesDropped).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();

      const newWindow = manager.getWindow(testAgentId);
      expect(newWindow?.windowNumber).toBe(2);
      expect(newWindow?.previousSummary).toBeDefined();
      expect(newWindow?.messages.length).toBeLessThan(originalMessageCount);
    });
  });

  describe('getContextMessages', () => {
    it('should return messages in correct order', () => {
      manager.createWindow(testAgentId);

      manager.addMessage(testAgentId, {
        role: 'system',
        content: 'System prompt',
      });
      manager.addMessage(testAgentId, {
        role: 'user',
        content: 'User message',
      });
      manager.addMessage(testAgentId, {
        role: 'assistant',
        content: 'Assistant response',
      });

      const messages = manager.getContextMessages(testAgentId);

      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
      expect(messages[2].role).toBe('assistant');
    });

    it('should include previous summary after rotation', async () => {
      manager.createWindow(testAgentId, { maxTokens: 100, thresholdPercent: 50 });

      // Build up context
      manager.addMessage(testAgentId, { role: 'system', content: 'System' });
      manager.addMessage(testAgentId, { role: 'user', content: 'Question 1' });
      manager.addMessage(testAgentId, { role: 'assistant', content: 'Answer 1' });
      manager.addMessage(testAgentId, { role: 'user', content: 'Question 2' });
      manager.addMessage(testAgentId, { role: 'assistant', content: 'Answer 2' });

      await manager.rotateWindow(testAgentId);

      const messages = manager.getContextMessages(testAgentId);

      // Should have system prompt, previous context summary, and preserved messages
      const systemMessages = messages.filter(m => m.role === 'system');
      expect(systemMessages.length).toBeGreaterThanOrEqual(1);
      
      // One of the system messages should contain previous context
      const hasSummary = systemMessages.some(m => m.content.includes('[PREVIOUS CONTEXT]'));
      expect(hasSummary).toBe(true);
    });
  });

  describe('clearWindow', () => {
    it('should clear all messages but preserve system prompt', () => {
      manager.createWindow(testAgentId);

      manager.addMessage(testAgentId, { role: 'system', content: 'System prompt' });
      manager.addMessage(testAgentId, { role: 'user', content: 'User message' });
      manager.addMessage(testAgentId, { role: 'assistant', content: 'Response' });

      manager.clearWindow(testAgentId);

      const window = manager.getWindow(testAgentId);
      expect(window?.messages).toHaveLength(0);
      expect(window?.systemPrompt).toBe('System prompt');
    });
  });
});

