import { RoomForGuestsSerializer, RoomSerializer, RoomSummarySerializer } from '@serializers/RoomSerializer.js'
import LivingRoom from '@models/Room/LivingRoom.js'
import { type LocalesEnum } from '@src/types/db.js'

export const RoomLivingRoomSummarySerializer = (livingRoom: LivingRoom) =>
  RoomSummarySerializer(LivingRoom, livingRoom)

export const RoomLivingRoomSerializer = (livingRoom: LivingRoom) =>
  RoomSerializer(LivingRoom, livingRoom)

export const RoomLivingRoomForGuestsSerializer = (
  roomLivingRoom: LivingRoom,
  passthrough: { locale: LocalesEnum }
) => RoomForGuestsSerializer(LivingRoom, roomLivingRoom, passthrough)
