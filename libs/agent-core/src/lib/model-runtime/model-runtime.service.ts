import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  IModelRuntime,
  ModelProvider,
  ModelState,
  ModelInstance,
  ModelStartOptions,
  ModelRuntimeConfig,
  ModelRuntimeConfigSchema,
  GenerationRequest,
  GenerationResponse,
  GenerationChunk,
} from './model-runtime.types';

/**
 * Model Runtime Service
 * 
 * Provides unified interface for model lifecycle management:
 * - Start/stop models via SDK or CLI
 * - Hot-swap between models
 * - Stream and non-stream generation
 * - Model availability and status checking
 */
@Injectable()
export class ModelRuntimeService implements IModelRuntime {
  private readonly logger = new Logger(ModelRuntimeService.name);
  private readonly instances: Map<string, ModelInstance> = new Map();
  private readonly httpClient: AxiosInstance;
  private config: ModelRuntimeConfig;
  private currentModel?: string;

  constructor(config?: Partial<ModelRuntimeConfig>) {
    this.config = ModelRuntimeConfigSchema.parse({
      modelName: config?.modelName || 'llama3',
      ...config,
    });

    const baseURL = this.config.endpoint || this.getDefaultEndpoint();
    this.httpClient = axios.create({
      baseURL,
      timeout: 300000, // 5 minutes for long operations
    });

    this.logger.log(`ModelRuntime initialized with provider: ${this.config.provider}`);
  }

  private getDefaultEndpoint(): string {
    switch (this.config.provider) {
      case ModelProvider.OLLAMA:
        return process.env['OLLAMA_URL'] || 'http://localhost:11434';
      case ModelProvider.OPENAI:
        return 'https://api.openai.com/v1';
      case ModelProvider.ANTHROPIC:
        return 'https://api.anthropic.com';
      default:
        return 'http://localhost:11434';
    }
  }

  getProvider(): ModelProvider {
    return this.config.provider;
  }

  /**
   * Start a model instance
   * Loads the model into memory and optionally warms it up
   */
  async start(modelName: string, options: ModelStartOptions = {}): Promise<ModelInstance> {
    const instanceId = uuidv4();
    
    const instance: ModelInstance = {
      id: instanceId,
      config: { ...this.config, modelName },
      state: ModelState.STARTING,
      startedAt: new Date(),
    };

    this.instances.set(modelName, instance);
    this.logger.log(`Starting model: ${modelName}`);

    try {
      // Check if model is available
      const isAvailable = await this.isAvailable(modelName);
      if (!isAvailable) {
        throw new Error(`Model ${modelName} is not available. Pull it first.`);
      }

      instance.state = ModelState.LOADING;

      // Load model into memory with a dummy request
      if (options.warmUp !== false) {
        await this.warmUpModel(modelName, options.keepAlive);
      }

      instance.state = ModelState.RUNNING;
      instance.lastUsedAt = new Date();
      this.currentModel = modelName;

      this.logger.log(`Model ${modelName} started successfully`);
      return instance;
    } catch (error) {
      instance.state = ModelState.ERROR;
      instance.error = (error as Error).message;
      this.logger.error(`Failed to start model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Warm up the model by sending an empty request
   */
  private async warmUpModel(modelName: string, keepAlive?: string): Promise<void> {
    try {
      await this.httpClient.post('/api/generate', {
        model: modelName,
        prompt: '',
        keep_alive: keepAlive || this.config.keepAlive,
      });
    } catch (error) {
      // Ignore errors during warmup - model is still usable
      this.logger.warn(`Warmup for ${modelName} returned error (this is often expected)`);
    }
  }

  /**
   * Stop a model instance (unload from memory)
   */
  async stop(modelName: string): Promise<void> {
    const instance = this.instances.get(modelName);
    if (!instance) {
      this.logger.warn(`No running instance found for model: ${modelName}`);
      return;
    }

    try {
      // Unload model from memory by setting keep_alive to 0
      await this.httpClient.post('/api/generate', {
        model: modelName,
        prompt: '',
        keep_alive: '0s',
      });

      this.instances.delete(modelName);
      if (this.currentModel === modelName) {
        this.currentModel = undefined;
      }

      this.logger.log(`Model ${modelName} stopped successfully`);
    } catch (error) {
      this.logger.error(`Failed to stop model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Get a running model instance
   */
  getInstance(modelName: string): ModelInstance | null {
    return this.instances.get(modelName) || null;
  }

  /**
   * List all running model instances
   */
  async listRunning(): Promise<ModelInstance[]> {
    try {
      const response = await this.httpClient.get('/api/ps');
      const runningModels = response.data?.models || [];
      
      // Update our instances map with actual running state
      for (const model of runningModels) {
        const existing = this.instances.get(model.name);
        if (existing) {
          existing.state = ModelState.RUNNING;
          existing.memoryUsage = model.size;
        } else {
          this.instances.set(model.name, {
            id: uuidv4(),
            config: { ...this.config, modelName: model.name },
            state: ModelState.RUNNING,
            startedAt: new Date(model.expires_at),
            memoryUsage: model.size,
          });
        }
      }

      return Array.from(this.instances.values());
    } catch (error) {
      this.logger.error('Failed to list running models:', error);
      return Array.from(this.instances.values());
    }
  }

  /**
   * List all available models
   */
  async listAvailable(): Promise<string[]> {
    try {
      const response = await this.httpClient.get('/api/tags');
      return (response.data?.models || []).map((m: { name: string }) => m.name);
    } catch (error) {
      this.logger.error('Failed to list available models:', error);
      return [];
    }
  }

  /**
   * Check if a model is available locally
   */
  async isAvailable(modelName: string): Promise<boolean> {
    const available = await this.listAvailable();
    return available.some(name => 
      name === modelName || 
      name.startsWith(`${modelName}:`) || 
      modelName.startsWith(`${name}:`)
    );
  }

  /**
   * Generate completion (non-streaming)
   */
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const modelName = this.currentModel || this.config.modelName;
    const startTime = Date.now();

    try {
      const isChat = request.messages && request.messages.length > 0;
      const endpoint = isChat ? '/api/chat' : '/api/generate';

      const response = await this.httpClient.post(endpoint, {
        model: modelName,
        prompt: request.prompt,
        messages: request.messages,
        system: request.system,
        images: request.images,
        format: request.format,
        raw: request.raw,
        context: request.context,
        options: this.config.options,
        stream: false,
      });

      const data = response.data;
      const content = isChat ? data.message?.content : data.response;

      // Update instance last used
      const instance = this.instances.get(modelName);
      if (instance) {
        instance.lastUsedAt = new Date();
      }

      return {
        content: content || '',
        model: data.model || modelName,
        context: data.context,
        totalDuration: data.total_duration || (Date.now() - startTime) * 1000000,
        loadDuration: data.load_duration || 0,
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      };
    } catch (error) {
      this.logger.error(`Generation failed for model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Generate completion (streaming)
   */
  async *generateStream(request: GenerationRequest): AsyncGenerator<GenerationChunk> {
    const modelName = this.currentModel || this.config.modelName;
    const isChat = request.messages && request.messages.length > 0;
    const endpoint = isChat ? '/api/chat' : '/api/generate';

    try {
      const response = await this.httpClient.post(endpoint, {
        model: modelName,
        prompt: request.prompt,
        messages: request.messages,
        system: request.system,
        images: request.images,
        format: request.format,
        raw: request.raw,
        context: request.context,
        options: this.config.options,
        stream: true,
      }, {
        responseType: 'stream',
      });

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter((line: string) => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            const content = isChat ? data.message?.content : data.response;

            yield {
              content: content || '',
              done: data.done || false,
              model: data.model,
              context: data.context,
              totalDuration: data.total_duration,
              loadDuration: data.load_duration,
              promptEvalCount: data.prompt_eval_count,
              evalCount: data.eval_count,
            };

            if (data.done) {
              // Update instance last used
              const instance = this.instances.get(modelName);
              if (instance) {
                instance.lastUsedAt = new Date();
              }
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } catch (error) {
      this.logger.error(`Stream generation failed for model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(modelName: string): Promise<Record<string, unknown>> {
    try {
      const response = await this.httpClient.post('/api/show', {
        name: modelName,
      });

      return {
        modelfile: response.data.modelfile,
        parameters: response.data.parameters,
        template: response.data.template,
        details: response.data.details,
        license: response.data.license,
      };
    } catch (error) {
      this.logger.error(`Failed to get info for model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Pull/download a model
   */
  async *pull(modelName: string): AsyncGenerator<{ status: string; progress?: number }> {
    try {
      const response = await this.httpClient.post('/api/pull', {
        name: modelName,
        stream: true,
      }, {
        responseType: 'stream',
      });

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter((line: string) => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            const progress = data.total && data.completed 
              ? Math.round((data.completed / data.total) * 100)
              : undefined;

            yield {
              status: data.status || 'pulling',
              progress,
            };
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      this.logger.log(`Model ${modelName} pulled successfully`);
    } catch (error) {
      this.logger.error(`Failed to pull model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Hot-swap to a different model
   * Preserves context by stopping old model and starting new one
   */
  async switchModel(fromModel: string, toModel: string): Promise<ModelInstance> {
    this.logger.log(`Switching model from ${fromModel} to ${toModel}`);

    // Check if target model is available
    const isAvailable = await this.isAvailable(toModel);
    if (!isAvailable) {
      throw new Error(`Target model ${toModel} is not available. Pull it first.`);
    }

    // Stop the current model (but don't throw if it fails)
    try {
      await this.stop(fromModel);
    } catch (error) {
      this.logger.warn(`Failed to stop model ${fromModel} during switch:`, error);
    }

    // Start the new model
    const instance = await this.start(toModel, { warmUp: true });
    
    this.logger.log(`Successfully switched from ${fromModel} to ${toModel}`);
    return instance;
  }

  /**
   * Get current active model name
   */
  getCurrentModel(): string | undefined {
    return this.currentModel;
  }

  /**
   * Set the active model without starting it
   */
  setCurrentModel(modelName: string): void {
    this.currentModel = modelName;
  }

  /**
   * Update runtime configuration
   */
  updateConfig(config: Partial<ModelRuntimeConfig>): void {
    this.config = ModelRuntimeConfigSchema.parse({
      ...this.config,
      ...config,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): ModelRuntimeConfig {
    return { ...this.config };
  }
}

