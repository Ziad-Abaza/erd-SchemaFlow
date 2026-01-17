# Fixes Applied - Server Context & Validation

## Summary

Fixed critical validation errors and context limit issues preventing the AI from working correctly.

## Problems Identified

1. **Validation Error**: `Field required: messages` on `/v1/chat/completions`.
   - Cause: Client-side code in `LocalAIProvider.ts` and `route.ts` was forwarding requests with `messages: undefined` when the input was malformed or empty, causing the Python server to reject the request.
2. **Context Limit Exceeded**: Logs showed `WARNING:ctransformers:Number of tokens (...) exceeded maximum context length (512)`.
   - Cause: `server/main.py` was initializing `ctransformers` without an explicit `context_length`, causing it to default to 512 tokens.

## Fixes Applied

### 1. Increased Context Window to 4096 Tokens ✅

**File**: `.env` and `server/main.py`

**Changes**:
- Updated `.env` to set `AI_MAX_CONTEXT_TOKENS=4096`.
- Modified `server/main.py` to read `AI_MAX_CONTEXT_TOKENS` and pass `context_length` to `AutoModelForCausalLM.from_pretrained`.

**Impact**:
- The model can now handle larger prompts and schema contexts (up to 4096 tokens).
- "Number of tokens exceeded" warnings should be resolved.
- JSON generation should be more reliable as the output won't be truncated unexpectedly.

### 2. Fixed Request Validation ✅

**File**: `src/lib/ai/providers/local-provider.ts` and `src/app/api/ai/chat/route.ts`

**Changes**:
- Added fallback `|| []` to `messages` field in `LocalAIProvider.ts` methods (`chat` and `stream`).
- Added fallback `|| []` to `messages` in `src/app/api/ai/chat/route.ts`.

**Impact**:
- Requests will never be sent with missing `messages` field.
- Resolves the `422 Unprocessable Entity` validation errors seen in logs.

## Instructions

**PLEASE RESTART THE PYTHON SERVER** for `server/main.py` changes to take effect.
