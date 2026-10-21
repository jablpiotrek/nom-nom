---
name: ui-polish
description: Make nom-nom's UI prettier — spacing, visual hierarchy, animations, colors, icons, responsiveness — without changing any behavior or logic. Use when the user asks to improve the look, polish, make it prettier, tidy up styling, or improve the design of a page/component, and explicitly wants the logic left alone.
---

# UI Polish — visuals only, logic untouched

The rule for this skill: **if a change could affect what the app does, it's out of scope.** Only change how it looks.

## Allowed

- Tailwind utility classes: spacing, sizing, color, typography, radius, shadow, borders, responsive (`sm:`/`md:`/...) variants.
- Nuxt UI component **props that are purely presentational**: `variant`, `color`, `size`, `icon`, `class`, `ui` slot overrides. (See `app/pages/index.vue`, `app/pages/[uuid]/index.vue`, `app/components/SwipeCard.vue` for the existing component/prop vocabulary — stay consistent with it rather than introducing new patterns.)
- Transitions/animations that are cosmetic (`transition`, `duration-*`, Vue `<Transition>` wrappers, `vue3-flashcards` swipe-card visual config if it's a style-only option) as long as they don't change when/whether something happens, only how it looks while it happens.
- Reordering template markup for visual layout, as long as it doesn't change which elements are conditionally rendered or in what order data-dependent content appears.
- Icon choice (`i-lucide-*`), empty states, loading-state visuals (spinner styling, skeletons) — as long as the underlying `status === 'pending'` / `v-if` conditions stay the same.

## Not allowed — stop and ask if you think you need one of these

- Editing `<script setup>` logic: computed values, functions, API calls (`$fetch`, `useFetch`), event handler bodies, composables (`useGameResume`, etc.), validation rules, routing (`router.push`, `definePageMeta`).
- Changing props/emits signatures, component inputs/outputs, or the shape of data passed between parent/child.
- Adding/removing i18n keys or changing their meaning (changing *styling* around existing `$t(...)` calls is fine; changing the key or the English/Polish copy's meaning is not — a pure copy *typo* fix is fine, but confirm if the wording itself changes).
- Changing middleware (`game-auth`, `home-resume-client`), auth flow, or anything under `server/`.
- Changing which elements exist conditionally (adding a `v-if`/removing one) unless it is purely about showing/hiding a decorative element that carries no state.
- Changing DB schema, queries, or API contracts — this skill never touches `server/`.

## Workflow

1. Read the target file(s) fully first.
2. Make the visual change, keeping every `<script setup>` line byte-for-byte identical unless the user explicitly approved a logic change (in which case: that's no longer this skill — say so and switch to a normal implementation flow).
3. After editing, diff your own change mentally against the rule above: every line you touched in a `<script>` block should be justified as "this only affects presentation" (e.g. a new `ref` purely for a hover/open state is borderline — prefer CSS-only solutions like `:hover`/`group-hover` first, and only add trivial UI-only state if there's no CSS-only way).
4. Run `npm run lint` and `npm run typecheck` before reporting done.
5. In your summary, explicitly state that no logic was changed, and name the files touched.
