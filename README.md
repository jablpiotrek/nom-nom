# nom-nom 🍼

A Tinder-style app for couples to pick a baby name together.

One partner creates a game — choosing boy or girl and setting a shared PIN — and gets a game ID to share. Both partners join with the game ID + PIN, pick a role (mommy/daddy), and independently swipe right (like) or left (dislike) through a deck of names. Whenever both partners like the same name, it shows up as a match.

Built with [Nuxt](https://nuxt.com) and [Nuxt UI](https://ui.nuxt.com), using Turso (SQLite) for storage via Drizzle ORM.

## How it works

- **Create a game**: pick a sex (boy/girl) and set a PIN. You get a game ID.
- **Join a game**: enter the game ID and PIN from either partner's device.
- **Pick a role**: mommy or daddy — swipes are tracked per role so each partner's choices are independent.
- **Swipe**: like or dislike each name in the deck.
- **Matches**: names both partners liked appear on the matches page.

## Setup

Install dependencies:

```bash
npm install
```

## Database (Turso)

See **[docs/TURSO.md](./docs/TURSO.md)** — connect `.env`, run `db:migrate`, then `db:seed`.

**Vercel:** set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`, and use build command `npm run vercel-build`.

## Development Server

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

## Production

Build the application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
