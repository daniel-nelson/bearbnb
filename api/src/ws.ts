import '@conf/loadEnv.js'

import * as util from 'node:util'
import { Cable } from '@rvoh/psychic-websockets'
import AppEnv from '@conf/AppEnv.js'
import initializePsychicApp from '@conf/system/initializePsychicApp.js'
import { PsychicApp } from '@rvoh/psychic'

let cable: Cable | null = null

async function startWs() {
  process.env.WS_SERVICE = '1'
  await initializePsychicApp()

  cable = new Cable()

  process.on('uncaughtException', err => {
    PsychicApp.logWithLevel(
      'error',
      'Uncaught websockets exception:',
      JSON.stringify(util.inspect(err, { depth: 10 }))
    )
    void shutdown('uncaughtException')
  })

  process.on('unhandledRejection', (reason, promise) => {
    PsychicApp.logWithLevel(
      'error',
      'Unhandled websockets promise rejection at',
      JSON.stringify(util.inspect(promise, { depth: 10 })),
      'reason:',
      JSON.stringify(util.inspect(reason, { depth: 10 }))
    )
    void shutdown('unhandledRejection')
  })

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  const port = AppEnv.integer('WS_PORT', { optional: true }) || (AppEnv.isTest ? 8889 : 8888)
  await cable.start(port)
}

async function shutdown(shutdownReason: ShutdownReason) {
  if (cable) {
    await cable.stop()
    cable = null
  }

  const exitCode = shutdownReason === 'uncaughtException' || shutdownReason === 'unhandledRejection' ? 1 : 0
  process.exit(exitCode)
}

type ShutdownReason = 'uncaughtException' | 'unhandledRejection' | 'SIGINT' | 'SIGTERM'

void startWs()