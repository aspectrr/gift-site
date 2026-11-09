import { query } from "@solidjs/router";

export const whoQuery = query(
  async () => {
    "use server";
    const { getWho } = await import("~/lib/who");
    const who = await getWho();
    // trimmed on purpose: this row gets serialized into every page payload
    return who ? { id: who.id, name: who.name, color: who.color } : null;
  },
  "who",
);

export type MemberDTO = {
  id: number;
  name: string;
  isKid: boolean;
  color: string;
  birthday: string | null;
  interestsNow: string;
  favorites: Record<string, string>;
  ideas: Array<{ id: number; title: string }>;
};

export type FamilyData = {
  year: number;
  members: MemberDTO[];
  upcoming: Array<{ id: number; name: string; color: string; days: number; label: string }>;
};

export const familyQuery = query(
  async (): Promise<FamilyData> => {
    "use server";
    const { eq } = await import("drizzle-orm");
    const { db } = await import("~/db");
    const { people, favorites, interests, giftIdeas } = await import("~/db/schema");
    const { nextBirthdays, birthdayLabel } = await import("~/lib/occasions");
    const { currentYear } = await import("~/lib/categories");

    const tz = Bun.env.APP_TZ ?? "America/New_York";
    const year = currentYear();
    const now = new Date();

    const everyone = await db.select().from(people).orderBy(people.name);
    const favRows = await db.select().from(favorites);
    const intRows = await db.select().from(interests).where(eq(interests.year, year));
    const ideaRows = await db
      .select({ id: giftIdeas.id, personId: giftIdeas.personId, title: giftIdeas.title })
      .from(giftIdeas)
      .where(eq(giftIdeas.year, year));

    const members: MemberDTO[] = everyone.map((p) => ({
      id: p.id,
      name: p.name,
      isKid: p.isKid,
      color: p.color,
      birthday: p.birthday,
      interestsNow: intRows.find((i) => i.personId === p.id)?.value ?? "",
      favorites: Object.fromEntries(favRows.filter((f) => f.personId === p.id).map((f) => [f.category, f.value])),
      ideas: ideaRows.filter((i) => i.personId === p.id).map((i) => ({ id: i.id, title: i.title })),
    }));

    const upcoming = nextBirthdays(everyone, now, tz, 30).map(({ person, days }) => ({
      id: person.id,
      name: person.name,
      color: person.color,
      days,
      label: person.birthday ? birthdayLabel(person.birthday, now, tz) : "",
    }));

    return { year, members, upcoming };
  },
  "family",
);

export type IdeaDTO = {
  id: number;
  size: string;
  title: string;
  url: string | null;
  note: string | null;
  addedByName: string;
  bought: boolean;
};

export type PersonData = {
  person: { id: number; name: string; email: string | null; phone: string | null; birthday: string | null; isKid: boolean; color: string };
  isSelf: boolean;
  /** false for anonymous visitors — they get a read-only view */
  canEdit: boolean;
  favorites: Record<string, string>;
  interest: string;
  ideas: IdeaDTO[];
  years: number[];
  year: number;
  birthdayLabel: string;
};

export const personQuery = query(
  async (id: number, year: number | null): Promise<PersonData | null> => {
    "use server";
    const { eq, and, desc } = await import("drizzle-orm");
    const { db } = await import("~/db");
    const { people, favorites, interests, giftIdeas } = await import("~/db/schema");
    const { getWho } = await import("~/lib/who");
    const { currentYear } = await import("~/lib/categories");
    const { birthdayLabel } = await import("~/lib/occasions");

    const [person] = await db.select().from(people).where(eq(people.id, id)).limit(1);
    if (!person) return null;

    const who = await getWho();
    const thisYear = currentYear();
    const tz = Bun.env.APP_TZ ?? "America/New_York";

    const yearRows = await db
      .selectDistinct({ year: interests.year })
      .from(interests)
      .where(eq(interests.personId, id));
    const ideaYears = await db
      .selectDistinct({ year: giftIdeas.year })
      .from(giftIdeas)
      .where(eq(giftIdeas.personId, id));
    const years = [...new Set([thisYear, ...yearRows.map((r) => r.year), ...ideaYears.map((r) => r.year)])]
      .filter((y) => y <= thisYear)
      .sort((a, b) => b - a);

    const selectedYear = year && years.includes(year) ? year : thisYear;

    const favRows = await db.select().from(favorites).where(eq(favorites.personId, id));
    const [interestRow] = await db
      .select()
      .from(interests)
      .where(and(eq(interests.personId, id), eq(interests.year, selectedYear)))
      .limit(1);
    const ideaRows = await db
      .select()
      .from(giftIdeas)
      .where(and(eq(giftIdeas.personId, id), eq(giftIdeas.year, selectedYear)))
      .orderBy(desc(giftIdeas.createdAt));

    const creators = new Map((await db.select({ id: people.id, name: people.name }).from(people)).map((p) => [p.id, p.name]));
    const isSelf = who?.id === person.id;

    return {
      person: {
        id: person.id,
        name: person.name,
        // contact info is the person's own business — self only
        email: isSelf ? person.email : null,
        phone: isSelf ? person.phone : null,
        birthday: person.birthday,
        isKid: person.isKid,
        color: person.color,
      },
      isSelf,
      canEdit: Boolean(who),
      favorites: Object.fromEntries(favRows.map((f) => [f.category, f.value])),
      interest: interestRow?.value ?? "",
      // bought flags never cross the wire to the person they belong to
      ideas: ideaRows.map((i) => ({
        id: i.id,
        size: i.size,
        title: i.title,
        url: i.url,
        note: i.note,
        addedByName: (i.createdById && creators.get(i.createdById)) || "someone",
        bought: isSelf ? false : Boolean(i.boughtAt),
      })),
      years,
      year: selectedYear,
      birthdayLabel: person.birthday ? birthdayLabel(person.birthday, new Date(), tz) : "",
    };
  },
  "person",
);
