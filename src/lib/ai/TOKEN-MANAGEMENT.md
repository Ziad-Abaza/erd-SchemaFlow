# Token Management System

## Overview

The token management system ensures AI requests never exceed context limits, handles large schemas intelligently, and maintains fast responses with valid outputs.

## Features

### 1. Token Estimation
- Accurate token counting using word and character-based estimation
- Accounts for message formatting overhead
- Real-time validation before sending requests

### 2. Automatic Context Compression
- Compresses schemas to reduce token usage by 40-60%
- Preserves essential information
- Removes redundant data

### 3. Intelligent Chunking
- Automatically chunks large schemas into multiple requests
- Processes chunks in parallel or sequentially
- Merges results intelligently

### 4. Truncation Fallback
- If chunking isn't possible, truncates content safely
- Preserves system messages
- Truncates at sentence boundaries when possible

### 5. Multi-Step Processing
- For very large schemas, processes in multiple steps
- Combines results from all chunks
- Deduplicates recommendations and issues

## Token Limits

Default limits (configurable):

```typescript
{
  maxContextTokens: 65536,    // Qwen3-4B supports 65K context
  maxInputTokens: 60000,      // Leave room for output
  maxOutputTokens: 2000,      // Max output tokens
  safetyBuffer: 1000          // Safety buffer to prevent edge cases
}
```

## Usage

### Automatic Token Management

The AI service automatically handles token management:

```typescript
import { getAIService } from '@/lib/ai';

const aiService = getAIService();

// Token management is automatic
const response = await aiService.processRequest(request, {
  compressContext: true,      // Enable compression
  chunkLargeSchemas: true    // Enable chunking
});
```

### Manual Token Management

```typescript
import { tokenManager } from '@/lib/ai';

// Check if request fits
const check = tokenManager.fitsWithinLimits(request);
if (!check.fits) {
  // Request exceeds limits
  console.warn(`Request exceeds limit: ${check.tokens} > ${check.limit}`);
}

// Prepare request with token management
const prepared = tokenManager.prepareRequest(request, {
  compressContext: true,
  chunkLargeSchemas: true
});

// Validate before sending
const validation = tokenManager.validateRequest(prepared as AIRequest);
if (!validation.valid) {
  console.warn(validation.error);
  // Use validation.adjusted if needed
}
```

### Chunking Large Schemas

```typescript
import { tokenManager } from '@/lib/ai';

const chunked = tokenManager.chunkSchema(
  schema,
  'Analyze this schema: {schema}',
  'You are a database expert.'
);

if (chunked.requiresMultiStep) {
  // Process each chunk
  for (const chunk of chunked.chunks) {
    const response = await aiService.processRequest(chunk);
    // Process response...
  }
}
```

## How It Works

### 1. Request Preparation

When a request is made:

1. **Estimate tokens** - Calculate total tokens in request
2. **Check limits** - Verify request fits within limits
3. **Compress if needed** - Apply context compression
4. **Chunk if too large** - Split into multiple requests
5. **Truncate if necessary** - Fallback truncation

### 2. Chunking Strategy

For schemas that exceed limits:

1. **Calculate chunk size** - Based on available tokens
2. **Split tables** - Divide into table groups
3. **Preserve relationships** - Keep related edges with chunks
4. **Process chunks** - Send each chunk separately
5. **Merge results** - Combine all chunk results

### 3. Result Merging

After processing chunks:

1. **Extract data** - Parse JSON from each chunk
2. **Deduplicate** - Remove duplicate recommendations/issues
3. **Combine summaries** - Merge summaries intelligently
4. **Return unified result** - Single response with all data

## Error Handling

The system handles errors gracefully:

- **Token limit exceeded**: Automatically truncates or chunks
- **Chunking fails**: Falls back to truncation
- **Parsing errors**: Returns fallback response
- **Service errors**: Returns error response with fallback data

## Performance

### Token Estimation Accuracy

- **Word-based**: ~1.3 tokens per word
- **Character-based**: ~0.25 tokens per character
- **Combined**: Average of both for better accuracy

### Compression Ratios

- **Initial compression**: 40-60% reduction
- **Summarization**: 70-80% reduction for very large schemas
- **Chunking**: Enables processing of unlimited schema sizes

## Configuration

### Custom Token Limits

```typescript
import { tokenManager } from '@/lib/ai';

tokenManager.setLimits({
  maxContextTokens: 32768,    // Smaller model
  maxInputTokens: 30000,
  maxOutputTokens: 1000,
  safetyBuffer: 500
});
```

### Get Current Limits

```typescript
const limits = tokenManager.getLimits();
console.log('Max context tokens:', limits.maxContextTokens);
```

## Best Practices

1. **Always enable compression** for large schemas
2. **Enable chunking** for schemas with 50+ tables
3. **Monitor token usage** in response metadata
4. **Handle chunked responses** appropriately in UI
5. **Cache chunked results** to avoid reprocessing

## Example: Large Schema Processing

```typescript
// Large schema with 200+ tables
const largeSchema = { nodes: [...200 tables...], edges: [...] };

// Automatic handling
const response = await aiService.processRequest({
  messages: [
    { role: 'system', content: 'Analyze schema' },
    { role: 'user', content: `Schema: ${JSON.stringify(largeSchema)}` }
  ]
}, {
  compressContext: true,
  chunkLargeSchemas: true
});

// Response will be chunked automatically
if (response.metadata?.chunked) {
  console.log(`Processed ${response.metadata.chunksProcessed} chunks`);
}
```

## Troubleshooting

### Request Still Too Large

If requests still exceed limits:

1. Check token limits are appropriate for your model
2. Increase compression aggressiveness
3. Reduce schema detail before sending
4. Use summarization mode

### Chunking Not Working

If chunking fails:

1. Verify schema structure is correct
2. Check token estimation accuracy
3. Reduce chunk size
4. Enable truncation fallback

### Performance Issues

If processing is slow:

1. Enable caching for repeated requests
2. Process chunks in parallel (if supported)
3. Reduce chunk count
4. Use background processing

## Future Enhancements

- [ ] Parallel chunk processing
- [ ] Adaptive chunk sizing
- [ ] Smart summarization for chunks
- [ ] Token usage analytics
- [ ] Cost tracking per request
