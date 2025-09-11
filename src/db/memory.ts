import pgvector from "pgvector/pg";
import { getConnection } from "./connection";

interface MemorySearchParams {
  embedding: number[];
  matchCount?: number;
  documentId?: string;
  sourceId?: string;
  source?: string;
  author?: string;
  startDate?: Date;
  endDate?: Date;
}

interface MemorySearchResult {
  id: string;
  source: string;
  source_id: string;
  document_id: string;
  url: string;
  created_at: Date;
  author: string;
  content: string;
  embedding: number[];
  similarity: number;
}


export async function searchMemories(
  params: MemorySearchParams,
): Promise<MemorySearchResult[]> {
  const {
    embedding,
    matchCount = 3,
    documentId = "%%",
    sourceId = "%%",
    source = "%%",
    author = "%%",
    startDate,
    endDate,
  } = params;

  const query = `
    SELECT
      documents.id,
      documents.source,
      documents.source_id,
      documents.document_id,
      documents.url,
      documents.created_at,
      documents.author,
      documents.content,
      documents.embedding::text,
      (documents.embedding <#> $1) * -1 as similarity
    FROM documents
    WHERE $2::timestamptz <= documents.created_at 
      AND documents.created_at <= $3::timestamptz
      AND (documents.source_id LIKE $4 OR documents.source_id IS NULL)
      AND (documents.source LIKE $5 OR documents.source IS NULL)
      AND (documents.author LIKE $6 OR documents.author IS NULL)
      AND (documents.document_id LIKE $7 OR documents.document_id IS NULL)
    ORDER BY documents.embedding <#> $1
    LIMIT $8
  `;

  const values = [
    pgvector.toSql(embedding),
    startDate || '-infinity',
    endDate || 'infinity',
    sourceId,
    source,
    author,
    documentId,
    matchCount,
  ];

  const pool = await getConnection();
  const result = await pool.query<MemorySearchResult>(query, values);
  return result.rows;
}

