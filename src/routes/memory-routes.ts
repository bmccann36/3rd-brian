import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type, Static } from '@sinclair/typebox';
import { embeddingService } from '../services/embedding.service';
import { searchMemories, upsertMemories } from '../db/memory';

// Define TypeBox schemas
const EmptyString = Type.Literal('');
const SourceType = Type.Union([
  Type.Literal('email'),
  Type.Literal('file'),
  Type.Literal('chat'),
  EmptyString,
]);

const FilterSchema = Type.Object({
  document_id: Type.Optional(
    Type.Union([
      Type.String({ description: 'Filter by document ID' }),
      EmptyString,
    ]),
  ),
  source: Type.Optional(SourceType),
  source_id: Type.Optional(
    Type.Union([
      Type.String({ description: 'Filter by source ID' }),
      EmptyString,
    ]),
  ),
  author: Type.Optional(
    Type.Union([
      Type.String({ description: 'Filter by author name' }),
      EmptyString,
    ]),
  ),
  start_date: Type.Optional(
    Type.Union([
      Type.String({
        format: 'date-time',
        description:
          'ISO 8601 datetime. Only return memories created after this date.',
      }),
      EmptyString,
    ]),
  ),
  end_date: Type.Optional(
    Type.Union([
      Type.String({
        format: 'date-time',
        description:
          'ISO 8601 datetime. Only return memories created before this date.',
      }),
      EmptyString,
    ]),
  ),
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

const DocumentMetadataSchema = Type.Object({
  source: Type.Optional(SourceType),
  source_id: Type.Optional(
    Type.Union([Type.String({ description: 'Source ID' }), EmptyString]),
  ),
  url: Type.Optional(
    Type.Union([
      Type.String({ description: 'URL associated with the document' }),
      EmptyString,
    ]),
  ),
  created_at: Type.Optional(
    Type.Union([
      Type.String({
        format: 'date-time',
        description: 'ISO 8601 datetime when the document was created',
      }),
      EmptyString,
    ]),
  ),
  author: Type.Optional(
    Type.Union([Type.String({ description: 'Author name' }), EmptyString]),
  ),
});

const DocumentSchema = Type.Object({
  id: Type.Optional(
    Type.Union([
      Type.String({ description: 'Unique document ID. Auto-generated if not provided.' }),
      EmptyString,
    ]),
  ),
  text: Type.String({ description: 'The text content of the document' }),
  metadata: Type.Optional(DocumentMetadataSchema),
});

const UpsertRequestSchema = Type.Object({
  documents: Type.Array(DocumentSchema, { minItems: 1 }),
});

const UpsertResponseSchema = Type.Object({
  ids: Type.Array(Type.String()),
});

// Type inference
type Filter = Static<typeof FilterSchema>;
type Query = Static<typeof QuerySchema>;
type QueryRequest = Static<typeof QueryRequestSchema>;
type Memory = Static<typeof MemorySchema>;
type QueryResponse = Static<typeof QueryResponseSchema>;
type UpsertRequest = Static<typeof UpsertRequestSchema>;
type UpsertResponse = Static<typeof UpsertResponseSchema>;

const memoryRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Log embedding service status
  if (!embeddingService.isEnabled()) {
    fastify.log.warn(
      'Embedding service is not enabled. Set OPENAI_API_KEY to enable embeddings.',
    );
  }

  fastify.post(
    '/query',
    {
      schema: {
        operationId: 'queryMemories',
        body: QueryRequestSchema,
        response: {
          200: QueryResponseSchema,
        },
        tags: ['memories'],
        summary: 'Query memories',
        description:
          "Accepts search query objects array each with query and optional filter. Break down complex questions into sub-questions. Refine results by criteria, e.g. time / source, don't do this often. Split queries if ResponseTooLargeError occurs.",
      },
    },
    async (request, reply) => {
      const { queries } = request.body;

      // Generate embeddings for queries using the service
      const queriesWithEmbeddings =
        await embeddingService.generateQueryEmbeddings(queries);

      // Search memories using real database
      const allMemories: Memory[] = [];

      try {
        const pendingQueries = queriesWithEmbeddings.map(
          async (queryWithEmbedding) => {
            const embedding = (queryWithEmbedding as any).embedding;
            if (!embedding) {
              return [];
            }

            const filter = queryWithEmbedding.filter;
            return searchMemories({
              embedding,
              matchCount: queryWithEmbedding.top_k || 3,
              documentId: filter?.document_id || undefined,
              sourceId: filter?.source_id || undefined,
              source: filter?.source || undefined,
              author: filter?.author || undefined,
              startDate: filter?.start_date
                ? new Date(filter.start_date)
                : undefined,
              endDate: filter?.end_date ? new Date(filter.end_date) : undefined,
            });
          },
        );

        const memoryGroups = await Promise.all(pendingQueries);

        for (const results of memoryGroups) {
          const memories: Memory[] = results.map((result) => ({
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
      } catch (error) {
        console.error('FATAL: Database search failed:', error);
        // Return empty response instead of crashing to maintain type safety
        console.error('Returning empty response due to database error');
      }

      const response: QueryResponse = {
        memories: allMemories,
        count: allMemories.length,
      };

      return response;
    },
  );

  fastify.post(
    '/upsert',
    {
      schema: {
        operationId: 'upsertMemories',
        body: UpsertRequestSchema,
        response: {
          200: UpsertResponseSchema,
        },
        tags: ['memories'],
        summary: 'Upsert memories',
        description:
          "Save chat information. Accepts an array of documents with text (potential questions + conversation text), metadata (source 'chat' and timestamp, no ID as this will be generated). Confirm with the user before saving, ask for more details/context.",
      },
    },
    async (request) => {
      const { documents } = request.body;

      const embeddings = await embeddingService.generateEmbeddings(
        documents.map((d) => d.text),
      );

      const upsertParams = documents.map((doc, index) => {
        const embedding = embeddings[index];
        if (!embedding) {
          throw new Error(`Failed to generate embedding for document at index ${index}`);
        }

        const meta = doc.metadata;
        return {
          id: doc.id || undefined,
          content: doc.text,
          embedding,
          source: meta?.source || undefined,
          sourceId: meta?.source_id || undefined,
          url: meta?.url || undefined,
          author: meta?.author || undefined,
          createdAt: meta?.created_at ? new Date(meta.created_at) : undefined,
        };
      });

      const ids = await upsertMemories(upsertParams);

      return { ids };
    },
  );
};

export default memoryRoutes;
