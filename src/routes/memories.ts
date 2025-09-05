import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type, Static } from "@sinclair/typebox";
import { embeddingService } from "../services/embedding.service";

// Define TypeBox schemas
const FilterSchema = Type.Object({
  document_id: Type.Optional(Type.String()),
  source: Type.Optional(
    Type.Union([
      Type.Literal("email"),
      Type.Literal("file"),
      Type.Literal("chat"),
    ]),
  ),
  source_id: Type.Optional(Type.String()),
  author: Type.Optional(Type.String()),
  start_date: Type.Optional(Type.String({ format: "date-time" })),
  end_date: Type.Optional(Type.String({ format: "date-time" })),
});

const QuerySchema = Type.Object({
  query: Type.String(),
  filter: Type.Optional(FilterSchema),
  top_k: Type.Optional(Type.Integer({ minimum: 1, default: 3 })),
});

const QueryRequestSchema = Type.Object({
  queries: Type.Array(QuerySchema, { minItems: 1 }),
});

const MemorySchema = Type.Object({
  id: Type.String(),
  content: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
  similarity: Type.Optional(Type.Number()),
});

const QueryResponseSchema = Type.Object({
  memories: Type.Array(MemorySchema),
  count: Type.Number(),
});

// Type inference
type Filter = Static<typeof FilterSchema>;
type Query = Static<typeof QuerySchema>;
type QueryRequest = Static<typeof QueryRequestSchema>;
type Memory = Static<typeof MemorySchema>;
type QueryResponse = Static<typeof QueryResponseSchema>;

const memoryRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Log embedding service status
  if (!embeddingService.isEnabled()) {
    fastify.log.warn("Embedding service is not enabled. Set OPENAI_API_KEY to enable embeddings.");
  } else {
    fastify.log.info("Embedding service initialized successfully.");
  }

  fastify.post(
    "/query",
    {
      schema: {
        body: QueryRequestSchema,
        response: {
          200: QueryResponseSchema,
        },
        tags: ["memories"],
        summary: "Query memories",
        description:
          "Search for relevant memories based on query strings with optional filtering",
      },
    },
    async (request, reply) => {
      const { queries } = request.body;

      // Generate embeddings for queries using the service
      const queriesWithEmbeddings = await embeddingService.generateQueryEmbeddings(queries);

      // Log embedding results
      console.log("Queries with embeddings:", queriesWithEmbeddings.map(q => ({
        query: q.query,
        hasEmbedding: !!(q as any).embedding,
        embeddingDimensions: (q as any).embedding?.length,
      })));

      // TODO: Next step - use queriesWithEmbeddings to search vector store
      // Each query now has an embedding array that can be used for similarity search

      // Mock memory data
      const allMockMemories: Memory[] = [
        {
          id: "mem-1",
          content: "This is a sample memory about the user's preferences",
          metadata: {
            timestamp: new Date().toISOString(),
            category: "preferences",
            source: "chat",
            author: "user123",
            document_id: "doc-001",
          },
          similarity: 0.95,
        },
        {
          id: "mem-2",
          content: "User mentioned they enjoy coding in TypeScript",
          metadata: {
            timestamp: new Date().toISOString(),
            category: "technical",
            source: "email",
            author: "developer@example.com",
            document_id: "doc-002",
          },
          similarity: 0.89,
        },
        {
          id: "mem-3",
          content: "Important project file uploaded yesterday",
          metadata: {
            timestamp: new Date().toISOString(),
            category: "files",
            source: "file",
            author: "admin",
            document_id: "doc-003",
          },
          similarity: 0.75,
        },
      ];

      const response: QueryResponse = {
        memories: allMockMemories,
        count: allMockMemories.length,
      };

      return response;
    },
  );
};

export default memoryRoutes;
