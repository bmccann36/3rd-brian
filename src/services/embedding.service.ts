import OpenAI from "openai";

export class EmbeddingService {
  private openai: OpenAI | null;
  private isConfigured: boolean;
  private model = "text-embedding-3-large";

  constructor() {
    this.isConfigured = !!process.env.OPENAI_API_KEY;

    if (this.isConfigured) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.warn(
        "OPENAI_API_KEY not configured - embeddings will be skipped",
      );
      this.openai = null;
    }
  }

  /**
   * Check if the embedding service is properly configured
   */
  isEnabled(): boolean {
    return this.isConfigured;
  }

  /**
   * Generate embedding for a single text string
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }

  /**
   * Generate embeddings for multiple text strings efficiently in a single API call
   */
  async generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    if (!this.isConfigured || !this.openai) {
      console.debug(
        "Embedding service not configured, returning null embeddings",
      );
      return texts.map(() => null);
    }

    if (texts.length === 0) {
      return [];
    }

    try {
      // OpenAI API accepts array of strings and returns embeddings in the same order
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
        dimensions: 256,
      });

      // Map the response data to match input order
      const embeddings = texts.map((_, index) => {
        if (response.data && response.data[index]) {
          return response.data[index].embedding;
        } else {
          console.error(`No embedding data for text at index ${index}`);
          return null;
        }
      });

      return embeddings;
    } catch (error) {
      console.error("Error generating embeddings batch:", error);
      // Return array of nulls matching input length
      return texts.map(() => null);
    }
  }

  /**
   * Generate embeddings for query objects, preserving the original query structure
   */
  async generateQueryEmbeddings<T extends { query: string }>(
    queries: T[],
  ): Promise<(T & { embedding?: number[] })[]> {
    const queryTexts = queries.map((q) => q.query);
    const embeddings = await this.generateEmbeddings(queryTexts);

    return queries.map((query, index) => {
      const embedding = embeddings[index];
      if (embedding) {
        return { ...query, embedding };
      }
      return query;
    });
  }
}

// Export a singleton instance
export const embeddingService = new EmbeddingService();
