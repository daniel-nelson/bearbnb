import User from '@models/User.js'
import { PsychicServer } from '@rvoh/psychic'
import { OpenapiSpecRequest } from '@rvoh/psychic-spec-helpers'
import createUser from '@spec/factories/UserFactory.js'
import { firebaseTestBearerToken, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'
import { paths as OpenapiPaths } from '@src/types/openapi/tests.openapi.js'

describe('Visitor/V1/MeController', () => {
  let request: SpecRequestType
  let user: User

  beforeEach(async () => {
    user = await createUser()
    request = await session(user)
  })

  describe('GET show', () => {
    it('returns the current Firebase-authenticated user', async () => {
      const { body } = await request.get('/v1/me', 200)

      expect(body).toEqual({
        id: user.id,
        email: user.email,
      })
    })

    it('rejects missing bearer tokens', async () => {
      const unauthenticatedRequest = new OpenapiSpecRequest<OpenapiPaths>()
      await unauthenticatedRequest.init(PsychicServer)

      await unauthenticatedRequest.get('/v1/me', 401)
    })

    it('rejects malformed bearer tokens', async () => {
      await request.setDefaultHeaders({ Authorization: 'Bearer nope' }).get('/v1/me', 401)
    })

    it('rejects malformed test bearer tokens', async () => {
      await request.setDefaultHeaders({ Authorization: 'Bearer test-firebase:not-json' }).get('/v1/me', 401)
    })

    it('provisions Firebase users whose email is not yet verified', async () => {
      const { body } = await request
        .setDefaultHeaders({
          Authorization: `Bearer ${firebaseTestBearerToken({
            uid: 'unverified-firebase-user',
            email: 'unverified@example.com',
            emailVerified: false,
          })}`,
        })
        .get('/v1/me', 200)

      const provisionedUser = await User.findOrFailBy({ firebaseUid: 'unverified-firebase-user' })
      expect(body).toEqual({
        id: provisionedUser.id,
        email: 'unverified@example.com',
      })
    })

    it('does not claim an existing unlinked user by email', async () => {
      const existingUser = await createUser({ email: 'claimed-email@example.com' })

      await request
        .setDefaultHeaders({
          Authorization: `Bearer ${firebaseTestBearerToken({
            uid: 'different-firebase-user',
            email: existingUser.email,
          })}`,
        })
        .get('/v1/me', 401)

      await existingUser.reload()
      expect(existingUser.firebaseUid).toBeNull()
    })
  })
})
