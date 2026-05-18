import { UpdateableProperties } from '@rvoh/dream/types'
import Bathroom from '@models/Room/Bathroom.js'
import createPlace from '@spec/factories/PlaceFactory.js'

export default async function createBathroom(attrs: UpdateableProperties<Bathroom> = {}) {
  return await Bathroom.create({
    place: attrs.place ? null : await createPlace(),
    bathOrShowerStyle: 'bath',
    ...attrs,
  })
}
