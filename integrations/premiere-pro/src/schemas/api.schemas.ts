/**
 * Zod schemas for Ursly API validation
 * Following the project's validation standards
 */

import { z } from 'zod';

// ============================================
// Connection & Health Schemas
// ============================================

export const ConnectionStatusSchema = z.object({
  connected: z.boolean(),
  status: z.enum(['healthy', 'unhealthy', 'unreachable']),
  error: z.string().optional(),
});

export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>;

// ============================================
// Model Schemas
// ============================================

export const ModelSchema = z.object({
  name: z.string().min(1),
  size: z.string().optional(),
  digest: z.string().optional(),
  modifiedAt: z.string().optional(),
  details: z
    .object({
      format: z.string().optional(),
      family: z.string().optional(),
      families: z.array(z.string()).optional(),
      parameterSize: z.string().optional(),
      quantizationLevel: z.string().optional(),
    })
    .optional(),
});

export type Model = z.infer<typeof ModelSchema>;

export const ModelsResponseSchema = z.object({
  models: z.array(ModelSchema),
});

export type ModelsResponse = z.infer<typeof ModelsResponseSchema>;

// ============================================
// Completion Schemas
// ============================================

export const CompletionOptionsSchema = z.object({
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().min(1).max(128000).optional().default(2048),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().min(0).optional(),
  stop: z.array(z.string()).optional(),
});

export type CompletionOptions = z.infer<typeof CompletionOptionsSchema>;

export const CompletionResponseSchema = z.object({
  text: z.string(),
  model: z.string(),
  totalDuration: z.number().optional(),
  promptEvalCount: z.number().optional(),
  evalCount: z.number().optional(),
});

export type CompletionResponse = z.infer<typeof CompletionResponseSchema>;

// ============================================
// Chat Schemas
// ============================================

export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema),
  model: z.string().optional(),
  stream: z.boolean().optional().default(false),
  options: CompletionOptionsSchema.optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// ============================================
// Caption Schemas
// ============================================

export const CaptionSchema = z.object({
  index: z.number().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}[,.]\d{3}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}:\d{2}[,.]\d{3}$/),
  text: z.string().min(1),
});

export type Caption = z.infer<typeof CaptionSchema>;

export const CaptionsArraySchema = z.array(CaptionSchema);

// ============================================
// Transcription Schemas
// ============================================

export const TranscriptionSegmentSchema = z.object({
  id: z.number().optional(),
  start: z.number(),
  end: z.number(),
  text: z.string(),
  confidence: z.number().optional(),
});

export type TranscriptionSegment = z.infer<typeof TranscriptionSegmentSchema>;

export const TranscriptionResponseSchema = z.object({
  text: z.string(),
  segments: z.array(TranscriptionSegmentSchema).optional(),
  language: z.string().optional(),
  duration: z.number().optional(),
});

export type TranscriptionResponse = z.infer<typeof TranscriptionResponseSchema>;

export const TranscriptionOptionsSchema = z.object({
  whisperModel: z.string().optional().default('whisper:small'),
  language: z.string().optional().default('auto'),
  task: z.enum(['transcribe', 'translate']).optional().default('transcribe'),
  timestamps: z.boolean().optional().default(true),
});

export type TranscriptionOptions = z.infer<typeof TranscriptionOptionsSchema>;

// ============================================
// Vision/Analysis Schemas
// ============================================

export const FrameAnalysisOptionsSchema = z.object({
  model: z.string().optional().default('llava'),
  prompt: z.string().optional(),
});

export type FrameAnalysisOptions = z.infer<typeof FrameAnalysisOptionsSchema>;

export const FrameAnalysisResponseSchema = z.object({
  description: z.string(),
  objects: z.array(z.string()).optional(),
  mood: z.string().optional(),
  technicalNotes: z.string().optional(),
});

export type FrameAnalysisResponse = z.infer<typeof FrameAnalysisResponseSchema>;

// ============================================
// Smart Cut Schemas
// ============================================

export const SmartCutSuggestionSchema = z.object({
  cuts: z.array(z.string()),
  transitions: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type SmartCutSuggestion = z.infer<typeof SmartCutSuggestionSchema>;

// ============================================
// Plugin Settings Schemas
// ============================================

export const PluginSettingsSchema = z.object({
  endpoint: z.string().url().optional(),
  model: z.string().optional(),
  defaultTemperature: z.number().min(0).max(2).optional(),
  defaultMaxTokens: z.number().min(1).optional(),
});

export type PluginSettings = z.infer<typeof PluginSettingsSchema>;

// ============================================
// Plugin State Schema
// ============================================

export const PluginStateSchema = z.object({
  isConnected: z.boolean(),
  currentModel: z.string().nullable(),
  isProcessing: z.boolean(),
  lastError: z.string().nullable(),
});

export type PluginState = z.infer<typeof PluginStateSchema>;

// ============================================
// API Error Schema
// ============================================

export const APIErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  status: z.number().optional(),
});

export type APIError = z.infer<typeof APIErrorSchema>;


