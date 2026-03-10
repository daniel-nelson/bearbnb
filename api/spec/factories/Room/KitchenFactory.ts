import { UpdateableProperties } from '@rvoh/dream/types'
import Kitchen from '@models/Room/Kitchen.js'

export default async function createKitchen(attrs: UpdateableProperties<Kitchen> = {}) {
  return await Kitchen.create({
    appliances: ['stove'],
    ...attrs,
  })
}
