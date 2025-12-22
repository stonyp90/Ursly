import { Module, Global } from '@nestjs/common';
import { ContextWindowManager } from './context-window.manager';
import { CONTEXT_WINDOW_MANAGER } from './context-window.types';
import { SUMMARIZATION_SERVICE } from './context-summarizer';

/**
 * NestJS module for context window management
 * 
 * This module provides the ContextWindowManager as a singleton
 * that can be injected into any service that needs context management.
 * 
 * Usage:
 * 1. Import ContextWindowModule in your app module
 * 2. Inject CONTEXT_WINDOW_MANAGER where needed
 * 
 * Optionally provide a SUMMARIZATION_SERVICE for LLM-based summarization
 */
@Global()
@Module({
  providers: [
    {
      provide: CONTEXT_WINDOW_MANAGER,
      useFactory: (summarizationService?: any) => {
        return new ContextWindowManager(summarizationService);
      },
      inject: [{ token: SUMMARIZATION_SERVICE, optional: true }],
    },
  ],
  exports: [CONTEXT_WINDOW_MANAGER],
})
export class ContextWindowModule {}

/**
 * Configure with custom summarization service
 */
export class ContextWindowModuleConfig {
  static forRoot(summarizationServiceProvider?: any) {
    return {
      module: ContextWindowModule,
      providers: summarizationServiceProvider
        ? [
            summarizationServiceProvider,
            {
              provide: CONTEXT_WINDOW_MANAGER,
              useFactory: (summarizationService: any) => {
                return new ContextWindowManager(summarizationService);
              },
              inject: [SUMMARIZATION_SERVICE],
            },
          ]
        : [
            {
              provide: CONTEXT_WINDOW_MANAGER,
              useClass: ContextWindowManager,
            },
          ],
      exports: [CONTEXT_WINDOW_MANAGER],
    };
  }
}

