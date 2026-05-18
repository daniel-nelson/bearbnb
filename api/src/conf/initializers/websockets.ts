import AppEnv from '@conf/AppEnv.js'
import allowedCorsOrigins from '@conf/system/allowedCorsOrigins.js'
import resolveWebsocketUser from '@conf/system/resolveWebsocketUser.js'
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
  //                  ws:start handlers). Delivery is single-process: cross-process
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
            maxRetriesPerRequest: null,
          })
        : new Redis({
            host: AppEnv.string('WS_REDIS_HOST', { optional: true }) || 'localhost',
            port: AppEnv.integer('WS_REDIS_PORT', { optional: true }) || 6379,
            username: AppEnv.string('WS_REDIS_USERNAME', { optional: true }),
            password: AppEnv.string('WS_REDIS_PASSWORD', { optional: true }),
            // tls:  {},
            maxRetriesPerRequest: null,
          }),
    )
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
    // Replace the body with your own logic (e.g. auth-token inspection) to
    // layer additional checks on top of the origin allowlist.
    allowRequest: (req, callback) => {
      const origin = req.headers.origin
      if (origin !== undefined && allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback('origin not allowed', false)
      }
    },
  })

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

  wsApp.on('ws:start', io => {
    io.of('/').on('connection', async socket => {
      const user = await resolveWebsocketUser(socket)
      if (!user) {
        socket.disconnect(true)
        return
      }
      // this automatically fires the /ops/connection-success message
      await Ws.register(socket, user)
    })
  })

  wsApp.on('ws:connect', () => {
    // do something upon websocket connection being established
  })
}
