import crypto from 'node:crypto';
import pgvector from 'pgvector/pg';
import { getConnection } from './connection';

export interface MemoryUpsertParams {
  id?: string;
  content: string;
  embedding: number[];
  source?: string;
  sourceId?: string;
  documentId?: string;
  url?: string;
  author?: string;
  createdAt?: Date;
}

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
    documentId = '%%',
    sourceId = '%%',
    source = '%%',
    author = '%%',
    startDate,
    endDate,
  } = params;

  const pool = await getConnection();

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

  const result = await pool.query<MemorySearchResult>(query, values);
  return result.rows;
}

export async function upsertMemories(
  params: MemoryUpsertParams[],
): Promise<string[]> {
  const pool = await getConnection();

  const ids: string[] = [];
  const valueClauses: string[] = [];
  const values: unknown[] = [];

  for (const doc of params) {
    const id = doc.id || crypto.randomUUID();
    ids.push(id);

    const offset = values.length;
    valueClauses.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`,
    );
    values.push(
      id,
      doc.content,
      pgvector.toSql(doc.embedding),
      doc.source ?? null,
      doc.sourceId ?? null,
      doc.documentId ?? null,
      doc.url ?? null,
      doc.author ?? null,
      doc.createdAt ?? new Date(),
    );
  }

  const query = `
    INSERT INTO documents (id, content, embedding, source, source_id, document_id, url, author, created_at)
    VALUES ${valueClauses.join(', ')}
    ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content,
      embedding = EXCLUDED.embedding,
      source = EXCLUDED.source,
      source_id = EXCLUDED.source_id,
      document_id = EXCLUDED.document_id,
      url = EXCLUDED.url,
      author = EXCLUDED.author,
      created_at = EXCLUDED.created_at
  `;

  await pool.query(query, values);
  return ids;
}
