import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// For tech demo: allow missing DATABASE_URL and export null db
const DATABASE_URL = process.env.DATABASE_URL;

let db: NodePgDatabase<typeof schema> | null = null;

if (DATABASE_URL) {
  try {
    const pool = new Pool({ connectionString: DATABASE_URL });
    db = drizzle(pool, { schema });
  } catch (error) {
    console.warn("Database connection failed:", error);
    db = null;
  }
}

export { db };
export type Database = typeof db;
export * from "./schema";