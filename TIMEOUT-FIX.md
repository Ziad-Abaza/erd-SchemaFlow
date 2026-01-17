# Timeout and Context Limit Fix

## Problem Identified

The AI validation was timing out because:

1. **Model Mismatch**: The system was configured for Qwen (65K context) but the actual model is Mistral-7B (512 context limit)
2. **Request Size**: Requests were ~1435 tokens, exceeding the 512 token limit
3. **Timeout Too Short**: 30 second timeout was insufficient for processing large schemas with small context models
4. **No Model Detection**: System didn't detect the actual model's capabilities

## Solution Implemented

### 1. Model Detection
- Added `ModelDetector` to detect model capabilities
- Automatically detects Mistral vs Qwen models
- Configurable via environment variables:
  - `AI_MODEL_NAME` - Model name (e.g., "mistral", "qwen")
  - `AI_MAX_CONTEXT_TOKENS` - Explicit context limit override

### 2. Dynamic Token Limits
- Token manager now detects model context limit
- Defaults to 512 for Mistral (conservative)
- Uses 65K for Qwen models
- Automatically adjusts safety buffers based on model size

### 3. Increased Timeouts
- Default timeout increased from 30s to 120s
- Configurable via `AI_REQUEST_TIMEOUT` environment variable
- Small context models get longer timeouts (more compression overhead)

### 4. Aggressive Chunking for Small Models
- For models with ≤512 context, uses only 30% of available tokens per chunk
- More aggressive table grouping
- Smaller safety buffers

### 5. Better Error Handling
- Graceful fallbacks when model detection fails
- Clear error messages indicating context limit issues
- Automatic retry with adjusted parameters

## Configuration

### Environment Variables

```env
# Model configuration
AI_MODEL_NAME=mistral                    # or "qwen"
AI_MAX_CONTEXT_TOKENS=512               # Override detected limit
AI_REQUEST_TIMEOUT=120000               # Timeout in milliseconds (120s default)

# Server configuration
AI_SERVER_URL=http://localhost:8000
AI_API_KEY=optional-key
```

### Automatic Detection

If not configured, the system will:
1. Try to detect from server `/model-info` endpoint (404 is expected and handled gracefully)
2. Fall back to environment-based detection (checks `AI_MODEL_NAME` and model file path)
3. Default to conservative 512 token limit (safe for Mistral-7B)

**Note**: The `/model-info` endpoint is optional. If it returns 404 (as shown in your logs), the system automatically falls back to environment-based detection. This is expected behavior and not an error.

## Expected Behavior

### Before Fix
- ❌ Requests with 1435 tokens sent to 512-token model
- ❌ 30 second timeout
- ❌ Context limit errors
- ❌ Timeout errors

### After Fix
- ✅ Automatic model detection (Mistral = 512 tokens)
- ✅ 120 second timeout for large schemas
- ✅ Aggressive chunking for small models
- ✅ Proper context limit enforcement
- ✅ Successful processing of large schemas

## Testing

To verify the fix:

1. **Check Model Detection**:
   ```typescript
   import { ModelDetector } from '@/lib/ai';
   const caps = ModelDetector.detectFromEnv();
   console.log('Detected:', caps.maxContextTokens); // Should be 512 for Mistral
   ```

2. **Test with Large Schema**:
   - Submit validation request with large schema
   - Should see chunking in action
   - Should complete within 120 seconds

3. **Monitor Logs**:
   - Check for "Number of tokens exceeded" warnings
   - Should see successful chunk processing
   - No timeout errors

## Next Steps

If issues persist:

1. **Increase Timeout Further**:
   ```env
   AI_REQUEST_TIMEOUT=180000  # 3 minutes
   ```

2. **Reduce Schema Size**:
   - Use more aggressive compression
   - Process fewer tables at once

3. **Check Server Configuration**:
   - Verify model is actually Mistral-7B
   - Check if server supports larger context windows

---

*Fixed: 2025-01-17*
*Issue: Timeout due to context limit mismatch*
