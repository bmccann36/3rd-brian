import { Pool, PoolClient } from "pg";
import pgvector from "pgvector/pg";
import * as dotenv from "dotenv";

dotenv.config();

let pool: Pool | null = null;

export async function getConnection(): Promise<Pool> {
  if (!pool) {
    console.log("Creating new database pool for Lambda...");
    console.log("Environment variables:", {
      PG_HOST: process.env.PG_HOST ? "SET" : "MISSING",
      PG_PORT: process.env.PG_PORT ? "SET" : "MISSING",
      PG_DB: process.env.PG_DB ? "SET" : "MISSING",
      PG_USER: process.env.PG_USER ? "SET" : "MISSING",
      PG_PASSWORD: process.env.PG_PASSWORD ? "SET" : "MISSING",
    });

    pool = new Pool({
      host: process.env.PG_HOST,
      port: parseInt(process.env.PG_PORT || "5432"),
      database: process.env.PG_DB,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      max: 1, // Lambda optimization - single connection
      idleTimeoutMillis: 60000, // Keep connection alive longer for container reuse
      connectionTimeoutMillis: 5000,
      ssl: process.env.PG_HOST?.includes("neon.tech")
        ? { rejectUnauthorized: false }
        : undefined,
    });

    // Register pgvector types on each new connection
    pool.on("connect", async (client: PoolClient) => {
      console.log("Database client connected, registering pgvector...");
      await pgvector.registerTypes(client);
    });

    pool.on("error", (err) => {
      console.error("Database pool error:", err);
    });

    console.log("Database pool created");
  }

  return pool;
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}