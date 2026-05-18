import { UpdateableProperties } from '@rvoh/dream/types'
import Bedroom from '@models/Room/Bedroom.js'
import createPlace from '@spec/factories/PlaceFactory.js'

export default async function createBedroom(attrs: UpdateableProperties<Bedroom> = {}) {
  return await Bedroom.create({
    place: attrs.place ? null : await createPlace(),
    bedTypes: ['twin'],
    ...attrs,
  })
}
