import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Observable } from 'rxjs';
import {
  Model,
  PullModelDto,
  ModelPullProgress,
  AuditEventTypeEnum,
} from '@ursly/shared/types';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ModelsService {
  private readonly ollamaUrl: string;

  constructor(
    private configService: ConfigService,
    private auditService: AuditService,
  ) {
    this.ollamaUrl =
      this.configService.get<string>('OLLAMA_URL') || 'http://localhost:11434';
  }

  async listModels(): Promise<{ models: Model[] }> {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`);
      return response.data;
    } catch (error) {
      console.error('Failed to list models:', error.message);
      throw new Error('Failed to retrieve models from Ollama');
    }
  }

  async pullModel(dto: PullModelDto): Promise<{ status: string }> {
    try {
      await axios.post(`${this.ollamaUrl}/api/pull`, {
        name: dto.name,
        insecure: dto.insecure || false,
        stream: false,
      });

      // Audit log
      await this.auditService.log({
        eventType: 'model_inference',
        metadata: { modelName: dto.name },
      });

      return { status: 'Model pull completed' };
    } catch (error) {
      console.error('Failed to pull model:', error.message);
      throw new Error('Failed to pull model from Ollama');
    }
  }

  pullModelStream(dto: PullModelDto): Observable<MessageEvent> {
    return new Observable((observer) => {
      axios
        .post(
          `${this.ollamaUrl}/api/pull`,
          {
            name: dto.name,
            insecure: dto.insecure || false,
            stream: true,
          },
          {
            responseType: 'stream',
          },
        )
        .then((response) => {
          response.data.on('data', (chunk: Buffer) => {
            try {
              const progress: ModelPullProgress = JSON.parse(chunk.toString());
              observer.next({ data: progress } as MessageEvent);
            } catch (e) {
              // Ignore parse errors
            }
          });

          response.data.on('end', () => {
            observer.complete();
            // Audit log
            this.auditService.log({
              eventType: 'model_inference',
              metadata: { modelName: dto.name },
            });
          });

          response.data.on('error', (error: Error) => {
            observer.error(error);
          });
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  async deleteModel(name: string): Promise<{ status: string }> {
    try {
      await axios.delete(`${this.ollamaUrl}/api/delete`, {
        data: { name },
      });

      return { status: 'Model deleted successfully' };
    } catch (error) {
      console.error('Failed to delete model:', error.message);
      throw new Error('Failed to delete model from Ollama');
    }
  }

  async showModel(name: string): Promise<any> {
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/show`, { name });
      return response.data;
    } catch (error) {
      console.error('Failed to show model:', error.message);
      throw new Error('Failed to retrieve model info from Ollama');
    }
  }
}
