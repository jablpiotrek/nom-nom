---
description: Implement a feature end-to-end following nom-nom's conventions, then verify with lint/typecheck.
argument-hint: <feature description>
---

Implement the following in nom-nom: $ARGUMENTS

Follow the rules in `CLAUDE.md`. Work in this order:

1. **Explore first.** Find the relevant pages (`app/pages/`), components (`app/components/`), composables (`app/composables/`), and server routes (`server/api/`) before writing anything. Mirror existing patterns (e.g. how `SwipeCard.vue`, `useGameResume`, or `server/api/games/[uuid]/*.ts` are structured) rather than inventing new ones.
2. **Schema first, if needed.** If the feature needs new/changed data, edit `server/database/schema.ts`, then run `npm run db:generate` to produce the migration (never hand-write migration SQL), then `npm run db:migrate`.
3. **Server routes.** One file per verb under `server/api/games/[uuid]/...`, call `verifyGameAuth(event, uuid)` before touching game data, reuse the `'mommy' | 'daddy'` / `'boy' | 'girl'` / `'like' | 'dislike'` union types from the schema.
4. **UI.** Use existing Nuxt UI (`U*`) components and Tailwind utility classes consistent with neighboring files — no new UI library, no raw `<style>` blocks unless the file already has one.
5. **i18n.** Add any new user-facing text to both `i18n/locales/en.json` and `i18n/locales/pl.json` with matching keys. Never hardcode strings in templates.

When the feature is implemented:

- Run `npm run lint` and fix anything it flags (it auto-fixes most style issues).
- Run `npm run typecheck` and fix any type errors.
- Double-check `en.json`/`pl.json` key parity if you touched either.
- Report back a short summary of what changed and which files were touched. Do not commit or push unless explicitly asked.
