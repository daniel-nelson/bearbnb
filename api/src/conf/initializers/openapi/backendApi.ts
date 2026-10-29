import { DreamCLI } from '@rvoh/dream/system'
import { PsychicApp } from '@rvoh/psychic'
import { generateZustandStoreFromSdk } from '@rvoh/psychic/system'
import AppEnv from '../../AppEnv.js'

export default function initializeBackendApi(psy: PsychicApp) {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      await DreamCLI.logger.logProgress(`[backendApi] syncing...`, async () => {
        await DreamCLI.spawn('pnpm', {
          args: [
            'exec',
            'openapi-ts',
            '-i',
            './src/openapi/openapi.json',
            '-o',
            '../client/src/api/backend/generated',
          ],
          onStdout: message => {
            DreamCLI.logger.logContinueProgress(`[backendApi]` + ' ' + message, {
              logPrefixColor: 'green',
            })
          },
        })
      })

      await DreamCLI.logger.logProgress(`[backendApi] generating zustand store...`, async () => {
        await generateZustandStoreFromSdk('../client/src/api/backend/generated')
      })
    }
  })
}
