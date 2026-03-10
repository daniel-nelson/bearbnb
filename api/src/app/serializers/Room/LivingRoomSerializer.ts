import { RoomSerializer, RoomSummarySerializer } from '@serializers/RoomSerializer.js'
import LivingRoom from '@models/Room/LivingRoom.js'

export const RoomLivingRoomSummarySerializer = (livingRoom: LivingRoom) =>
  RoomSummarySerializer(LivingRoom, livingRoom)

export const RoomLivingRoomSerializer = (livingRoom: LivingRoom) =>
  RoomSerializer(LivingRoom, livingRoom)
