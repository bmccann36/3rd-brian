import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import memoryRoutes from "./routes/memories";
import path from "node:path";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";

export const buildApp = (): FastifyInstance => {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
    },
  }).withTypeProvider<TypeBoxTypeProvider>()

  app.register(cors, {
    origin: true,
    // credentials: true,
  });

  // Register Swagger
  app.register(swagger, {
    openapi: {
      info: {
        title: "Items API",
        description: "A simple CRUD API for managing items",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Development server",
        },
      ],
    },
  });

  let staticAssetPath = "static";
  if (!process.env.LAMBDA_TASK_ROOT) {
    staticAssetPath = "dist/static";
  }
  const baseDir = path.resolve(staticAssetPath);
  console.log(`configured baseDir: ${baseDir}`);

  app.register(fastifySwaggerUI, { baseDir });

  app.register(memoryRoutes);

  app.get("/health", {
    schema: {
      response: {
        200: Type.Object({
          status: Type.String(),
          timestamp: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    return {
      status: "healthy yo ho ho",
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/", {
    schema: {
      response: {
        200: Type.Object({
          message: Type.String(),
          version: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    return {
      message: "Welcome to the API",
      version: "1.0.0",
    };
  });

  return app;
};
