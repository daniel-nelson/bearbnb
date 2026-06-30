import { ObjectSerializer } from '@rvoh/dream'
import { RoomForVisitorsSerializer, RoomSerializer, RoomSummarySerializer } from '@serializers/RoomSerializer.js'
import Kitchen from '@models/Room/Kitchen.js'
import { type ApplianceTypesEnum, ApplianceTypesEnumValues, type LocalesEnum } from '@src/types/db.js'
import i18n from '@src/utils/i18n.js'

export const RoomKitchenSummarySerializer = (kitchen: Kitchen) =>
  RoomSummarySerializer(Kitchen, kitchen)

export const RoomKitchenSerializer = (kitchen: Kitchen) =>
  RoomSerializer(Kitchen, kitchen)
    .attribute('appliances')

export const ApplianceSerializer = (appliance: ApplianceTypesEnum, passthrough: { locale: LocalesEnum }) =>
  ObjectSerializer({ appliance }, passthrough)
    .attribute('appliance', { as: 'value', openapi: { type: 'string', enum: ApplianceTypesEnumValues } })
    .customAttribute('label', () => i18n(passthrough.locale, `rooms.Kitchen.appliances.${appliance}`), {
      openapi: 'string',
    })

export const RoomKitchenForVisitorsSerializer = (roomKitchen: Kitchen, passthrough: { locale: LocalesEnum }) =>
  RoomForVisitorsSerializer(Kitchen, roomKitchen, passthrough).rendersMany<Kitchen>('appliances', {
    serializer: ApplianceSerializer,
  })
