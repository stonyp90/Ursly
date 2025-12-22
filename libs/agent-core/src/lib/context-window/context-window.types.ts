import { z } from 'zod';

/**
 * Configuration for context window management
 */
export const ContextWindowConfigSchema = z.object({
  /** Maximum tokens the model can handle */
  maxTokens: z.number().int().positive().default(4096),
  /** Percentage threshold to trigger context rotation (0-100) */
  thresholdPercent: z.number().min(0).max(100).default(80),
  /** Maximum tokens allowed for the context summary */
  summaryMaxTokens: z.number().int().positive().default(500),
  /** Always preserve the system prompt in new windows */
  preserveSystemPrompt: z.boolean().default(true),
  /** Model name for token counting (affects tokenizer) */
  modelName: z.string().default('llama3'),
});

export type ContextWindowConfig = z.infer<typeof ContextWindowConfigSchema>;

/**
 * Represents a single message in the context
 */
export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
  timestamp: z.date().default(() => new Date()),
  tokenCount: z.number().int().optional(),
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Represents the current state of a context window
 */
export const ContextWindowStateSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  windowNumber: z.number().int().positive().default(1),
  messages: z.array(MessageSchema).default([]),
  totalTokens: z.number().int().default(0),
  systemPrompt: z.string().optional(),
  previousSummary: z.string().optional(),
  config: ContextWindowConfigSchema,
  createdAt: z.date().default(() => new Date()),
  rotatedAt: z.date().optional(),
});

export type ContextWindowState = z.infer<typeof ContextWindowStateSchema>;

/**
 * Result of a context rotation
 */
export interface ContextRotationResult {
  previousWindowId: string;
  newWindowId: string;
  summary: string;
  messagesDropped: number;
  tokensSaved: number;
}

/**
 * Token usage statistics
 */
export interface TokenUsageStats {
  current: number;
  max: number;
  threshold: number;
  percentUsed: number;
  shouldRotate: boolean;
}

/**
 * Port interface for context window management
 */
export interface IContextWindowManager {
  /** Create a new context window for an agent */
  createWindow(agentId: string, config?: Partial<ContextWindowConfig>): ContextWindowState;
  
  /** Get the current context window for an agent */
  getWindow(agentId: string): ContextWindowState | null;
  
  /** Add a message to the context window */
  addMessage(agentId: string, message: Omit<Message, 'timestamp' | 'tokenCount'>): Message;
  
  /** Get token usage statistics */
  getTokenUsage(agentId: string): TokenUsageStats;
  
  /** Check if context should be rotated */
  shouldRotate(agentId: string): boolean;
  
  /** Rotate the context window (summarize and create new) */
  rotateWindow(agentId: string): Promise<ContextRotationResult>;
  
  /** Get all messages for context injection */
  getContextMessages(agentId: string): Message[];
  
  /** Clear the context window */
  clearWindow(agentId: string): void;
}

export const CONTEXT_WINDOW_MANAGER = Symbol('IContextWindowManager');

