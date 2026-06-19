# Fresh React Frontend Rebuild Handoff

This plan is for a new BearBnB frontend branch that starts from a freshly generated BearBnB app with Vite React frontend apps. Do not use the existing `front-end` branch as implementation source. It contains corrections layered on top of earlier wrong turns, especially accidental Next API proxy routes and a Better Auth spike that is no longer the chosen auth direction. Treat it only as historical context if absolutely necessary.

## Architectural Decisions

- Use Vite React frontend apps, not Next.js.
- The browser calls the Psychic API directly. Do not create frontend `/api/*` pass-through routes.
- Psychic owns HTTP APIs, serializers, OpenAPI, Firebase bearer-token verification, CORS, database constraints, and feature-spec server orchestration.
- React owns rendering, routing, forms, client state, date selection, and user feedback.
- Use Firebase Auth, not Better Auth. The React client signs in with Firebase, obtains Firebase ID tokens, and sends them to Psychic app APIs as `Authorization: Bearer <id-token>`.
- Use the Firebase Auth emulator for local development and feature specs. Document emulator setup clearly enough that clone-and-run remains approachable.
- Do not use cookie sessions for app authentication. Bearer-token API auth avoids the app-mutation CSRF problem that made Better Auth less attractive here.
- `endsOn` means checkout date. Booking occupancy is half-open: `[startsOn, endsOn)`. A July 1 to July 3 booking occupies July 1 and July 2, and another booking may start July 3.
- Guests may review immediately after booking. For this teaching/demo app, "verified-stay review" means verified booking provenance, not completed-stay enforcement.
- Keep commits clean and educational. If a later correction is known now, build it correctly in the original commit rather than adding a later fixup.

## Commit Plan

### 1. Generate Vite React frontend apps

Start from the fresh generated BearBnB with React clients. Commit only generator output and any minimal generated-app configuration needed to boot. Do not add product UI yet.

Expected shape:
- `client/`, `admin/`, and `internal/` are Vite React apps if the generated app includes all three.
- API package scripts launch frontend dev servers from `api/`, e.g. `pnpm client`, `pnpm admin`, `pnpm internal`.
- Feature specs launch frontend apps through API wrapper scripts, not by manually entering frontend folders.
- No Next app router, no Next route handlers, no `client/app/api`.

Verification:
- From `api/`: `pnpm build:spec`, `pnpm lint`, `pnpm uspec`, and the generated `pnpm fspec`.

### 2. Add direct frontend API client configuration

Add a small frontend API helper that reads the configured Psychic API origin from Vite env and performs direct browser requests to Psychic.

Rules:
- Use `VITE_API_HOST` or the generated route/env helper if present.
- Default local development API origin can be `http://localhost:7777`; feature specs should use `http://localhost:7778`.
- Authenticated requests must pass `Authorization: Bearer <id-token>` from Firebase Auth.
- Do not proxy through React/Vite. Vite dev proxy is also not the desired teaching path unless there is a very explicit, temporary test-only reason.
- Keep response handling explicit enough for beginner readers: typed happy path, status-specific user errors, generic fallback.

Verification:
- Unit/build checks should prove env typing.
- A trivial feature spec can prove the frontend reaches Psychic directly.

### 3. Add Firebase Auth backend boundary

Add Firebase Auth to the Psychic API with direct browser-to-API bearer-token auth in mind.

Backend requirements:
- Configure Firebase Admin SDK for development/test against the Firebase Auth emulator.
- Verify Firebase ID tokens in the Psychic auth boundary and resolve the corresponding BearBnB user.
- Keep the Psychic API stateless from the browser's perspective: authenticated app API requests use `Authorization: Bearer <id-token>`.
- Configure CORS for the Vite frontend origins, but do not rely on cookies or `credentials: "include"` for app authentication.
- Do not use Next auth route handlers or any frontend auth proxy.
- Prefer Psychic/Dream application configuration patterns and `AppEnv`; do not read `process.env` directly in backend code.
- Add comments only where Firebase emulator/Admin SDK integration is not obvious from the application domain.

Frontend requirements:
- React uses Firebase Auth directly for signup, sign-in, sign-out, and auth state.
- In local dev/specs, connect the frontend Firebase Auth SDK to the Auth emulator.
- Before authenticated Psychic API calls, get the current user's ID token and send it as `Authorization: Bearer <id-token>`.
- Do not store Firebase ID tokens in local storage; use Firebase Auth's SDK/session state and retrieve fresh tokens as needed.

Security notes:
- Firebase bearer-token auth avoids ambient browser credentials for Psychic app mutations, so the normal cookie-session CSRF problem is not part of the app API auth model.
- Still keep CORS allowlisted to the frontend origins; CORS is not auth, but it should not be wildcarded casually.
- Tests should prove missing, malformed, expired, or wrong-project/emulator tokens are rejected.
- Tests should prove a valid Firebase-authenticated user can reach authenticated APIs and maps to the correct BearBnB user.
- Controller specs should not start the Firebase Auth emulator. Keep the Firebase Admin SDK verification behind one app boundary and use a fake verifier/test token there so controller specs stay fast and deterministic.
- Most headless browser feature specs should not exercise Firebase UI or the emulator. They should use a test-only frontend auth adapter/token and keep product-flow coverage focused on BearBnB behavior. A tiny dedicated Firebase SDK/emulator smoke spec is optional, but the default feature suite should not depend on emulator startup.

Verification:
- API controller/unit specs for auth boundary behavior.
- Browser feature spec for signup/sign-in/sign-out.
- Feature specs should start/use the Firebase Auth emulator and must not require a real Firebase project.

### 4. Add guest places index

Build the first usable guest page with direct API reads.

Backend:
- Add or use the public guest places endpoint and serializer.
- Keep OpenAPI derived from serializers/models where Psychic can derive it.
- Run `pnpm psy sync` after route/serializer/OpenAPI changes.

Frontend:
- Show a usable places index as the first screen.
- Fetch directly from Psychic API.
- Use a restrained, operational UI. Avoid marketing-page structure unless explicitly needed.

Verification:
- Controller spec for the places endpoint.
- Feature spec that loads the React app and sees places from the API.

### 5. Add guest place detail page

Add client-side routing and a place detail view.

Frontend:
- Use React Router or the generated app's established routing choice.
- Keep route params and API calls clear.
- Continue direct Psychic API reads.

Backend:
- Add any missing detail serializer fields intentionally.

Verification:
- Controller spec for detail response.
- Feature spec navigating from index to detail.

### 6. Add guest booking API

Introduce booking creation on the backend before building the frontend form.

Backend:
- Generate resources/migrations using Psychic generators where applicable.
- Use Dream model validations for application-level checks.
- Prevent double-booking at the database level with a PostgreSQL exclusion constraint.
- Use checkout-date semantics from the start: `endsOn` is exclusive.
- Add a migration comment explaining the rationale: lodging checkout dates are not occupied nights, so the database range must allow same-day turnover.
- Prefer Kysely APIs where idiomatic; use raw SQL only for PostgreSQL-specific features Kysely does not model cleanly.

Important:
- Do not implement inclusive date ranges and then fix them later.
- Do not manually inspect opaque PostgreSQL error codes in controller code. If mapping constraint errors is needed, use a narrowly named custom error/type and keep database-specific details in one small boundary.

Verification:
- Controller/model specs for successful booking.
- Specs proving overlapping bookings fail.
- Specs proving a booking may start on another booking's checkout date.

### 7. Add guest booking frontend

Build the booking form against the already-correct booking API.

Frontend:
- Direct POST to Psychic API with `Authorization: Bearer <id-token>`.
- No `/api/guest/bookings` frontend route.
- Use a date library for frontend date handling. Luxon is the recommended default.
- Make unauthenticated and validation errors clear.

Verification:
- Browser feature spec signs in and books a place.
- Browser feature spec sees API validation errors for unavailable dates.

### 8. Add booking availability calendar

Refine the booking UI so booked nights are greyed out and cannot be selected.

Frontend:
- Display already-booked nights as unavailable.
- Do not grey out checkout dates unless they are also occupied by another booking.
- Enforce half-open range selection in the UI: selecting a checkout date as the next start date is allowed.
- Keep layout stable across desktop/mobile.

Backend:
- Keep database exclusion constraint as the final guard against races and double-booking.
- Do not rely only on frontend disabling.

Verification:
- Controller/model specs for race-proof double-book prevention.
- Feature specs for disabled occupied dates and allowed same-day turnover.

### 9. Add public guest reviews

Add public review display separately from review creation.

Backend:
- Add serializer fields intentionally.
- Keep display endpoint public if the product calls for public reviews.

Frontend:
- Display reviews on the place detail page.

Verification:
- Controller spec for public reviews.
- Feature spec that public reviews render.

### 10. Add guest review creation

Allow guests to review immediately after a booking.

Backend:
- Require a real booking owned by the current guest.
- Do not require the stay to be completed.
- Prevent reviewing someone else's booking.

Frontend:
- Show review form after successful booking or wherever the product flow places it.
- Direct POST to Psychic API with `Authorization: Bearer <id-token>`.
- No `/api/guest/reviews` frontend route.

Verification:
- Controller specs for ownership and unauthenticated cases.
- Feature spec for booking then reviewing.

### 11. Polish generated/frontend design

Only after the flows are correct, polish the Vite React UI.

Rules:
- Keep UI domain-specific and usable, not a landing page.
- Use stable dimensions for calendar grids and controls.
- Avoid text overlap across mobile and desktop.
- Avoid one-note color palettes.
- Do not introduce decorative UI that hides the product/booking task.

Verification:
- Run feature specs.
- Use browser screenshots if making substantial visual changes.

## Commit Hygiene

- Each commit should be logically educational and internally correct.
- If a file line was originally added in a commit, known corrections to that line belong in that same commit during this rebuild.
- Do not preserve the old branch's mistaken history.
- Run formatting before committing, but keep migration formatting stable according to `.prettierignore` and `api/.prettierignore`.
- Include generated files after `pnpm psy sync` or migrations.

## Final Verification Before PR

From `api/`:

```console
pnpm build:spec
pnpm lint
pnpm uspec
pnpm fspec
```

Also verify no frontend pass-through API routes exist:

```console
find ../client ../admin ../internal -path '*/api/*' -type f
```

That command should return nothing unless a future commit has an intentional, documented non-proxy reason.
