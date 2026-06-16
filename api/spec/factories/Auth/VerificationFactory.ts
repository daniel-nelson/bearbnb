import { DateTime } from '@rvoh/dream'
import { UpdateableProperties } from '@rvoh/dream/types'
import AuthVerification from '@models/Auth/Verification.js'

let counter = 0

export default async function createAuthVerification(attrs: UpdateableProperties<AuthVerification> = {}) {
  return await AuthVerification.create({
    identifier: `Auth/Verification identifier ${++counter}`,
    value: `Auth/Verification value ${counter}`,
    expiresAt: DateTime.now(),
    ...attrs,
  })
}
