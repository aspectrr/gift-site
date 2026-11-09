# Family Favorites

The family gift chart, as an app. Everyone's favorites, clothing sizes, current
interests, and gift ideas (with links) in one place — browsable by person and by
year, mobile-first, no accounts. Inspired by the "Family Favorites Chart"
Google Sheet the family used to pass around; now with birthday reminders and
private "bought" marks.

## How it works

- **No login.** First visit: pick your name (or type a new one). A signed
  cookie remembers you for a year — when it expires, you get the picker again.
- **Anyone can edit anyone** — same trust model as the shared sheet.
- **Yearly refresh.** Interests and gift ideas are year-scoped; past years stay
  browsable via the year switcher. Favorites are current-only.
- **Private bought marks.** Anyone except you can mark one of your ideas as
  bought. You can never see (or set) marks on your own list.
- **Reminders (email via Resend).** Nov 15 + Dec 5: "fill out your list" to
  anyone whose current-year list is empty. 7 days before each birthday: a
  heads-up to everyone else with a peek at that person's favorites. Deduped in
  `reminders_sent`, so restarts never double-send.

## Stack

SolidStart (SSR) · Bun · Drizzle ORM · SQLite (`bun:sqlite`) · Tailwind CSS v4 ·
Fly.io (single machine + persistent volume at `/data`, snapshots = backups).

## Dev

```sh
bun install
bun run db:generate   # only after changing src/db/schema.ts
bun run seed          # optional: fake family of 10
bun run dev           # http://localhost:3000
bun test
```

The dev server must run under Bun (`bun --bun vinxi dev`, already the script)
because the database is `bun:sqlite`.

Dry-run the reminder job for any date (no emails without `RESEND_API_KEY`):

```sh
DB_PATH=/tmp/t.db REMINDER_NOW=2026-11-16T14:00:00Z bun run reminders:run
```

## Deploy (Fly.io)

```sh
fly launch --no-deploy        # creates the app, uses fly.toml + Dockerfile
fly volumes create data --size 1
fly secrets set \
  APP_SECRET=$(openssl rand -hex 32) \
  APP_URL=https://<app>.fly.dev \
  RESEND_API_KEY=re_... \
  RESEND_FROM="Family Favorites <favorites@yourdomain.com>" \
  APP_TZ=America/New_York     # optional, default America/New_York
fly deploy
```

Add to iPhone home screen via Safari → Share → Add to Home Screen.

## Env

| Var | Default | What it does |
| --- | --- | --- |
| `DB_PATH` | `./data/gifts.db` | SQLite file (Fly: `/data/gifts.db` on the volume) |
| `APP_SECRET` | dev fallback | HMAC key for the identity cookie — set in prod |
| `APP_URL` | `http://localhost:3000` | used in reminder email links |
| `APP_TZ` | `America/New_York` | timezone for birthday/reminder math |
| `RESEND_API_KEY` | unset → dry-run | emails log instead of send |
| `RESEND_FROM` | `Family Favorites <onboarding@resend.dev>` | sender identity |

## Not in the MVP (yet)

Name-exchange drawing, SMS reminders, chat gift advisor, shopping links,
photo avatars, multiple families.
