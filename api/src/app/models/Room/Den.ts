import { STI } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import Room from '@models/Room.js'

@STI(Room)
export default class Den extends Room {
  public override get serializers(): DreamSerializers<Den> {
    return {
      default: 'Room/DenSerializer',
      summary: 'Room/DenSummarySerializer',
    }
  }

}
