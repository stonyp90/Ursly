import { Module, DynamicModule, Provider, Type } from '@nestjs/common';
import {
  MODEL_RUNTIME,
  RAG_SERVICE,
  CONTEXT_LEARNING_SERVICE,
  ModelRuntimeConfig,
} from './model-runtime.types';
import { CONTEXT_WINDOW_MANAGER } from '../context-window';
import { ContextWindowManager } from '../context-window/context-window.manager';
import { ModelRuntimeService } from './model-runtime.service';
import { RAGService } from './rag.service';
import { ContextLearningService } from './context-learning.service';
import { AgentRuntime } from './agent-runtime';

/**
 * Model Runtime Module Configuration
 */
export interface ModelRuntimeModuleOptions {
  /** Default model to use */
  defaultModel?: string;
  /** Ollama endpoint URL */
  endpoint?: string;
  /** Enable RAG support */
  enableRAG?: boolean;
  /** Enable context learning */
  enableLearning?: boolean;
  /** Custom model runtime provider */
  modelRuntime?: Type<any>;
  /** Custom RAG service provider */
  ragService?: Type<any>;
  /** Custom learning service provider */
  learningService?: Type<any>;
}

/**
 * Model Runtime Module
 * 
 * Provides:
 * - ModelRuntimeService - Model lifecycle management
 * - RAGService - Retrieval Augmented Generation
 * - ContextLearningService - Learn from conversations
 * - AgentRuntime - Unified agent interface
 * 
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [
 *     ModelRuntimeModule.forRoot({
 *       defaultModel: 'llama3',
 *       enableRAG: true,
 *       enableLearning: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class ModelRuntimeModule {
  static forRoot(options: ModelRuntimeModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      // Context Window Manager
      {
        provide: CONTEXT_WINDOW_MANAGER,
        useClass: ContextWindowManager,
      },
      // Model Runtime Service
      {
        provide: MODEL_RUNTIME,
        useFactory: () => {
          return new ModelRuntimeService({
            modelName: options.defaultModel || 'llama3',
            endpoint: options.endpoint,
          });
        },
      },
      {
        provide: ModelRuntimeService,
        useExisting: MODEL_RUNTIME,
      },
    ];

    // RAG Service
    if (options.enableRAG !== false) {
      if (options.ragService) {
        providers.push({
          provide: RAG_SERVICE,
          useClass: options.ragService,
        });
      } else {
        providers.push({
          provide: RAG_SERVICE,
          useClass: RAGService,
        });
      }
      providers.push({
        provide: RAGService,
        useExisting: RAG_SERVICE,
      });
    }

    // Context Learning Service
    if (options.enableLearning !== false) {
      if (options.learningService) {
        providers.push({
          provide: CONTEXT_LEARNING_SERVICE,
          useClass: options.learningService,
        });
      } else {
        providers.push({
          provide: CONTEXT_LEARNING_SERVICE,
          useClass: ContextLearningService,
        });
      }
      providers.push({
        provide: ContextLearningService,
        useExisting: CONTEXT_LEARNING_SERVICE,
      });
    }

    // Agent Runtime
    providers.push(AgentRuntime);

    return {
      module: ModelRuntimeModule,
      providers,
      exports: [
        MODEL_RUNTIME,
        ModelRuntimeService,
        CONTEXT_WINDOW_MANAGER,
        AgentRuntime,
        ...(options.enableRAG !== false ? [RAG_SERVICE, RAGService] : []),
        ...(options.enableLearning !== false ? [CONTEXT_LEARNING_SERVICE, ContextLearningService] : []),
      ],
      global: true,
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: ModelRuntimeModule,
      providers: [AgentRuntime],
      exports: [AgentRuntime],
    };
  }
}

