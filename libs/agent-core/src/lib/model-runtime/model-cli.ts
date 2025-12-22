import { ModelRuntimeService } from './model-runtime.service';
import { ModelProvider, ModelState } from './model-runtime.types';

/**
 * CLI Command result
 */
export interface CLIResult {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * Model CLI
 * 
 * Command-line interface for model operations.
 * Can be used standalone or integrated into existing CLI tools.
 * 
 * Usage:
 *   const cli = new ModelCLI();
 *   await cli.execute(['start', 'llama3']);
 *   await cli.execute(['list']);
 *   await cli.execute(['stop', 'llama3']);
 */
export class ModelCLI {
  private runtime: ModelRuntimeService;

  constructor(endpoint?: string) {
    this.runtime = new ModelRuntimeService({
      modelName: 'default',
      endpoint,
    });
  }

  /**
   * Execute a CLI command
   */
  async execute(args: string[]): Promise<CLIResult> {
    const [command, ...params] = args;

    switch (command?.toLowerCase()) {
      case 'start':
        return this.start(params[0], params.slice(1));
      case 'stop':
        return this.stop(params[0]);
      case 'list':
        return this.list(params[0]);
      case 'pull':
        return this.pull(params[0]);
      case 'info':
        return this.info(params[0]);
      case 'switch':
        return this.switch(params[0], params[1]);
      case 'generate':
      case 'gen':
        return this.generate(params[0], params.slice(1).join(' '));
      case 'chat':
        return this.chat(params[0], params.slice(1).join(' '));
      case 'help':
      default:
        return this.help();
    }
  }

  /**
   * Start a model
   */
  private async start(modelName: string, options: string[]): Promise<CLIResult> {
    if (!modelName) {
      return { success: false, message: 'Model name required. Usage: start <model_name>' };
    }

    try {
      const warmUp = !options.includes('--no-warmup');
      const keepAlive = this.getOptionValue(options, '--keep-alive') || '5m';

      const instance = await this.runtime.start(modelName, {
        warmUp,
        keepAlive,
      });

      return {
        success: true,
        message: `Model ${modelName} started successfully`,
        data: {
          id: instance.id,
          state: instance.state,
          startedAt: instance.startedAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to start model: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Stop a model
   */
  private async stop(modelName: string): Promise<CLIResult> {
    if (!modelName) {
      return { success: false, message: 'Model name required. Usage: stop <model_name>' };
    }

    try {
      await this.runtime.stop(modelName);
      return {
        success: true,
        message: `Model ${modelName} stopped successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop model: ${(error as Error).message}`,
      };
    }
  }

  /**
   * List models
   */
  private async list(type?: string): Promise<CLIResult> {
    try {
      if (type === 'running' || type === 'active') {
        const running = await this.runtime.listRunning();
        return {
          success: true,
          message: `${running.length} running model(s)`,
          data: running.map(m => ({
            name: m.config.modelName,
            state: m.state,
            startedAt: m.startedAt,
            memory: m.memoryUsage,
          })),
        };
      }

      const available = await this.runtime.listAvailable();
      return {
        success: true,
        message: `${available.length} available model(s)`,
        data: available,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to list models: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Pull a model
   */
  private async pull(modelName: string): Promise<CLIResult> {
    if (!modelName) {
      return { success: false, message: 'Model name required. Usage: pull <model_name>' };
    }

    try {
      let lastStatus = '';
      let lastProgress = 0;

      for await (const progress of this.runtime.pull(modelName)) {
        if (progress.status !== lastStatus || progress.progress !== lastProgress) {
          lastStatus = progress.status;
          lastProgress = progress.progress || 0;
          console.log(`${progress.status} ${progress.progress ? `(${progress.progress}%)` : ''}`);
        }
      }

      return {
        success: true,
        message: `Model ${modelName} pulled successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to pull model: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get model info
   */
  private async info(modelName: string): Promise<CLIResult> {
    if (!modelName) {
      return { success: false, message: 'Model name required. Usage: info <model_name>' };
    }

    try {
      const info = await this.runtime.getModelInfo(modelName);
      return {
        success: true,
        message: `Model info for ${modelName}`,
        data: info,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get model info: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Switch models
   */
  private async switch(fromModel: string, toModel: string): Promise<CLIResult> {
    if (!fromModel || !toModel) {
      return {
        success: false,
        message: 'Both models required. Usage: switch <from_model> <to_model>',
      };
    }

    try {
      const instance = await this.runtime.switchModel(fromModel, toModel);
      return {
        success: true,
        message: `Switched from ${fromModel} to ${toModel}`,
        data: {
          model: instance.config.modelName,
          state: instance.state,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to switch models: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Generate completion
   */
  private async generate(modelName: string, prompt: string): Promise<CLIResult> {
    if (!modelName || !prompt) {
      return {
        success: false,
        message: 'Model and prompt required. Usage: generate <model_name> <prompt>',
      };
    }

    try {
      // Set current model
      this.runtime.setCurrentModel(modelName);

      const response = await this.runtime.generate({
        prompt,
        stream: false,
      });

      return {
        success: true,
        message: response.content,
        data: {
          model: response.model,
          tokens: response.totalTokens,
          duration: Math.round(response.totalDuration / 1000000), // ms
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Generation failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Chat with model (streaming)
   */
  private async chat(modelName: string, message: string): Promise<CLIResult> {
    if (!modelName || !message) {
      return {
        success: false,
        message: 'Model and message required. Usage: chat <model_name> <message>',
      };
    }

    try {
      this.runtime.setCurrentModel(modelName);

      let fullResponse = '';
      for await (const chunk of this.runtime.generateStream({
        messages: [{ role: 'user', content: message }],
      })) {
        process.stdout.write(chunk.content);
        fullResponse += chunk.content;
      }
      console.log(); // New line after response

      return {
        success: true,
        message: fullResponse,
      };
    } catch (error) {
      return {
        success: false,
        message: `Chat failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Show help
   */
  private help(): CLIResult {
    const helpText = `
Model CLI - Command-line interface for model operations

COMMANDS:
  start <model> [options]     Start a model
    --no-warmup               Skip warm-up phase
    --keep-alive <duration>   Keep model loaded (default: 5m)

  stop <model>                Stop/unload a model

  list [running]              List available models (or running models)

  pull <model>                Download a model

  info <model>                Show model information

  switch <from> <to>          Hot-swap between models

  generate <model> <prompt>   Generate completion
  gen <model> <prompt>        Alias for generate

  chat <model> <message>      Interactive chat (streaming)

  help                        Show this help message

EXAMPLES:
  start llama3
  start codellama --keep-alive 10m
  list running
  pull mistral
  generate llama3 "Hello, how are you?"
  switch llama3 codellama
  chat llama3 "Explain quantum computing"
`;

    return {
      success: true,
      message: helpText,
    };
  }

  /**
   * Get option value from args
   */
  private getOptionValue(args: string[], option: string): string | undefined {
    const index = args.indexOf(option);
    if (index >= 0 && index < args.length - 1) {
      return args[index + 1];
    }
    return undefined;
  }
}

/**
 * Run CLI from command line
 */
export async function runCLI(args: string[]): Promise<void> {
  const cli = new ModelCLI();
  const result = await cli.execute(args);

  if (result.success) {
    console.log(result.message);
    if (result.data) {
      console.log(JSON.stringify(result.data, null, 2));
    }
    process.exit(0);
  } else {
    console.error(`Error: ${result.message}`);
    process.exit(1);
  }
}

// CLI entry point when run directly
if (require.main === module) {
  runCLI(process.argv.slice(2));
}

