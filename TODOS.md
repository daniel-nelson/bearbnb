# TODOS

## P2: Admin app build-out

**What:** Build the admin/host-facing app with its own OpenAPI → Zustand pipeline from the admin-specific OpenAPI spec.

**Why:** Demonstrates Psychic serving multiple clients with separate OpenAPI specs (admin spec is private, not exposed publicly). Shows that each frontend gets its own generated type pipeline from its own spec — separate concerns, separate stores.

**Context:** The admin OpenAPI spec already exists and is separate from the default/mobile/internal specs. The admin app (Next.js, Tailwind) is a blank starter. It would need its own `pnpm psy setup:sync:openapi-zustand` targeting the admin spec, its own DESIGN.md, and its own set of host management features (Places CRUD, Rooms CRUD, LocalizedText management, booking management, moderation).

**Effort:** L (human: ~2 weeks / CC: ~3-4 hours)
**Priority:** P2
**Depends on:** Guest client completion
