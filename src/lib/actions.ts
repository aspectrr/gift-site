import { action, redirect } from "@solidjs/router";

export type ActionResult = { ok: true } | { error: string; match?: { id: number; name: string } };

export const switchAction = action(async (): Promise<ActionResult> => {
  "use server";
  const { clearWho } = await import("~/lib/who");
  clearWho();
  return { ok: true };
}, "switch");

export const pickAction = action(async (fd: FormData): Promise<ActionResult> => {
  "use server";
  const { eq } = await import("drizzle-orm");
  const { db } = await import("~/db");
  const { people } = await import("~/db/schema");
  const { setWho } = await import("~/lib/who");

  const [p] = await db
    .select()
    .from(people)
    .where(eq(people.id, Number(fd.get("id"))))
    .limit(1);
  if (!p) return { error: "gone" };
  setWho(p.id);
  return { ok: true };
}, "pick");

export const joinAction = action(async (fd: FormData): Promise<ActionResult> => {
  "use server";
  const { eq } = await import("drizzle-orm");
  const { db } = await import("~/db");
  const { people } = await import("~/db/schema");
  const { setWho } = await import("~/lib/who");
  const { pickColor } = await import("~/lib/categories");
  const { resolveBirthday } = await import("~/lib/occasions");

  const name = String(fd.get("name") ?? "").trim().slice(0, 40);
  if (!name) return { error: "empty" };

  const birthdayRaw = String(fd.get("birthday") ?? "").trim();
  if (birthdayRaw && (!/^\d{2}-\d{2}$/.test(birthdayRaw) || !resolveBirthday(birthdayRaw, 2024))) {
    return { error: "birthday" };
  }
  const phone = String(fd.get("phone") ?? "").trim().slice(0, 24) || null;

  const [match] = await db.select().from(people).where(eq(people.name, name)).limit(1);
  if (match) return { error: "exists", match: { id: match.id, name: match.name } };

  const [created] = await db
    .insert(people)
    .values({ name, phone, birthday: birthdayRaw || null, color: pickColor(name) })
    .returning();
  setWho(created.id);
  return { ok: true };
}, "join");

export const addPersonAction = action(async (fd: FormData): Promise<ActionResult> => {
  "use server";
  const { eq } = await import("drizzle-orm");
  const { db } = await import("~/db");
  const { people } = await import("~/db/schema");
  const { pickColor } = await import("~/lib/categories");
  const { getWho } = await import("~/lib/who");

  const who = await getWho();
  if (!who) return { error: "who" };

  const name = String(fd.get("name") ?? "").trim().slice(0, 40);
  if (!name) return { error: "empty" };

  const [match] = await db.select().from(people).where(eq(people.name, name)).limit(1);
  if (match) return { error: "exists", match: { id: match.id, name: match.name } };

  await db.insert(people).values({ name, isKid: fd.get("isKid") === "on", color: pickColor(name) });
  return { ok: true };
}, "addPerson");

export const savePersonAction = action(async (fd: FormData): Promise<ActionResult> => {
  "use server";
  const { eq, ne, and } = await import("drizzle-orm");
  const { db } = await import("~/db");
  const { people, favorites, interests } = await import("~/db/schema");
  const { CATEGORIES, currentYear } = await import("~/lib/categories");
  const { resolveBirthday } = await import("~/lib/occasions");
  const { getWho } = await import("~/lib/who");

  const who = await getWho();
  if (!who) return { error: "Pick your name first, then edit." };

  const id = Number(fd.get("id"));
  const name = String(fd.get("name") ?? "").trim().slice(0, 40);
  if (!name) return { error: "Please add a name." };

  const [dupe] = await db
    .select()
    .from(people)
    .where(and(eq(people.name, name), ne(people.id, id)))
    .limit(1);
  if (dupe) return { error: `“${name}” is already someone else here.` };

  const emailRaw = String(fd.get("email") ?? "").trim();
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    return { error: "That email doesn't look right." };
  }
  const phone = String(fd.get("phone") ?? "").trim().slice(0, 24) || null;

  const birthdayRaw = String(fd.get("birthday") ?? "").trim();
  if (birthdayRaw && (!/^\d{2}-\d{2}$/.test(birthdayRaw) || !resolveBirthday(birthdayRaw, 2024))) {
    return { error: "Birthday should look like 04-09 (month-day)." };
  }

  await db
    .update(people)
    .set({
      name,
      // contact info is editable only by the person it belongs to
      ...(who.id === id ? { email: emailRaw || null, phone } : {}),
      birthday: birthdayRaw || null,
      isKid: fd.get("isKid") === "on",
    })
    .where(eq(people.id, id));

  for (const cat of CATEGORIES) {
    const value = String(fd.get(`cat_${cat.key}`) ?? "").trim();
    if (!value) {
      await db.delete(favorites).where(and(eq(favorites.personId, id), eq(favorites.category, cat.key)));
    } else {
      await db
        .insert(favorites)
        .values({ personId: id, category: cat.key, value })
        .onConflictDoUpdate({ target: [favorites.personId, favorites.category], set: { value } });
    }
  }

  const into = String(fd.get("into_now") ?? "").trim();
  if (into) {
    await db
      .insert(interests)
      .values({ personId: id, year: currentYear(), value: into })
      .onConflictDoUpdate({ target: [interests.personId, interests.year], set: { value: into } });
  } else {
    await db
      .delete(interests)
      .where(and(eq(interests.personId, id), eq(interests.year, currentYear())));
  }

  return { ok: true };
}, "savePerson");

export const addIdeaAction = action(async (fd: FormData): Promise<ActionResult> => {
  "use server";
  const { db } = await import("~/db");
  const { giftIdeas } = await import("~/db/schema");
  const { getWho } = await import("~/lib/who");
  const { currentYear } = await import("~/lib/categories");

  const title = String(fd.get("title") ?? "").trim().slice(0, 140);
  if (!title) return { error: "What's the idea? Add a title." };

  let url: string | null = String(fd.get("url") ?? "").trim() || null;
  if (url) {
    try {
      const u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
      url = u.toString();
    } catch {
      return { error: "That link doesn't look right — paste the full address, starting with https://" };
    }
  }

  const who = await getWho();
  if (!who) return { error: "Who are you? Go back and pick your name first." };

  await db.insert(giftIdeas).values({
    personId: Number(fd.get("personId")),
    year: Number(fd.get("year")) || currentYear(),
    size: fd.get("size") === "big" ? "big" : "small",
    title,
    url,
    note: String(fd.get("note") ?? "").trim().slice(0, 300) || null,
    createdById: who.id,
  });
  return { ok: true };
}, "addIdea");

export const toggleBoughtAction = action(async (fd: FormData): Promise<ActionResult> => {
  "use server";
  const { eq } = await import("drizzle-orm");
  const { db } = await import("~/db");
  const { giftIdeas } = await import("~/db/schema");
  const { getWho } = await import("~/lib/who");

  const who = await getWho();
  if (!who) return { error: "who" };

  const [idea] = await db
    .select()
    .from(giftIdeas)
    .where(eq(giftIdeas.id, Number(fd.get("ideaId"))))
    .limit(1);
  if (!idea) return { error: "gone" };

  // the whole point: you can never see or set bought state on your own list
  if (idea.personId === who.id) return { error: "self" };

  await db
    .update(giftIdeas)
    .set(
      idea.boughtAt
        ? { boughtAt: null, boughtById: null }
        : { boughtAt: new Date(), boughtById: who.id },
    )
    .where(eq(giftIdeas.id, idea.id));
  return { ok: true };
}, "toggleBought");

export const deleteIdeaAction = action(async (fd: FormData): Promise<ActionResult> => {
  "use server";
  const { eq } = await import("drizzle-orm");
  const { db } = await import("~/db");
  const { giftIdeas } = await import("~/db/schema");
  const { getWho } = await import("~/lib/who");
  const who = await getWho();
  if (!who) return { error: "who" };
  await db.delete(giftIdeas).where(eq(giftIdeas.id, Number(fd.get("ideaId"))));
  return { ok: true };
}, "deleteIdea");

export const deletePersonAction = action(async (fd: FormData): Promise<ActionResult | Response> => {
  "use server";
  const { eq } = await import("drizzle-orm");
  const { db } = await import("~/db");
  const { people } = await import("~/db/schema");
  const { getWho, clearWho } = await import("~/lib/who");

  const who = await getWho();
  if (!who) return { error: "who" };

  const id = Number(fd.get("id"));
  await db.delete(people).where(eq(people.id, id));
  if (who.id === id) clearWho();
  return redirect("/");
}, "deletePerson");
