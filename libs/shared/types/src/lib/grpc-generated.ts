// Placeholder for gRPC generated types
// These will be generated from proto files using @grpc/proto-loader

export interface GenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  images?: string[];
  options?: GenerateOptions;
  format?: string;
  stream?: boolean;
  agentId?: string;
  taskId?: string;
}

export interface GenerateOptions {
  numCtx?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  repeatPenalty?: number;
  seed?: number;
  numPredict?: number;
  stop?: string[];
}

export interface GenerateResponse {
  model: string;
  response: string;
  done: boolean;
  totalDuration?: number;
  loadDuration?: number;
  promptEvalCount?: number;
  promptEvalDuration?: number;
  evalCount?: number;
  evalDuration?: number;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  options?: GenerateOptions;
  stream?: boolean;
  format?: string;
  agentId?: string;
  taskId?: string;
}

export interface ChatMessage {
  role: string;
  content: string;
  images?: string[];
}

export interface ChatResponse {
  model: string;
  message: ChatMessage;
  done: boolean;
  totalDuration?: number;
  loadDuration?: number;
  promptEvalCount?: number;
  promptEvalDuration?: number;
  evalCount?: number;
  evalDuration?: number;
}

export interface PullRequest {
  name: string;
  insecure?: boolean;
  stream?: boolean;
}

export interface PullResponse {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export interface ModelInfo {
  name: string;
  size: number;
  digest: string;
  modifiedAt: string;
  details?: ModelDetails;
}

export interface ModelDetails {
  format?: string;
  family?: string;
  families?: string[];
  parameterSize?: string;
  quantizationLevel?: string;
}

export interface ModelList {
  models: ModelInfo[];
}

export interface DeleteModelRequest {
  name: string;
}

export interface DeleteModelResponse {
  success: boolean;
  message: string;
}

export interface ShowModelRequest {
  name: string;
}

export interface ShowModelResponse {
  modelfile: string;
  parameters: string;
  template: string;
  details?: ModelDetails;
}

