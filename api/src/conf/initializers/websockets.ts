import AppEnv from '#conf/AppEnv.js'
import allowedCorsOrigins from '#conf/system/allowedCorsOrigins.js'
import resolveWebsocketUser from '#conf/system/resolveWebsocketUser.js'
import { PsychicApp } from '@rvoh/psychic'
import { PsychicAppWebsockets, Ws } from '@rvoh/psychic-websockets'
import { Redis } from 'ioredis'

export default (psy: PsychicApp) => {
  // PsychicAppWebsockets initializes in all processes by default. Any process —
  // websocket server, web server, or worker — may call Ws.emit(), and skipping
  // init in any of them causes a runtime cachePsychicAppWebsockets error that is
  // hard to diagnose. To restrict which roles can push messages, uncomment:
  //
  // if (!['websockets', 'web', 'worker'].includes(AppEnv.serviceRole) && !AppEnv.isTest) return

  psy.plugin(async () => {
    await PsychicAppWebsockets.init(psy, initializeWebsockets)
  })
}

function initializeWebsockets(wsApp: PsychicAppWebsockets) {
  // The websockets transport adapter is selected per environment:
  //   - test:        in-process adapter (the default) — no Redis. Unit specs do
  //                  zero Redis I/O; feature specs get real in-process delivery for
  //                  broadcasts emitted within the websocket-server process (e.g.
  //                  ws:connect hooks). Delivery is single-process: cross-process
  //                  fan-out (a web/worker emit reaching a socket on the ws server)
  //                  still needs Redis, as in production.
  //   - development
  //   - production:  Redis adapter (the default) — distributes the socket
  //                  registry and broadcasts across a clustered websocket fleet,
  //                  and needs the connection configured below.
  // Override explicitly anywhere with wsApp.set('adapter', 'redis' | 'in_process')
  // (or pass a custom adapter instance).
  if (!AppEnv.isTest) {
    wsApp.set(
      'connection',
      AppEnv.isProduction
        ? new Redis({
            host: AppEnv.string('WS_REDIS_HOST'),
            port: AppEnv.integer('WS_REDIS_PORT', { optional: true }) || 6379,
            username: AppEnv.string('WS_REDIS_USERNAME'),
            password: AppEnv.string('WS_REDIS_PASSWORD'),
            tls: {},
            // Fail fast, don't hang. Unlike the BullMQ worker connection (which MUST
            // use `maxRetriesPerRequest: null` for its blocking commands), the socket.io
            // redis-adapter issues no blocking commands, so this connection must bound
            // retries: with `null`, a broadcast or registry lookup (e.g. a worker emit)
            // hangs forever when the WS Redis is unreachable. The adapter requires no
            // special connection options — https://socket.io/docs/v4/redis-adapter/
            maxRetriesPerRequest: 3,
            commandTimeout: 10000,
          })
        : new Redis({
            host: AppEnv.string('WS_REDIS_HOST', { optional: true }) || 'localhost',
            port: AppEnv.integer('WS_REDIS_PORT', { optional: true }) || 6379,
            username: AppEnv.string('WS_REDIS_USERNAME', { optional: true }),
            password: AppEnv.string('WS_REDIS_PASSWORD', { optional: true }),
            // tls:  {},
            maxRetriesPerRequest: 3,
            commandTimeout: 10000,
          }),
    )

    // Redis adapter (pub/sub) error observability. The framework logs these
    // errors internally but exposes no hook for them by design, so if you want
    // them in your error service (e.g. Sentry) attach your own listeners here,
    // right after set('connection') — subConnection is the duplicate created by
    // that call. Two caveats:
    //   - ioredis re-emits 'error' repeatedly for the duration of an outage (one
    //     per reconnect attempt), so throttle/dedupe before reporting or a single
    //     Redis blip will flood your error service.
    //   - Configure the connection ONCE. Do NOT set('connection') again after the
    //     websocket server has started: start captures these clients and hands
    //     them to the socket.io Redis adapter, and a later set() disconnects the
    //     old clients without rebinding the adapter, so replacement is broken.
    //
    // wsApp.connection.on('error', err => {
    //   // report err to your error service (throttled/deduped)
    // })
    // wsApp.subConnection.on('error', err => {
    //   // report err to your error service (throttled/deduped)
    // })
  }

  const allowedOrigins = allowedCorsOrigins()
  wsApp.set('socketio', {
    // socketio server options here
    cors: {
      credentials: true,
      origin: allowedOrigins,
    },
    // socket.io's `cors.origin` above only constrains HTTP long-polling —
    // native WebSocket upgrades bypass CORS. `allowRequest` runs before every
    // handshake on every transport, so we re-enforce the allowlist here.
    // Keep it to checks on the raw HTTP request. Authenticate in the ws:connect
    // hook below instead: the client's auth token (socket.handshake.auth) is not
    // available here yet, and a throw here is not contained, so it would exit
    // the websocket process.
    allowRequest: (req, callback) => {
      const origin = req.headers.origin
      if (origin !== undefined && allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback('origin not allowed', false)
      }
    },
  })

  // Health check for the websocket server's own http listener. Orchestrators
  // probe this for liveness of the ws process, separately from the web server.
  // The framework already serves one at the default path `/healthcheck` (GET,
  // empty 200). Uncomment to change it — set the path to `/health_check` to match
  // the web server's route above and this app's `ignoredRoutes` config, change
  // the method or body, or pass `null` to disable it entirely:
  //
  // wsApp.set('healthCheck', {
  //   path: '/health_check',
  //   // method: 'GET',
  //   // body: null,
  // })

  // Connection limits (Redis adapter). Both already default to the values shown,
  // so set them only to override:
  //   - maxConnectionsPerUser caps how many sockets a single user may register at
  //     once; registering past the cap evicts that user's oldest socket. This
  //     bounds per-user resource use — a client reconnecting in a loop can't
  //     accumulate unbounded registry entries.
  //   - maxConnectionTtl is a garbage-collection backstop on the socket-id registry
  //     key, NOT the live socket's lifetime (socket.io owns that via ping settings).
  //     It cleans up entries left behind by ungraceful disconnects. Keep it
  //     comfortably above your longest expected connection — if it expires while a
  //     socket is still connected, emits to that user silently stop.
  //
  // wsApp.set('maxConnectionsPerUser', 3)
  // wsApp.set('maxConnectionTtl', { days: 1 })

  // ******
  // HOOKS:
  // ******

  // Sign in each connecting socket. This must stay a ws:connect hook: the
  // framework contains a throw from one (a database or Redis error, a bug in the
  // auth code, the "replace before production" throw in resolveWebsocketUser) by
  // logging it, disconnecting only this socket and firing ws:error below. Do not
  // sign in from an io.on('connection') listener added in a ws:start hook: a
  // throw there is not contained, so it becomes an unhandled rejection, and
  // ws.ts exits the websocket process on those. Put any other per-connection
  // work after Ws.register, so it never runs for a socket that is not signed in.
  wsApp.on('ws:connect', async socket => {
    const user = await resolveWebsocketUser(socket)
    if (!user) {
      socket.disconnect(true)
      return
    }
    await Ws.register(socket, user)
  })

  wsApp.on('ws:error', (error, context) => {
    // A framework-contained websocket failure. `context.phase` discriminates it:
    //   - 'ws:connect'      — a ws:connect hook threw; context.socketId is the
    //                         socket that was disconnected as a result.
    //   - 'ws:health-check' — the ws server's own http handler threw;
    //                         context.method / context.path describe the request.
    // By the time this runs the socket is already disconnected / the process is
    // already safe and the framework has already logged the error, so this hook
    // is purely for reporting it onward. This is the idiomatic place to forward a
    // websocket failure to your error service (e.g. Sentry), for example:
    //
    //   Sentry.captureException(error, {
    //     tags: { phase: context.phase },
    //     extra: { ...context },
    //   })
    void error
    void context
  })
}
