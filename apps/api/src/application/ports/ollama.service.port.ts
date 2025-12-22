/**
 * Ollama model info
 */
export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modifiedAt: Date;
}

/**
 * Ollama generation options
 */
export interface GenerateOptions {
  model: string;
  prompt: string;
  systemPrompt?: string;
  stream?: boolean;
}

/**
 * Ollama generation response
 */
export interface GenerateResponse {
  response: string;
  done: boolean;
  totalDuration?: number;
  promptEvalCount?: number;
  evalCount?: number;
}

/**
 * Port (interface) for Ollama AI Service
 * This defines the contract for AI model interactions
 */
export interface IOllamaService {
  /**
   * List available models
   */
  listModels(): Promise<OllamaModel[]>;

  /**
   * Check if a model is available
   */
  hasModel(modelName: string): Promise<boolean>;

  /**
   * Generate a response from the model
   */
  generate(options: GenerateOptions): Promise<GenerateResponse>;

  /**
   * Generate a streaming response from the model
   */
  generateStream(options: GenerateOptions): AsyncGenerator<string, void, unknown>;

  /**
   * Check if Ollama service is healthy
   */
  isHealthy(): Promise<boolean>;
}

export const OLLAMA_SERVICE = Symbol('IOllamaService');

