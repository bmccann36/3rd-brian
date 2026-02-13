# Changelog

Work log tracking what was done each session. Most recent first.

---

## 2026-02-12 (evening) — POST /upsert Implementation

**Context:** Phase 1 completion. The last blocker for full GPT switchover — the GPT could read memories but not save new ones.

**What happened:**
- Implemented `POST /upsert` endpoint in `src/routes/memory-routes.ts`
  - TypeBox schemas: `DocumentMetadataSchema`, `DocumentSchema`, `UpsertRequestSchema`, `UpsertResponseSchema`
  - Same `EmptyString` union pattern on all optional fields (ChatGPT sends `""` for omitted fields)
  - Handler: extracts documents, generates embeddings in batch, maps to DB params, returns IDs
  - OpenAPI metadata with description guiding the GPT to confirm before saving
- Added `upsertMemories()` to `src/db/memory.ts`
  - Batch insert with parameterized `VALUES` clauses
  - `ON CONFLICT (id) DO UPDATE SET ...` for idempotent upserts
  - Auto-generates UUID via `crypto.randomUUID()` when ID not provided
  - Uses `pgvector.toSql()` for embedding column (same as search)
- Updated CLAUDE.md, roadmap, and changelog

**Status:** Phase 1 complete. All endpoints needed for GPT parity are implemented. Ready to deploy and re-import OpenAPI spec in ChatGPT.

---

## 2026-02-12 — Empty String Fix & Custom GPT Docs

**Context:** Quick morning session. Goal was to fix the ChatGPT empty string validation issue from last session.

**What happened:**
- Fixed ChatGPT empty string validation issue in filter fields
  - All filter fields now accept `""` via `Type.Union([..., Type.Literal('')])` at the schema level
  - Empty strings coerced to `undefined` with `|| undefined` in the handler before reaching the DB
  - Kept `format: 'date-time'` validation on date fields (the union approach allows both valid dates and empty strings)
- Added descriptions to all filter schema fields (flow into OpenAPI spec, help ChatGPT understand the fields)
- Created `docs/custom-gpt.md` — documents GPT Action setup, auth config, spec import workflow, and known ChatGPT behaviors
- Updated CLAUDE.md: marked auth/OpenAPI/GPT connection as done, added custom-gpt.md reference
- Updated roadmap: marked empty string handling as complete
- Deployed to production and verified — ChatGPT queries returning 200s

**Status:** Empty string blocker resolved. Only `/upsert` remains for Phase 1 completion.

---

## 2026-02-11 — Auth, OpenAPI Spec, SSM Config & GPT Connection

**Context:** ~1 hour session before work. Goal was to get closer to replacing the Python backend.

**What happened:**
- Added bearer token authentication (Fastify `onRequest` hook)
  - Public paths exempt: `/`, `/health`, `/docs/*`
  - Token stored in `BEARER_TOKEN` env var
- Moved all Lambda env vars to SSM Parameter Store (`/third-brian/*`)
  - Nuked and recreated the SAM stack + managed S3 bucket (old one was deleted in S3 cleanup)
- Fixed Swagger UI: set `routePrefix: '/docs'`, served at `/docs/` with JSON spec at `/docs/json`
- OpenAPI spec fixes for ChatGPT GPT Actions compatibility:
  - Overrode version to 3.1.0 (library hardcodes 3.0.3) via `transformObject`
  - Added `operationId` to `/query` route
  - Dynamic server URL via `API_BASE_URL` env var
  - Added `HTTPBearer` security scheme
- Updated Swagger metadata: "Items API" → "Second Brian API"
- Updated `@fastify/swagger` and `@fastify/swagger-ui` to latest
- Added `.aws-sam/` to `.gitignore`
- Created `docs/scripts.md` for npm script documentation
- Successfully connected the "Second Brian" ChatGPT GPT to this backend!

**Known issue:** ChatGPT sends empty strings for optional filter fields (e.g., `"start_date": ""`), which fails Fastify's `date-time` format validation. Needs a `preValidation` strip or schema update — deferred to next session.

**Status:** Auth + OpenAPI + deploy done (Phase 1.2, 1.3, 1.4 partially complete). Still need `/upsert` (1.1) and the empty-string fix before the GPT can fully replace the Python backend.

---

## 2026-02-10 — Project Inventory & Documentation

**Context:** Picked the project back up after ~5 months away. Needed to figure out where things stood.

**What happened:**
- Reviewed full project history across all three iterations (python backend → second-brian-node → third-brian)
- Confirmed the Python backend is still the one wired up to the "Second Brian" ChatGPT GPT
- Mapped out what `third-brian` has vs. what's missing for parity
- Created project documentation:
  - `CLAUDE.md` — auto-loaded project context
  - `docs/decisions.md` — architectural decision log
  - `docs/roadmap.md` — phased feature roadmap
  - `docs/changelog.md` — this file

**Status:** No code changes. Documentation only. Ready to start Phase 1 (chunking, upsert, delete, auth).

---

## 2025-09-25 — Connection Management Refactor

**What happened:**
- Refactored memory search to use centralized connection management
- Removed unnecessary logging during database client connection
- Ran prettier across codebase

**Commits:** `2063da0`, `9ad98e1`, `6ab2f8e`

---

## 2025-09-11 — Embedding Service & Database Pooling

**What happened:**
- Implemented database connection pooling and reuse for Lambda handler
- Added database connection management module (`src/db/connection.ts`)
- Added memory search functionality (`src/db/memory.ts`)
- Integrated OpenAI API for query embeddings (`src/services/embedding.service.ts`)
- Updated configuration and improved embedding service logging
- Renamed `memories.ts` to `memory-routes.ts`

**Commits:** `d994454`, `d27668a`, `b3afe72`, `cf44cf5`, `651600d`

---

## 2025-09-05 — Initial Project Setup

**What happened:**
- Scaffolded Fastify app with TypeScript, Swagger UI, and TypeBox schemas
- Added memory routes with `POST /query` endpoint
- Set up SAM template for Lambda deployment
- Initial deploy to AWS as `third-brian` stack

**Commits:** `479da80`, `bcaff94`, `e782ba2`
