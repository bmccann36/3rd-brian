# Custom GPT Setup — "Second Brian"

How to configure and maintain the ChatGPT Custom GPT that uses this API.

## GPT Action Configuration

The GPT uses a single "Action" pointing at this backend. Configuration lives in the ChatGPT GPT editor at [chatgpt.com/gpts/editor](https://chatgpt.com/gpts/editor).

### Importing the OpenAPI Schema

1. Go to the GPT editor → Configure → Actions
2. Click **Import from URL**
3. Enter: `https://vnx9a606k6.execute-api.us-east-1.amazonaws.com/Prod/docs/json`
4. The schema populates into the text box

This is a **one-time snapshot** — ChatGPT does not re-fetch the spec automatically. After adding or changing endpoints, you must re-import.

### Authentication

- **Auth type:** API Key
- **API Key:** The bearer token stored in SSM at `/third-brian/BEARER_TOKEN`
- **Auth Type:** Bearer
- **Header name:** Authorization (default)

The GPT sends `Authorization: Bearer <token>` on every request. Public paths (`/`, `/health`, `/docs/*`) are exempt.

### Privacy Policy URL

Required by ChatGPT for published GPTs. Currently set to the API root URL.

## Known ChatGPT Behaviors

### Empty Strings for Optional Fields

ChatGPT sends `""` for every optional field it doesn't use, e.g.:

```json
{
  "filter": {
    "document_id": "",
    "source": "chat",
    "source_id": "",
    "author": "",
    "start_date": "",
    "end_date": ""
  }
}
```

We handle this two ways:
- **Schema level:** Filter fields accept empty string literals via `Type.Union([..., Type.Literal('')])` so Fastify validation doesn't reject them
- **Handler level:** Empty strings are coerced to `undefined` with `|| undefined` before reaching the database query

### Operation Naming

ChatGPT derives action names from `operationId` in the OpenAPI spec. We set these explicitly on each route (e.g., `operationId: 'queryMemories'`).

## Updating the GPT After Code Changes

1. Build and deploy: `npm run build && sam deploy --profile personal --region us-east-1 --no-confirm-changeset`
2. Verify the spec: `curl https://vnx9a606k6.execute-api.us-east-1.amazonaws.com/Prod/docs/json | jq .`
3. Re-import the spec URL in the GPT editor (only needed if endpoints/schemas changed)
4. Test from ChatGPT to confirm

For code-only changes that don't alter the API surface, step 3 is unnecessary.

## API Endpoint

- **Production:** `https://vnx9a606k6.execute-api.us-east-1.amazonaws.com/Prod/`
- **Docs/Swagger UI:** `/docs/`
- **OpenAPI JSON:** `/docs/json`
