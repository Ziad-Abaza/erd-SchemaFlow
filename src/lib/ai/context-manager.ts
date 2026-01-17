/**
 * Context Manager - Smart context compression and management
 * Reduces token usage while preserving essential information
 */

import { ContextCompressionOptions } from './types';

export class ContextManager {
  // Dynamic max tokens based on model (will be set by token manager)
  private readonly DEFAULT_MAX_TOKENS = 400; // Conservative default for small models
  private readonly COMPRESSION_RATIO = 0.6; // Target 60% size reduction

  /**
   * Compress schema data by removing redundant information
   */
  compressSchema(schema: any, options: ContextCompressionOptions = {}): string {
    const maxTokens = options.maxTokens || this.DEFAULT_MAX_TOKENS;
    
    if (!schema || (!schema.nodes && !schema.tables)) {
      return JSON.stringify(schema);
    }

    const nodes = schema.nodes || schema.tables || [];
    const edges = schema.edges || schema.relationships || [];

    // Extract essential information only
    const compressed = {
      tables: nodes.map((node: any) => ({
        name: node.data?.name || node.name,
        columns: this.compressColumns(node.data?.columns || node.columns || []),
        primaryKey: node.data?.primaryKey || node.primaryKey,
        indexes: this.compressIndexes(node.data?.indexes || node.indexes || [])
      })),
      relationships: edges.map((edge: any) => ({
        source: edge.source || edge.sourceTable,
        target: edge.target || edge.targetTable,
        type: edge.data?.type || edge.type,
        cardinality: edge.data?.cardinality || edge.cardinality
      }))
    };

    let compressedStr = JSON.stringify(compressed);
    
    // If still too large, apply summarization
    if (this.estimateTokens(compressedStr) > maxTokens) {
      compressedStr = this.summarizeSchema(compressed, maxTokens);
    }

    return compressedStr;
  }

  /**
   * Compress column definitions
   */
  private compressColumns(columns: any[]): any[] {
    return columns.map((col: any) => ({
      name: col.name,
      type: col.type,
      nullable: col.nullable,
      primaryKey: col.primaryKey,
      foreignKey: col.foreignKey,
      indexed: col.indexed || col.isIndexed
      // Remove: description, default, constraints (unless critical)
    }));
  }

  /**
   * Compress index definitions
   */
  private compressIndexes(indexes: any[]): any[] {
    return indexes.map((idx: any) => ({
      name: idx.name,
      columns: idx.columns,
      unique: idx.unique
    }));
  }

  /**
   * Summarize schema when compression isn't enough
   */
  private summarizeSchema(schema: any, maxTokens: number): string {
    // Create a high-level summary
    const summary = {
      tableCount: schema.tables?.length || 0,
      relationshipCount: schema.relationships?.length || 0,
      tables: schema.tables?.map((table: any) => ({
        name: table.name,
        columnCount: table.columns?.length || 0,
        hasPrimaryKey: !!table.primaryKey,
        hasIndexes: (table.indexes?.length || 0) > 0
      })) || []
    };

    let summaryStr = JSON.stringify(summary);
    
    // If still too large, truncate table list
    if (this.estimateTokens(summaryStr) > maxTokens) {
      const maxTables = Math.floor((maxTokens * 0.8) / 50); // Rough estimate
      summary.tables = summary.tables.slice(0, maxTables);
      summaryStr = JSON.stringify(summary);
    }

    return summaryStr;
  }

  /**
   * Compress validation results
   */
  compressValidationResults(results: any[]): any[] {
    return results.map((result: any) => ({
      type: result.type,
      category: result.category,
      title: result.title,
      table: result.tableId || result.table,
      column: result.columnId || result.column
      // Remove: full description, suggestions (can be regenerated)
    }));
  }

  /**
   * Compress performance metrics
   */
  compressPerformanceMetrics(metrics: any): any {
    return {
      totalNodes: metrics.totalNodes,
      fps: metrics.fps,
      renderTime: metrics.renderTime,
      memoryUsage: metrics.memoryUsage
      // Remove: detailed breakdowns
    };
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Create a context hash for caching
   */
  createContextHash(context: any): string {
    const normalized = JSON.stringify(context, Object.keys(context).sort());
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Merge multiple contexts intelligently
   */
  mergeContexts(contexts: any[], maxTokens?: number): string {
    const merged = contexts.reduce((acc, ctx) => {
      if (ctx.nodes) acc.nodes = [...(acc.nodes || []), ...ctx.nodes];
      if (ctx.edges) acc.edges = [...(acc.edges || []), ...ctx.edges];
      if (ctx.validationResults) acc.validationResults = [...(acc.validationResults || []), ...ctx.validationResults];
      if (ctx.performanceMetrics) acc.performanceMetrics = { ...acc.performanceMetrics, ...ctx.performanceMetrics };
      return acc;
    }, {});

    return this.compressSchema(merged, { maxTokens });
  }
}

export const contextManager = new ContextManager();

