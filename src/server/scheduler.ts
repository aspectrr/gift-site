import { runReminderJob } from "./reminder-job";

/**
 * Started once from entry-server. Checks run hourly; each reminder is
 * deduped by key so extra checks are free. In dev, run manually instead:
 * `bun run reminders:run`
 */
export function startScheduler(): void {
  if (Bun.env.NODE_ENV !== "production" && !Bun.env.FLY_APP_NAME) return;

  const tick = () =>
    runReminderJob().then(
      (r) => {
        if (r.sent.length) console.log(`[reminders] sent: ${r.sent.join(", ")}`);
        if (r.failures.length) console.error(`[reminders] failed: ${r.failures.join(", ")}`);
      },
      (err) => console.error("[reminders] job crashed:", err),
    );

  setTimeout(tick, 30_000); // catch-up pass shortly after boot
  setInterval(tick, 60 * 60 * 1000);
}
