import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OllamaService {
  private readonly ollamaUrl: string;

  constructor(private auditService: AuditService) {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  }

  async* generateCompletion(request: any): AsyncGenerator<any> {
    const startTime = Date.now();

    try {
      // Log prompt sent
      await this.auditService.logEvent({
        eventType: 'PROMPT_SENT',
        agentId: request.agentId,
        taskId: request.taskId,
        metadata: {
          model: request.model,
          promptLength: request.prompt?.length || 0,
        },
      });

      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: request.model,
          prompt: request.prompt,
          system: request.system,
          images: request.images,
          options: this.mapOptions(request.options),
          format: request.format,
          stream: request.stream !== false,
        },
        {
          responseType: 'stream',
        }
      );

      let fullResponse = '';

      for await (const chunk of response.data) {
        const data = JSON.parse(chunk.toString());
        fullResponse += data.response || '';
        
        yield {
          model: data.model,
          response: data.response,
          done: data.done,
          totalDuration: data.total_duration,
          loadDuration: data.load_duration,
          promptEvalCount: data.prompt_eval_count,
          promptEvalDuration: data.prompt_eval_duration,
          evalCount: data.eval_count,
          evalDuration: data.eval_duration,
        };

        if (data.done) {
          // Log response received
          await this.auditService.logEvent({
            eventType: 'RESPONSE_RECEIVED',
            agentId: request.agentId,
            taskId: request.taskId,
            duration: Date.now() - startTime,
            metadata: {
              model: data.model,
              responseLength: fullResponse.length,
            },
            tokenUsage: {
              promptTokens: data.prompt_eval_count,
              completionTokens: data.eval_count,
              totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
            },
          });
          break;
        }
      }
    } catch (error) {
      console.error('Generate completion error:', error.message);
      throw error;
    }
  }

  async* chatCompletion(request: any): AsyncGenerator<any> {
    const startTime = Date.now();

    try {
      // Log prompt sent
      await this.auditService.logEvent({
        eventType: 'PROMPT_SENT',
        agentId: request.agentId,
        taskId: request.taskId,
        metadata: {
          model: request.model,
          messageCount: request.messages?.length || 0,
        },
      });

      const response = await axios.post(
        `${this.ollamaUrl}/api/chat`,
        {
          model: request.model,
          messages: request.messages,
          options: this.mapOptions(request.options),
          format: request.format,
          stream: request.stream !== false,
        },
        {
          responseType: 'stream',
        }
      );

      let fullResponse = '';

      for await (const chunk of response.data) {
        const data = JSON.parse(chunk.toString());
        fullResponse += data.message?.content || '';
        
        yield {
          model: data.model,
          message: data.message,
          done: data.done,
          totalDuration: data.total_duration,
          loadDuration: data.load_duration,
          promptEvalCount: data.prompt_eval_count,
          promptEvalDuration: data.prompt_eval_duration,
          evalCount: data.eval_count,
          evalDuration: data.eval_duration,
        };

        if (data.done) {
          // Log response received
          await this.auditService.logEvent({
            eventType: 'RESPONSE_RECEIVED',
            agentId: request.agentId,
            taskId: request.taskId,
            duration: Date.now() - startTime,
            metadata: {
              model: data.model,
              responseLength: fullResponse.length,
            },
            tokenUsage: {
              promptTokens: data.prompt_eval_count,
              completionTokens: data.eval_count,
              totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
            },
          });
          break;
        }
      }
    } catch (error) {
      console.error('Chat completion error:', error.message);
      throw error;
    }
  }

  async* pullModel(request: any): AsyncGenerator<any> {
    try {
      const response = await axios.post(
        `${this.ollamaUrl}/api/pull`,
        {
          name: request.name,
          insecure: request.insecure || false,
          stream: true,
        },
        {
          responseType: 'stream',
        }
      );

      for await (const chunk of response.data) {
        const data = JSON.parse(chunk.toString());
        
        yield {
          status: data.status,
          digest: data.digest,
          total: data.total,
          completed: data.completed,
        };
      }

      // Log model pulled
      await this.auditService.logEvent({
        eventType: 'MODEL_PULLED',
        metadata: { modelName: request.name },
      });
    } catch (error) {
      console.error('Pull model error:', error.message);
      throw error;
    }
  }

  async listModels(): Promise<any> {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`);
      return {
        models: response.data.models || [],
      };
    } catch (error) {
      console.error('List models error:', error.message);
      throw error;
    }
  }

  async deleteModel(request: any): Promise<any> {
    try {
      await axios.delete(`${this.ollamaUrl}/api/delete`, {
        data: { name: request.name },
      });

      return {
        success: true,
        message: `Model ${request.name} deleted successfully`,
      };
    } catch (error) {
      console.error('Delete model error:', error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async showModelInfo(request: any): Promise<any> {
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/show`, {
        name: request.name,
      });

      return {
        modelfile: response.data.modelfile,
        parameters: response.data.parameters,
        template: response.data.template,
        details: response.data.details,
      };
    } catch (error) {
      console.error('Show model error:', error.message);
      throw error;
    }
  }

  private mapOptions(options: any): any {
    if (!options) return undefined;

    return {
      num_ctx: options.numCtx,
      temperature: options.temperature,
      top_k: options.topK,
      top_p: options.topP,
      repeat_penalty: options.repeatPenalty,
      seed: options.seed,
      num_predict: options.numPredict,
      stop: options.stop,
    };
  }
}

