import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const people = sqliteTable("people", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  email: text("email"),
  /** E.164-ish or freeform — collected for future SMS nudges */
  phone: text("phone"),
  /** 'MM-DD', no birth year */
  birthday: text("birthday"),
  isKid: integer("is_kid", { mode: "boolean" }).notNull().default(false),
  color: text("color").notNull().default("mint"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** One row per filled category, per person. Categories are a code constant, not a table. */
export const favorites = sqliteTable(
  "favorites",
  {
    personId: integer("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    value: text("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.personId, t.category] })],
);

/** "Into right now" — one line per person per year, history preserved. */
export const interests = sqliteTable(
  "interests",
  {
    personId: integer("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    value: text("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.personId, t.year] })],
);

export const giftIdeas = sqliteTable("gift_ideas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personId: integer("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  /** 'small' | 'big' */
  size: text("size").notNull().default("small"),
  title: text("title").notNull(),
  url: text("url"),
  note: text("note"),
  /** Private: never sent to the person this idea belongs to. */
  boughtAt: integer("bought_at", { mode: "timestamp" }),
  boughtById: integer("bought_by_id"),
  createdById: integer("created_by_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** Dedupe keys so restarts never double-send a reminder. */
export const remindersSent = sqliteTable("reminders_sent", {
  key: text("key").primaryKey(),
  sentAt: integer("sent_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
