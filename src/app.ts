import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';

import path from 'node:path';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import memoryRoutes from './routes/memory-routes';

const PUBLIC_PATHS = new Set(['/', '/health', '/docs', '/docs/']);

export const buildApp = (): FastifyInstance => {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  }).withTypeProvider<TypeBoxTypeProvider>();

  app.register(cors, {
    origin: true,
    // credentials: true,
  });

  app.addHook('onRequest', async (request, reply) => {
    if (
      PUBLIC_PATHS.has(request.url) ||
      request.url.startsWith('/docs/')
    ) {
      return;
    }

    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token || token !== process.env.BEARER_TOKEN) {
      reply.code(401).send({ error: 'Invalid or missing token' });
    }
  });

  // Register Swagger
  app.register(swagger, {
    openapi: {
      info: {
        title: 'Second Brian API',
        description:
          'A retrieval API for querying and filtering documents based on natural language queries and metadata',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          HTTPBearer: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
      security: [{ HTTPBearer: [] }],
    },
  });

  let staticAssetPath = 'static';
  if (!process.env.LAMBDA_TASK_ROOT) {
    staticAssetPath = 'node_modules/@fastify/swagger-ui/static';
  }
  const baseDir = path.resolve(staticAssetPath);

  app.register(fastifySwaggerUI, { baseDir });

  app.register(memoryRoutes);

  app.get(
    '/health',
    {
      schema: {
        response: {
          200: Type.Object({
            status: Type.String(),
            timestamp: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      return {
        status: 'healthy yo ho ho',
        timestamp: new Date().toISOString(),
      };
    },
  );

  app.get(
    '/',
    {
      schema: {
        response: {
          200: Type.Object({
            message: Type.String(),
            version: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      return {
        message: 'Welcome to the API',
        version: '1.0.0',
      };
    },
  );

  return app;
};
