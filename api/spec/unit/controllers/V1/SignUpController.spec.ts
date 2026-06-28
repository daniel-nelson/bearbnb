import { CURRENT_TOS_VERSION } from '@conf/termsOfService.js'
import User from '@models/User.js'
import { DateTime } from '@rvoh/dream'
import createUser from '@spec/factories/UserFactory.js'
import { session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('V1/SignUpController', () => {
  let request: SpecRequestType
  let user: User

  beforeEach(async () => {
    user = await createUser()
    request = await session(user)
  })

  describe('POST create', () => {
    it('records terms-of-service consent for the current user', async () => {
      const { body } = await request.post('/v1/sign-up', 201)

      expect(body).toEqual({
        id: user.id,
        email: user.email,
      })

      await user.reload()
      expect(user.tosVersion).toEqual(CURRENT_TOS_VERSION)
      expect(user.tosAcceptedAt).not.toBeNull()
    })

    it('does not overwrite a prior acceptance of the current terms version', async () => {
      const acceptedAt = DateTime.now().minus({ days: 3 })
      await user.update({ tosAcceptedAt: acceptedAt, tosVersion: CURRENT_TOS_VERSION })

      await request.post('/v1/sign-up', 201)

      await user.reload()
      expect(user.tosVersion).toEqual(CURRENT_TOS_VERSION)
      expect(user.tosAcceptedAt).toEqualDateTime(acceptedAt)
    })

    it('rejects unauthenticated requests', async () => {
      await request.setDefaultHeaders({ Authorization: 'Bearer nope' }).post('/v1/sign-up', 401)
    })
  })
})
