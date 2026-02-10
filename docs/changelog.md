# Changelog

Work log tracking what was done each session. Most recent first.

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
