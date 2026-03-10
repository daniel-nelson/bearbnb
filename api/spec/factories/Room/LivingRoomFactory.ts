import { UpdateableProperties } from '@rvoh/dream/types'
import LivingRoom from '@models/Room/LivingRoom.js'

export default async function createLivingRoom(attrs: UpdateableProperties<LivingRoom> = {}) {
  return await LivingRoom.create({
    ...attrs,
  })
}
