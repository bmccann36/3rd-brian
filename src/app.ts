import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import itemRoutes from './routes/items';

export const buildApp = (): FastifyInstance => {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  app.register(cors, {
    origin: true,
    // credentials: true,
  });

  app.register(itemRoutes);

  app.get('/health', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  });

  app.get('/', async (request, reply) => {
    return {
      message: 'Welcome to the API',
      version: '1.0.0',
    };
  });

  return app;
};
