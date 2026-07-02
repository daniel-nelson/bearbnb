import { STI } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import Room from '@models/Room.js'

@STI(Room)
export default class Kitchen extends Room {
  public override get serializers(): DreamSerializers<Kitchen> {
    return {
      default: 'Room/KitchenSerializer',
      summary: 'Room/KitchenSummarySerializer',
      forHost: 'Room/KitchenForHostSerializer',
      forVisitors: 'Room/KitchenForVisitorsSerializer',
    }
  }

  public appliances: DreamColumn<Kitchen, 'appliances'>
}
