import { STI } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import Room from '@models/Room.js'

// Uncomment when adding decorators (@deco.BelongsTo, @deco.Validates, etc.):
// import { Decorators } from '@rvoh/dream'
// const deco = new Decorators<typeof Den>()

@STI(Room)
export default class Den extends Room {
  public override get serializers(): DreamSerializers<Den> {
    return {
      default: 'Room/DenSerializer',
      summary: 'Room/DenSummarySerializer',
      forVisitors: 'Room/DenForVisitorsSerializer',
    }
  }

}
