/**
 * Model Detector - Detects AI model capabilities from server or environment
 */

export interface ModelCapabilities {
  name: string;
  maxContextTokens: number;
  supportsStreaming: boolean;
  estimatedSpeed: 'fast' | 'medium' | 'slow';
}

export class ModelDetector {
  // Cache whether the endpoint exists to avoid repeated 404s
  private static endpointChecked = false;
  private static endpointExists = false;

  /**
   * Detect model capabilities from server response or environment
   */
  static async detectFromServer(baseURL: string): Promise<ModelCapabilities | null> {
    // If we've already checked and the endpoint doesn't exist, skip the check
    if (this.endpointChecked && !this.endpointExists) {
      return null;
    }

    try {
      // Try to get model info from server
      const response = await fetch(`${baseURL}/model-info`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      this.endpointChecked = true;

      if (response.ok) {
        this.endpointExists = true;
        const info = await response.json();
        return {
          name: info.model || 'unknown',
          maxContextTokens: info.max_context_tokens || 512,
          supportsStreaming: info.supports_streaming !== false,
          estimatedSpeed: info.estimated_speed || 'medium'
        };
      }

      // 404 or other error - endpoint doesn't exist
      this.endpointExists = false;
      // Don't log 404s - they're expected for servers without this endpoint
    } catch (error: any) {
      // Network error or timeout - server doesn't support model-info endpoint
      this.endpointChecked = true;
      this.endpointExists = false;
      // This is expected and not a problem
    }

    return null;
  }

  /**
   * Detect from environment variables
   */
  static detectFromEnv(): ModelCapabilities {
    const modelName = process.env.AI_MODEL_NAME?.toLowerCase() || '';
    const maxContext = parseInt(process.env.AI_MAX_CONTEXT_TOKENS || '0', 10);

    // Mistral models
    if (modelName.includes('mistral')) {
      return {
        name: 'mistral',
        maxContextTokens: maxContext || 4096,
        supportsStreaming: true,
        estimatedSpeed: 'medium'
      };
    }

    // Qwen models
    if (modelName.includes('qwen')) {
      return {
        name: 'qwen',
        maxContextTokens: maxContext || 65536,
        supportsStreaming: true,
        estimatedSpeed: 'fast'
      };
    }

    // Default conservative settings
    return {
      name: 'unknown',
      maxContextTokens: maxContext || 512,
      supportsStreaming: true,
      estimatedSpeed: 'medium'
    };
  }

  /**
   * Get recommended timeout based on model capabilities
   */
  static getRecommendedTimeout(capabilities: ModelCapabilities, estimatedTokens: number): number {
    const baseTimeout = 30000; // 30 seconds base

    // Small context models need more time per token (more compression overhead)
    if (capabilities.maxContextTokens <= 512) {
      // For small models, allow more time (up to 2 minutes)
      return Math.min(300000, baseTimeout + (estimatedTokens * 100));
    }

    // Large context models are faster
    return Math.min(180000, baseTimeout + (estimatedTokens * 50));
  }
}

