import { STI } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import Room from '@models/Room.js'

@STI(Room)
export default class Bedroom extends Room {
  public override get serializers(): DreamSerializers<Bedroom> {
    return {
      default: 'Room/BedroomSerializer',
      summary: 'Room/BedroomSummarySerializer',
      forVisitors: 'Room/BedroomForVisitorsSerializer',
    }
  }

  public bedTypes: DreamColumn<Bedroom, 'bedTypes'>
}
