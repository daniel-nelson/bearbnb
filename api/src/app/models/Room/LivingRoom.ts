import { STI } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import Room from '@models/Room.js'

// Uncomment when adding decorators (@deco.BelongsTo, @deco.Validates, etc.):
// import { Decorators } from '@rvoh/dream'
// const deco = new Decorators<typeof LivingRoom>()

@STI(Room)
export default class LivingRoom extends Room {
  public override get serializers(): DreamSerializers<LivingRoom> {
    return {
      default: 'Room/LivingRoomSerializer',
      summary: 'Room/LivingRoomSummarySerializer',
      forGuests: 'Room/LivingRoomForGuestsSerializer',
    }
  }

}
