import { RoomSerializer, RoomSummarySerializer } from '@serializers/RoomSerializer.js'
import Bathroom from '@models/Room/Bathroom.js'

export const RoomBathroomSummarySerializer = (bathroom: Bathroom) =>
  RoomSummarySerializer(Bathroom, bathroom)

export const RoomBathroomSerializer = (bathroom: Bathroom) =>
  RoomSerializer(Bathroom, bathroom)
    .attribute('bathOrShowerStyle')
