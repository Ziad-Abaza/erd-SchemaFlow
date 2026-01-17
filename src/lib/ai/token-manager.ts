/**
 * Token Manager - Robust token management to prevent context limit errors
 * Handles chunking, summarization, and multi-step processing for large schemas
 */

import { AIMessage, AIRequest } from './types';
import { contextManager } from './context-manager';

export interface TokenLimits {
  maxContextTokens: number;      // Maximum context window (e.g., 65536 for Qwen)
  maxInputTokens: number;          // Maximum input tokens (context - output buffer)
  maxOutputTokens: number;         // Maximum output tokens
  safetyBuffer: number;            // Safety buffer to prevent edge cases
}

export interface ChunkedRequest {
  chunks: AIRequest[];
  requiresMultiStep: boolean;
  totalTokens: number;
}

export class TokenManager {
  private limits: TokenLimits;

  constructor(limits?: Partial<TokenLimits>) {
    // Initialize with detected or provided limits
    const defaultLimits = this.getDefaultLimits();
    this.limits = { ...defaultLimits, ...limits };
  }

  /**
   * Get default limits based on detected model
   */
  private getDefaultLimits(): TokenLimits {
    const maxContext = this.detectModelContextLimit();
    return {
      maxContextTokens: maxContext,
      maxInputTokens: Math.max(100, maxContext - 2000),  // Leave room for output, min 100
      maxOutputTokens: 2000,
      safetyBuffer: maxContext <= 512 ? 50 : 1000  // Smaller buffer for small models
    };
  }

  /**
   * Detect model context limit from environment or model name
   */
  private detectModelContextLimit(): number {
    // Check for explicit configuration
    const envLimit = process.env.AI_MAX_CONTEXT_TOKENS;
    if (envLimit) {
      return parseInt(envLimit, 10);
    }

    // Check model name from environment
    const modelName = process.env.AI_MODEL_NAME?.toLowerCase() || '';
    
    // Mistral models typically have 512-8192 context
    if (modelName.includes('mistral')) {
      return 512; // Conservative for Mistral-7B
    }
    
    // Qwen models support large context
    if (modelName.includes('qwen')) {
      return 65536;
    }

    // Default to conservative 512 for unknown models
    return 512;
  }

  
  /**
   * Estimate total tokens in a request
   */
  estimateRequestTokens(request: AIRequest): number {
    let total = 0;

    // System message tokens
    if (request.messages) {
      for (const message of request.messages) {
        total += this.estimateTokens(message.content);
      }
    }

    // Add overhead for message formatting (approximately 4 tokens per message)
    total += (request.messages?.length || 0) * 4;

    return total;
  }

  /**
   * Estimate tokens in text (more accurate than simple char/4)
   */
  estimateTokens(text: string): number {
    if (!text) return 0;
    
    // More accurate estimation:
    // - Words: ~1.3 tokens per word
    // - Characters: ~0.25 tokens per character
    // - Use average of both for better accuracy
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;
    
    const wordEstimate = words * 1.3;
    const charEstimate = chars * 0.25;
    
    return Math.ceil((wordEstimate + charEstimate) / 2);
  }

  /**
   * Check if request fits within limits
   */
  fitsWithinLimits(request: AIRequest): { fits: boolean; tokens: number; limit: number } {
    const tokens = this.estimateRequestTokens(request);
    const limit = this.limits.maxInputTokens - this.limits.safetyBuffer;
    
    return {
      fits: tokens <= limit,
      tokens,
      limit
    };
  }

  /**
   * Truncate messages to fit within token limits
   */
  truncateToFit(request: AIRequest): AIRequest {
    const check = this.fitsWithinLimits(request);
    
    if (check.fits) {
      return request;
    }

    // Need to truncate - preserve system message, truncate user message
    const truncated: AIRequest = {
      ...request,
      messages: [...(request.messages || [])]
    };

    const systemMessage = truncated.messages.find(m => m.role === 'system');
    const userMessages = truncated.messages.filter(m => m.role === 'user');
    
    if (userMessages.length === 0) {
      return request; // Can't truncate if no user messages
    }

    // Calculate available tokens for user content
    const systemTokens = systemMessage ? this.estimateTokens(systemMessage.content) : 0;
    const overhead = (truncated.messages.length) * 4;
    const availableTokens = this.limits.maxInputTokens - this.limits.safetyBuffer - systemTokens - overhead;

    // Truncate user message content
    const userMessage = userMessages[0];
    const truncatedContent = this.truncateText(userMessage.content, availableTokens);
    
    truncated.messages = [
      ...(systemMessage ? [systemMessage] : []),
      { ...userMessage, content: truncatedContent + '\n\n[Content truncated due to size limits]' }
    ];

    return truncated;
  }

  /**
   * Truncate text to fit within token limit
   */
  truncateText(text: string, maxTokens: number): string {
    if (this.estimateTokens(text) <= maxTokens) {
      return text;
    }

    // Try to truncate at sentence boundaries
    const sentences = text.split(/([.!?]\s+)/);
    let truncated = '';
    let currentTokens = 0;

    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i] + (sentences[i + 1] || '');
      const sentenceTokens = this.estimateTokens(sentence);
      
      if (currentTokens + sentenceTokens > maxTokens) {
        break;
      }
      
      truncated += sentence;
      currentTokens += sentenceTokens;
    }

    // If still too large, truncate by characters
    if (this.estimateTokens(truncated) > maxTokens) {
      const maxChars = maxTokens * 4; // Rough estimate
      truncated = text.substring(0, maxChars);
    }

    return truncated;
  }

  /**
   * Chunk large schema into multiple requests
   */
  chunkSchema(schema: any, basePrompt: string, systemMessage: string): ChunkedRequest {
    const nodes = schema?.nodes || schema?.tables || [];
    const edges = schema?.edges || schema?.relationships || [];
    
    // Estimate tokens for base prompt and system message
    const baseTokens = this.estimateTokens(basePrompt) + this.estimateTokens(systemMessage) + 50;
    // For small context models, be more aggressive with chunking
    const availableTokens = Math.max(
      this.limits.maxInputTokens - this.limits.safetyBuffer - baseTokens,
      100 // Minimum 100 tokens per chunk
    );
    
    // If schema fits in one request, return single chunk
    const fullSchemaStr = JSON.stringify({ nodes, edges });
    const fullSchemaTokens = this.estimateTokens(fullSchemaStr);
    
    if (fullSchemaTokens <= availableTokens) {
      return {
        chunks: [{
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: basePrompt.replace('{schema}', fullSchemaStr) }
          ],
          temperature: 0.3,
          maxTokens: this.limits.maxOutputTokens
        }],
        requiresMultiStep: false,
        totalTokens: baseTokens + fullSchemaTokens
      };
    }

    // Need to chunk - split into table groups
    const chunks: AIRequest[] = [];
    // For small context models (512 tokens), be very aggressive with chunking
    const chunkSize = this.limits.maxContextTokens <= 512 
      ? Math.floor(availableTokens * 0.3) // Use only 30% for very small models
      : Math.floor(availableTokens / 2);  // 50% for larger models
    // Estimate tables per chunk based on model size
    const tokensPerTable = this.limits.maxContextTokens <= 512 ? 50 : 100;
    const tablesPerChunk = Math.max(1, Math.floor((chunkSize / tokensPerTable)));
    
    for (let i = 0; i < nodes.length; i += tablesPerChunk) {
      const chunkNodes = nodes.slice(i, i + tablesPerChunk);
      const chunkEdges = edges.filter((e: any) => {
        const sourceId = e.source || e.sourceTable;
        const targetId = e.target || e.targetTable;
        return chunkNodes.some((n: any) => 
          (n.id === sourceId || n.data?.name === sourceId || n.name === sourceId) ||
          (n.id === targetId || n.data?.name === targetId || n.name === targetId)
        );
      });

      const chunkSchema = { nodes: chunkNodes, edges: chunkEdges };
      const chunkSchemaStr = contextManager.compressSchema(chunkSchema, { 
        maxTokens: chunkSize 
      });

      chunks.push({
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: basePrompt.replace('{schema}', chunkSchemaStr) + 
            `\n\nNote: This is chunk ${Math.floor(i / tablesPerChunk) + 1} of ${Math.ceil(nodes.length / tablesPerChunk)}. Analyze this portion of the schema.` }
        ],
        temperature: 0.3,
        maxTokens: this.limits.maxOutputTokens
      });
    }

    return {
      chunks,
      requiresMultiStep: true,
      totalTokens: baseTokens + fullSchemaTokens
    };
  }

  /**
   * Process request with automatic token management
   */
  prepareRequest(request: AIRequest, options: {
    compressContext?: boolean;
    chunkLargeSchemas?: boolean;
  } = {}): AIRequest | ChunkedRequest {
    const compressContext = options.compressContext !== false;
    const chunkLargeSchemas = options.chunkLargeSchemas !== false;

    // Compress context if enabled
    if (compressContext && request.messages) {
      request.messages = request.messages.map(msg => {
        if (msg.role === 'user' && msg.content.includes('Schema:')) {
          try {
            const schemaMatch = msg.content.match(/Schema:\s*({[\s\S]*?})(?:\n|$)/);
            if (schemaMatch) {
              const schema = JSON.parse(schemaMatch[1]);
              const compressed = contextManager.compressSchema(schema, {
                maxTokens: this.limits.maxInputTokens - 2000 // Leave room for prompt
              });
              msg.content = msg.content.replace(schemaMatch[0], `Schema: ${compressed}`);
            }
          } catch {
            // If parsing fails, continue with original
          }
        }
        return msg;
      });
    }

    // Check if it fits
    const check = this.fitsWithinLimits(request);
    
    if (check.fits) {
      return request;
    }

    // Doesn't fit - try chunking if enabled
    if (chunkLargeSchemas) {
      const userMessage = request.messages?.find(m => m.role === 'user');
      const systemMessage = request.messages?.find(m => m.role === 'system')?.content || '';
      
      if (userMessage?.content.includes('Schema:')) {
        try {
          const schemaMatch = userMessage.content.match(/Schema:\s*({[\s\S]*?})(?:\n|$)/);
          if (schemaMatch) {
            const schema = JSON.parse(schemaMatch[1]);
            const basePrompt = userMessage.content.replace(/Schema:\s*{[\s\S]*?}(?:\n|$)/, 'Schema: {schema}');
            return this.chunkSchema(schema, basePrompt, systemMessage);
          }
        } catch {
          // If chunking fails, fall through to truncation
        }
      }
    }

    // Fallback: truncate to fit
    return this.truncateToFit(request);
  }

  /**
   * Validate and enforce token limits before sending request
   */
  validateRequest(request: AIRequest): { valid: boolean; error?: string; adjusted?: AIRequest } {
    const check = this.fitsWithinLimits(request);
    
    if (check.fits) {
      return { valid: true };
    }

    // Request exceeds limits - provide adjusted version
    const adjusted = this.truncateToFit(request);
    
    return {
      valid: false,
      error: `Request exceeds token limit (${check.tokens} > ${check.limit}). Content has been truncated.`,
      adjusted
    };
  }

  /**
   * Get current token limits
   */
  getLimits(): TokenLimits {
    return { ...this.limits };
  }

  /**
   * Update token limits
   */
  setLimits(limits: Partial<TokenLimits>): void {
    this.limits = { ...this.limits, ...limits };
  }
}

export const tokenManager = new TokenManager();

