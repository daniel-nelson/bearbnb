import { CURRENT_TOS_VERSION, TERMS_OF_SERVICE_REQUIRED_ERROR } from '@conf/termsOfService.js'
import User from '@models/User.js'
import { DateTime } from '@rvoh/dream'
import createHost from '@spec/factories/HostFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('AuthedController terms-of-service consent gate', () => {
  // Exercised through a Host endpoint because Host controllers are the only
  // AuthedController descendants at this point in history. The gate lives on
  // AuthedController itself, so it applies identically to every authenticated
  // surface (Guest endpoints inherit it the moment they exist).
  let request: SpecRequestType
  let user: User

  beforeEach(async () => {
    user = await createUser({ tosAcceptedAt: null, tosVersion: null })
    await createHost({ user })
    request = await session(user)
  })

  it('blocks an authenticated user who has not accepted the terms of service', async () => {
    const { body } = await request.get('/v1/host/places', 403)

    expect(body).toEqual(TERMS_OF_SERVICE_REQUIRED_ERROR)
  })

  it('allows the request once the current terms of service have been accepted', async () => {
    await user.update({ tosAcceptedAt: DateTime.now(), tosVersion: CURRENT_TOS_VERSION })

    await request.get('/v1/host/places', 200)
  })

  it('blocks a user whose accepted terms-of-service version is stale', async () => {
    await user.update({ tosAcceptedAt: DateTime.now(), tosVersion: 'an-old-version' })

    await request.get('/v1/host/places', 403)
  })
})
