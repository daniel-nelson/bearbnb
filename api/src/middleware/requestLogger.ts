import type Koa from 'koa'
import winston from 'winston'

export interface RequestLoggerOptions {
  winstonInstance?: winston.Logger
  transports?: winston.transport[]
  format?: winston.Logform.Format
  meta?: boolean
  headerBlacklist?: string[]
  bodyBlacklist?: string[]
  ignoredRoutes?: string[]
  colorize?: boolean
}

function filterObject(obj: Record<string, unknown>, blacklist: string[]): Record<string, unknown> {
  const lower = blacklist.map(k => k.toLowerCase())
  const filtered: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    if (!lower.includes(key.toLowerCase())) {
      filtered[key] = obj[key]
    }
  }
  return filtered
}

export default function requestLogger(options: RequestLoggerOptions = {}): Koa.Middleware {
  const {
    winstonInstance,
    transports,
    format,
    meta = true,
    headerBlacklist = [],
    bodyBlacklist = [],
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
    const message = `${ctx.method} ${ctx.url} ${status} ${duration}ms`

    let level: string
    if (status >= 500) level = 'error'
    else if (status >= 400) level = 'warn'
    else level = 'info'

    const logEntry: Record<string, unknown> = { message, level }

    if (meta) {
      const headers = filterObject(ctx.headers as Record<string, unknown>, headerBlacklist)
      const rawBody = (ctx.request as unknown as Record<string, unknown>).body as
        | Record<string, unknown>
        | undefined
      const body = rawBody ? filterObject(rawBody, bodyBlacklist) : undefined

      logEntry.meta = {
        req: {
          method: ctx.method,
          url: ctx.url,
          headers,
          body,
        },
        res: {
          statusCode: status,
        },
        responseTime: duration,
      }
    }

    logger.log(logEntry as winston.LogEntry)
  }
}
