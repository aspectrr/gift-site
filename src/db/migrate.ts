import { db } from ".";

// Standalone: `bun run migrate` (also runs automatically on server boot).
console.log(`migrations applied to ${process.env.DB_PATH ?? "./data/gifts.db"}`);
