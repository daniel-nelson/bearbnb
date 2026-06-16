import { DateTime } from '@rvoh/dream'
import { UpdateableProperties } from '@rvoh/dream/types'
import AuthSession from '@models/Auth/Session.js'
import createUser from '@spec/factories/UserFactory.js'

let counter = 0

export default async function createAuthSession(attrs: UpdateableProperties<AuthSession> = {}) {
  return await AuthSession.create({
    user: attrs.user ? null : await createUser(),
    token: `Auth/Session token ${++counter}`,
    expiresAt: DateTime.now(),
    ...attrs,
  })
}
