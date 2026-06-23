import { UpdateableProperties } from '@rvoh/dream/types'
import Favorite from '@models/Favorite.js'
import createGuest from '@spec/factories/GuestFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'

export default async function createFavorite(attrs: UpdateableProperties<Favorite> = {}) {
  return await Favorite.create({
    guest: attrs.guest ? null : await createGuest(),
    place: attrs.place ? null : await createPlace(),
    ...attrs,
  })
}
