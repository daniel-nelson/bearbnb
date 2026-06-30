/**
 * The terms-of-service version a guest accepts when they sign up. Bump this
 * string whenever the terms change so that newly-recorded consent reflects the
 * version that was actually presented. Persisted to `users.tos_version`
 * alongside `users.tos_accepted_at` by the sign-up flow.
 */
export const CURRENT_TOS_VERSION = '2026-06-28'

/**
 * Marker returned in the body of the 403 raised when an authenticated user has
 * not accepted the current terms. The frontend matches on this string to tell a
 * consent block apart from other forbidden responses and prompt for acceptance.
 */
export const TERMS_OF_SERVICE_REQUIRED_ERROR = 'terms_of_service_required'
