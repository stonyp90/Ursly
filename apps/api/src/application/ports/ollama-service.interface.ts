export interface IOllamaService {
  modelExists(modelName: string): Promise<boolean>;
  listModels(): Promise<any[]>;
  pullModel(modelName: string): Promise<void>;
  generate(params: GenerateParams): Promise<AsyncIterable<GenerateChunk>>;
}

export interface GenerateParams {
  model: string;
  prompt: string;
  system?: string;
  agentId?: string;
  taskId?: string;
}

export interface GenerateChunk {
  response: string;
  done: boolean;
  context?: number[];
}

