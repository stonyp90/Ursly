/**
 * Ursly API Client for Premiere Pro UXP Plugin
 * Handles communication with the local Ursly API server
 *
 * Implements the adapter pattern for the Ursly API infrastructure layer.
 */

import {
  ConnectionStatus,
  ConnectionStatusSchema,
  Model,
  ModelsResponseSchema,
  CompletionOptions,
  CompletionOptionsSchema,
  CompletionResponse,
  TranscriptionOptions,
  TranscriptionOptionsSchema,
  TranscriptionResponse,
  TranscriptionResponseSchema,
  FrameAnalysisOptions,
  FrameAnalysisOptionsSchema,
} from '../schemas';

/**
 * Configuration for the Ursly API client
 */
export interface UrslyAPIConfig {
  baseUrl?: string;
  timeout?: number;
}

/**
 * Ursly API Client
 * Provides typed methods for interacting with the Ursly API
 */
export class UrslyAPI {
  private baseUrl: string;
  private connected: boolean;
  private models: Model[];
  private currentModel: string | null;
  private abortController: AbortController | null;
  private readonly timeout: number;

  constructor(config: UrslyAPIConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'http://localhost:3000';
    this.timeout = config.timeout ?? 30000;
    this.connected = false;
    this.models = [];
    this.currentModel = null;
    this.abortController = null;
  }

  /**
   * Update the API endpoint
   */
  setEndpoint(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  /**
   * Get the current endpoint
   */
  getEndpoint(): string {
    return this.baseUrl;
  }

  /**
   * Set the current model to use for completions
   */
  setCurrentModel(modelName: string): void {
    this.currentModel = modelName;
  }

  /**
   * Get the current model
   */
  getCurrentModel(): string | null {
    return this.currentModel;
  }

  /**
   * Check if connected to API
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Check connection to the Ursly API
   */
  async checkConnection(): Promise<ConnectionStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        this.connected = true;
        return ConnectionStatusSchema.parse({
          connected: true,
          status: 'healthy',
        });
      }

      this.connected = false;
      return ConnectionStatusSchema.parse({
        connected: false,
        status: 'unhealthy',
      });
    } catch (error) {
      this.connected = false;
      return ConnectionStatusSchema.parse({
        connected: false,
        status: 'unreachable',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * List available models from Ollama via Ursly API
   */
  async listModels(): Promise<Model[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    const validated = ModelsResponseSchema.safeParse(data);

    if (validated.success) {
      this.models = validated.data.models;
    } else {
      // Handle array response or legacy format
      this.models = Array.isArray(data) ? data : data.models ?? [];
    }

    return this.models;
  }

  /**
   * Generate a text completion (non-streaming)
   */
  async generateCompletion(
    prompt: string,
    options: Partial<CompletionOptions> = {}
  ): Promise<CompletionResponse> {
    if (!this.currentModel) {
      throw new Error('No model selected');
    }

    const validatedOptions = CompletionOptionsSchema.parse(options);
    this.abortController = new AbortController();

    const response = await fetch(
      `${this.baseUrl}/models/${this.currentModel}/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          stream: false,
          temperature: validatedOptions.temperature,
          maxTokens: validatedOptions.maxTokens,
          options: {
            num_predict: validatedOptions.maxTokens,
          },
        }),
        signal: this.abortController.signal,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        (error as { message?: string }).message ??
          `Generation failed: ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      text:
        data.response ?? data.text ?? (data.message as { content?: string })?.content ?? '',
      model: this.currentModel,
      totalDuration: data.total_duration,
    };
  }

  /**
   * Generate a streaming completion
   */
  async streamCompletion(
    prompt: string,
    options: Partial<CompletionOptions> = {},
    onChunk: (chunk: string) => void
  ): Promise<void> {
    if (!this.currentModel) {
      throw new Error('No model selected');
    }

    const validatedOptions = CompletionOptionsSchema.parse(options);
    this.abortController = new AbortController();

    const response = await fetch(
      `${this.baseUrl}/models/${this.currentModel}/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          stream: true,
          temperature: validatedOptions.temperature,
          maxTokens: validatedOptions.maxTokens,
          options: {
            num_predict: validatedOptions.maxTokens,
          },
        }),
        signal: this.abortController.signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Streaming failed: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line) as { response?: string };
            if (data.response) {
              onChunk(data.response);
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Transcribe audio using Whisper model
   */
  async transcribeAudio(
    audioData: ArrayBuffer | string,
    options: Partial<TranscriptionOptions> = {}
  ): Promise<TranscriptionResponse> {
    const validatedOptions = TranscriptionOptionsSchema.parse(options);
    this.abortController = new AbortController();

    const audioBase64 =
      typeof audioData === 'string'
        ? audioData
        : this.arrayBufferToBase64(audioData);

    const response = await fetch(`${this.baseUrl}/api/tasks/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'transcribe',
        model: validatedOptions.whisperModel,
        audio: audioBase64,
        options: {
          language: validatedOptions.language,
          task: validatedOptions.task,
          timestamps: validatedOptions.timestamps,
        },
      }),
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const data = await response.json();
    return TranscriptionResponseSchema.parse(data);
  }

  /**
   * Analyze video frame using vision model
   */
  async analyzeFrame(
    imageData: ArrayBuffer | string,
    options: Partial<FrameAnalysisOptions> = {}
  ): Promise<{ description: string }> {
    const validatedOptions = FrameAnalysisOptionsSchema.parse(options);
    this.abortController = new AbortController();

    const imageBase64 =
      typeof imageData === 'string'
        ? imageData
        : this.arrayBufferToBase64(imageData);

    const response = await fetch(`${this.baseUrl}/api/tasks/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'vision',
        model: validatedOptions.model,
        images: [imageBase64],
        prompt:
          validatedOptions.prompt ??
          'Describe this video frame in detail. Include information about the scene, subjects, actions, and mood.',
        options: {
          temperature: 0.5,
        },
      }),
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Frame analysis failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Abort the current request
   */
  abortRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

export default UrslyAPI;


