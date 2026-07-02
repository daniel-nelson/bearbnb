import { STI } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import Room from '@models/Room.js'

@STI(Room)
export default class Bathroom extends Room {
  public override get serializers(): DreamSerializers<Bathroom> {
    return {
      default: 'Room/BathroomSerializer',
      summary: 'Room/BathroomSummarySerializer',
      forHost: 'Room/BathroomForHostSerializer',
      forVisitors: 'Room/BathroomForVisitorsSerializer',
    }
  }

  public bathOrShowerStyle: DreamColumn<Bathroom, 'bathOrShowerStyle'>
}
