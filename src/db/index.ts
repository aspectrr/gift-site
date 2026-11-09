import { mkdirSync } from "node:fs";
import path from "node:path";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import * as schema from "./schema";

export const dbPath = process.env.DB_PATH ?? "./data/gifts.db";

mkdirSync(path.dirname(dbPath), { recursive: true });
export const sqlite = new Database(dbPath, { create: true });
sqlite.exec("PRAGMA journal_mode = WAL;");

export const db = drizzle(sqlite, { schema });

// Migrations are idempotent — safe on every boot.
migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

export type Person = typeof schema.people.$inferSelect;
export type GiftIdea = typeof schema.giftIdeas.$inferSelect;
