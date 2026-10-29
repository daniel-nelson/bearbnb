// Redaction for the request log written by requestLogger.ts.
//
// A value is masked when its key contains any blocklisted name, ignoring case, at any
// depth of the body, in the query string and in the request headers. With the default
// `bodyBlocklist`, `password`, `passwordConfirmation`, `accessToken`, `user[token]` and an
// `x-auth-token` header are all masked, and so is a harmless name like `tokenCount`. The key
// is kept, so the log still shows the field was sent. In the logged path, the value of a route
// parameter whose name contains a blocklisted name, such as `:token` or `:tokenId`, is masked.
//
// Objects and arrays nested more than MAX_LOGGED_DEPTH levels deep are replaced with
// TRUNCATED, so a deeply nested body cannot overflow the stack while it is being logged.
//
// This file deliberately has no dependencies.

export const FILTERED = '[FILTERED]'
export const TRUNCATED = '[TRUNCATED]'
export const MAX_LOGGED_DEPTH = 10

// returns a redacted copy of a parsed request body or query; the original is never modified
export function redact(value: unknown, blocklist: string[]): unknown {
  return redactValue(value, lowercase(blocklist), 1)
}

// returns the request path with the value of each route parameter (`ctx.params`) whose name
// contains a blocklisted name replaced by FILTERED wherever it appears, as sent or
// percent-encoded, so `/password-resets/abc` becomes `/password-resets/[FILTERED]`. A short
// value masks the same characters elsewhere in the path too: a `tokenId` of `1` turns `/v1` into
// `/v[FILTERED]`. When a value is not in the path, the path of the route the router matched
// (`ctx.routerPath`), such as `/files/*secretPath`, is logged instead
export function redactPath(
  path: string,
  blocklist: string[],
  routeParams: unknown,
  routePath: unknown,
): string {
  if (typeof routeParams !== 'object' || routeParams === null) return path
  const lowerBlocklist = lowercase(blocklist)

  let redacted = path
  for (const [name, value] of Object.entries(routeParams) as [string, unknown][]) {
    if (typeof value !== 'string' || value === '' || !isSensitive(name, lowerBlocklist)) continue
    const masked = redacted.replaceAll(value, FILTERED).replaceAll(encodeURIComponent(value), FILTERED)
    if (masked === redacted) return typeof routePath === 'string' ? routePath : FILTERED
    redacted = masked
  }
  return redacted
}

// returns a copy of the request headers for the log: a header whose whole name, ignoring
// case, is in `headerBlocklist` is left out, and any other header whose name contains a
// `bodyBlocklist` name is masked and keeps its key (`x-auth-token`, `proxy-authorization`)
export function redactHeaders(
  headers: Record<string, unknown>,
  headerBlocklist: string[],
  bodyBlocklist: string[],
): Record<string, unknown> {
  const leftOut = lowercase(headerBlocklist)
  const logged = Object.entries(headers).filter(([name]) => !leftOut.includes(name.toLowerCase()))
  return redact(Object.fromEntries(logged), bodyBlocklist) as Record<string, unknown>
}

function redactValue(value: unknown, lowerBlocklist: string[], depth: number): unknown {
  if (typeof value !== 'object' || value === null) return value
  if (depth > MAX_LOGGED_DEPTH) return TRUNCATED

  if (Array.isArray(value)) return value.map(item => redactValue(item, lowerBlocklist, depth + 1))

  // Object.fromEntries keeps a `__proto__` key from a JSON body as an ordinary key
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]): [string, unknown] => [
      key,
      isSensitive(key, lowerBlocklist) ? FILTERED : redactValue(nested, lowerBlocklist, depth + 1),
    ]),
  )
}

function isSensitive(key: string, lowerBlocklist: string[]): boolean {
  const lowerKey = key.toLowerCase()
  return lowerBlocklist.some(name => lowerKey.includes(name))
}

function lowercase(names: string[]): string[] {
  return names.map(name => name.toLowerCase())
}
