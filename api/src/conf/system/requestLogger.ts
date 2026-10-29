import type Koa from 'koa'
import winston from 'winston'
import { redact, redactHeaders, redactPath } from './redactForLog.js'

export interface RequestLoggerOptions {
  winstonInstance?: winston.Logger
  transports?: winston.transport[]
  format?: winston.Logform.Format
  // headers left out of the log (whole name, ignoring case)
  headerBlocklist?: string[]
  // body, query-string, header and route-parameter values masked in the log (any key, header or
  // route-parameter name containing a listed name, ignoring case, at any depth; see redactForLog.ts)
  bodyBlocklist?: string[]
  ignoredRoutes?: string[]
}

export default function requestLogger(options: RequestLoggerOptions = {}): Koa.Middleware {
  const {
    winstonInstance,
    transports,
    format,
    headerBlocklist = [],
    bodyBlocklist = [],
    ignoredRoutes = [],
  } = options

  const logger =
    winstonInstance ??
    winston.createLogger({
      transports: transports ?? [new winston.transports.Console()],
      format: format ?? winston.format.json(),
    })

  const ignoredSet = new Set(ignoredRoutes)

  return async (ctx: Koa.Context, next: Koa.Next) => {
    if (ignoredSet.has(ctx.path)) {
      await next()
      return
    }

    const start = Date.now()
    await next()
    const duration = Date.now() - start

    const status = ctx.status
    // A query-string parameter, request-body field, header or route parameter whose name contains
    // a `bodyBlocklist` name, ignoring case, such as `token` from `SENSITIVE_FIELDS` in
    // conf/app.ts (`?token=…`, `{ resetToken: … }`, `x-auth-token`, `:token`, `:tokenId`), is
    // logged as `[FILTERED]`, so a request to `/password-resets/:token` logs
    // `/password-resets/[FILTERED]`. A header whose whole name is in `headerBlocklist`, such as
    // `authorization`, `cookie` or `referer`, is left out of the log instead. A path the router did
    // not bind parameters for is logged as received: one that matches no route (a 404), a method
    // its route does not take (a 405, or `OPTIONS`), and a request that middleware mounted after
    // this logger answers before the router runs (such as a rate limiter's 429). Mount such
    // middleware ahead of the logger, with `psy.use(…)` in conf/app.ts above this hook, to keep its
    // requests out of the log. For an emailed sign-in or reset link, the URL fragment
    // (`/reset-password#token=…`), which browsers never send to the server, is still the safest
    // place for the token; have the page's JavaScript pass it on under a masked name.
    const path = redactPath(ctx.path, bodyBlocklist, ctx.params, ctx.routerPath)
    const message = `${ctx.method} ${path} ${status} ${duration}ms`

    let level: string
    if (status >= 500) level = 'error'
    else if (status >= 400) level = 'warn'
    else level = 'info'

    const logEntry: Record<string, unknown> = { message, level }
    const query = redact(ctx.query, bodyBlocklist)
    const headers = redactHeaders(ctx.headers, headerBlocklist, bodyBlocklist)
    const body = redact(ctx.request.body, bodyBlocklist)

    logEntry.meta = {
      req: {
        method: ctx.method,
        path,
        query,
        headers,
        body,
      },
      res: {
        statusCode: status,
      },
      responseTime: duration,
    }

    logger.log(logEntry as winston.LogEntry)
  }
}
