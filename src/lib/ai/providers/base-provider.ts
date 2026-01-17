/**
 * Base AI Provider - Abstract interface for model-agnostic AI providers
 */

import { AIProvider, AIRequest, AIResponse, AIStreamChunk } from '../types';

export abstract class BaseAIProvider implements AIProvider {
  abstract name: string;
  protected baseURL: string;
  protected apiKey?: string;
  protected timeout: number;

  constructor(baseURL: string, apiKey?: string, timeout: number = 120000) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    // Increased default timeout to 120s for large schemas
    // Can be overridden via environment variable
    this.timeout = parseInt(process.env.AI_REQUEST_TIMEOUT || timeout.toString(), 10);
  }

  abstract chat(request: AIRequest): Promise<AIResponse>;
  abstract stream(request: AIRequest): AsyncGenerator<AIStreamChunk>;
  
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  protected async fetchWithTimeout(url: string, options: RequestInit, timeout: number = this.timeout): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  protected extractJSON(content: string): any {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                     content.match(/```\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Fall through to try parsing whole content
      }
    }

    // Try parsing the whole content
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}

