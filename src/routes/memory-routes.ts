import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type, Static } from "@sinclair/typebox";
import { embeddingService } from "../services/embedding.service";
import { searchMemories } from "../db/memory";

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

      // Search memories using real database
      const allMemories: Memory[] = [];

      try {
        for (const queryWithEmbedding of queriesWithEmbeddings) {
          const embedding = (queryWithEmbedding as any).embedding;
          if (embedding) {
            console.log(`Searching for query: ${queryWithEmbedding.query}`);

            const results = await searchMemories({
              embedding,
              matchCount: queryWithEmbedding.top_k || 3,
              documentId: queryWithEmbedding.filter?.document_id,
              sourceId: queryWithEmbedding.filter?.source_id,
              source: queryWithEmbedding.filter?.source,
              author: queryWithEmbedding.filter?.author,
              startDate: queryWithEmbedding.filter?.start_date ? new Date(queryWithEmbedding.filter.start_date) : undefined,
              endDate: queryWithEmbedding.filter?.end_date ? new Date(queryWithEmbedding.filter.end_date) : undefined,
            });

            console.log(`Found ${results.length} results for query: ${queryWithEmbedding.query}`);

            // Transform database results to Memory format
            const memories: Memory[] = results.map(result => ({
              id: result.id,
              content: result.content,
              similarity: result.similarity,
              metadata: {
                source: result.source,
                source_id: result.source_id,
                document_id: result.document_id,
                url: result.url,
                author: result.author,
                created_at: result.created_at.toISOString(),
              },
            }));

            allMemories.push(...memories);
          }
        }

        console.log(`Database search completed. Total memories found: ${allMemories.length}`);

      } catch (error) {
        console.error("FATAL: Database search failed:", error);
        // Return empty response instead of crashing to maintain type safety
        console.error("Returning empty response due to database error");
      }

      const response: QueryResponse = {
        memories: allMemories,
        count: allMemories.length,
      };

      return response;
    },
  );
};

export default memoryRoutes;
