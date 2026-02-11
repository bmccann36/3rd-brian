# npm Scripts

## `node:dev`

```bash
npm run node:dev
```

Starts the Fastify server locally for development using nodemon + ts-node. Watches `src/**/*.ts` for changes and auto-restarts on save. Runs the Lambda handler entry point (`src/handlers/lambda-handler.ts`) which detects it's not in a Lambda environment and starts a standalone HTTP server instead.

- Server: `http://localhost:3000`
- Swagger docs: `http://localhost:3000/docs`
- Requires `.env` file with database and API credentials
- Hot-reloads on TypeScript file changes (not `.env` changes — restart manually for those)
