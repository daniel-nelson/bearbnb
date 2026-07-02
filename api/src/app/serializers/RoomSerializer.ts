import { DreamSerializer } from '@rvoh/dream'
import Room from '@models/Room.js'
import { type LocalesEnum } from '@src/types/db.js'
import i18n from '@src/utils/i18n.js'

export const RoomSummarySerializer = <T extends Room>(StiChildClass: typeof Room, room: T) =>
  DreamSerializer(StiChildClass ?? Room, room)
    .attribute('id')
    .attribute('type', { openapi: { type: 'string', enum: [(StiChildClass ?? Room).sanitizedName] } })
    .attribute('position')

export const RoomSerializer = <T extends Room>(StiChildClass: typeof Room, room: T) =>
  RoomSummarySerializer(StiChildClass, room)

// Host-facing shape: owner-management fields plus the editable localized text rows the
// Host Room show/edit screens need (raw rows, not a locale-selected display string).
// Mirrors PlaceForHostSerializer. Each STI child extends this and adds its own
// type-specific column.
export const RoomForHostSerializer = <T extends Room>(StiChildClass: typeof Room, room: T) =>
  RoomSerializer(StiChildClass, room)
    .rendersMany('localizedTexts')

export const RoomForVisitorsSerializer = <T extends Room>(
  StiChildClass: typeof Room,
  room: T,
  passthrough: { locale: LocalesEnum }
) =>
  DreamSerializer(StiChildClass ?? Room, room)
    .attribute('id')
    .attribute('type', { openapi: { type: 'string', enum: [(StiChildClass ?? Room).sanitizedName] } })
    .customAttribute('displayType', () => i18n(passthrough.locale, `rooms.type.${room.type}`), {
      openapi: 'string',
    })
    // Render the always-present en-US fallback title first, then let the requested
    // locale's title override it (skipped when that locale's LocalizedText is absent).
    .delegatedAttribute<Room, 'fallbackCurrentLocalizedText'>('fallbackCurrentLocalizedText', 'title', {
      openapi: 'string',
    })
    .delegatedAttribute<Room, 'currentLocalizedText'>('currentLocalizedText', 'title', {
      openapi: 'string',
      required: false,
    })
