# كراج · Karaj

A car servicing and maintenance marketplace for the Qatari market. Arabic-first, right-to-left by default, with an English toggle.

**Live:** _not deployed yet_ — see [Deployment](#deployment)
**Case study:** [`/about`](http://localhost:3000/about) on the running site

> Every workshop, price and review on this site is invented. What is real is the schema behind it, the migrations, and the scheduling logic.

<!-- Add `docs/screenshot-home.png` here once captured; see "Screenshots" below. -->

---

## What this is

Most maintenance apps present **a list of services**. This one presents **your car**, and the services hang off it.

There are two ways in, both derived from the content rather than bolted on top of it:

- **A spatial one.** The home page draws a car in line art with eight named zones, each bound to a service category through a `hotspot_key` column. Tap the front wheel for brakes, the bonnet for oil and filters.
- **A symptomatic one.** Ten symptoms, each with one narrowing question, ending in a plain-language verdict and one to three recommended services. Somebody whose car pulls to the right does not think "wheel alignment" — they think about what the car is doing.

---

## Quickstart

Requires Node 22+, pnpm, and Docker.

```bash
pnpm install
cp .env.example .env.local
pnpm db:reset
pnpm dev
```

`pnpm db:reset` starts Postgres in Docker, drops the schema, applies the committed migrations, and seeds a full dataset — 8 categories, 39 services, 14 workshops, 72 reviews, 58 vehicle models, and 12 bookings spread across every status.

> **Port note.** The container publishes Postgres on host port **5433**, because a system PostgreSQL install commonly already owns 5432. If yours is free, `KARAJ_DB_PORT=5432 pnpm db:up` and update `DATABASE_URL`.

### Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server on :3000 |
| `pnpm build` / `pnpm start` | Production build and serve |
| `pnpm db:reset` | up → drop → migrate → seed, from a clean clone |
| `pnpm db:generate` | Generate a migration from the schema |
| `pnpm test` | Vitest — 38 tests over the two logic modules |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint, including the RTL rule below |

---

## The parts worth looking at

Removing auth and payments removes most of the *visible* backend, so the parts that still prove it are made legible from the outside:

**[`src/server/services/availability.ts`](src/server/services/availability.ts)** — slot generation, and the one genuinely non-trivial piece of logic here. Opening hours are stored as local wall-clock time plus weekday, never as instants, and converted to UTC once at the boundary. A date-specific override table handles public holidays and Ramadan hours. A job must *finish* before closing, so a three-hour service is never offered at 19:30 against a 20:00 close. A midday break splits the day into two windows rather than blocking the slots that straddle it. Capacity is per bay. Covered by [24 tests](src/server/services/availability.test.ts).

**[`src/server/services/maintenance.ts`](src/server/services/maintenance.ts)** — next-due projection from odometer plus interval, where whichever threshold arrives first wins. That matters in Qatar: a car doing 6,000 km a year still needs its oil changed on the calendar, because the heat degrades it regardless of use. [14 tests](src/server/services/maintenance.test.ts).

**[`src/db/schema/`](src/db/schema)** — a real relational schema, one file per domain, with migrations committed to git.

**[`src/server/actions/create-booking.ts`](src/server/actions/create-booking.ts)** — every Server Action opens the same way: Zod parse, then rate-limit check. Prices and durations are re-derived from the database rather than accepted from the client, the slot is re-checked server-side because the picker was rendered from a snapshot, and the write is one transaction with price snapshots on the line items.

**[`src/db/seed.ts`](src/db/seed.ts)** — the seed is a design deliverable, not fixture data. Real Qatari makes and models, Doha zone numbers, plausible workshop names and hours, correctly written Arabic, and deliberately long names, because a layout tested on "Service 1" lies to you about truncation.

---

## Design decisions

**Why the car diagram.** The generic answer to this brief is a gradient hero, a centred headline, and a 3×3 grid of identical icon tiles. It is fast to build and it asks the visitor to already know what the part is called. The diagram and the symptom rail are both navigation, not decoration.

**Why no auth.** Half-built auth is worse than none — it invites a reviewer to test it and find the gaps. There is no users table, no sessions, no roles. The consequence is accepted openly: bookings are write-only from the public side, so the seed contains bookings in every status, which is what makes the status timeline visible in states the UI can never reach.

**Why no component library.** The brief was "not templated", and a reviewer recognises default shadcn instantly. The primitives here are about two hundred lines.

**Why no carousel library.** CSS scroll-snap handles the banner and the rails, is RTL-correct without configuration, and costs roughly nothing.

**Why Drizzle over Prisma.** The availability and next-due queries are SQL-shaped. Drizzle shows the SQL thinking instead of hiding it.

**Why no PostGIS.** With no coverage polygons to model, plain `lat`/`lng` with Haversine ordering is enough. Decided early so it never became a migration.

**Prices come from `provider_services`.** A "from 120 ر.ق" that no workshop actually charges is a lie. The figure shown is the cheapest price a real row carries.

### Right-to-left, properly

Arabic is the default locale and it is **not** prefixed — the canonical URL is `/`, not `/ar`. Locale detection is deliberately off: an Arabic-first site that redirects an English browser to the English build means nobody ever sees the build the design was made for.

Everything uses logical properties, and an ESLint rule fails the build on the Tailwind utilities that silently produce a correct-looking LTR layout and a broken RTL one — `ml-`, `pr-`, `left-`, `text-left`, `space-x-`, `border-l`, and the rest. It covers `cn()` arguments too, since that is where most conditional classes live.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15.5, App Router, React Server Components |
| Language | TypeScript, `strict`, no `any` |
| Database | PostgreSQL 16 (Docker), Drizzle ORM, migrations in git |
| Styling | Tailwind CSS v4, tokens as CSS custom properties |
| i18n | next-intl, `ar` default and unprefixed |
| Validation | Zod, one schema shared by form and Server Action |
| Tests | Vitest, on the two logic modules only |

No API routes — mutations are Server Actions. The single route handler is the cleanup cron, because Vercel Cron cannot invoke a Server Action.

---

## Intentionally out of scope

These were cut on purpose, not left unfinished. Each costs a week and produces nothing a reviewer can see.

- **Authentication** — no users table, no sessions, no roles.
- **Payments** — prices are displayed, nothing is charged. No payment abstraction layer either; an interface with one stub implementation is dead code.
- **Admin panel** — all content comes from the seed. Content management is invisible work.
- **Provider dashboard**, auctions, parts marketplace, notifications, email/SMS, chat, live tracking, PWA offline.

### Known limitations, stated plainly

- **Rate limiting is in-memory**, a fixed window keyed by IP ([`src/server/rate-limit.ts`](src/server/rate-limit.ts)). On a multi-instance deployment each instance enforces its own limit, and a cold start resets it. A real product would put this in Redis. For a demo whose write path creates rows nobody reads, this is the right amount of machinery.
- **The garage is `localStorage`** and does not survive a change of browser. The UI says so rather than pretending otherwise.
- **Booking lookup is `code + last 4 digits of phone`.** That is not authentication, and the interface does not imply it is.
- **Anyone can create bookings on a live URL.** Hence the rate limit and a nightly cleanup ([`/api/cron/cleanup`](src/app/api/cron/cleanup/route.ts)) that deletes public bookings older than 7 days. Seeded rows carry `source = 'seed'` and are never swept — without that, the cleanup would empty the status timeline for every future visitor.

---

## Deployment

Local Postgres in Docker is the development setup. The live path:

1. Create a Neon (or Supabase) Postgres instance.
2. Put its URLs in `.env.production` (gitignored) — `DATABASE_URL` for the pooled endpoint, `DATABASE_URL_UNPOOLED` for the direct one.
3. `pnpm db:migrate:prod`, then **once**, explicitly, `pnpm db:seed:prod`. Never automatic on deploy.
4. On Vercel set `DATABASE_URL` (pooled), `NEXT_PUBLIC_SITE_URL`, and `CRON_SECRET`.
5. `vercel.json` registers the daily cleanup cron at 02:00 UTC.

**Two endpoints, two drivers.** The pooled endpoint goes through pgbouncer in transaction mode, which does not keep a session across statements — so migrations and the seed use the direct endpoint, and the runtime client turns off prepared statements whenever the URL points at a pooler.

On top of that, the CLI scripts pick a *driver*: postgres.js over the wire protocol on port 5432, or Neon's SQL-over-HTTPS on 443. A `*.neon.tech` host defaults to the HTTP one, because plenty of networks — corporate egress filters, some VPNs — accept the TCP handshake on 5432 and then reset the connection as soon as they see non-HTTP bytes. Force either with `DATABASE_DRIVER=postgres|neon-http`. The HTTP driver has no transactions; nothing in the seed needs one, but anything added later that does must use `postgres`.

Catalog pages use `generateStaticParams` with hourly ISR — 80+ service pages and 28 workshop pages are prerendered at build. Only `/book`, `/booking/[code]`, `/track` and `/workshops` (which is a search page) are dynamic. A cold free-tier Postgres can take a second to wake, and static catalog pages mean the first impression never waits on it.

---

## Screenshots

_To capture:_ home at 390×844 (Arabic), the car diagram with a zone selected, the booking sheet mid-flow, and a workshop profile in English. Plus a ~20-second screen recording of the diagram and the booking sheet — that is what actually gets shared in a message; most people never open the link.

---

## Verified

- `pnpm audit` — 0 advisories
- `pnpm test` — 38 passing
- `pnpm typecheck` — clean
- `pnpm lint` — clean
- `pnpm build` — succeeds; 156 sitemap entries across both locales
- No horizontal scroll at 320px on any page, in either direction
- A booking round-trips through Postgres and is retrievable by code at `/track`
