# BearBnB Guest Client Build

> The definitive Psychic framework reference app. A developer clones BearBnB, follows the commit history, and understands every major Psychic pattern.

Generated through `/office-hours` → `/plan-ceo-review` → `/plan-eng-review` → `/plan-design-review` on 2026-03-24.

## Vision

The definitive Psychic framework reference app. A developer clones BearBnB, follows the commit history, and understands every major Psychic pattern: the type-safety pipeline (migration → Dream → Serializer → Controller → OpenAPI → Zustand), background workers, WebSockets, Firebase Auth integration, i18n, STI, soft delete, sortable, and feature specs. The commit history IS the tutorial. The "money shot" is adding an enum value and watching it cascade through every layer — including triggering an i18n type failure.

## Build Sequence

1. **OpenAPI → Zustand setup** — `pnpm psy setup:sync:openapi-zustand` + `pnpm psy sync`. Own commit showing the full generated output.
2. **price_per_night migration + seed data** — Add `price_per_night:integer` to Places (own commit). Seed Hosts, Places with prices, Rooms of all STI types, localized text, Guests.
3. **Firebase Auth** — Emulator config, Koa middleware for token verification, `firebase_uid` on User model (unique index), spec helper that stubs middleware to return known test user. Auto-creates User + Guest on first auth.
4. **FavoritePlace** — Generate resource: `User:belongs_to Place:belongs_to` (unique index on [user_id, place_id]). Place HasOne `currentUserFavorite` with `DreamConst.passthrough` `and` condition. Place summary serializer `rendersOne('currentUserFavorite')`. Guest PlacesController passes `.passthrough({ userId: this.currentUser?.id })`.
5. **Browse listings** — Listing grid with dark mode toggle, responsive (3/2/1 col), loading skeletons, empty state ("No dens found"), 503 retry utility, live filtering, load more pagination. ASCII art thumbnail in cards. Favorite heart toggle (optimistic UI).
6. **Place detail page** — Two-column layout (60% content / 40% sticky booking widget). Rooms rendered by STI type, localized text, locale switcher (EN/ES pill toggle via Accept-Language header on fetch).
7. **Booking flow** — Generate Booking resource (own commit): `Guest:belongs_to Place:belongs_to arrive_on:date depart_on:date adults:integer cubs:integer deleted_at:date:optional`. Route: `v1/guest/bookings`. Reservation form, date picker, confirmation. Mobile: fixed bottom bar with price + "Reserve" → booking sheet.
8. **Reviews** — Generate Review resource (own commit): `Guest:belongs_to Booking:belongs_to rating:integer body:text`. Public-facing read-only nested resource with pagination. Linked to Booking (one-review-per-stay, verified-stay).
9. **Search/filters** — Query scopes for place style, sleeps, price range. Live filter UI. Pagination for listings.
10. **ASCII art workers** — Background job enqueued on Place create, generates ASCII art, stores result on Place.
11. **WebSocket notifications** — Channel pushes `art_ready` to frontend when art is generated. Client component manages WebSocket connection, updates Zustand store.
12. **OpenAPI docs page** — Developer-facing. Multi-spec selector dropdown: default, mobile, admin, internal, tests. Shows the multi-spec story (mobile uses string enums for Kotlin/Swift brittleness).
13. **Pipeline cascade commit** — Add `honeypot` to `appliance_types_enum` via `DreamMigrationHelpers.addEnumValue`. Walk through every changed file in commit message including i18n type failure in primary locale file (teaching moment about secondary locale gap).
14. **Feature specs** — Written alongside each feature using Vitest + Puppeteer. Final pass for cross-feature integration tests.

## Architectural Decisions

- **Public browse with optional auth:** Guest PlacesController extends UnauthedController. Has a `currentUser` getter that does NOT 401 when no user found. Logged-in users see favorite indicators; anonymous users don't.
- **Auth mocking:** Stub Firebase token verification at the Psychic middleware level. Specs never hit Firebase.
- **Auth → User mapping:** `firebase_uid` stored on User model with unique index. Middleware: `findOrCreate` User + Guest from Firebase token on first auth.
- **Locale detection:** Accept-Language header set per-request on fetch calls from the frontend.
- **WebSocket in Next.js:** Client component (or React context provider) manages WebSocket connection, updates Zustand store on message receipt.
- **Infrastructure:** Redis already required and configured (`api/src/conf/initializers/workers.ts` and `websockets.ts`). Workers and WebSocket channels extend existing infrastructure.
- **503 retry:** Single client-side utility with exponential backoff, used by both Zustand API calls and WebSocket reconnection.
- **Commit discipline:** New/complex generators get own commits with exact commands in console code blocks. `setup:sync:openapi-zustand` combined with `pnpm psy sync` to show full effect. Already-demonstrated patterns can be brief.
- **FOR_THE_PSYCHIC_SKILL.md:** Document learnings about Dream/Psychic patterns during implementation for future agents building Dream/Psychic projects.

## UI/UX Design Specs

### Navigation
- Persistent navbar: brand (Fraunces 24px, honey) | Explore | Trips | Login/Avatar
- Mobile: brand + hamburger menu

### Page Layouts
- **Browse:** Search pill (centered) → filter chips (horizontal scroll) → listing grid → load more button
- **Place detail:** Desktop: 2-col (60% content / 40% sticky booking widget). Mobile: single col, fixed bottom bar with price + "Reserve" (opens booking sheet)
- **Auth pages:** Centered 400px card on desktop, full-width on mobile
- **My Bookings:** Card list with status badges (honey=pending, forest=confirmed, stone=past)
- **OpenAPI docs:** Developer-facing, spec selector dropdown + documentation UI

### Interaction Behaviors
- **Search/filters:** Live filtering (results update as user types/selects)
- **ASCII art:** Thumbnail preview in listing cards, full display on detail page
- **Pagination:** "Load more" button (preserves scroll position for back button)
- **Favorite toggle:** Optimistic UI — heart fills immediately (campfire color), pulses while saving. Toast on error.
- **Locale switcher:** Pill toggle near page header, EN/ES. Brief fade transition on text change.
- **Dark mode:** CSS custom property toggle, instant transition (0.3s ease-out per DESIGN.md)
- **503 retry:** "Bears are hibernating momentarily..." with exponential backoff, auto-retry

### Interaction States

| Feature | Loading | Empty | Error | Success | Partial |
|---------|---------|-------|-------|---------|---------|
| Browse grid | Skeleton cards | "No dens found" + clear filters CTA | Error boundary + retry | Card grid | Paginated |
| Place detail | Skeleton layout | N/A (404) | "Den not found" page | Full page | N/A |
| Booking widget | Dates loading | N/A | Validation errors inline | "Booking confirmed!" | N/A |
| Reviews | Skeleton list | "No reviews yet — be the first!" | Error boundary | Review list | Paginated |
| Search/filters | Skeleton cards | "No dens match" + try different CTA | Error boundary | Filtered grid | N/A |
| Favorite toggle | Heart pulses | N/A | Toast "Couldn't save" | Heart fills (honey) | N/A |
| Locale switch | Brief fade | N/A | Falls back to EN | Text updates | N/A |
| ASCII art | "Generating your view..." | N/A | "Art unavailable" | Art displayed | WS push |
| Auth (login) | Button spinner | N/A | "Invalid email or password" | Redirect to browse | N/A |
| My Bookings | Skeleton list | "No trips yet — find your den!" | Error boundary | Booking list | N/A |
| 503 retry | "Bears hibernating momentarily..." | N/A | "Check connection" | Transparent recovery | N/A |

### Responsive Breakpoints

| Page | Desktop (12-col) | Tablet (8-col) | Mobile (4-col) |
|------|-----------------|----------------|----------------|
| Navbar | Full links + avatar | Same | Brand + hamburger |
| Browse grid | 3-col cards | 2-col cards | 1-col cards |
| Place detail | 2-col (60/40) sticky | 2-col (55/45) | Single col, fixed bottom bar |
| Booking widget | Sticky sidebar | Below content | Fixed bottom bar → sheet |
| Auth | Centered 400px card | Same | Full-width |

### Accessibility
- Focus rings: `--honey` at 3px offset
- Touch targets: 44px minimum on all interactive elements
- ARIA landmarks: `nav`, `main`, `aside` (booking widget)
- Favorite toggle: `aria-pressed`; locale switch: `aria-label`
- ASCII art: `alt` text describing the place
- Contrast: DESIGN.md colors meet WCAG AA

### Emotional Arc
Discovery (charming landing) → Desire (rich listings) → Trust (reviews, ratings) → Confidence (easy booking) → Delight (warm confirmation)

## Scope Expansions (accepted during CEO review)

| # | Proposal | Effort | Reasoning |
|---|----------|--------|-----------|
| 1 | Dark mode toggle | S | DESIGN.md already defines dark palette. Shows design system is real. |
| 2 | Pipeline cascade commit (enum value) | S | Adding `honeypot` to `appliance_types_enum` cascades through all types AND triggers i18n type failure. |
| 3 | Error boundaries + empty states + 503 retry | S | Shows design system applied to edge cases. 503 retry demonstrates real deployment pattern. |
| 4 | EN/ES locale switcher | S | API already serves localized content. End-to-end i18n story. |
| 5 | OpenAPI docs with multi-spec selector | S | Shows multi-spec story (mobile, admin, internal, tests). Unique Psychic feature. |

## Deferred

- Admin app build-out (separate project, tracked in TODOS.md)
- Guest cancellation flow
- Availability checking / double-booking validation
- Password reset / account management
- Additional auth methods (Google sign-in, magic link)

## Open Questions

1. ASCII art generation: library vs. simple generator
2. Availability checking: stretch goal for booking validation

## Review History

| Review | Date | Status | Key Findings |
|--------|------|--------|-------------|
| /office-hours | 2026-03-24 | APPROVED | Builder mode. Pipeline-First approach chosen. ASCII art idea born. |
| /plan-ceo-review | 2026-03-24 | CLEAR | Selective Expansion. 5 expansions accepted. |
| /plan-eng-review | 2026-03-24 | CLEAR | firebase_uid on User, auto-create on first auth, public browse with optional auth, FavoritePlace pattern. |
| Codex outside voice | 2026-03-24 | 4 issues | Public browse, README booking schema, reviews→booking link, OpenAPI docs security. |
| /plan-design-review | 2026-03-24 | CLEAR (6→9/10) | Page layouts, navigation, mobile booking, responsive breakpoints, a11y specs, emotional arc. |
