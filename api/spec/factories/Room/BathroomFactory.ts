import { UpdateableProperties } from '@rvoh/dream/types'
import Bathroom from '@models/Room/Bathroom.js'

export default async function createBathroom(attrs: UpdateableProperties<Bathroom> = {}) {
  return await Bathroom.create({
    bathOrShowerStyle: 'bath',
    ...attrs,
  })
}
