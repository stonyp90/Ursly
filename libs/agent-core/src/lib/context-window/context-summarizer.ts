import { Message } from './context-window.types';
import { TokenCounter } from './token-counter';

/**
 * Configuration for context summarization
 */
export interface SummarizerConfig {
  maxSummaryTokens: number;
  modelName: string;
  preserveRecentMessages: number;
}

/**
 * Result of summarization
 */
export interface SummarizationResult {
  summary: string;
  tokenCount: number;
  messagesProcessed: number;
  keyPoints: string[];
}

/**
 * Port interface for summarization service
 * This abstracts the LLM call for testability
 */
export interface ISummarizationService {
  summarize(messages: Message[], maxTokens: number): Promise<string>;
}

export const SUMMARIZATION_SERVICE = Symbol('ISummarizationService');

/**
 * Context summarizer for creating compact summaries of conversation history
 */
export class ContextSummarizer {
  private tokenCounter: TokenCounter;
  private config: SummarizerConfig;

  constructor(config: Partial<SummarizerConfig> = {}) {
    this.config = {
      maxSummaryTokens: config.maxSummaryTokens || 500,
      modelName: config.modelName || 'default',
      preserveRecentMessages: config.preserveRecentMessages || 2,
    };
    this.tokenCounter = new TokenCounter(this.config.modelName);
  }

  /**
   * Generate a summary prompt for the LLM
   */
  generateSummaryPrompt(messages: Message[]): string {
    const conversationText = messages
      .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
      .join('\n\n');

    return `Please provide a concise summary of the following conversation. 
Focus on:
1. Key decisions made
2. Important information shared
3. Current context and state
4. Any pending tasks or questions

Keep the summary under ${this.config.maxSummaryTokens} tokens.

CONVERSATION:
${conversationText}

SUMMARY:`;
  }

  /**
   * Extract key points from messages without LLM
   * Used as fallback or for quick summaries
   */
  extractKeyPoints(messages: Message[]): string[] {
    const keyPoints: string[] = [];
    
    for (const msg of messages) {
      // Extract questions (likely important context)
      const questions = msg.content.match(/[^.!?]*\?/g);
      if (questions) {
        keyPoints.push(...questions.slice(0, 2).map(q => q.trim()));
      }

      // Extract statements with key indicators
      const keyIndicators = [
        /important:/i,
        /note:/i,
        /remember:/i,
        /key point:/i,
        /summary:/i,
        /conclusion:/i,
        /decision:/i,
        /action:/i,
        /todo:/i,
        /must/i,
        /should/i,
        /critical/i,
      ];

      for (const indicator of keyIndicators) {
        if (indicator.test(msg.content)) {
          // Extract the sentence containing the indicator
          const sentences = msg.content.split(/[.!?]+/);
          for (const sentence of sentences) {
            if (indicator.test(sentence) && sentence.trim().length > 10) {
              keyPoints.push(sentence.trim());
              break;
            }
          }
        }
      }
    }

    // Deduplicate and limit
    return [...new Set(keyPoints)].slice(0, 10);
  }

  /**
   * Create a fallback summary without LLM
   */
  createFallbackSummary(messages: Message[]): SummarizationResult {
    const keyPoints = this.extractKeyPoints(messages);
    
    // Get the last few user messages for context
    const userMessages = messages
      .filter(m => m.role === 'user')
      .slice(-3)
      .map(m => this.tokenCounter.truncateToFit(m.content, 100));

    // Get the last assistant response
    const lastAssistant = messages
      .filter(m => m.role === 'assistant')
      .slice(-1)
      .map(m => this.tokenCounter.truncateToFit(m.content, 200));

    let summary = 'PREVIOUS CONTEXT SUMMARY:\n\n';
    
    if (keyPoints.length > 0) {
      summary += 'Key Points:\n';
      keyPoints.forEach((point, i) => {
        summary += `${i + 1}. ${point}\n`;
      });
      summary += '\n';
    }

    if (userMessages.length > 0) {
      summary += 'Recent User Topics:\n';
      userMessages.forEach(msg => {
        summary += `- ${msg}\n`;
      });
      summary += '\n';
    }

    if (lastAssistant.length > 0) {
      summary += 'Last Response Context:\n';
      summary += lastAssistant[0] + '\n';
    }

    // Ensure summary fits within token limit
    const truncatedSummary = this.tokenCounter.truncateToFit(
      summary,
      this.config.maxSummaryTokens
    );

    return {
      summary: truncatedSummary,
      tokenCount: this.tokenCounter.countTokens(truncatedSummary),
      messagesProcessed: messages.length,
      keyPoints,
    };
  }

  /**
   * Prepare messages for summarization
   * Excludes recent messages that will be preserved
   */
  prepareMessagesForSummary(
    messages: Message[],
    systemPrompt?: string
  ): { toSummarize: Message[]; toPreserve: Message[] } {
    // Filter out system messages (they're handled separately)
    const nonSystemMessages = messages.filter(m => m.role !== 'system');
    
    // Keep recent messages
    const preserveCount = this.config.preserveRecentMessages;
    const toPreserve = nonSystemMessages.slice(-preserveCount);
    const toSummarize = nonSystemMessages.slice(0, -preserveCount);

    return { toSummarize, toPreserve };
  }

  /**
   * Create summary using provided summarization service
   */
  async summarize(
    messages: Message[],
    summarizationService?: ISummarizationService
  ): Promise<SummarizationResult> {
    const { toSummarize } = this.prepareMessagesForSummary(messages);

    if (toSummarize.length === 0) {
      return {
        summary: '',
        tokenCount: 0,
        messagesProcessed: 0,
        keyPoints: [],
      };
    }

    // If no summarization service provided, use fallback
    if (!summarizationService) {
      return this.createFallbackSummary(toSummarize);
    }

    try {
      const summary = await summarizationService.summarize(
        toSummarize,
        this.config.maxSummaryTokens
      );

      const tokenCount = this.tokenCounter.countTokens(summary);

      return {
        summary,
        tokenCount,
        messagesProcessed: toSummarize.length,
        keyPoints: this.extractKeyPoints(toSummarize),
      };
    } catch (error) {
      // Fallback to local summarization on error
      console.warn('LLM summarization failed, using fallback:', error);
      return this.createFallbackSummary(toSummarize);
    }
  }
}

