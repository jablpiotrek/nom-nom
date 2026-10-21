---
name: review-performance
description: Performance-focused code review for nom-nom. Use when the user asks to review a diff, PR, branch, or specific files for performance, efficiency, speed, slowness, N+1 queries, bundle size, or unnecessary re-renders/re-fetches. Not for general correctness or security review — use review-security for that.
---

# Performance Review — nom-nom

Review the given diff/branch/files for performance problems only. Do not comment on security or general correctness unless it's also a performance issue — point the user to `/code-review` or `review-security` for those.

## Where this codebase tends to have performance issues

**Database (Drizzle/Turso, `server/api/games/[uuid]/*.ts`, `server/database/`)**
- N+1 queries: a loop issuing one query per row instead of a single `IN (...)`/join. Compare against `deck.get.ts` (batches swiped IDs into one `notInArray` query) and `matches.get.ts` (single join + `GROUP BY`/`HAVING`) as the existing good patterns.
- Missing `WHERE` narrowing before `.orderBy()`/`.all()` — fetching more rows than needed and filtering in JS instead of SQL.
- Repeated round-trips that could be one query (e.g. fetching a game, then separately checking something that could be a join or a single `with`).
- New columns used in `WHERE`/`JOIN`/`ORDER BY` that aren't covered by the `unique_swipe` index or an equivalent — check `server/database/schema.ts`.

**API routes**
- Returning more data than the client needs (e.g. full row objects instead of the `{ id, name }` shape used elsewhere).
- Sequential `await` calls that don't depend on each other — should be `Promise.all`.

**Nuxt/Vue client (`app/`)**
- `useFetch`/`$fetch` calls inside `onMounted`/watchers that re-fire on every render or every keystroke without debouncing (e.g. search/filter inputs).
- Large reactive objects/arrays (e.g. the swipe deck) being deep-copied or re-created unnecessarily on every swipe instead of mutating/slicing.
- Missing `v-memo`/`key` on list renders (`v-for` over names/matches) causing full re-renders of `SwipeCard`-style components.
- Client-side work that should be SSR'd (or vice versa) — check `definePageMeta`/`useFetch` usage against how `match.vue` and `[uuid]/index.vue` already do it.
- Importing something at module scope that's heavy and only used conditionally (hurts bundle size / cold start on serverless).

**i18n**
- Loading both locale files eagerly when only one is needed (shouldn't happen with `@nuxtjs/i18n`'s lazy loading — flag if a change bypasses it).

## How to review

1. Read the diff/files in full before judging — don't guess from function names.
2. For each finding, state: the concrete file/line, what makes it slow (extra round trip, O(n²), unnecessary re-render, etc.), and under what realistic data volume it matters (a 20-name deck is not the same risk profile as a 10k-row table — don't flag micro-optimizations that have no real effect at this app's scale).
3. Prefer the smallest fix that removes the inefficiency; suggest it, don't just name the problem.
4. If nothing material is found, say so plainly — don't invent marginal nitpicks to fill space.
5. Report findings with `ReportFindings` if that tool is available in this session and the surrounding review workflow expects it; otherwise list them clearly in the response, most impactful first.
