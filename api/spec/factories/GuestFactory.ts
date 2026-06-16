import { UpdateableProperties } from '@rvoh/dream/types'
import Guest from '@models/Guest.js'
import createUser from '@spec/factories/UserFactory.js'

export default async function createGuest(attrs: UpdateableProperties<Guest> = {}) {
  const { user, ...guestAttrs } = attrs
  const guestUser = user || (await createUser())
  const guest = await guestUser.associationQuery('guest').firstOrFail()
  await guest.update(guestAttrs)
  return guest
}
