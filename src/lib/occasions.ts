/**
 * Pure date/birthday math in a named timezone. Uses Intl for tz conversion —
 * no date library needed at this scale.
 */

const fmtCache = new Map<string, Intl.DateTimeFormat>();

/** YYYY-M-D parts of `now` in `tz`. */
export function localParts(
  now: Date,
  tz: string,
): { y: number; m: number; d: number } {
  let fmt = fmtCache.get(tz);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    fmtCache.set(tz, fmt);
  }
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  return {
    y: Number(parts.year),
    m: Number(parts.month),
    d: Number(parts.day),
  };
}

function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** Resolve a Feb 29 birthday to Feb 28 in non-leap years. */
export function resolveBirthday(
  mmdd: string,
  y: number,
): { m: number; d: number } | null {
  const match = /^(\d{2})-(\d{2})$/.exec(mmdd);
  if (!match) return null;
  let m = Number(match[1]);
  let d = Number(match[2]);
  if (m < 1 || m > 12) return null;
  const maxDay = [
    31,
    isLeap(y) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][m - 1];
  if (m === 2 && d === 29 && !isLeap(y)) d = 28;
  if (d < 1 || d > maxDay) return null;
  return { m, d };
}

function toUtc(y: number, m: number, d: number): number {
  return Date.UTC(y, m - 1, d);
}

/**
 * Days from `now` (in `tz`) until the next occurrence of this birthday.
 * 0 = today. Negative = never (invalid birthday).
 */
export function daysUntilBirthday(
  mmdd: string,
  now: Date,
  tz: string,
): { days: number; year: number } | null {
  const today = localParts(now, tz);
  const resolved = resolveBirthday(mmdd, today.y);
  if (!resolved) return null;

  let target = toUtc(today.y, resolved.m, resolved.d);
  let year = today.y;
  if (target < toUtc(today.y, today.m, today.d)) {
    const next = resolveBirthday(mmdd, today.y + 1)!;
    target = toUtc(today.y + 1, next.m, next.d);
    year = today.y + 1;
  }
  return {
    days: Math.round((target - toUtc(today.y, today.m, today.d)) / 86_400_000),
    year,
  };
}

export type HasBirthday = { id: number; name: string; birthday: string | null };

/** Upcoming birthdays within `withinDays`, soonest first. */
export function nextBirthdays<T extends HasBirthday>(
  people: T[],
  now: Date,
  tz: string,
  withinDays: number,
): Array<{ person: T; days: number }> {
  return people
    .filter((p) => p.birthday)
    .map((p) => ({
      person: p,
      ...(daysUntilBirthday(p.birthday!, now, tz) ?? { days: -1, year: 0 }),
    }))
    .filter((x) => x.days >= 0 && x.days <= withinDays)
    .sort((a, b) => a.days - b.days);
}

/** "Nov 21" style label for a birthday this/next occurrence. */
export function birthdayLabel(mmdd: string, now: Date, tz: string): string {
  const r = daysUntilBirthday(mmdd, now, tz);
  if (!r) return "";
  const { m, d } = resolveBirthday(mmdd, r.year)!;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(r.year, m - 1, d)));
}
