import { eq } from "drizzle-orm";
import { db } from "~/db";
import {
  people,
  interests,
  giftIdeas,
  favorites,
  remindersSent,
} from "~/db/schema";
import { dueReminders, type ReminderPerson } from "~/lib/reminders";
import { CATEGORIES } from "~/lib/categories";
import { birthdayLabel } from "~/lib/occasions";
import { sendEmail, appUrl } from "~/lib/email";

const TZ = Bun.env.APP_TZ ?? "America/New_York";

export type ReminderJobResult = { sent: string[]; failures: string[] };

/** Load data, compute due reminders, send, record. Safe to run repeatedly. */
export async function runReminderJob(
  now = new Date(),
): Promise<ReminderJobResult> {
  const year = now.getFullYear();
  const everyone = await db.select().from(people);
  const ids = everyone.map((p) => p.id);

  const [ints, ideas, sent] = await Promise.all([
    ids.length
      ? db.select().from(interests).where(eq(interests.year, year))
      : [],
    ids.length
      ? db.select().from(giftIdeas).where(eq(giftIdeas.year, year))
      : [],
    db.select().from(remindersSent),
  ]);

  const hasInterests = new Set(
    ints.filter((i) => i.value.trim()).map((i) => i.personId),
  );
  const hasIdeas = new Set(ideas.map((i) => i.personId));
  const sentKeys = new Set(sent.map((s) => s.key));

  const reminderPeople: ReminderPerson[] = everyone.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    birthday: p.birthday,
    listIsEmpty: !hasInterests.has(p.id) && !hasIdeas.has(p.id),
  }));

  const due = dueReminders(reminderPeople, sentKeys, now, TZ, year);
  const result: ReminderJobResult = { sent: [], failures: [] };

  for (const r of due) {
    try {
      if (r.kind === "fillout") {
        await sendEmail(filloutEmail(r.person, year, r.wave));
      } else {
        const favLines = await favoritesOf(r.person.id);
        for (const member of reminderPeople) {
          if (member.id === r.person.id || !member.email) continue;
          await sendEmail(birthdayEmail(member.email, r.person, favLines));
        }
      }
      await db
        .insert(remindersSent)
        .values({ key: r.key })
        .onConflictDoNothing();
      result.sent.push(r.key);
    } catch (err) {
      console.error(`reminder ${r.key} failed:`, err);
      result.failures.push(r.key);
    }
  }

  return result;
}

async function favoritesOf(personId: number): Promise<string[]> {
  const rows = await db
    .select()
    .from(favorites)
    .where(eq(favorites.personId, personId));
  const byKey = new Map(rows.map((r) => [r.category, r.value]));
  return CATEGORIES.filter((c) => byKey.has(c.key)).map(
    (c) => `${c.label}: ${byKey.get(c.key)}`,
  );
}

function filloutEmail(p: ReminderPerson, year: number, wave: 1 | 2) {
  const nudge = wave === 1 ? "Christmas is coming" : "Christmas is close";
  return {
    to: p.email!,
    subject: `🎄 ${p.name}, fill out your ${year} favorites`,
    html: wrap(`
      <p>Hi ${escapeHtml(p.name)}! ${escapeHtml(nudge)} and your ${year} list is still empty.</p>
      <p>Take two minutes to add what you're into and a few gift ideas so nobody has to guess.</p>
      ${button(`${appUrl()}/me?edit=1`, "Update my list")}
    `),
  };
}

function birthdayEmail(to: string, p: ReminderPerson, favorites: string[]) {
  const label = p.birthday ? birthdayLabel(p.birthday, new Date(), TZ) : "soon";
  const list = favorites.length
    ? `<p style="color:#333;font-size:14px;line-height:1.7">${favorites
        .slice(0, 6)
        .map((f) => escapeHtml(f))
        .join("<br/>")}</p>`
    : "";
  return {
    to,
    subject: `🎂 ${p.name}'s birthday is ${label}`,
    html: wrap(`
      <p><strong>${escapeHtml(p.name)}</strong>'s birthday is coming up on <strong>${escapeHtml(label)}</strong>.</p>
      <p>A peek at their current favorites:</p>
      ${list || `<p style="color:#333">(no favorites filled in yet)</p>`}
      ${button(`${appUrl()}/people/${p.id}`, `See ${escapeHtml(p.name)}'s list`)}
    `),
  };
}

function button(href: string, label: string) {
  return `<p style="margin:28px 0"><a href="${href}" style="background:#99ffcc;color:#000;border:1px solid #000;padding:12px 22px;border-radius:12px;text-decoration:none;font-weight:700;display:inline-block">${label}</a></p>`;
}

function wrap(inner: string) {
  return `<div style="font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#222;max-width:480px;margin:0 auto;padding:24px;background:#fff;border:1px solid #000;border-radius:16px">${inner}</div>`;
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
