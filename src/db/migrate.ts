// side-effect import: src/db/index.ts applies migrations on load
// oxlint-disable-next-line no-unused-vars
import { db } from ".";

// Standalone: `bun run migrate` (also runs automatically on server boot).
console.log(`migrations applied to ${Bun.env.DB_PATH ?? "./data/gifts.db"}`);
