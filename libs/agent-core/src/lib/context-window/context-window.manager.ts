import { v4 as uuidv4 } from 'uuid';
import {
  IContextWindowManager,
  ContextWindowState,
  ContextWindowConfig,
  ContextWindowConfigSchema,
  Message,
  TokenUsageStats,
  ContextRotationResult,
} from './context-window.types';
import { TokenCounter, MODEL_CONTEXT_SIZES } from './token-counter';
import { ContextSummarizer, ISummarizationService } from './context-summarizer';

/**
 * In-memory context window manager
 * 
 * Manages context windows for multiple agents, handling:
 * - Token tracking
 * - Threshold detection
 * - Automatic context rotation
 * - Context summarization
 */
export class ContextWindowManager implements IContextWindowManager {
  private windows: Map<string, ContextWindowState> = new Map();
  private tokenCounters: Map<string, TokenCounter> = new Map();
  private summarizer: ContextSummarizer;
  private summarizationService?: ISummarizationService;

  constructor(summarizationService?: ISummarizationService) {
    this.summarizer = new ContextSummarizer();
    this.summarizationService = summarizationService;
  }

  /**
   * Create a new context window for an agent
   */
  createWindow(
    agentId: string,
    config?: Partial<ContextWindowConfig>
  ): ContextWindowState {
    // Parse and validate config with defaults
    const parsedConfig = ContextWindowConfigSchema.parse({
      ...config,
      maxTokens: config?.maxTokens || this.getModelMaxTokens(config?.modelName),
    });

    // Create token counter for this model
    const tokenCounter = new TokenCounter(parsedConfig.modelName);
    this.tokenCounters.set(agentId, tokenCounter);

    const windowState: ContextWindowState = {
      id: uuidv4(),
      agentId,
      windowNumber: 1,
      messages: [],
      totalTokens: 0,
      config: parsedConfig,
      createdAt: new Date(),
    };

    this.windows.set(agentId, windowState);
    return windowState;
  }

  /**
   * Get max tokens for a model
   */
  private getModelMaxTokens(modelName?: string): number {
    if (!modelName) return MODEL_CONTEXT_SIZES['default'];
    
    const normalized = modelName.toLowerCase().split(':')[0];
    for (const [key, value] of Object.entries(MODEL_CONTEXT_SIZES)) {
      if (normalized.includes(key)) {
        return value;
      }
    }
    return MODEL_CONTEXT_SIZES['default'];
  }

  /**
   * Get the current context window for an agent
   */
  getWindow(agentId: string): ContextWindowState | null {
    return this.windows.get(agentId) || null;
  }

  /**
   * Get or create token counter for agent
   */
  private getTokenCounter(agentId: string): TokenCounter {
    let counter = this.tokenCounters.get(agentId);
    if (!counter) {
      const window = this.windows.get(agentId);
      counter = new TokenCounter(window?.config.modelName || 'default');
      this.tokenCounters.set(agentId, counter);
    }
    return counter;
  }

  /**
   * Add a message to the context window
   */
  addMessage(
    agentId: string,
    message: Omit<Message, 'timestamp' | 'tokenCount'>
  ): Message {
    let window = this.windows.get(agentId);
    
    if (!window) {
      // Auto-create window with defaults
      window = this.createWindow(agentId);
    }

    const tokenCounter = this.getTokenCounter(agentId);
    const tokenCount = tokenCounter.countMessageTokens(message.role, message.content);

    const fullMessage: Message = {
      ...message,
      timestamp: new Date(),
      tokenCount,
    };

    // Handle system prompt specially
    if (message.role === 'system') {
      window.systemPrompt = message.content;
    }

    window.messages.push(fullMessage);
    window.totalTokens += tokenCount;

    return fullMessage;
  }

  /**
   * Get token usage statistics
   */
  getTokenUsage(agentId: string): TokenUsageStats {
    const window = this.windows.get(agentId);
    
    if (!window) {
      return {
        current: 0,
        max: MODEL_CONTEXT_SIZES['default'],
        threshold: Math.floor(MODEL_CONTEXT_SIZES['default'] * 0.8),
        percentUsed: 0,
        shouldRotate: false,
      };
    }

    const { maxTokens, thresholdPercent } = window.config;
    const threshold = Math.floor(maxTokens * (thresholdPercent / 100));
    const percentUsed = (window.totalTokens / maxTokens) * 100;

    return {
      current: window.totalTokens,
      max: maxTokens,
      threshold,
      percentUsed,
      shouldRotate: window.totalTokens >= threshold,
    };
  }

  /**
   * Check if context should be rotated
   */
  shouldRotate(agentId: string): boolean {
    return this.getTokenUsage(agentId).shouldRotate;
  }

  /**
   * Rotate the context window (summarize and create new)
   */
  async rotateWindow(agentId: string): Promise<ContextRotationResult> {
    const window = this.windows.get(agentId);
    
    if (!window) {
      throw new Error(`No context window found for agent ${agentId}`);
    }

    const previousWindowId = window.id;
    const previousTokens = window.totalTokens;
    const previousMessageCount = window.messages.length;

    // Generate summary
    const summarizationResult = await this.summarizer.summarize(
      window.messages,
      this.summarizationService
    );

    // Get messages to preserve (recent ones)
    const { toPreserve } = this.summarizer.prepareMessagesForSummary(
      window.messages,
      window.systemPrompt
    );

    // Create new window
    const newWindowId = uuidv4();
    const tokenCounter = this.getTokenCounter(agentId);

    // Calculate tokens for new window
    let newTotalTokens = 0;

    // Add system prompt tokens if preserved
    if (window.config.preserveSystemPrompt && window.systemPrompt) {
      newTotalTokens += tokenCounter.countMessageTokens('system', window.systemPrompt);
    }

    // Add summary tokens
    newTotalTokens += summarizationResult.tokenCount;

    // Add preserved message tokens
    for (const msg of toPreserve) {
      newTotalTokens += msg.tokenCount || tokenCounter.countMessageTokens(msg.role, msg.content);
    }

    // Update window state
    const newWindow: ContextWindowState = {
      id: newWindowId,
      agentId,
      windowNumber: window.windowNumber + 1,
      messages: toPreserve.map(m => ({
        ...m,
        tokenCount: m.tokenCount || tokenCounter.countMessageTokens(m.role, m.content),
      })),
      totalTokens: newTotalTokens,
      systemPrompt: window.systemPrompt,
      previousSummary: summarizationResult.summary,
      config: window.config,
      createdAt: new Date(),
      rotatedAt: new Date(),
    };

    this.windows.set(agentId, newWindow);

    return {
      previousWindowId,
      newWindowId,
      summary: summarizationResult.summary,
      messagesDropped: previousMessageCount - toPreserve.length,
      tokensSaved: previousTokens - newTotalTokens,
    };
  }

  /**
   * Get all messages for context injection
   * Returns messages in the correct order for LLM input
   */
  getContextMessages(agentId: string): Message[] {
    const window = this.windows.get(agentId);
    
    if (!window) {
      return [];
    }

    const contextMessages: Message[] = [];
    const tokenCounter = this.getTokenCounter(agentId);

    // 1. Add system prompt first
    if (window.systemPrompt) {
      contextMessages.push({
        role: 'system',
        content: window.systemPrompt,
        timestamp: window.createdAt,
        tokenCount: tokenCounter.countMessageTokens('system', window.systemPrompt),
      });
    }

    // 2. Add previous context summary if exists
    if (window.previousSummary) {
      contextMessages.push({
        role: 'system',
        content: `[PREVIOUS CONTEXT]\n${window.previousSummary}`,
        timestamp: window.rotatedAt || window.createdAt,
        tokenCount: tokenCounter.countTokens(window.previousSummary) + 20, // overhead for prefix
      });
    }

    // 3. Add conversation messages (excluding system messages)
    const conversationMessages = window.messages.filter(m => m.role !== 'system');
    contextMessages.push(...conversationMessages);

    return contextMessages;
  }

  /**
   * Clear the context window
   */
  clearWindow(agentId: string): void {
    const window = this.windows.get(agentId);
    
    if (window) {
      window.messages = [];
      window.totalTokens = 0;
      window.previousSummary = undefined;
      
      // Re-add system prompt tokens if exists
      if (window.systemPrompt) {
        const tokenCounter = this.getTokenCounter(agentId);
        window.totalTokens = tokenCounter.countMessageTokens('system', window.systemPrompt);
      }
    }
  }

  /**
   * Get all agent IDs with active windows
   */
  getActiveAgentIds(): string[] {
    return Array.from(this.windows.keys());
  }

  /**
   * Remove a context window entirely
   */
  removeWindow(agentId: string): boolean {
    this.tokenCounters.delete(agentId);
    return this.windows.delete(agentId);
  }

  /**
   * Get debug info for a window
   */
  getDebugInfo(agentId: string): object | null {
    const window = this.windows.get(agentId);
    if (!window) return null;

    const usage = this.getTokenUsage(agentId);

    return {
      windowId: window.id,
      windowNumber: window.windowNumber,
      messageCount: window.messages.length,
      tokenUsage: usage,
      hasSystemPrompt: !!window.systemPrompt,
      hasPreviousSummary: !!window.previousSummary,
      createdAt: window.createdAt,
      rotatedAt: window.rotatedAt,
    };
  }
}

