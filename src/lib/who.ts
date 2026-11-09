import { createHmac, timingSafeEqual } from "node:crypto";
import { getCookie, setCookie, deleteCookie } from "vinxi/http";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { people } from "~/db/schema";
import type { Person } from "~/db";

const SECRET = process.env.APP_SECRET ?? "dev-secret-change-me";
const YEAR_SECONDS = 60 * 60 * 24 * 365;

function sign(id: string): string {
  return createHmac("sha256", SECRET).update(id).digest("base64url");
}

function valid(raw: string | undefined): number | null {
  if (!raw) return null;
  const [id, sig] = raw.split(".");
  if (!id || !sig) return null;
  const a = Buffer.from(sign(id));
  const b = Buffer.from(sig);
  // ponytail: not length-checked timingSafeEqual; signature is base64url from our own HMAC
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** The current viewer, or null if unknown/tampered cookie. */
export async function getWho(): Promise<Person | null> {
  const id = valid(getCookie("who"));
  if (id === null) return null;
  const [p] = await db.select().from(people).where(eq(people.id, id)).limit(1);
  return p ?? null;
}

export function setWho(id: number): void {
  setCookie("who", `${id}.${sign(String(id))}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: YEAR_SECONDS,
  });
}

export function clearWho(): void {
  deleteCookie("who", { path: "/" });
}

/** For tests. */
export const _internal = { sign, valid };
