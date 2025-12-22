import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  IContextWindowManager,
  CONTEXT_WINDOW_MANAGER,
  ContextWindowConfig,
  Message,
  TokenUsageStats,
} from './context-window';

/**
 * Agent execution configuration
 */
export interface AgentExecutionConfig {
  agentId: string;
  model: string;
  systemPrompt: string;
  contextConfig?: Partial<ContextWindowConfig>;
}

/**
 * Result of agent execution
 */
export interface AgentExecutionResult {
  response: string;
  tokenUsage: TokenUsageStats;
  contextRotated: boolean;
  windowNumber: number;
}

/**
 * Port interface for LLM completion
 */
export interface ICompletionService {
  generate(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
  }): Promise<string>;
}

export const COMPLETION_SERVICE = Symbol('ICompletionService');

/**
 * Agent Executor with automatic context window management
 * 
 * This is the main entry point for executing agent tasks with
 * automatic context tracking and rotation.
 */
@Injectable()
export class AgentExecutor {
  private agentConfigs: Map<string, AgentExecutionConfig> = new Map();

  constructor(
    @Inject(CONTEXT_WINDOW_MANAGER)
    private readonly contextManager: IContextWindowManager,
    @Optional()
    @Inject(COMPLETION_SERVICE)
    private readonly completionService?: ICompletionService,
  ) {}

  /**
   * Initialize an agent with configuration
   */
  initializeAgent(config: AgentExecutionConfig): void {
    this.agentConfigs.set(config.agentId, config);

    // Create context window with model-specific settings
    const window = this.contextManager.createWindow(config.agentId, {
      ...config.contextConfig,
      modelName: config.model,
    });

    // Add system prompt
    if (config.systemPrompt) {
      this.contextManager.addMessage(config.agentId, {
        role: 'system',
        content: config.systemPrompt,
      });
    }
  }

  /**
   * Execute a prompt with automatic context management
   */
  async execute(
    agentId: string,
    userPrompt: string,
    completionService?: ICompletionService
  ): Promise<AgentExecutionResult> {
    const config = this.agentConfigs.get(agentId);
    if (!config) {
      throw new Error(`Agent ${agentId} not initialized. Call initializeAgent first.`);
    }

    const service = completionService || this.completionService;
    if (!service) {
      throw new Error('No completion service provided');
    }

    // Check if we need to rotate context before adding new message
    let contextRotated = false;
    if (this.contextManager.shouldRotate(agentId)) {
      await this.contextManager.rotateWindow(agentId);
      contextRotated = true;
    }

    // Add user message
    this.contextManager.addMessage(agentId, {
      role: 'user',
      content: userPrompt,
    });

    // Get context messages for completion
    const contextMessages = this.contextManager.getContextMessages(agentId);
    const messagesForLLM = contextMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Generate completion
    const response = await service.generate({
      model: config.model,
      messages: messagesForLLM,
    });

    // Add assistant response to context
    this.contextManager.addMessage(agentId, {
      role: 'assistant',
      content: response,
    });

    // Get updated token usage
    const tokenUsage = this.contextManager.getTokenUsage(agentId);
    const window = this.contextManager.getWindow(agentId);

    return {
      response,
      tokenUsage,
      contextRotated,
      windowNumber: window?.windowNumber || 1,
    };
  }

  /**
   * Execute with streaming support
   */
  async *executeStream(
    agentId: string,
    userPrompt: string,
    streamingService: {
      generateStream(params: {
        model: string;
        messages: Array<{ role: string; content: string }>;
      }): AsyncIterable<string>;
    }
  ): AsyncIterable<{ chunk: string; done: boolean; result?: AgentExecutionResult }> {
    const config = this.agentConfigs.get(agentId);
    if (!config) {
      throw new Error(`Agent ${agentId} not initialized`);
    }

    // Check for context rotation
    let contextRotated = false;
    if (this.contextManager.shouldRotate(agentId)) {
      await this.contextManager.rotateWindow(agentId);
      contextRotated = true;
    }

    // Add user message
    this.contextManager.addMessage(agentId, {
      role: 'user',
      content: userPrompt,
    });

    // Get context
    const contextMessages = this.contextManager.getContextMessages(agentId);
    const messagesForLLM = contextMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Stream response
    let fullResponse = '';
    for await (const chunk of streamingService.generateStream({
      model: config.model,
      messages: messagesForLLM,
    })) {
      fullResponse += chunk;
      yield { chunk, done: false };
    }

    // Add complete response to context
    this.contextManager.addMessage(agentId, {
      role: 'assistant',
      content: fullResponse,
    });

    const tokenUsage = this.contextManager.getTokenUsage(agentId);
    const window = this.contextManager.getWindow(agentId);

    yield {
      chunk: '',
      done: true,
      result: {
        response: fullResponse,
        tokenUsage,
        contextRotated,
        windowNumber: window?.windowNumber || 1,
      },
    };
  }

  /**
   * Get current token usage for an agent
   */
  getTokenUsage(agentId: string): TokenUsageStats {
    return this.contextManager.getTokenUsage(agentId);
  }

  /**
   * Manually trigger context rotation
   */
  async rotateContext(agentId: string): Promise<void> {
    await this.contextManager.rotateWindow(agentId);
  }

  /**
   * Clear agent context
   */
  clearContext(agentId: string): void {
    this.contextManager.clearWindow(agentId);
  }

  /**
   * Get context window debug info
   */
  getDebugInfo(agentId: string): object | null {
    const window = this.contextManager.getWindow(agentId);
    if (!window) return null;

    return {
      config: this.agentConfigs.get(agentId),
      window: {
        id: window.id,
        windowNumber: window.windowNumber,
        messageCount: window.messages.length,
        totalTokens: window.totalTokens,
        hasSummary: !!window.previousSummary,
      },
      tokenUsage: this.contextManager.getTokenUsage(agentId),
    };
  }

  /**
   * Check if agent needs context rotation
   */
  needsRotation(agentId: string): boolean {
    return this.contextManager.shouldRotate(agentId);
  }
}

