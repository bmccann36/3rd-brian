⏺ Complete POST /query Flow

Down the Stack (API → DB):

1. HTTP Request → FastAPI Endpoint (server/main.py:93-103)
   - Receives POST with QueryRequest containing queries array
   - Validates request structure
2. Endpoint → Datastore Interface (datastore/datastore.py:53-65)
   - Extracts query texts from Query objects
   - Calls OpenAI API to convert text → embedding vectors (~1500 dimensions)
   - Combines original queries with embeddings into QueryWithEmbedding objects
3. Base Datastore → Postgres Implementation (pgvector_datastore.py:100-153)
   - Loops through queries (serially, not parallel)
   - Builds params with embedding + filters (date range, author, source)
   - Calls PostgreSQL stored procedure match_page_sections
4. Python → PostgreSQL (match_page_sections function)
   - Applies SQL WHERE filters (regular PostgreSQL)
   - Calculates vector similarity using pgvector <#> operator
   - Orders by similarity score
   - Returns top N matches

Back Up (DB → API):

5. PostgreSQL → Python
   - Returns rows with content, metadata, similarity scores
6. Postgres Implementation → Base Datastore
   - Transforms rows into DocumentChunkWithScore objects
   - Wraps as QueryResult (pairs query text with results)
7. Datastore → FastAPI Endpoint
   - Returns List[QueryResult]
8. FastAPI → HTTP Response
   - Wraps in QueryResponse model
   - Auto-serializes to JSON
   - Returns 200 with results
