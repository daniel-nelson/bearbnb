import { UpdateableProperties } from '@rvoh/dream/types'
import Bedroom from '@models/Room/Bedroom.js'

export default async function createBedroom(attrs: UpdateableProperties<Bedroom> = {}) {
  return await Bedroom.create({
    bedTypes: ['twin'],
    ...attrs,
  })
}
