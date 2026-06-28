/**
 * The terms-of-service version a guest accepts when they sign up. Bump this
 * string whenever the terms change so that newly-recorded consent reflects the
 * version that was actually presented. Persisted to `users.tos_version`
 * alongside `users.tos_accepted_at` by the sign-up flow.
 */
export const CURRENT_TOS_VERSION = '2026-06-28'
