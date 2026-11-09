import { runReminderJob } from "./reminder-job";

// REMINDER_NOW lets you dry-run any date: REMINDER_NOW=2026-11-16T14:00:00Z bun run reminders:run
const now = Bun.env.REMINDER_NOW ? new Date(Bun.env.REMINDER_NOW) : new Date();
const r = await runReminderJob(now);
console.log(`sent: ${r.sent.length ? r.sent.join(", ") : "(none due)"}`);
if (r.failures.length) {
  console.error(`FAILED: ${r.failures.join(", ")}`);
  process.exitCode = 1;
}
