import { UpdateableProperties } from '@rvoh/dream/types'
import AuthAccount from '@models/Auth/Account.js'
import createUser from '@spec/factories/UserFactory.js'

export default async function createAuthAccount(attrs: UpdateableProperties<AuthAccount> = {}) {
  return await AuthAccount.create({
    user: attrs.user ? null : await createUser(),
    ...attrs,
  })
}
