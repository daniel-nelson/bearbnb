import { UpdateableProperties } from '@rvoh/dream/types'
import Favorite from '@models/Favorite.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createUser from '@spec/factories/UserFactory.js'

export default async function createFavorite(attrs: UpdateableProperties<Favorite> = {}) {
  const guest = attrs.guest ? null : await (await createUser()).associationQuery('guest').firstOrFail()

  return await Favorite.create({
    guest,
    place: attrs.place ? null : await createPlace(),
    ...attrs,
  })
}
