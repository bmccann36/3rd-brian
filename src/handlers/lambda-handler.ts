import awsLambdaFastify from "@fastify/aws-lambda";
import { buildApp } from "../app";

const app = buildApp();

// Detect if we're running in Lambda or SAM Local
const isLambda = !!(
  process.env.LAMBDA_TASK_ROOT || process.env.AWS_LAMBDA_FUNCTION_NAME
);
const isSAMLocal = process.env.AWS_SAM_LOCAL === "true";

// Export handler for Lambda
export const handler = awsLambdaFastify(app);

// Start local server if not in Lambda environment
if (!isLambda && !isSAMLocal) {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const host = process.env.HOST || "0.0.0.0";

  app.listen({ port, host }, (err, address) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    console.log(`🚀 Server running at ${address}`);
    console.log(`📚 Documentation available at ${address}/docs`);
  });
}
