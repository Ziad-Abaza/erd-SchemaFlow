/**
 * AI Service Types - Model-agnostic interface definitions
 */

export interface AIModelConfig {
  provider: 'openai' | 'local' | 'anthropic' | 'custom';
  baseURL: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  enableThinking?: boolean;
  stream?: boolean;
  metadata?: Record<string, any>;
}

export interface AIResponse {
  content: string;
  model?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason?: string;
  metadata?: Record<string, any>;
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
  metadata?: Record<string, any>;
}

export interface CachedResponse {
  data: any;
  timestamp: number;
  ttl: number;
  hash: string;
}

export interface ContextCompressionOptions {
  maxTokens?: number;
  preserveStructure?: boolean;
  summarize?: boolean;
  removeRedundancy?: boolean;
}

export interface AIJob {
  id: string;
  type: string;
  request: AIRequest;
  priority: 'high' | 'medium' | 'low';
  callback?: (result: AIResponse) => void;
  errorCallback?: (error: Error) => void;
  createdAt: number;
  retries?: number;
}

export interface AIProvider {
  name: string;
  chat(request: AIRequest): Promise<AIResponse>;
  stream(request: AIRequest): AsyncGenerator<AIStreamChunk>;
  isAvailable(): Promise<boolean>;
}

