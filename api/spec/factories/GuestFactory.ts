import { UpdateableProperties } from '@rvoh/dream/types'
import Guest from '@models/Guest.js'
import createUser from '@spec/factories/UserFactory.js'

export default async function createGuest(attrs: UpdateableProperties<Guest> = {}) {
  const user = attrs.user ?? (await createUser())
  const guest = await user.associationQuery('guest').first()
  if (!guest) return await Guest.create({ ...attrs, user })

  const guestAttrs: UpdateableProperties<Guest> = { ...attrs }
  delete guestAttrs.user
  if (Object.keys(guestAttrs).length) await guest.update(guestAttrs)
  return guest
}
