/**
 * Local AI Provider - For local AI servers (OpenAI-compatible)
 */

import { BaseAIProvider } from './base-provider';
import { AIRequest, AIResponse, AIStreamChunk } from '../types';

export class LocalAIProvider extends BaseAIProvider {
  name = 'local';

  async chat(request: AIRequest): Promise<AIResponse> {
    const response = await this.fetchWithTimeout(
      `${this.baseURL}/v1/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          messages: request.messages || [],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens,
          enable_thinking: request.enableThinking ?? false,
          stream: false
        })
      }
    );

    if (!response.ok) {
      throw new Error(`AI server responded with ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
      content,
      model: data.model,
      tokens: data.usage ? {
        prompt: data.usage.prompt_tokens || 0,
        completion: data.usage.completion_tokens || 0,
        total: data.usage.total_tokens || 0
      } : undefined,
      finishReason: data.choices?.[0]?.finish_reason,
      metadata: {
        ...request.metadata,
        responseId: data.id
      }
    };
  }

  async *stream(request: AIRequest): AsyncGenerator<AIStreamChunk> {
    const response = await this.fetchWithTimeout(
      `${this.baseURL}/v1/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          messages: request.messages || [],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens,
          enable_thinking: request.enableThinking ?? false,
          stream: true
        })
      }
    );

    if (!response.ok) {
      throw new Error(`AI server responded with ${response.status}: ${await response.text()}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) {
      throw new Error('No response body reader available');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          yield { content: '', done: true };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { content: '', done: true };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                yield { content, done: false };
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

