# Roadmap

Goal: Replace the Python `second-brain-python-backend` with this Node.js version so the ChatGPT "Second Brian" GPT can be switched over. Keep it simple — this is a personal memory store for life logistics and family/medical notes, not a general-purpose retrieval system.

## Phase 1: MVP — Get the GPT Working on This Backend

### 1.1 POST /upsert
- Accept array of documents: `{ id?, text, metadata? }`
- Generate embedding for each document's text
- Store in pgvector with metadata (source, author, created_at, etc.)
- Auto-generate document ID (UUID) if not provided
- If document ID already exists, replace it
- No chunking for now — inputs are short (chat snippets, personal notes)
- Return list of document IDs

### 1.2 Bearer Token Auth ✅
- Fastify `onRequest` hook checking `Authorization: Bearer <token>`
- Token stored in SSM Parameter Store (`/third-brian/BEARER_TOKEN`)
- Public paths exempt: `/`, `/health`, `/docs/*`

### 1.3 OpenAPI Schema for GPT ✅
- Auto-generated from TypeBox schemas, served live at `/docs/json`
- OpenAPI 3.1.0 (overridden via `transformObject` — library hardcodes 3.0.3)
- HTTPBearer security scheme, operationIds, dynamic server URL
- GPT successfully imports and uses the spec

### 1.4 Deploy & Switch Over (partial)
- ✅ Deployed `third-brian` stack with SSM-backed env vars
- ✅ ChatGPT GPT action URL + schema pointed here
- ✅ `/query` works end-to-end through the GPT
- ⬜ Need `/upsert` before full switchover (GPT can read but not save)
- ✅ ChatGPT empty string handling — filter fields accept `""` via union types, coerced to `undefined` in handler

## Phase 2: Polish

### 2.1 DELETE /delete
- Accept: `{ ids?, filter?, delete_all? }`
- Must provide at least one
- Delete by document IDs, metadata filter, or wipe all
- Return success boolean

### 2.2 Database Schema Documentation
- Document the `documents` table schema (columns, indexes, types)
- Include the SQL to create it from scratch

### 2.3 Cleanup Old Infrastructure
- Tear down old AWS stacks: `second-brain-python-backend`, `second-brian-node`
- Remove `src/server.ts` (redundant with lambda-handler.ts)

## Phase 3: Future Ideas

### Text Chunking
- Add chunking if/when longer content gets stored (e.g., medical documents)
- Only build this when there's an actual need

### File Upload (POST /upsert-file)
- PDF/DOCX text extraction → embed → store
- Useful for medical docs, insurance paperwork, etc.
- Would need chunking (Phase 3 dependency)

### MCP Server Interface
- Expose this as an MCP server so Claude Code / Claude Desktop can use it
- Would make this a cross-platform memory layer (ChatGPT + Claude)

### Claude Skill / Plugin
- Package as a Claude Code skill for direct integration
