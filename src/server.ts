import * as dotenv from "dotenv";
dotenv.config({ quiet: true });
import { buildApp } from "./app";

const isLambda = !!(
  process.env.LAMBDA_TASK_ROOT || process.env.AWS_LAMBDA_FUNCTION_NAME
);
const isSAMLocal = process.env.AWS_SAM_LOCAL === "true";

async function start() {
  // Only start the server if we're not in Lambda or SAM Local environment
  if (!isLambda && !isSAMLocal) {
    const app = buildApp();
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    const host = process.env.HOST || "127.0.0.1";

    try {
      await app.listen({ port, host });
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  }
}

// Only start if this file is run directly (not imported)
if (require.main === module) {
  start();
}

export { start };
