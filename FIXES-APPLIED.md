# Fixes Applied - Timeouts & Performance

## Summary

Addressed persistent timeouts (120000ms) and performance bottlenecks when running the local AI model on CPU.

## Problems Identified

1. **Request Timeouts**: The default timeout of 120 seconds was insufficient for the local Mistral model running on CPU, especially when processing larger schemas or generating table structures (which took ~4.4 minutes in one log entry).
2. **CPU Overload/Starvation**: The `RequestQueue` defaulted to 3 concurrent requests. On a CPU-bound system, running 3 LLM inferences in parallel causes extreme slowdowns, leading to timeouts for *all* requests.
3. **Inconsistent Defaults**: Different parts of the codebase (`model-detector.ts`, `local-provider.ts`) had hardcoded defaults that didn't adapt well to local CPU inference.

## Fixes Applied

### 1. Increased Timeouts ✅

**File**: `.env`, `src/lib/ai/ai-service.ts`, `src/lib/ai/model-detector.ts`

**Changes**:
- Updated `.env` to set `AI_REQUEST_TIMEOUT=300000` (5 minutes).
- Updated `ai-service.ts` to pass `300000` (5 mins) as the default timeout if env var isn't set.
- Updated `model-detector.ts` to suggest longer timeouts (up to 5 mins) for models with small contexts or CPU constraints.

### 2. Reduced Concurrency ✅

**File**: `src/lib/ai/request-queue.ts`

**Changes**:
- Changed default `maxConcurrent` from `3` to `1`.

**Impact**:
- Requests will now be processed sequentially. This is CRITICAL for local CPU inference.
- While latency for the *first* request remains high, subsequent requests won't fight for CPU resources, preventing the entire system from locking up.

### 3. Updated Model Defaults ✅

**File**: `src/lib/ai/model-detector.ts`

**Changes**:
- Updated default `maxContextTokens` for Mistral from 512 to 4096 to match the server configuration.

## Instructions

**PLEASE RESTART THE PYTHON SERVER** and **RELOAD THE NEXT.JS APP** for these changes to take effect.
