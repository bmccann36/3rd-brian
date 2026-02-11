# 3rd-brian — Personal Semantic Memory API

## What This Is

A Node.js/TypeScript rewrite of the [chatgpt-retrieval-plugin](https://github.com/openai/chatgpt-retrieval-plugin), tailored for personal use as a "second brain." It powers a ChatGPT Custom GPT called "Second Brian" that can save and retrieve memories from conversations.

**Why this exists:** The original plugin is Python (painful for Brian) and requires an always-on server (expensive for a hobby project). This version uses Fastify on AWS Lambda via SAM.

## Project History

This is the **third iteration** of the same idea:

1. `second-brain-python-backend` (Apr 2025) — Python, deployed, currently wired up to the ChatGPT GPT
2. `second-brian-node` (Apr 2025) — First Node.js attempt
3. `third-brian` (Aug 2025) — Current. Clean rewrite in TypeScript/Fastify

The Python version is still the one connected to the "Second Brian" GPT action at `https://5syy7xbxtj.execute-api.us-east-1.amazonaws.com/Prod`. This project aims to replace it.

## Tech Stack

- **Runtime:** Node.js 22 / TypeScript
- **Framework:** Fastify 5 + TypeBox (schema validation) + Swagger UI
- **Database:** Postgres with pgvector (Neon.tech hosted)
- **Embeddings:** OpenAI `text-embedding-3-large` (256 dimensions)
- **Deployment:** AWS SAM → Lambda (arm64) + API Gateway
- **Bundler:** esbuild
- **Stack name:** `third-brian`

## Current Status

### Done
- [x] Fastify app scaffolding with TypeBox + Swagger
- [x] OpenAI embedding service (singleton, batch support)
- [x] Postgres/pgvector connection pooling (Lambda-friendly)
- [x] `POST /query` — semantic search with metadata filtering
- [x] `GET /health` and `GET /` — basic health/info endpoints
- [x] Lambda handler with connection reuse
- [x] SAM template + esbuild bundling
- [x] Deployed to AWS as `third-brian` stack

### Not Done — Phase 1 (MVP to replace Python backend)
- [ ] `POST /upsert` — embed and store documents (no chunking needed for now)
- [ ] Bearer token authentication (Fastify hook)
- [ ] OpenAPI schema compatible with ChatGPT GPT actions
- [ ] Deploy and switch the "Second Brian" GPT to this backend

### Not Done — Phase 2+ (see docs/roadmap.md)
- [ ] `DELETE /delete`
- [ ] Database schema documentation
- [ ] Tear down old stacks
- [ ] Text chunking (when needed for longer content like medical docs)
- [ ] File upload endpoint
- [ ] MCP server interface (cross-platform memory: ChatGPT + Claude)

See [docs/roadmap.md](docs/roadmap.md) for detailed breakdown.

## Project Structure

```
src/
├── app.ts                      # Fastify app builder (Swagger, CORS, routes)
├── server.ts                   # Standalone server entry (unused, see lambda-handler)
├── handlers/
│   └── lambda-handler.ts       # Lambda entry + local dev server
├── routes/
│   └── memory-routes.ts        # POST /query
├── db/
│   ├── connection.ts           # Pg pool with pgvector registration
│   └── memory.ts               # searchMemories() vector similarity query
└── services/
    └── embedding.service.ts    # OpenAI embedding generation
```

## Running Locally

```bash
npm install
# Copy .env.example to .env and fill in values
npx ts-node src/handlers/lambda-handler.ts
# Server at http://localhost:3000, docs at http://localhost:3000/docs
```

## AWS Deployment

```bash
npm run build                          # tsc + esbuild bundle
sam deploy --profile personal --region us-east-1 --no-confirm-changeset   # full deploy (template + code)
echo "Y" | sam sync --stack-name third-brian --profile personal --region us-east-1 --code --no-watch  # code-only (fast, no CloudFormation)
```

- Use `sam deploy` when the template changes (new env vars, IAM, etc.)
- Use `sam sync --code` for code-only changes (pushes directly to Lambda, seconds vs minutes)
- AWS profile `personal` is required. Always use `--profile personal` flag directly (not `awsume`, which only sets env vars in the user's shell and won't carry into Claude's shell)
- Environment variables are stored in SSM Parameter Store under `/third-brian/*`

## Reference

- Original plugin repo: `/Users/brianmccann/git-repos/chatgpt-retrieval-plugin`
- See [docs/decisions.md](docs/decisions.md) for architectural decisions
- See [docs/roadmap.md](docs/roadmap.md) for detailed feature roadmap
- See [docs/changelog.md](docs/changelog.md) for session-by-session work log
- See [docs/scripts.md](docs/scripts.md) for npm script documentation
