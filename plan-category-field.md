# Plan: Add `category` field to memory system

## Context

The "Second Brian" GPT memo (2026-02-13) identified that pure semantic search is great for recall but weak for aggregation and mode switching. A small required classification per memory enables filtering by cognitive mode (home recall, experiments, drive indexing, etc.) without disrupting the existing lightweight architecture.

Decision: Add an optional `category` column (defaults to `OTHER`) to the `documents` table and wire it through the API for both upsert and query filtering. No tags for now — can backfill later with an offline LLM extraction job.

## Category values

```
HOME        — Physical items, storage locations
DRIVE       — Google Drive files, receipts, docs
SYSTEM      — Meta about this system itself
EXPERIMENT  — Fun builds, architecture ideas
LIFE        — General life items
OTHER       — Catch-all (default)
```

## Changes

### 1. Database: Add `category` column

```sql
ALTER TABLE documents ADD COLUMN category text DEFAULT 'OTHER';
```

Run via MCP postgres tool. No Postgres ENUM — plain text matches the existing `source` pattern and avoids migrations when adding values.

### 2. `src/db/memory.ts` — Wire category through DB functions

- Add `category?: string` to `MemoryUpsertParams`
- Add `category?: string` to `MemorySearchParams`
- **upsertMemories**: Add `category` to INSERT columns, VALUES, and ON CONFLICT UPDATE. Default to `'OTHER'` when not provided.
- **searchMemories**: Add `category` to SELECT columns. Add LIKE filter clause matching the existing pattern: `AND (documents.category LIKE $N OR documents.category IS NULL)`
- Add `category: string` to `MemorySearchResult`

### 3. `src/routes/memory-routes.ts` — Schema + handler changes

**New shared type** (same pattern as `SourceType`):
```ts
const CategoryType = Type.Union([
  Type.Literal('HOME'),
  Type.Literal('DRIVE'),
  Type.Literal('SYSTEM'),
  Type.Literal('EXPERIMENT'),
  Type.Literal('LIFE'),
  Type.Literal('OTHER'),
  EmptyString,
]);
```

**FilterSchema**: Add `category: Type.Optional(CategoryType)`

**DocumentMetadataSchema**: Add `category: Type.Optional(CategoryType)`

**Query handler**: Pass `category: filter?.category || undefined` to `searchMemories()`

**Upsert handler**: Pass `category: meta?.category || undefined` to upsert params

**Response mapping**: Include `category` in the metadata object returned from queries

### 4. Update docs

- `docs/roadmap.md` — Add category field to Phase 2 as completed, note tags as future
- `docs/changelog.md` — Session log

## Files to modify

| File | Change |
|------|--------|
| Database (via MCP) | `ALTER TABLE documents ADD COLUMN category text DEFAULT 'OTHER'` |
| `src/db/memory.ts` | Add category to interfaces, INSERT/SELECT/WHERE/ON CONFLICT |
| `src/routes/memory-routes.ts` | Add `CategoryType`, wire into Filter + DocumentMetadata + handlers |
| `docs/roadmap.md` | Update |
| `docs/changelog.md` | Session log |

## Verification

1. `npx tsc --noEmit` — compiles clean
2. `npm run build` — esbuild succeeds
3. Query existing memories via MCP — confirm `category` column exists with `OTHER` default
4. Start locally, test upsert with `category: "HOME"` and query with category filter
5. Deploy and re-import OpenAPI spec in ChatGPT GPT settings
