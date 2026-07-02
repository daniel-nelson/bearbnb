import { DreamSerializer } from '@rvoh/dream'
import Place from '@models/Place.js'
import { type LocalesEnum } from '@src/types/db.js'
import i18n from '@src/utils/i18n.js'

export const PlaceSummarySerializer = (place: Place) =>
  DreamSerializer(Place, place)
    .attribute('id')
    .attribute('name')

export const PlaceSerializer = (place: Place) =>
  PlaceSummarySerializer(place)
    .attribute('style')
    .attribute('sleeps')

export const PlaceSummaryForVisitorsSerializer = (place: Place) =>
  DreamSerializer(Place, place)
    .attribute('id')
    // Render the always-present en-US fallback title first, then let the requested
    // locale's title override it. When the requested locale has no LocalizedText,
    // `currentLocalizedText` is null and the optional delegated attribute is skipped,
    // leaving the fallback in place. Order matters: fallback before current.
    .delegatedAttribute('fallbackCurrentLocalizedText', 'title', { openapi: 'string' })
    .delegatedAttribute('currentLocalizedText', 'title', { openapi: 'string', required: false })
    .delegatedAttribute('currentFavorite', 'id', {
      as: 'favoriteId',
      openapi: 'string',
      optional: true,
    })
    .customAttribute('favorited', () => !!place.currentFavorite, { openapi: 'boolean' })

export const PlaceForHostSerializer = (place: Place) =>
  PlaceSerializer(place)
    .rendersMany('localizedTexts')
    .rendersMany('rooms')

export const PlaceForVisitorsSerializer = (place: Place, passthrough: { locale: LocalesEnum }) =>
  PlaceSummaryForVisitorsSerializer(place)
    .attribute('style')
    .customAttribute('displayStyle', () => i18n(passthrough.locale, `places.style.${place.style}`), {
      openapi: 'string',
    })
    .attribute('sleeps')
    .rendersMany('rooms', { serializerKey: 'forVisitors' })
