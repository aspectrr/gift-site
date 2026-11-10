import { localParts, daysUntilBirthday } from "./occasions";

/**
 * Pure reminder selection. The scheduler loads rows, calls this, then sends.
 * Dedupe happens by key: a reminder only fires if its key is absent from
 * `sentKeys` (already-sent set from `reminders_sent`).
 */

export const FILLOUT_WAVES = [
  { wave: 1 as const, month: 11, day: 15 }, // Nov 15
  { wave: 2 as const, month: 12, day: 5 }, // Dec 5
];
const FILLOUT_WINDOW_END = { month: 12, day: 26 }; // stop nudging after Christmas

export type ReminderPerson = {
  id: number;
  name: string;
  email: string | null;
  birthday: string | null;
  /** current-year list is empty (no interests row and no ideas) */
  listIsEmpty: boolean;
};

export type DueReminder =
  | { kind: "fillout"; key: string; person: ReminderPerson; wave: 1 | 2 }
  | { kind: "birthday"; key: string; person: ReminderPerson };

function dayNumber(y: number, m: number, d: number): number {
  return (Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86_400_000;
}

export function dueReminders(
  people: ReminderPerson[],
  sentKeys: ReadonlySet<string>,
  now: Date,
  tz: string,
  year: number,
): DueReminder[] {
  const today = localParts(now, tz);
  const due: DueReminder[] = [];

  if (
    today.m < FILLOUT_WINDOW_END.month ||
    (today.m === FILLOUT_WINDOW_END.month && today.d < FILLOUT_WINDOW_END.day)
  ) {
    for (const w of FILLOUT_WAVES) {
      const started =
        dayNumber(today.y, today.m, today.d) >=
        dayNumber(today.y, w.month, w.day);
      if (!started) continue;
      for (const p of people) {
        if (!p.email || !p.listIsEmpty) continue;
        const key = `fillout:${year}:${w.wave}:${p.id}`;
        if (!sentKeys.has(key))
          due.push({ kind: "fillout", key, person: p, wave: w.wave });
      }
    }
  }

  for (const p of people) {
    if (!p.birthday) continue;
    const r = daysUntilBirthday(p.birthday, now, tz);
    if (!r || r.days > 7) continue;
    const key = `bday:${p.id}:${r.year}`;
    if (!sentKeys.has(key)) due.push({ kind: "birthday", key, person: p });
  }

  return due;
}
