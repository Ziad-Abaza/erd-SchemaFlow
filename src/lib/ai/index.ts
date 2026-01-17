/**
 * AI Service Module - Main exports
 */

export * from './types';
export * from './ai-service';
export * from './context-manager';
export * from './cache-manager';
export * from './request-queue';
export * from './prompts';
export * from './token-manager';
export * from './model-detector';
export * from './providers/base-provider';
export * from './providers/local-provider';

export { getAIService } from './ai-service';
export { contextManager } from './context-manager';
export { cacheManager } from './cache-manager';
export { tokenManager } from './token-manager';
export { ModelDetector } from './model-detector';

