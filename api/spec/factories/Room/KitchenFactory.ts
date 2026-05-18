import { UpdateableProperties } from '@rvoh/dream/types'
import Kitchen from '@models/Room/Kitchen.js'
import createPlace from '@spec/factories/PlaceFactory.js'

export default async function createKitchen(attrs: UpdateableProperties<Kitchen> = {}) {
  return await Kitchen.create({
    place: attrs.place ? null : await createPlace(),
    appliances: ['stove'],
    ...attrs,
  })
}
