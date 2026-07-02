import { STI } from '@rvoh/dream'
import { DreamSerializers } from '@rvoh/dream/types'
import Room from '@models/Room.js'

@STI(Room)
export default class LivingRoom extends Room {
  public override get serializers(): DreamSerializers<LivingRoom> {
    return {
      default: 'Room/LivingRoomSerializer',
      summary: 'Room/LivingRoomSummarySerializer',
      forHost: 'Room/LivingRoomForHostSerializer',
      forVisitors: 'Room/LivingRoomForVisitorsSerializer',
    }
  }
}
