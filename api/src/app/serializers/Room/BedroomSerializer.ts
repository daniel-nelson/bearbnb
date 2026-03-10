import { RoomSerializer, RoomSummarySerializer } from '@serializers/RoomSerializer.js'
import Bedroom from '@models/Room/Bedroom.js'

export const RoomBedroomSummarySerializer = (bedroom: Bedroom) =>
  RoomSummarySerializer(Bedroom, bedroom)

export const RoomBedroomSerializer = (bedroom: Bedroom) =>
  RoomSerializer(Bedroom, bedroom)
    .attribute('bedTypes')
