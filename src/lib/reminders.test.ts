import { describe, expect, test } from "bun:test";
import { daysUntilBirthday, nextBirthdays, resolveBirthday } from "./occasions";
import { dueReminders, type ReminderPerson } from "./reminders";
import { matches, normalize } from "./search";
import { _internal } from "./who";

const TZ = "America/New_York";
// 9:00 AM ET on the given date
const at9am = (utc: string) => new Date(utc);

describe("occasions", () => {
  test("birthday today = 0 days", () => {
    expect(daysUntilBirthday("11-21", at9am("2026-11-21T14:00:00Z"), TZ)?.days).toBe(0);
  });

  test("7 days ahead", () => {
    expect(daysUntilBirthday("11-22", at9am("2026-11-15T14:00:00Z"), TZ)?.days).toBe(7);
  });

  test("wraps to next year (Jan birthday, Dec today)", () => {
    const r = daysUntilBirthday("01-02", at9am("2026-12-28T14:00:00Z"), TZ);
    expect(r?.days).toBe(5);
    expect(r?.year).toBe(2027); // dedupe key uses occurrence year
  });

  test("Feb 29 resolves to Feb 28 in non-leap years", () => {
    expect(daysUntilBirthday("02-29", at9am("2027-02-27T14:00:00Z"), TZ)?.days).toBe(1); // Feb 28
    expect(daysUntilBirthday("02-29", at9am("2028-02-27T14:00:00Z"), TZ)?.days).toBe(2); // real Feb 29, leap
    expect(resolveBirthday("02-30", 2026)).toBeNull();
    expect(resolveBirthday("13-01", 2026)).toBeNull();
  });

  test("nextBirthdays sorts and filters", () => {
    const people = [
      { id: 1, name: "A", birthday: "11-25" },
      { id: 2, name: "B", birthday: "11-22" },
      { id: 3, name: "C", birthday: "12-20" },
    ];
    const up = nextBirthdays(people, at9am("2026-11-21T14:00:00Z"), TZ, 30);
    expect(up.map((u) => u.person.id)).toEqual([2, 1, 3]); // B 1d, A 4d, C 29d
  });
});

describe("reminder selection", () => {
  const person = (over: Partial<ReminderPerson>): ReminderPerson => ({
    id: 1,
    name: "Deb",
    email: "deb@example.com",
    birthday: null,
    listIsEmpty: true,
    ...over,
  });

  test("fill-out wave 1 fires on/after Nov 15 for empty lists with email", () => {
    const due = dueReminders([person({})], new Set(), at9am("2026-11-15T14:00:00Z"), TZ, 2026);
    expect(due).toHaveLength(1);
    expect(due[0].kind).toBe("fillout");
    expect(due[0].key).toBe("fillout:2026:1:1");
  });

  test("Nov 14 is too early", () => {
    expect(dueReminders([person({})], new Set(), at9am("2026-11-14T14:00:00Z"), TZ, 2026)).toHaveLength(0);
  });

  test("Dec 5 fires both waves, dedupe drops wave 1 if sent", () => {
    const now = at9am("2026-12-05T14:00:00Z");
    const both = dueReminders([person({})], new Set(), now, TZ, 2026);
    expect(both.map((d) => d.key).sort()).toEqual(["fillout:2026:1:1", "fillout:2026:2:1"]);
    const afterWave1 = dueReminders([person({})], new Set(["fillout:2026:1:1"]), now, TZ, 2026);
    expect(afterWave1.map((d) => d.key)).toEqual(["fillout:2026:2:1"]);
  });

  test("window closes after Christmas", () => {
    expect(dueReminders([person({})], new Set(), at9am("2026-12-26T14:00:00Z"), TZ, 2026)).toHaveLength(0);
  });

  test("full list, no email, or empty name get no fill-out", () => {
    const now = at9am("2026-11-16T14:00:00Z");
    expect(dueReminders([person({ listIsEmpty: false })], new Set(), now, TZ, 2026)).toHaveLength(0);
    expect(dueReminders([person({ email: null })], new Set(), now, TZ, 2026)).toHaveLength(0);
  });

  test("birthday heads-up within 7 days, keyed by occurrence year, deduped", () => {
    const bday = person({ id: 7, birthday: "11-21", listIsEmpty: false, email: "x@example.com" });
    const due = dueReminders([bday], new Set(), at9am("2026-11-15T14:00:00Z"), TZ, 2026);
    expect(due).toHaveLength(1);
    expect(due[0].kind).toBe("birthday");
    expect(due[0].key).toBe("bday:7:2026");

    expect(dueReminders([bday], new Set(["bday:7:2026"]), at9am("2026-11-18T14:00:00Z"), TZ, 2026)).toHaveLength(0);

    const far = person({ id: 8, birthday: "12-20", listIsEmpty: false, email: "x@example.com" });
    expect(dueReminders([far], new Set(), at9am("2026-11-15T14:00:00Z"), TZ, 2026)).toHaveLength(0);
  });
});

describe("search", () => {
  test("token AND matching, case + diacritic insensitive", () => {
    expect(matches("José loves Cold Brew", "jose")).toBe(true);
    expect(matches("José loves Cold Brew", "cold brew")).toBe(true);
    expect(matches("José loves Cold Brew", "brew tea")).toBe(false);
    expect(normalize("Crème Brûlée")).toBe("creme brulee");
    expect(matches("", "")).toBe(true);
  });
});

describe("identity cookie", () => {
  test("sign + verify roundtrip, tamper rejected", () => {
    const sig = _internal.sign("42");
    expect(_internal.valid(`42.${sig}`)).toBe(42);
    expect(_internal.valid(`43.${sig}`)).toBeNull();
    expect(_internal.valid("42")).toBeNull();
    expect(_internal.valid(undefined)).toBeNull();
    expect(_internal.valid("42.notbase64!!")).toBeNull();
  });
});
