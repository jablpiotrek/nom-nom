# nom-nom

A Tinder-style app for couples to pick a baby name together. Create a game (boy/girl + PIN), both partners join, each swipes a shared deck of names as "mommy" or "daddy", and names both liked show up as matches.

## Stack

- Nuxt 4 + Nuxt UI v4 (`U*` components), Tailwind v4 utility classes — no raw CSS files, no other UI/component library.
- Drizzle ORM over Turso (libSQL/SQLite). Schema lives in `server/database/schema.ts`.
- `@nuxtjs/i18n` with `en` and `pl` locales (`i18n/locales/*.json`), `strategy: 'no_prefix'`.
- Server routes under `server/api/games/[uuid]/...`, one file per verb (`deck.get.ts`, `swipe.post.ts`, etc).

## Conventions

- `<script setup lang="ts">` everywhere, Composition API, no Options API.
- ESLint stylistic rules are enforced: no trailing commas, 1tbs brace style. Run `npm run lint` (auto-fixes) before considering work done.
- Every user-facing string goes through i18n (`$t(...)` / `useI18n()`), added to **both** `i18n/locales/en.json` and `i18n/locales/pl.json` in the same change. Never hardcode UI text.
- Game roles are the literal strings `'mommy' | 'daddy'`; sex is `'boy' | 'girl'`; swipe actions are `'like' | 'dislike'`. Reuse these union types from `server/database/schema.ts` instead of redefining them.
- Auth/session logic lives in `server/utils/auth.ts` (`verifyGameAuth`, `setGameCookie`, PIN hashing) and the `game-auth` / `home-resume-client` middleware. Server routes that touch a game must call `verifyGameAuth(event, uuid)` first.
- Client-side resume/role state goes through `useGameResume()` / `app/utils/gameResume.ts` — don't read/write localStorage or cookies directly from components.

## Database changes

1. Edit `server/database/schema.ts`.
2. `npm run db:generate` to create the Drizzle migration — never hand-write or hand-edit migration SQL.
3. `npm run db:migrate` to apply it locally.
4. Update `server/database/seed.ts` if the change affects seed data.

## Before finishing any task

- `npm run lint`
- `npm run typecheck`
- If you touched i18n strings, confirm both `en.json` and `pl.json` have matching keys.

## Useful commands

- `npm run dev` — dev server on `http://localhost:3000`
- `npm run db:studio` — inspect the local/remote DB
- `npm run db:seed` — seed name list
