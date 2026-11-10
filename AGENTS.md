# AGENTS.md — guidance for coding agents in this repo

## What this is

Howards' Favorites — a family gift-idea tracker. SolidStart (SolidJS) + drizzle +
SQLite (`bun:sqlite`), deployed on fly.io. Identity is a signed `who` cookie;
the person it names is the "viewer".

## Commands

- `bun run dev` — dev server on :3000
- `bun run build` — production build (vinxi). Note: does NOT typecheck.
- `bun test` — unit tests, ~40ms, no DB needed
- `bun lint src` / `bun fmt --check` — lint / format check (both are Bun built-ins)
- `bun run typecheck` — `tsc --noEmit`
- `bun run db:generate` then `bun run migrate` — schema changes via drizzle-kit
- `bun run seed` — fill local dev data

## Gotchas

- Bun runtime, not Node. `bun:sqlite` "could not be resolved" build warnings are
  normal (external dependency) — don't try to fix them.
- `bun lint` needs Bun canary (repo pins 1.4.4-canary.1 in CI; stable Bun says
  "Script not found"). Unpin setup-bun once lint ships in stable.
- Local DB is `data/gifts.db` (gitignored). `DB_PATH` env overrides it; fly.io
  mounts `/data`.
- `APP_SECRET` signs the `who` cookie; `dev-secret-change-me` default is dev-only.
- Server actions live in `src/lib/actions.ts`; client forms POST to
  `/_server?id=...` endpoints. The person form (`src/components/PersonForm.tsx`)
  autosaves after 500ms via `useAction`, and flushes on Done, `useBeforeLeave`,
  and `pagehide` — don't bypass those paths.
- Person-form writes are wrapped in `db.transaction` — keep new writes inside it.
- `drizzle/` holds generated migrations: change schemas via drizzle-kit, never by
  hand. `bun fmt` ignores that folder (see `.prettierignore`).
- `.pi/` is local tooling, gitignored — don't commit it.

## Definition of done

`bun lint src && bun fmt --check && bun run typecheck && bun test` — the
pre-commit hook runs all four; CI runs them plus a Docker build. All green
before calling work finished.
