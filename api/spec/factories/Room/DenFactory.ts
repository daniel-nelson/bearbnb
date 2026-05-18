import { UpdateableProperties } from '@rvoh/dream/types'
import Den from '@models/Room/Den.js'

export default async function createDen(attrs: UpdateableProperties<Den> = {}) {
  return await Den.create({
    ...attrs,
  })
}
