import { z } from 'zod';

/**
 * Model provider types supported by the runtime
 */
export enum ModelProvider {
  OLLAMA = 'ollama',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  CUSTOM = 'custom',
}

/**
 * Model lifecycle states
 */
export enum ModelState {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  LOADING = 'loading',
  ERROR = 'error',
}

/**
 * Model runtime configuration schema
 */
export const ModelRuntimeConfigSchema = z.object({
  provider: z.nativeEnum(ModelProvider).default(ModelProvider.OLLAMA),
  modelName: z.string(),
  endpoint: z.string().url().optional(),
  apiKey: z.string().optional(),
  options: z.object({
    temperature: z.number().min(0).max(2).default(0.7),
    topP: z.number().min(0).max(1).default(0.9),
    topK: z.number().int().positive().default(40),
    contextLength: z.number().int().positive().default(4096),
    repeatPenalty: z.number().min(0).max(2).default(1.1),
    numPredict: z.number().int().positive().optional(),
    stop: z.array(z.string()).optional(),
    seed: z.number().int().optional(),
  }).default({}),
  keepAlive: z.string().default('5m'),
  numGpu: z.number().int().min(-1).optional(),
});

export type ModelRuntimeConfig = z.infer<typeof ModelRuntimeConfigSchema>;

/**
 * Running model instance information
 */
export interface ModelInstance {
  id: string;
  config: ModelRuntimeConfig;
  state: ModelState;
  startedAt?: Date;
  lastUsedAt?: Date;
  memoryUsage?: number;
  gpuLayers?: number;
  error?: string;
}

/**
 * Model start options
 */
export interface ModelStartOptions {
  /** Pre-warm the model with a prompt */
  warmUp?: boolean;
  /** Keep model loaded in memory */
  keepAlive?: string;
  /** Number of GPU layers to use (-1 for all) */
  numGpu?: number;
  /** Wait for model to be ready */
  waitForReady?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Model generation request
 */
export interface GenerationRequest {
  prompt?: string;
  messages?: Array<{ role: string; content: string; images?: string[] }>;
  system?: string;
  images?: string[];
  format?: 'json' | string;
  stream?: boolean;
  raw?: boolean;
  context?: number[];
}

/**
 * Streaming generation chunk
 */
export interface GenerationChunk {
  content: string;
  done: boolean;
  model?: string;
  context?: number[];
  totalDuration?: number;
  loadDuration?: number;
  promptEvalCount?: number;
  evalCount?: number;
}

/**
 * Complete generation response
 */
export interface GenerationResponse {
  content: string;
  model: string;
  context?: number[];
  totalDuration: number;
  loadDuration: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * RAG document for context injection
 */
export interface RAGDocument {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
  score?: number;
}

/**
 * RAG query options
 */
export interface RAGQueryOptions {
  topK?: number;
  minScore?: number;
  filter?: Record<string, unknown>;
  includeMetadata?: boolean;
}

/**
 * Context injection source
 */
export interface ContextSource {
  type: 'rag' | 'file' | 'url' | 'custom';
  id: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Learning configuration for context-based training
 */
export interface ContextLearningConfig {
  /** Enable learning from conversations */
  enabled: boolean;
  /** Minimum conversation length to learn from */
  minMessages: number;
  /** Topics to focus on */
  focusTopics?: string[];
  /** Store embeddings for RAG */
  storeEmbeddings: boolean;
  /** Summarize before storing */
  summarize: boolean;
}

/**
 * Model runtime interface - main abstraction for model operations
 */
export interface IModelRuntime {
  /** Get the current provider */
  getProvider(): ModelProvider;

  /** Start a model instance */
  start(modelName: string, options?: ModelStartOptions): Promise<ModelInstance>;

  /** Stop a model instance */
  stop(modelName: string): Promise<void>;

  /** Get running model instance */
  getInstance(modelName: string): ModelInstance | null;

  /** List all running models */
  listRunning(): Promise<ModelInstance[]>;

  /** List all available models */
  listAvailable(): Promise<string[]>;

  /** Generate completion (non-streaming) */
  generate(request: GenerationRequest): Promise<GenerationResponse>;

  /** Generate completion (streaming) */
  generateStream(request: GenerationRequest): AsyncGenerator<GenerationChunk>;

  /** Get model information */
  getModelInfo(modelName: string): Promise<Record<string, unknown>>;

  /** Pull/download a model */
  pull(modelName: string): AsyncGenerator<{ status: string; progress?: number }>;

  /** Check if model is available locally */
  isAvailable(modelName: string): Promise<boolean>;

  /** Hot-swap to a different model */
  switchModel(fromModel: string, toModel: string): Promise<ModelInstance>;
}

/**
 * RAG service interface
 */
export interface IRAGService {
  /** Add documents to the vector store */
  addDocuments(documents: RAGDocument[]): Promise<void>;

  /** Query similar documents */
  query(query: string, options?: RAGQueryOptions): Promise<RAGDocument[]>;

  /** Delete documents */
  deleteDocuments(ids: string[]): Promise<void>;

  /** Generate embeddings for text */
  embed(text: string): Promise<number[]>;

  /** Clear all documents */
  clear(): Promise<void>;

  /** Get document count */
  count(): Promise<number>;
}

/**
 * Context learning service interface
 */
export interface IContextLearningService {
  /** Learn from a conversation */
  learnFromConversation(
    agentId: string,
    messages: Array<{ role: string; content: string }>,
    metadata?: Record<string, unknown>
  ): Promise<void>;

  /** Get learned context for a query */
  getLearnedContext(
    agentId: string,
    query: string,
    options?: RAGQueryOptions
  ): Promise<string>;

  /** Export learned knowledge */
  exportKnowledge(agentId: string): Promise<RAGDocument[]>;

  /** Import knowledge */
  importKnowledge(agentId: string, documents: RAGDocument[]): Promise<void>;

  /** Get learning statistics */
  getStats(agentId: string): Promise<{
    documentCount: number;
    conversationCount: number;
    lastLearnedAt?: Date;
  }>;
}

/** DI tokens */
export const MODEL_RUNTIME = Symbol('IModelRuntime');
export const RAG_SERVICE = Symbol('IRAGService');
export const CONTEXT_LEARNING_SERVICE = Symbol('IContextLearningService');

