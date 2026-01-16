---
noteId: "3622d1c0f32011f0ab99f18fe620d1a4"
tags: []

---

# AI Integration Plan: Database Monitoring, Suggestions, Chat, and Table Creation

## Goals
- Deliver production-grade AI features powered by the existing AI/Qwen setup.
- Cover four pillars end-to-end:
  - Database monitoring and anomaly insights.
  - AI-driven schema and query suggestions.
  - Context-aware chat assistant.
  - Natural-language table and diagram creation.
- Keep the system modular, privacy-aware, and platform-friendly (Windows support + remote model option).

## Existing Assets (What we will leverage)
- AI/config.json: Qwen3-4B configuration and quantization hints.
- AI/README.md: Example code for Qwen chatbot and Qwen-Agent (tool-calling) usage.
- src/lib/validation-engine.ts: Deterministic heuristics for normalization and suggestions.
- src/components/editor/suggestions-panel.tsx: UI for presenting suggestions and applying actions.

## High-Level Architecture
- Client (Next.js/React):
  - Editor + Suggestions Panel + new AI Copilot Chat + Monitoring Dashboard.
- API Layer (Next.js Route Handlers):
  - /api/ai/chat: Chat with tools.
  - /api/ai/suggest: Generate schema/query suggestions.
  - /api/ai/ddl: NL → DDL → diagram patch proposal.
  - /api/monitor/*: Monitoring data collection, summarization, and alerts.
- AI Orchestrator:
  - Prefer OpenAI-compatible HTTP for cross-platform reliability.
  - Use Qwen-Agent where available to simplify tool calling.
  - Enable provider abstraction to switch between local/remote models.
- Data Sources:
  - DB connectors (Postgres/MySQL initially) for schema, stats, and EXPLAIN plans.
  - Optional metric sources (pg_stat_statements, slow-query logs, system metrics).

## Model Hosting Options
- Option A: Remote OpenAI-compatible API (recommended for Windows).
  - Configure Qwen/OpenAI-compatible endpoints via env.
- Option B: Local Python service hosting Qwen-Agent.
  - Uses transformers/vLLM; MLX path is Mac-focused, so keep as optional.
- Option C: Self-hosted llama.cpp/Ollama (OpenAI-compatible) with Qwen or similar.

## Core Capabilities

### 1) Database Monitoring Services
- Objectives
  - Collect and normalize telemetry to identify hotspots and anti-patterns.
  - Convert raw metrics and EXPLAIN plans into actionable insights and alerts.

- Data Collection
  - Adapters: Postgres, MySQL.
  - Sources: pg_stat_statements, slow query logs, EXPLAIN (ANALYZE, BUFFERS where safe), connection/lock stats, index usage, bloat estimates, table/row growth.
  - Schedule: Background cron (serverless-friendly) or on-demand pull.

- Processing & Storage
  - Normalize to a lightweight time-series (query hash, mean/95p latency, rows, buffers, calls).
  - Persist in lightweight storage (SQLite/file/db) depending on deployment; configurable.

- Insights & Alerts
  - Rules: threshold breaches (latency/lock waits), plan regressions, missing index detection, unused indexes, table bloat, skewed distribution.
  - LLM Summaries: generate concise weekly/daily report and instant root-cause narratives with remediation steps.

- AI Tools (Agent-accessible)
  - monitor.collect(db_id, window)
  - monitor.top_queries(db_id, window, limit)
  - monitor.explain(db_id, sql)
  - monitor.summarize(db_id, window)

- UI
  - Monitoring Dashboard (Top N queries, alerts, timelines, explain visualizer).
  - “Ask AI” on any panel to get human-readable summaries and prioritized actions.

- Implementation Steps
  1. Create /api/monitor endpoints and DB adapters.
  2. Implement storage and rules engine.
  3. Add AI summaries (call /api/ai/chat with monitoring context).
  4. Build dashboard screens and alert banners.

### 2) AI Suggestions (Schema and Queries)
- Objectives
  - Augment deterministic validators with AI reasoning for richer, context-aware suggestions.

- Sources of Truth
  - Current diagram JSON (nodes/edges), naming conventions, domain description (optional), query corpus (if available), usage stats.

- Suggestion Types
  - Normalization and decomposition (extends existing validation-engine.ts).
  - Foreign key proposals and index recommendations (leverage/use suggestForeignKeys and suggestIndexes, plus AI refinement/explanations).
  - Naming and consistency (conventions, reserved words, length/format guidance).
  - Query optimization suggestions from EXPLAIN plans and stats.
  - Breaking-change impact analysis for proposed edits.

- AI Tooling
  - schema.load(diagram_json)
  - schema.suggest_changes(policies)
  - query.optimize(sql, stats)
  - migration.impact(diff)

- UX
  - Unified Suggestions Panel sections: Heuristic vs AI-enhanced.
  - Each suggestion includes: description, reason, impact, affected tables/columns, one-click apply or create patch.

- Implementation Steps
  1. Define suggestion DTO shared across heuristics and AI.
  2. Add /api/ai/suggest to produce AI-augmented suggestions.
  3. Surface in Suggestions Panel with filtering and diff preview.

### 3) Chat Assistant (Context-Aware)
- Objectives
  - Natural language interface to your schema, monitoring data, and design actions.

- Context Packing
  - System prompt: project role, tone, guardrails.
  - Inject: schema snapshot, active selection (tables/columns), recent suggestions, top monitoring facts.
  - Retrieval: small vector store for recent queries/suggestions (optional, local-only).

- Tool Set (for Qwen-Agent)
  - diagram.get_state(), diagram.apply_patch(patch)
  - ddl.generate(entities), ddl.diff(from, to)
  - sql.generate(intent), sql.explain(sql), sql.test(sql)
  - monitor.fetch/ summarize (from above)

- Safety
  - Read-only by default. DDL apply requires user confirmation via preview/diff.
  - Parameterize any generated SQL; never run DDL against production targets.

- Implementation Steps
  1. New UI: /components/ai/chat-panel with streaming.
  2. /api/ai/chat endpoint supporting: messages[], tools, model routing.
  3. Tool execution layer in the API with strong input validation.

### 4) Natural-Language Table and Diagram Creation
- Objectives
  - Convert user intent into DDL and diagram patches that the user can preview and apply.

- Flow
  1. User: “Add a Customers table with name, email (unique), and signup_date; link to Orders.”
  2. AI: Generates DDL and diagram patch (new nodes/edges + column metadata + indexes/constraints).
  3. UI: Show diff (before/after ERD, DDL preview). User confirms → apply.

- Implementation Details
  - Tools: ddl.generate, diagram.apply_patch.
  - Validation: Run validation-engine.ts after patch to flag conflicts.
  - Migration: optional migration file generation for downstream DBs.

## API Design (Draft)
- POST /api/ai/chat
  - body: { messages: ChatMessage[], context?: { diagram, selection, monitor }, tools?: string[] }
  - resp: { message, tool_calls?, reasoning? }
- POST /api/ai/suggest
  - body: { diagram, policies?: { naming, normalization, vendor } }
  - resp: { suggestions: Suggestion[] }
- POST /api/ai/ddl
  - body: { intent: string, diagram }
  - resp: { ddl: string, patch: DiagramPatch, warnings?: string[] }
- GET /api/monitor/top-queries?db_id&window=1h
- POST /api/monitor/explain
  - body: { db_id, sql }

## Server/Agent Integration
- Provider Abstraction
  - env MODEL_PROVIDER=openai|qwen_agent|custom
  - env MODEL_API_BASE, MODEL_API_KEY, MODEL_NAME
- Qwen-Agent Path
  - Use AI/README guidance. Expose a small HTTP wrapper if running out-of-process.
- OpenAI-compatible Path
  - Reuse the same prompt & tool schema via function calling.

## Data Contracts
- Suggestion
  - { id, type, description, reason, impact: low|med|high, tables: string[], columns?: string[], patch?: DiagramPatch }
- DiagramPatch
  - { add: Node[], remove: NodeId[], update: Partial<Node>[]; edgesAdd/Remove/Update }

## Security & Privacy
- Do not send raw PII to models; redact values and hash identifiers where feasible.
- Read-only DB connections by default for monitoring/analyze.
- Confirmation gates for any schema mutation.
- Rate limits and audit logs for tool calls.

## Observability
- Structured logs for prompts, tool calls (sans sensitive data), and latencies.
- Metrics: token usage, success/error rates, suggestion acceptance rate.

## Performance & Cost Controls
- Prompt compression: only include relevant schema sections.
- Caching: deterministic suggestions cached by schema hash.
- Streaming: partial render for chat.

## Rollout Plan (Milestones & Acceptance Criteria)
1. Foundations (Provider + API skeleton)
  - Env-configurable model provider; /api/ai/chat echoes.
  - Basic chat UI integrated, streams text.
2. Schema Suggestions v1 (Heuristics + Unification)
  - Standardized Suggestion DTO across validation-engine and UI.
  - /api/ai/suggest returns merged heuristic+AI suggestions (AI optional behind flag).
3. Table Creation (NL → DDL → Patch)
  - /api/ai/ddl produces legal DDL + patch; diff preview + apply.
  - Validation step runs post-apply; no regressions.
4. Monitoring v1
  - /api/monitor/top-queries and /api/monitor/explain implemented for one DB type.
  - Dashboard cards + “Ask AI to summarize” button.
5. Agentic Tool Calling
  - Tools: diagram.get_state/apply_patch, ddl.generate, monitor.summarize.
  - Safety gates and audit logs in place.

## Testing Strategy
- Unit tests: tool handlers, patch application, validators.
- Contract tests: API schemas via zod/ts tests.
- Golden tests: prompt templates with snapshot testing.
- Integration: spinning a local Postgres with sample data to validate monitoring + EXPLAIN.

## Risks & Mitigations
- Model availability on Windows: default to OpenAI-compatible remote.
- Tool misuse: strict schemas, dry-run modes, confirmation dialogs.
- Cost/latency: caching, compression, and small models for draft suggestions.

## Future Enhancements
- Vector-based retrieval of project docs/user stories to guide schema design.
- Autonomous refactoring plans with multi-step approval.
- Multi-DB vendor targeting (SQL Server, Oracle) and migration generators.
- Performance budgets and SLOs enforced via policy suggestions.
