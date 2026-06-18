import {
  RoomForGuestsSerializer,
  RoomSerializer,
  RoomSummarySerializer,
} from '@serializers/RoomSerializer.js'
import Den from '@models/Room/Den.js'
import { type LocalesEnum } from '@src/types/db.js'

export const RoomDenSummarySerializer = (den: Den) => RoomSummarySerializer(Den, den)

export const RoomDenSerializer = (den: Den) => RoomSerializer(Den, den)

export const RoomDenForGuestsSerializer = (roomDen: Den, passthrough: { locale: LocalesEnum }) =>
  RoomForGuestsSerializer(Den, roomDen, passthrough)
