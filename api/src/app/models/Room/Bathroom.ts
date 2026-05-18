import { STI } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import Room from '@models/Room.js'

// Uncomment when adding decorators (@deco.BelongsTo, @deco.Validates, etc.):
// import { Decorators } from '@rvoh/dream'
// const deco = new Decorators<typeof Bathroom>()

@STI(Room)
export default class Bathroom extends Room {
  public override get serializers(): DreamSerializers<Bathroom> {
    return {
      default: 'Room/BathroomSerializer',
      summary: 'Room/BathroomSummarySerializer',
      forGuests: 'Room/BathroomForGuestsSerializer',
    }
  }

  public bathOrShowerStyle: DreamColumn<Bathroom, 'bathOrShowerStyle'>
}
