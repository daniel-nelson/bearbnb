import getAuth from '@conf/auth.js'
import { splitSetCookieHeader } from 'better-auth/cookies'
import type { Middleware } from 'koa'

export default function authKoaMiddleware(): Middleware {
  return async (ctx, next) => {
    // Better Auth owns its configured base path. Everything else should keep
    // flowing through Psychic's normal router and controller stack.
    if (!ctx.path.startsWith('/api/auth')) {
      await next()
      return
    }

    // Better Auth's handler speaks the Web Fetch API, while Koa exposes Node's
    // IncomingMessage. This builds the Fetch request without buffering the body,
    // so Better Auth can consume POST bodies such as sign-in/sign-up payloads.
    const response = await getAuth().handler(
      new Request(ctx.href, {
        method: ctx.method,
        headers: requestHeaders(ctx.req.headers),
        body: ctx.method === 'GET' || ctx.method === 'HEAD' ? undefined : (ctx.req as unknown as BodyInit),
        duplex: 'half',
      } as RequestInit & { duplex: 'half' }),
    )

    // Translate the Fetch response back onto Koa. Set-Cookie needs special
    // handling because multiple cookies can be folded into a single Fetch header,
    // but Koa must append them as separate Set-Cookie header values.
    ctx.status = response.status
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        for (const cookie of splitSetCookieHeader(value)) ctx.append('Set-Cookie', cookie)
      } else {
        ctx.set(key, value)
      }
    })

    if (response.body) ctx.body = Buffer.from(await response.arrayBuffer())
  }
}

function requestHeaders(nodeHeaders: Record<string, string | string[] | undefined>) {
  // Node represents repeated request headers as string arrays; Fetch Headers
  // needs each value appended separately to preserve the original request.
  const headers = new Headers()

  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item)
    } else if (value !== undefined) {
      headers.set(key, value)
    }
  }

  return headers
}
