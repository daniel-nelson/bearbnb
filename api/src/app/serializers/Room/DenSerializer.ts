import { RoomSerializer, RoomSummarySerializer } from '@serializers/RoomSerializer.js'
import Den from '@models/Room/Den.js'

export const RoomDenSummarySerializer = (den: Den) =>
  RoomSummarySerializer(Den, den)

export const RoomDenSerializer = (den: Den) =>
  RoomSerializer(Den, den)
