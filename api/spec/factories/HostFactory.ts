import { DateTime } from '@rvoh/dream'
import { UpdateableProperties } from '@rvoh/dream/types'
import Host from '@models/Host.js'
import createUser from '@spec/factories/UserFactory.js'

let counter = 0

export default async function createHost(attrs: UpdateableProperties<Host> = {}) {
  return await Host.create({
    user: attrs.user ? null : await createUser(),
    legalName: `Host legalName ${++counter}`,
    signedHostAgreementAt: DateTime.now(),
    ...attrs,
  })
}
