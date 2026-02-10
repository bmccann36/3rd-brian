# Architectural Decisions

## Why Node.js/TypeScript instead of Python

The original chatgpt-retrieval-plugin is Python/FastAPI. Brian is much more comfortable in TypeScript, and maintaining Python code was a friction point that caused the project to stall multiple times.

## Why Fastify

- FastAPI equivalent in the Node world — async-first, schema validation, auto-generated OpenAPI docs
- TypeBox provides Pydantic-like schema validation with TypeScript type inference
- First-class Lambda support via `@fastify/aws-lambda`

## Why Lambda instead of always-on server

- Hobby project — can't justify paying for an always-on server
- Usage is sporadic (whenever chatting with the GPT)
- Cold starts are acceptable for this use case
- SAM makes deployment straightforward

## Why Postgres/pgvector (Neon.tech)

- The original plugin supports 19+ vector databases, but that's overkill for personal use
- pgvector is simple, SQL-based, and Neon offers a generous free tier
- Connection pooling in `connection.ts` handles Lambda's connection reuse pattern

## Why OpenAI text-embedding-3-large at 256 dimensions

- Same model the Python backend uses — ensures compatibility with existing stored embeddings
- 256 dims is a good balance of quality vs. storage/speed for personal use
- Matches the original plugin's default configuration

## Why esbuild for bundling

- Lambda deployment requires a single bundled file with dependencies
- esbuild is fast and handles the Node.js bundling well
- Copies static assets (Swagger UI) into the bundle via `esbuild-plugin-copy`

## Single vector DB vs. pluggable factory

- The original plugin has an abstract DataStore with 19+ implementations
- For personal use, hardcoding Postgres/pgvector is simpler and sufficient
- If we ever need to switch, the query logic is isolated in `src/db/memory.ts`
