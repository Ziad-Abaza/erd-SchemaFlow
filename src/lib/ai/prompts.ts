/**
 * Prompt Templates - Centralized prompt management
 * Makes it easy to update prompts and maintain consistency
 */

export interface PromptContext {
  schema?: any;
  nodes?: any[];
  edges?: any[];
  validationResults?: any[];
  performanceMetrics?: any;
  dbType?: string;
  queryPatterns?: string[];
  context?: string;
  validationRules?: string[];
}

export class PromptManager {
  /**
   * Performance analysis prompt
   */
  static getPerformancePrompt(context: PromptContext): string {
    const schemaStr = context.schema 
      ? JSON.stringify(context.schema)
      : JSON.stringify({ nodes: context.nodes || [], edges: context.edges || [] });

    return `Analyze this database schema for performance issues:

Schema: ${schemaStr}
Database Type: ${context.dbType || 'postgresql'}
${context.queryPatterns ? `Query Patterns: ${JSON.stringify(context.queryPatterns)}` : ''}

Focus on:
- Missing indexes on foreign keys
- Composite index opportunities
- Query optimization patterns
- Table partitioning candidates
- Normalization vs denormalization trade-offs

Return ONLY valid JSON in this exact format:
{
  "summary": "Overall performance assessment",
  "recommendations": [
    {
      "type": "index|query|schema|partition",
      "priority": "high|medium|low",
      "description": "Clear description of the recommendation",
      "impact": "Expected improvement or benefit",
      "sql": "Optional SQL statement to implement"
    }
  ],
  "metrics": {
    "estimatedImprovement": "e.g., 40-60% query speed improvement",
    "riskLevel": "low|medium|high"
  }
}`;
  }

  /**
   * Validation analysis prompt
   */
  static getValidationPrompt(context: PromptContext): string {
    const schemaStr = context.schema
      ? JSON.stringify(context.schema)
      : JSON.stringify({ nodes: context.nodes || [], edges: context.edges || [] });

    return `Validate this database schema for best practices:

Schema: ${schemaStr}
${context.context ? `Context: ${context.context}` : ''}
${context.validationRules ? `Validation Rules: ${JSON.stringify(context.validationRules)}` : ''}

Check for:
- Naming convention violations
- Missing primary keys
- Orphaned foreign keys
- Data type inconsistencies
- Normalization issues
- Referential integrity problems
- Best practice violations

Return ONLY valid JSON in this exact format:
{
  "summary": "Validation summary",
  "issues": [
    {
      "id": "unique-issue-id",
      "type": "error|warning|info",
      "category": "schema|naming|integrity|performance|normalization",
      "title": "Brief issue title",
      "description": "Detailed description",
      "location": {
        "table": "table_name",
        "column": "column_name"
      },
      "suggestions": [
        {
          "action": "action_description",
          "sql": "Optional SQL fix",
          "automated": true|false
        }
      ],
      "confidence": 0.0-1.0
    }
  ]
}`;
  }

  /**
   * Status summary prompt
   */
  static getStatusSummaryPrompt(context: PromptContext): string {
    const schemaStr = context.schema
      ? JSON.stringify(context.schema)
      : JSON.stringify({ nodes: context.nodes || [], edges: context.edges || [] });

    return `Generate a comprehensive status summary for this database schema:

Schema: ${schemaStr}
Validation Results: ${JSON.stringify(context.validationResults || [])}
Performance Metrics: ${JSON.stringify(context.performanceMetrics || [])}

Analyze and provide:
- Overall health status
- Health score (0-100)
- Category-specific insights
- Prioritized next steps

Return ONLY valid JSON in this exact format:
{
  "overall": "healthy|warning|critical",
  "score": 0-100,
  "insights": [
    {
      "category": "category_name",
      "status": "status_description",
      "recommendation": "actionable_recommendation"
    }
  ],
  "nextSteps": [
    "Prioritized action item 1",
    "Prioritized action item 2"
  ]
}`;
  }

  /**
   * System message for performance analysis
   */
  static getPerformanceSystemMessage(): string {
    return `You are a database performance analysis expert. 

CRITICAL INSTRUCTIONS:
- You MUST respond ONLY with valid JSON
- No explanations, no conversational text, no markdown formatting
- No "I'm an AI language model" disclaimers
- If you cannot provide JSON, return: {"error": "Unable to analyze", "summary": "", "recommendations": [], "metrics": {}}

Required JSON format:
{
  "summary": "Brief analysis summary",
  "recommendations": [
    {
      "type": "index|query|schema|partition",
      "priority": "high|medium|low",
      "description": "Clear description",
      "impact": "Expected improvement",
      "sql": "Optional SQL statement"
    }
  ],
  "metrics": {
    "estimatedImprovement": "e.g., 40-60% query speed improvement",
    "riskLevel": "low|medium|high"
  }
}

Respond with ONLY the JSON object. Nothing else.`;
  }

  /**
   * System message for validation
   */
  static getValidationSystemMessage(): string {
    return 'You are a database schema validation expert. Analyze schemas and provide structured JSON validation results with actionable recommendations.';
  }

  /**
   * System message for status summary
   */
  static getStatusSummarySystemMessage(): string {
    return 'You are a database health expert. Analyze validation and performance data to provide a comprehensive health summary with actionable insights.';
  }
}

