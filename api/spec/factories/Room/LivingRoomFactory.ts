import { UpdateableProperties } from '@rvoh/dream/types'
import LivingRoom from '@models/Room/LivingRoom.js'
import createPlace from '@spec/factories/PlaceFactory.js'

export default async function createLivingRoom(attrs: UpdateableProperties<LivingRoom> = {}) {
  return await LivingRoom.create({
    place: attrs.place ? null : await createPlace(),
    ...attrs,
  })
}
