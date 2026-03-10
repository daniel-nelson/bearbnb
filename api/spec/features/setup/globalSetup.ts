import '@conf/loadEnv.js'

import { PsychicDevtools } from '@rvoh/psychic/system'

export async function setup() {
  await PsychicDevtools.launchDevServer('clientFspecApp', { port: 3050, cmd: 'pnpm client:fspec' })
  await PsychicDevtools.launchDevServer('adminFspecApp', { port: 3051, cmd: 'pnpm admin:fspec' })
}

export function teardown() {
  PsychicDevtools.stopDevServer('clientFspecApp')
  PsychicDevtools.stopDevServer('adminFspecApp')
}
