import resolveCurrentAdminUser from '@controllers/helpers/resolveCurrentAdminUser.js'
import { PsychicController } from '@rvoh/psychic'
import { firebaseTestBearerToken } from '@spec/unit/helpers/authentication.js'

describe('resolveCurrentAdminUser', () => {
  it('fails closed until AdminUser model-backed auth exists', async () => {
    await expect(resolveCurrentAdminUser(controllerWithAuthorization())).rejects.toThrow(
      'Admin authentication requires an AdminUser model-backed lookup before admin routes can be used.',
    )
  })
})

function controllerWithAuthorization(): PsychicController {
  return {
    header: (name: string) =>
      name === 'authorization'
        ? `Bearer ${firebaseTestBearerToken({ uid: 'admin-firebase-uid', email: 'admin@example.com' })}`
        : undefined,
  } as unknown as PsychicController
}
