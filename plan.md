# plan.md — Car Services & Maintenance Platform (Portfolio Build)

> Working name: **كراج / Karaj** (placeholder).
> Market context: Qatar. Arabic-first, RTL by default, English toggle.
> Stack: Next.js (App Router) · TypeScript · PostgreSQL (local, Docker) · Drizzle ORM · Tailwind CSS.
> **No authentication. No payments. No admin panel.** This is a portfolio piece.

---

## 1. What changes because this is a portfolio piece

The audience is no longer a car owner in Doha. It is a **hiring manager or client who will spend 40–90 seconds on the live URL**, on a phone, probably without reading Arabic. That inverts several priorities:

| Real product | Portfolio build |
|---|---|
| Correctness and edge cases win | **First impression and visual craft win** |
| Auth, payments, admin are table stakes | They are invisible in a screenshot — cut them |
| Empty states are an operational problem | Empty states never happen; the seed data is always full |
| Deployment is a later phase | **Deployment is part of the definition of done** — a portfolio project nobody can open does not exist |
| Scope grows over time | Scope is fixed and finishable in a known number of weeks |

### What stays, and why
Removing auth and payments removes most of the visible backend. Since the point of this project is also to show full-stack capability, the parts that still prove it are kept deliberately and made **legible from the outside**:

- A real relational schema with migrations in git (not JSON files pretending to be a database)
- Server Components fetching from Postgres via Drizzle — no client-side fetch waterfall
- Server Actions with Zod validation and a real error path
- One piece of genuinely non-trivial server logic: **slot availability generation** (§9). This is the thing that separates "styled a static page" from "built an application"
- A seed script that produces a full, realistic dataset in one command

These are documented in the README (§12) because otherwise nobody notices them.

---

## 2. Scope

### In
- Home with the interactive car diagram (§7)
- Symptom-based navigation ("سيارتي تسحب لليمين") → recommended services
- Service catalog: categories → services, with fixed / "starts from" / quote-only pricing
- Workshop directory: profiles, hours, coverage, ratings, filtering and sorting
- **Guest booking flow** — service → workshop → date/time slot → contact details → confirmation, with a lookup code. Writes to Postgres. No account.
- **Booking lookup** — enter the code + phone, see the booking and its status timeline
- **Demo garage** — add a car (make/model/year/plate/odometer), see a maintenance timeline and computed next-due items. Stored in `localStorage`, no server, no account
- Promo banner rail (animated, as briefed)
- English/Arabic toggle across every screen
- Deployed live URL + README case study

### Out — deliberately
- **Authentication.** No users table, no sessions, no password hashing, no roles.
- **Payments.** Prices are displayed; nothing is charged. No payment abstraction layer either — an interface with one stub implementation is dead code in a portfolio repo.
- **Admin panel.** All content comes from the seed. Content management is invisible work that no viewer will ever see.
- **Provider dashboard.** Optional single-screen exception in §11 if a dense-data screen is wanted for the portfolio; not part of the base plan.
- **Auctions / parts marketplace.** The brief references مزاد قطر as a *style* reference only. Auctions are a separate product (listings, bids, closing logic, disputes) and would consume the entire timeline.
- Notifications, email, SMS, chat, live tracking, PWA offline.

### Consequences to accept openly
- Bookings are write-only from the public side and can never change status through the UI. The status timeline is therefore **seeded to show all states** across different demo bookings, so the component is visible in every state without an admin.
- The demo garage does not survive a browser change. That is fine and should be stated in the UI ("بيانات تجريبية محفوظة في متصفحك").
- Anyone can create bookings on the live site. Add basic rate limiting and a nightly cleanup of rows older than 7 days (§9), or the demo database fills with junk.

---

## 3. Stack decisions

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15, App Router, RSC | Server Components keep the catalog fast; Server Actions remove the need for an API layer |
| Language | TypeScript, `strict: true` | — |
| Styling | Tailwind CSS v4 + CSS variables for tokens | Tokens in CSS vars so theming and RTL overrides live in one place |
| DB (dev) | PostgreSQL 16 via Docker Compose | As specified; pin the exact minor version |
| DB (live) | Neon or Supabase free tier, same schema, same migrations | See §10 — this is the one addition the portfolio requirement forces |
| ORM | Drizzle + drizzle-kit | SQL-shaped, typed, migrations committed to git |
| Validation | Zod, shared between form and Server Action | One schema, no drift |
| Motion | `motion` (Framer Motion), used sparingly — §8 | |
| Icons | Lucide + a **custom car-part icon set** (no stock set has "brake pad" or "radiator") |
| Images | `next/image`; all assets committed, no uploads |
| i18n | `next-intl` with a `[locale]` segment |
| Tests | Vitest on `availability.ts` and `maintenance.ts` only | Two focused test files read better in a repo than 40 shallow ones |

### Rejected
- **A separate backend (NestJS/Express).** No second consumer. Server Actions plus a thin `src/server/` layer is the correct size, and an over-architected portfolio repo signals worse than a right-sized one.
- **Prisma.** Availability and next-due queries are SQL-shaped; Drizzle shows the SQL thinking.
- **A component library (MUI / Chakra / stock shadcn styling).** The brief is "not templated" — a prebuilt kit defeats it, and a reviewer recognises default shadcn instantly. Radix primitives for behaviour (dialog, popover, select) are fine; none of the styling.
- **A carousel library.** CSS scroll-snap handles the banner and rails, RTL-aware, ~0 KB.
- **PostGIS.** With no real coverage polygons to model, plain `lat`/`lng` + Haversine ordering is enough. Decided now so it never becomes a migration.
- **Auth "just in case".** Half-built auth is worse than none: it invites the reviewer to test it and find the gaps.

---

## 4. Local environment

```
docker-compose.yml       postgres:16-alpine, volume, port 5432
.env.example             DATABASE_URL, NEXT_PUBLIC_SITE_URL
drizzle/                 generated migrations (committed)
src/db/schema/           one file per domain, barrel-exported
src/db/seed.ts           the whole dataset
```

Rules:
- Schema changes go through `drizzle-kit generate` → committed migration.
- `pnpm db:reset` = drop → migrate → seed, working from a clean clone in one command. This command is in the README and a reviewer will run it.
- **The seed is a design deliverable, not fixture data.** Real Qatari make/model list, Doha zone numbers, plausible workshop names and hours, correctly written Arabic service names, sensible QAR prices, varied rating counts, at least 12 workshops and 30 services. A layout tested on "Service 1" and Lorem ipsum lies to you about line length, truncation, and density — and a reviewer spots placeholder text in two seconds.

---

## 5. Data model

Money as `numeric(10,2)` in QAR; timestamps `timestamptz` stored UTC, rendered `Asia/Qatar`.

**Catalog**
- `service_categories` — parent_id (self-ref, 2 levels max), slug, name_ar, name_en, icon_key, **`hotspot_key`** (links a category to a zone on the car diagram — §7), sort
- `services` — category_id, slug, name_ar/en, summary_ar/en, price_mode `fixed|from|quote`, base_price, duration_min, delivery_modes `text[]`
- `symptoms` + `symptom_services` — symptom-first navigation
- `maintenance_rules` — service_id, interval_km, interval_months (drives next-due in the demo garage)
- `vehicle_makes`, `vehicle_models` — reference data for the garage form

**Marketplace**
- `providers` — name_ar/en, slug, logo, cover, about_ar/en, lat, lng, zone, phone, is_verified, rating_avg, rating_count
- `provider_hours` — provider_id, weekday, opens_at, closes_at, is_closed
- `provider_services` — provider_id, service_id, price, duration_min
- `reviews` — provider_id, rating 1–5, author_name, body_ar, created_at (seeded)

**Bookings** (guest, no user table)
- `bookings` — code (`KRJ-8F2A`), contact_name, contact_phone, vehicle_label (free text from the form), provider_id, mode `at_center|mobile|pickup`, scheduled_at, status, subtotal, total, notes, created_at
- `booking_items` — booking_id, service_id, **name/price snapshot**

**Content**
- `banners` — image_ar/en, title, link, sort, is_active

No `users`, `sessions`, `addresses`, `payments`, `notifications`, or `audit_log`. Lookup is `code + last 4 digits of phone` — enough for a demo, and honest about being a demo.

**Status values** — `requested | confirmed | in_progress | completed | canceled`. Not a transition machine in this build; the seed contains bookings in each state so the timeline component is fully visible.

---

## 6. Route map

```
src/app/[locale]/
  page.tsx                        home
  services/page.tsx
  services/[category]/page.tsx
  services/[category]/[service]/page.tsx
  symptoms/[slug]/page.tsx
  workshops/page.tsx              filter + sort
  workshops/[slug]/page.tsx
  offers/page.tsx
  book/page.tsx                   guest booking flow (also intercepted as a sheet)
  booking/[code]/page.tsx         confirmation + status timeline
  track/page.tsx                  lookup by code + phone
  garage/page.tsx                 localStorage demo garage
  about/page.tsx                  short case-study page, linked from the footer
```
No route groups needed — there is only one shell. No API routes. Mutations are Server Actions in `src/server/actions/`.

---

## 7. Design direction

### The idea in one line
Most maintenance apps present **a list of services**. This one presents **your car** — and the services hang off it.

### Palette — cool workshop light, not the warm-cream default
```css
--paper:   #F1F4F3   /* cool off-white, faint green-grey */
--surface: #FFFFFF
--ink:     #0E1F26   /* deep petrol — text and dark surfaces */
--steel:   #5D6E73   /* secondary text */
--line:    #D8DEDC
--marker:  #F2B705   /* mechanic's paint-marker yellow — attention only */
--ok:      #2E7D5B   --due: #C0392B   --wait: #B26B00
```
`--marker` never fills a large area and appears at most **twice per viewport** — it means "look here / due now". Dark sections use `--ink`, never a tinted near-black.

### Type
- **IBM Plex Sans Arabic** — one family, whole interface, weights 400/600/700. Chosen because it is engineered rather than decorative, has a properly drawn Arabic cut, and pairs exactly with its Latin sibling for the language toggle.
- **IBM Plex Mono** — restricted to fixed-width alphanumerics only: plate numbers, odometer, booking codes, totals. Used because those strings are read digit-by-digit and must align — not as decoration for labels.
- Scale (rem): 0.8125 / 0.9375 / 1 / 1.25 / 1.625 / 2.25 / 3.25. Arabic body line-height 1.75. Max line length 68ch.
- No ALL-CAPS labels (meaningless in Arabic anyway), no single accented word in a headline, no eyebrow label above every heading.

### Shape & shadow (the brief asks for shadows, so they are designed rather than sprinkled)
Radius encodes hierarchy: sheets 20px · cards 12px · inputs 8px · chips 999px.
Three elevations, tinted with the ink hue rather than grey:
```css
--e1: 0 1px 2px rgba(14,31,38,.06);          /* resting card */
--e2: 0 4px 16px -4px rgba(14,31,38,.12);    /* raised / hover */
--e3: 0 24px 48px -12px rgba(14,31,38,.22);  /* sheets, modals */
```
If everything has a shadow, nothing is elevated.

### Home — mobile (primary)
```
┌──────────────────────────────┐
│  ☰            كراج        AR │
├──────────────────────────────┤
│      ╭────────────────╮      │  ← hero: line-art car,
│     ╱   ◯          ◯   ╲     │    tappable zones, blueprint
│    │  ●        ●    ●  │     │    strokes on --paper
│     ╲__◯__________◯___╱      │    ● = service hotspot
│   « اضغط على الجزء الذي      │
│      تحتاج صيانته »          │
├──────────────────────────────┤
│ ما الذي تشعر به؟             │
│ ⟨ صوت غريب ⟩⟨ تسحب لليمين ⟩ →│  ← symptom chips, h-scroll
├──────────────────────────────┤
│ ▓▓▓▓ banner rail ▓▓▓  ● ○ ○  │
├──────────────────────────────┤
│ ورش قريبة منك                │
│ ┌────────┐┌────────┐┌───────  │
│ │ 4.8 ★  ││ 4.6 ★  ││        │  ← snap rail, not a grid
│ │ 2.1 كم ││ 3.4 كم ││        │
│ └────────┘└────────┘└───────  │
├──────────────────────────────┤
│  الرئيسية  الخدمات  كراجي  ⚙ │
└──────────────────────────────┘
```

### Home — desktop
```
┌────────────────────────────────────────────────────────────┐
│  كراج        الخدمات  الورش  العروض   تتبع حجزك    AR|EN   │
├──────────────────────────┬─────────────────────────────────┤
│    ╭──────────────╮      │  احجز صيانة سيارتك              │
│   ╱  ◯        ◯   ╲      │  في أقل من دقيقة                │
│  │ ●     ●     ●  │      │                                 │
│   ╲__◯________◯__╱       │  [ ابدأ الحجز ]                 │
│   (interactive diagram)  │  أو اختر الجزء من الرسم →       │
├──────────────────────────┴─────────────────────────────────┤
│  زيت ومرشحات   │  إطارات وفرامل  │  تكييف   │  كهرباء      │
│  من 120 ر.ق    │  من 90 ر.ق      │ من 150   │ عرض سعر      │  ← asymmetric,
└────────────────────────────────────────────────────────────┘     sized by demand
```
Right-aligned (RTL), ragged-left, never centered body text. Prices align to the start edge of their column.

### Why this isn't the default
The generic answer to this brief is a gradient hero, a centered headline, a 3×3 icon grid, and identical rounded cards under the same grey shadow. This plan replaces the icon grid with **two content-derived navigation models** — spatial (the car diagram) and symptomatic (what you feel) — because that is how a car owner actually thinks. Neither is decoration; both are the navigation.

### The four presentation devices ("أساليب عرض حديثة")
1. **Interactive car diagram** — SVG line art with named zones (`hood`, `wheel-fl`, `brakes`, `ac`, `battery`, `body`, `interior`) mapped to `service_categories.hotspot_key`. Tap/hover highlights the zone and slides in a card with that zone's services and a "from X ر.ق". Zones are real `<button>`s with a logical tab order and visible focus.
2. **Symptom chips** — horizontal snap rail; tapping opens a short guided narrowing ("متى يحدث الصوت؟ عند الفرملة / عند الانعطاف") ending in 1–3 recommended services. Strongest differentiator against competitors, and cheap: static decision data, no ML.
3. **Demo garage timeline** — one car, a vertical timeline of past services and forward-projected due items computed from odometer + `maintenance_rules`. Due items are the only place `--marker` appears at rest.
4. **Booking sheet** — the whole flow lives in one bottom sheet on mobile / side panel on desktop, summary always visible, steps transitioning inside the sheet with a shared-layout animation. No page-to-page wizard.

---

## 8. Motion spec

The brief asks for smooth button motion and moving banners. The failure mode is fade-up-on-scroll applied to every section: it reads as templated and drops frames on a mid-range Android — the exact device a reviewer opens the link on.

**Budget: one orchestrated non-user-triggered moment per page.** On home that moment is the car diagram drawing itself in on first load (`stroke-dashoffset`, ~600ms, once per session). Everything else responds to an action.

| Interaction | Motion |
|---|---|
| Button press | scale 0.97, 120ms, `cubic-bezier(.2,.8,.2,1)`; elevation drops one step |
| Hotspot select | zone stroke thickens + fill tint, 160ms; detail card slides from the **inline-end** edge |
| Banner rail | CSS scroll-snap, auto-advance 6s; pauses on hover, focus, touch, hidden tab, and reduced-motion |
| Sheet open | translateY + `--e3`, 260ms; backdrop fades 180ms |
| Booking step | `layoutId` shared-element on the summary bar |
| Loading | skeletons matching the real layout, never a centered spinner |

Hard rules: `transform`/`opacity` only, no layout-animating properties, everything behind `prefers-reduced-motion`. In RTL all `x` values flip sign — wrap Framer usage in a `useDirectionalMotion()` helper instead of hand-flipping at 40 call sites.

---

## 9. Server architecture

```
src/server/
  services/
    availability.ts    slot generation: provider_hours × service duration × existing bookings
    maintenance.ts     next-due from odometer + maintenance_rules
    pricing.ts         line items, totals, snapshots
    booking-code.ts    collision-safe short code generation
  actions/
    create-booking.ts  zod parse → rate limit → insert → revalidate → redirect to /booking/[code]
    lookup-booking.ts
```
Every Server Action begins with the same two lines: Zod parse, rate-limit check. There is no session to check in this build, which makes **rate limiting non-optional** — a public, unauthenticated write endpoint on a live URL will be found. In-memory limiter keyed by IP is enough (single instance); document the limitation in the README rather than pretending otherwise.

**Availability is the one hard piece of logic and the main backend signal in the repo.** Store hours as local `time` + weekday, generate slots in UTC, never hand-roll timezone math (`date-fns-tz`, `Asia/Qatar`). Include a `provider_hour_overrides` table for closed days and Ramadan hours — it is a small table that makes the logic look considered rather than naive.

**Housekeeping:** a `/api/cron/cleanup` route (Vercel cron, daily) deleting demo bookings older than 7 days. Two dozen lines that keep the live demo clean for months.

---

## 10. Deployment — part of the scope, not an afterthought

Local Postgres in Docker is the development setup, as specified. But a portfolio project has to be openable from a link in a message, so the live path is:

- **Vercel** for the app; **Neon** (or Supabase) free tier for Postgres — same schema, same committed migrations, seed run once against it.
- `pnpm db:seed:prod` is a separate, explicit command. Never automatic on deploy.
- Static-first rendering: catalog pages use `generateStaticParams` and ISR. Only `/book`, `/booking/[code]`, and `/track` are dynamic. A cold Neon free-tier instance can take a second to wake — static catalog pages mean the first impression never waits on it.
- Custom domain if available; a `vercel.app` subdomain is acceptable but a real domain reads better.
- OG image and favicon done properly — the link preview is the first thing anyone sees, before the site itself.

---

## 11. Milestones

| # | Milestone | Contents | Done when |
|---|---|---|---|
| 0 | Foundation | Repo, Docker Postgres, Drizzle, migrations, **full realistic seed**, i18n, CSS-var tokens, fonts subset + preloaded | `pnpm db:reset && pnpm dev` works from a clean clone |
| 1 | Design system | Primitives + `/dev/kitchen-sink` + RTL/LTR audit | Every component state renders correctly in both directions |
| 2 | Car diagram | SVG asset, zone mapping, hover/tap/keyboard, detail card | Works on touch, mouse, keyboard, and at 320px |
| 3 | Catalog | Home, categories, service detail, symptoms, workshops list + filters + profile, banners | Lighthouse mobile ≥ 90 perf / 100 a11y |
| 4 | Booking | Availability logic + tests, guest sheet flow, confirmation, status timeline, `/track` | A booking round-trips through Postgres and is retrievable by code |
| 5 | Demo garage | Add car, localStorage persistence, maintenance timeline, next-due | Timeline is legible with 1 car and with 8 service records |
| 6 | Ship | Deploy, seed prod, cleanup cron, rate limit, 404/500, OG image, README case study, screenshots | The link opens on a phone and looks finished |

Milestones 1 and 2 decide whether the brief is met. Do not compress them to reach the booking flow faster — the booking flow is the part every competitor already has.

**Optional milestone 7 — one workshop screen.** A single read-only "incoming orders" table (dense data, filters, status pills) if a dense-data UI is wanted alongside the consumer surface. One screen, no auth, seeded data, linked from the case-study page as a demo. Take this only if milestones 0–6 are finished; a half-built dashboard damages the portfolio more than its absence.

---

## 12. The repo and case study are part of the deliverable

Half of what a reviewer judges is never seen in the browser:

- **README** with: one screenshot above the fold, the live link, a 3-line description, the stack, `pnpm db:reset` quickstart, a short "design decisions" section (why the car diagram, why no auth), and an explicit **"what's intentionally out of scope"** list. Stating that auth and payments were cut on purpose is the difference between "unfinished" and "scoped".
- **Clean commit history.** Not one "initial commit" with 8,000 lines.
- **`/about` case-study page** on the site itself: the problem, the two navigation models, before/after of the generic approach, and the performance numbers.
- **3–4 screenshots** at real device sizes, plus a 20-second screen recording of the car diagram and the booking sheet. The recording is what gets shared in a message; most people never open the link.

---

## 13. Risks — what will actually go wrong

1. **The car diagram is the entire differentiator and the single biggest failure risk.** It needs a well-drawn SVG with named, hit-testable zones that reads at 320px. A traced stock image with 4,000 path nodes will be heavy and unmaintainable. Produce this asset in milestone 0–2, not week 8. Fallback if it can't be made good: promote the symptom rail to hero with an asymmetric category board — decided early, not improvised late.
2. **Without auth and payments, the project can read as a mockup.** Mitigation is §1: real schema, real migrations, real availability logic, and a README that points at them. If the repo looks like a styled static site, the full-stack signal is lost even though the work was done.
3. **Animation as a liability.** Adding motion is trivial; making it hold 60fps on a mid-range Android is not — and that is the device the link gets opened on. Keep the §8 budget. If a section needs an entrance animation to be interesting, the section is not interesting.
4. **RTL will break in ways that look fine on your screen.** Guaranteed offenders: `space-x-*` and `divide-x-*` (ban via ESLint), `left/right` instead of `start/end`, absolutely positioned badges, chevrons pointing the wrong way, `scrollLeft` sign differences between Chrome and Safari in RTL, Framer `x:` values. Logical properties everywhere, plus a kitchen-sink check in both directions each milestone.
5. **Arabic webfonts are heavy** — an unsubsetted family with 5 weights is 400 KB+. Self-host, subset to Arabic + Latin + digits, 3 weights, `font-display: swap`, preload the two used above the fold.
6. **Thin seed data ruins the design.** Three workshops make the workshop rail look broken; short names hide truncation bugs. The seed needs volume and variety, including deliberately long Arabic names.
7. **A public unauthenticated write endpoint on a live URL will be abused.** Rate limit + daily cleanup, in milestone 6, not later.
8. **Neon free tier cold starts.** Static/ISR catalog pages so the first paint never waits on the database.
9. **Scope creep from "مزاد" and from "just add login".** Both are out. Adding login to a portfolio piece adds a week and zero screenshots.
10. **Finishing matters more than adding.** An unfinished ambitious project scores below a finished modest one. Milestone 6 ships even if milestone 7 never happens.

---

## 14. Quality floor (definition of done, every milestone)

- Renders correctly 320px → 1920px; no horizontal scroll at any width
- Full keyboard operation with visible `:focus-visible`, car diagram included
- `prefers-reduced-motion` respected everywhere
- AA contrast on all text, including on `--marker` and `--ink` surfaces
- Every list has a skeleton; every form has field-level Arabic error text
- No `any`; no unhandled promise; no Server Action without a Zod parse
- Lighthouse mobile: perf ≥ 90, a11y 100, best practices ≥ 95
- Both `ar` and `en` render every screen without overflow or clipped text
