import '@conf/loadEnv.js'

import * as util from 'node:util'
import initializePsychicApp from '@conf/system/initializePsychicApp.js'
import { PsychicApp, PsychicServer } from '@rvoh/psychic'

let server: PsychicServer | null = null

async function start() {
  await initializePsychicApp()

  server = new PsychicServer()

  process.on('uncaughtException', err => {
    PsychicApp.logWithLevel(
      'error',
      'Uncaught server exception:',
      JSON.stringify(util.inspect(err, { depth: 10 }))
    )
    void shutdown()
  })

  process.on('unhandledRejection', (reason, promise) => {
    PsychicApp.logWithLevel(
      'error',
      'Unhandled server promise rejection at',
      JSON.stringify(util.inspect(promise, { depth: 10 })),
      'reason:',
      JSON.stringify(util.inspect(reason, { depth: 10 }))
    )
    void shutdown()
  })

  // NOTE: no SIGINT/SIGTERM handlers here; PsychicServer#start installs its own,
  // which gracefully stop the server and exit.

  await server.start()
}

async function shutdown() {
  if (server) {
    await server.stop()
    server = null
  }

  process.exit(1)
}

start().catch((err: unknown) => {
  // the configured logger may not exist yet when startup fails,
  // so fall back to console
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err)
  process.exit(1)
})
