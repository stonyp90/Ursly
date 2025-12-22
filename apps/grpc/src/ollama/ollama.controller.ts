import { Controller } from '@nestjs/common';
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable, Subject } from 'rxjs';
import { OllamaService } from './ollama.service';

@Controller()
export class OllamaController {
  constructor(private readonly ollamaService: OllamaService) {}

  @GrpcStreamMethod('OllamaService', 'GenerateCompletion')
  async generateCompletion(data: Observable<any>): Promise<Observable<any>> {
    const subject = new Subject();
    
    data.subscribe({
      next: async (request) => {
        try {
          const response = await this.ollamaService.generateCompletion(request);
          for await (const chunk of response) {
            subject.next(chunk);
          }
          subject.complete();
        } catch (error) {
          subject.error(error);
        }
      },
      error: (error) => subject.error(error),
    });

    return subject.asObservable();
  }

  @GrpcStreamMethod('OllamaService', 'ChatCompletion')
  async chatCompletion(data: Observable<any>): Promise<Observable<any>> {
    const subject = new Subject();
    
    data.subscribe({
      next: async (request) => {
        try {
          const response = await this.ollamaService.chatCompletion(request);
          for await (const chunk of response) {
            subject.next(chunk);
          }
          subject.complete();
        } catch (error) {
          subject.error(error);
        }
      },
      error: (error) => subject.error(error),
    });

    return subject.asObservable();
  }

  @GrpcStreamMethod('OllamaService', 'PullModel')
  async pullModel(data: Observable<any>): Promise<Observable<any>> {
    const subject = new Subject();
    
    data.subscribe({
      next: async (request) => {
        try {
          const response = await this.ollamaService.pullModel(request);
          for await (const chunk of response) {
            subject.next(chunk);
          }
          subject.complete();
        } catch (error) {
          subject.error(error);
        }
      },
      error: (error) => subject.error(error),
    });

    return subject.asObservable();
  }

  @GrpcMethod('OllamaService', 'ListModels')
  async listModels(): Promise<any> {
    return this.ollamaService.listModels();
  }

  @GrpcMethod('OllamaService', 'DeleteModel')
  async deleteModel(data: any): Promise<any> {
    return this.ollamaService.deleteModel(data);
  }

  @GrpcMethod('OllamaService', 'ShowModelInfo')
  async showModelInfo(data: any): Promise<any> {
    return this.ollamaService.showModelInfo(data);
  }
}

