import { RoomSerializer, RoomSummarySerializer } from '@serializers/RoomSerializer.js'
import Kitchen from '@models/Room/Kitchen.js'

export const RoomKitchenSummarySerializer = (kitchen: Kitchen) =>
  RoomSummarySerializer(Kitchen, kitchen)

export const RoomKitchenSerializer = (kitchen: Kitchen) =>
  RoomSerializer(Kitchen, kitchen)
    .attribute('appliances')
