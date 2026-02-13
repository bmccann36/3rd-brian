# Roadmap

## v0: Replace Python Backend — COMPLETE

Replaced the Python `second-brain-python-backend` with this Node.js/TypeScript version. The "Second Brian" ChatGPT GPT now points at this backend for both reading and writing memories.

**What shipped:**
- `POST /query` — semantic search with metadata filtering
- `POST /upsert` — batch embed + store with ON CONFLICT upsert
- Bearer token auth (SSM-backed)
- OpenAPI 3.1.0 spec compatible with ChatGPT GPT actions
- ChatGPT empty string handling
- Deployed to AWS Lambda via SAM

---

## v1: Next Up

### Category field
- Add `category` column to `documents` table (text, defaults to `OTHER`)
- Values: `HOME`, `DRIVE`, `SYSTEM`, `EXPERIMENT`, `LIFE`, `OTHER`
- Wire through upsert (write) and query (filter)
- Enables mode-based filtering and future aggregation
- See `plan-category-field.md` for full implementation plan

### Text chunking
- Split long documents into ~200-token chunks at sentence boundaries
- Chunk IDs: `{document_id}_0`, `{document_id}_1`, etc.
- Short texts (chat snippets) pass through unchanged
- Enables storing longer content like receipts, medical docs, insurance paperwork
- Python plugin has reference implementation in `services/chunks.py`

---

## Future Ideas (no timeline)

- **DELETE /delete** — Delete by IDs, filter, or wipe all
- **Tags** — Freeform `text[]` column, backfilled via offline LLM extraction job
- **File upload** (`POST /upsert-file`) — PDF/DOCX extraction → embed → store
- **Google Drive indexing** — Mirror metadata for receipts and docs
- **MCP server interface** — Cross-platform memory layer (ChatGPT + Claude)
- **Cleanup** — Tear down old stacks, remove `src/server.ts`
