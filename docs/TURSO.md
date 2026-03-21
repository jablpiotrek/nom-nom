# Turso database setup

You already have an **empty** Turso database. Connect the app in three layers: **credentials → schema → seed data**.

## 1. Get URL and token from Turso

### Option A — Turso CLI (recommended)

```bash
# Install CLI (once): https://docs.turso.tech/cli/overview
turso auth login

# List databases (find yours)
turso db list

# Database URL (copy the `libsql://...` value)
turso db show <your-database-name> --url

# Auth token for this app (copy the token string)
turso db tokens create <your-database-name>
```

### Option B — Turso dashboard

1. Open [Turso dashboard](https://turso.tech/app) → your database.
2. Copy the **libSQL URL** (starts with `libsql://`).
3. Create an **auth token** for that database and copy it (shown once).

## 2. Configure `.env` locally

From the project root:

```bash
cp .env.example .env
```

Edit `.env`:

| Variable             | Value                                                         |
| -------------------- | ------------------------------------------------------------- |
| `TURSO_DATABASE_URL` | Full URL from Turso, e.g. `libsql://nom-nom-yourorg.turso.io` |
| `TURSO_AUTH_TOKEN`   | Token from `turso db tokens create` (or dashboard)            |
| `SESSION_SECRET`     | Any long random string (used to sign session cookies)         |

**Do not commit `.env`.** Commit `.env.example` only.

## 3. Apply schema to the empty database

This repo ships an initial migration: `server/database/migrations/0000_init.sql`.

With `.env` filled:

```bash
npm install   # if needed
npm run db:migrate
```

That creates `games`, `names`, and `swipes` on Turso.

_(Alternative for a throwaway DB only: `npm run db:push` — skips migration files. For Vercel/production, prefer `db:migrate`.)_

## 4. Load baby names (seed)

Run once per database (or after you reset the DB):

```bash
npm run db:seed
```

## 5. Run the app

```bash
npm run dev
```

The API uses the same `TURSO_*` variables as Drizzle.

## 6. Vercel

In the project → **Settings → Environment Variables**, add for **Production** (and Preview if you use a separate Turso DB):

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `SESSION_SECRET`

Build command should run migrations before Nuxt build, e.g.:

`npm run db:migrate && npm run build`

(or use the `vercel-build` script in `package.json` if present).

**Preview deployments:** Use a **different** Turso database than production, or preview branches will run migrations against prod.

## Troubleshooting

- **`Please install '@libsql/client' for Drizzle Kit`** — From the project root run **`npm install`** or **`pnpm install`** so `node_modules/@libsql/client` exists. With **pnpm**, `package.json` → `pnpm.publicHoistPattern` hoists `@libsql/client` so `drizzle-kit` can resolve it; after changing that, reinstall: `rm -rf node_modules && pnpm install`.
- **`TURSO_DATABASE_URL is missing`** — `.env` not loaded; ensure file is at repo root and variable names match exactly.
- **`drizzle-kit` errors** — `drizzle.config.ts` loads `.env` via `dotenv`; run CLI commands from project root.
- **Seed fails on duplicate names** — normal if you ran seed twice; use a fresh DB or adjust seed logic.
