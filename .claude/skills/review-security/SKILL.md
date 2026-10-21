---
name: review-security
description: Security-focused code review for nom-nom. Use when the user asks to review a diff, PR, branch, or specific files for security, vulnerabilities, auth issues, or safe handling of PINs/sessions/cookies. Not for general correctness or performance review — use review-performance for that.
---

# Security Review — nom-nom

Review the given diff/branch/files for security problems only. Do not comment on performance or general style unless it's also a security issue.

## What "secure" means in this app, specifically

Games are protected by a **PIN only** (no email/password accounts), identified by a game `uuid` in the URL. The whole security model rests on: the PIN being hard to guess/brute-force, the session cookie being unforgeable, and one game's data being isolated from another's. Review against that model, not a generic checklist.

**PIN handling (`server/utils/auth.ts`, `server/api/games/[uuid]/verify-pin.post.ts`, `server/api/games/index.post.ts`)**
- PINs must go through `hashPin`/`verifyPin` (scrypt + per-game random salt, `timingSafeEqual` compare). Flag any code that compares PINs with `===`, stores a PIN in plaintext, or logs a PIN/pinHash.
- `verify-pin.post.ts` has no rate limiting — a short numeric PIN is brute-forceable. Flag any change that makes this worse (e.g. removing the generic 401, leaking whether a game exists vs. whether the PIN is wrong), and flag if the user is adding new unauthenticated endpoints without considering the same risk.
- PIN minimum length is enforced client-side only (`createPin.length < 4` in `app/pages/index.vue`). Any new client-only validation that isn't mirrored server-side is a gap — check whether the server route re-validates.

**Session/auth (`setGameCookie`, `createAuthToken`, `verifyGameAuth`, `middleware/game-auth.ts`)**
- The auth token is `HMAC(sessionSecret, uuid)` — deterministic per game, not a random per-session token. That means: (a) it never expires server-side except via cookie `maxAge`, (b) anyone who obtains one valid cookie for a game has permanent access until the cookie is cleared, (c) `SESSION_SECRET` compromise deauthenticates nothing retroactively. Flag any change that weakens this further (e.g. switching off `timingSafeEqual`-equivalent comparison, moving the secret into client-reachable code, or deriving the token from something guessable instead of the server-only secret).
- Every server route under `server/api/games/[uuid]/` that reads or writes game data must call `verifyGameAuth(event, uuid)` before doing anything else. Flag new routes that skip this, or that call it after already querying/mutating data.
- Cookie is set with `sameSite: 'lax'`, no `secure` flag pinned explicitly — check this still matches intent if cookie options change.

**Data isolation / IDOR**
- Every query filtering by game data must scope by `gameId`/`uuid` (see how `deck.get.ts` and `matches.get.ts` always include `eq(swipes.gameId, uuid)` or `eq(games.id, uuid)`). Flag any new query that joins/reads `names`, `swipes`, or `games` without a `gameId` filter — that's cross-game data leakage.
- `parent` (`mommy`/`daddy`) and `sex`/`action` values arriving from the client must be validated against the literal union (see the `['mommy','daddy'].includes(parent)` check in `deck.get.ts`) before use in a query — flag any new route that trusts a client-supplied enum-like field without validating it first.

**General web hygiene**
- No secrets (`SESSION_SECRET`, Turso tokens) should appear in client-bundled code, logs, or error messages sent to the client — `createError({ message: ... })` bodies are visible to the browser.
- Drizzle's query builder parameterizes values, so raw string concatenation into `sql\`...\`` is the thing to look for, not classic string-built SQL.
- Any new input (query params, body fields) should be checked for type/shape before use, matching the existing `if (!parent || !['mommy','daddy'].includes(parent))`-style guards.

## How to review

1. Read the diff/files in full before judging.
2. For each finding, state the concrete file/line, the exploit scenario in one sentence (who does what to get what), and the fix.
3. Separate "exploitable now" from "weakens defense in depth" — don't flag the known, accepted tradeoffs above (PIN-only auth, deterministic session token) as new findings unless the diff actually makes them worse.
4. If nothing material is found, say so plainly.
5. Report findings with `ReportFindings` if that tool is available in this session and the surrounding review workflow expects it; otherwise list them clearly, most severe first.
