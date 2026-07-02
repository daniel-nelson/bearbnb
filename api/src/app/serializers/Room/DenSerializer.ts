import {
  RoomForHostSerializer,
  RoomForVisitorsSerializer,
  RoomSerializer,
  RoomSummarySerializer,
} from '@serializers/RoomSerializer.js'
import Den from '@models/Room/Den.js'
import { type LocalesEnum } from '@src/types/db.js'

export const RoomDenSummarySerializer = (den: Den) =>
  RoomSummarySerializer(Den, den)

export const RoomDenSerializer = (den: Den) =>
  RoomSerializer(Den, den)

export const RoomDenForHostSerializer = (den: Den) =>
  RoomForHostSerializer(Den, den)

export const RoomDenForVisitorsSerializer = (roomDen: Den, passthrough: { locale: LocalesEnum }) =>
  RoomForVisitorsSerializer(Den, roomDen, passthrough)
