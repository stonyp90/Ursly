import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { IOllamaService, OllamaModel, GenerateOptions, GenerateResponse } from '../../../application/ports/ollama.service.port';

@Injectable()
export class OllamaServiceAdapter implements IOllamaService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env['OLLAMA_URL'] || 'http://localhost:11434';
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.data.models?.map((m: any) => ({
        name: m.name,
        size: m.size,
        digest: m.digest,
        modifiedAt: new Date(m.modified_at),
      })) || [];
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      return [];
    }
  }

  async hasModel(modelName: string): Promise<boolean> {
    const models = await this.listModels();
    return models.some((m) => m.name === modelName || m.name.startsWith(`${modelName}:`));
  }

  async generate(options: GenerateOptions): Promise<GenerateResponse> {
    const response = await axios.post(`${this.baseUrl}/api/generate`, {
      model: options.model,
      prompt: options.prompt,
      system: options.systemPrompt,
      stream: false,
    });

    return {
      response: response.data.response,
      done: response.data.done,
      totalDuration: response.data.total_duration,
      promptEvalCount: response.data.prompt_eval_count,
      evalCount: response.data.eval_count,
    };
  }

  async *generateStream(options: GenerateOptions): AsyncGenerator<string, void, unknown> {
    const response = await axios.post(
      `${this.baseUrl}/api/generate`,
      {
        model: options.model,
        prompt: options.prompt,
        system: options.systemPrompt,
        stream: true,
      },
      { responseType: 'stream' }
    );

    for await (const chunk of response.data) {
      const lines = chunk.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            yield data.response;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

