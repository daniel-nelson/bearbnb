import resolveCurrentInternalUser from '@controllers/helpers/resolveCurrentInternalUser.js'
import { PsychicController } from '@rvoh/psychic'
import { firebaseTestBearerToken } from '@spec/unit/helpers/authentication.js'

describe('resolveCurrentInternalUser', () => {
  it('fails closed until InternalUser model-backed auth exists', async () => {
    await expect(resolveCurrentInternalUser(controllerWithAuthorization())).rejects.toThrow(
      'Internal authentication requires an InternalUser model-backed lookup before internal routes can be used.',
    )
  })
})

function controllerWithAuthorization(): PsychicController {
  return {
    header: (name: string) =>
      name === 'authorization'
        ? `Bearer ${firebaseTestBearerToken({
            uid: 'internal-firebase-uid',
            email: 'internal@example.com',
          })}`
        : undefined,
  } as unknown as PsychicController
}
