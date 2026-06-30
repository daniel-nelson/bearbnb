import { CURRENT_TOS_VERSION } from '@conf/termsOfService.js'
import { DateTime } from '@rvoh/dream'
import { UpdateableProperties } from '@rvoh/dream/types'
import User from '@models/User.js'

let counter = 0

export default async function createUser(attrs: UpdateableProperties<User> = {}) {
  return await User.create({
    email: `email-${++counter}@example.com`,
    phone: `User phone ${counter}`,
    // Default to a consented user so authenticated specs pass the terms-of-service
    // gate. Specs covering provisioned-but-unconsented users override these to null.
    tosAcceptedAt: DateTime.now(),
    tosVersion: CURRENT_TOS_VERSION,
    ...attrs,
  })
}
