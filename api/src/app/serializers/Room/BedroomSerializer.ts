import Bedroom from '@models/Room/Bedroom.js'
import { ObjectSerializer } from '@rvoh/dream'
import { RoomForGuestsSerializer, RoomSerializer, RoomSummarySerializer } from '@serializers/RoomSerializer.js'
import { BedTypesEnum, BedTypesEnumValues, LocalesEnum } from '@src/types/db.js'
import i18n from '@src/utils/i18n.js'

export const RoomBedroomSummarySerializer = (bedroom: Bedroom) =>
  RoomSummarySerializer(Bedroom, bedroom)

export const RoomBedroomSerializer = (bedroom: Bedroom) =>
  RoomSerializer(Bedroom, bedroom)
    .attribute('bedTypes')

export const BedTypeSerializer = (bedType: BedTypesEnum, passthrough: { locale: LocalesEnum }) =>
  ObjectSerializer({ bedType }, passthrough)
    .attribute('bedType', { as: 'value', openapi: { type: 'string', enum: BedTypesEnumValues } })
    .customAttribute('label', () => i18n(passthrough.locale, `rooms.Bedroom.bedTypes.${bedType}`), {
      openapi: 'string',
    })

export const RoomBedroomForGuestsSerializer = (roomBedroom: Bedroom, passthrough: { locale: LocalesEnum }) =>
  RoomForGuestsSerializer(Bedroom, roomBedroom, passthrough).rendersMany('bedTypes', {
    serializer: BedTypeSerializer,
  })
