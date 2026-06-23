import { DreamSerializer } from '@rvoh/dream'
import Place from '@models/Place.js'
import { type LocalesEnum } from '@src/types/db.js'
import i18n from '@src/utils/i18n.js'

type PlaceSummaryForGuestsPassthrough = {
  favoriteIdsByPlaceId?: Record<string, string>
}

export const PlaceSummarySerializer = (place: Place) =>
  DreamSerializer(Place, place)
    .attribute('id')
    .attribute('name')

export const PlaceSerializer = (place: Place) =>
  PlaceSummarySerializer(place)
    .attribute('style')
    .attribute('sleeps')

export const PlaceSummaryForGuestsSerializer = (place: Place, passthrough: PlaceSummaryForGuestsPassthrough = {}) =>
  DreamSerializer(Place, place)
    .attribute('id')
    .delegatedAttribute('currentLocalizedText', 'title', { openapi: 'string' })
    .customAttribute(
      'favorited',
      () => Boolean(passthrough.favoriteIdsByPlaceId?.[place.id]),
      { openapi: 'boolean' }
    )
    .customAttribute(
      'favoriteId',
      () => passthrough.favoriteIdsByPlaceId?.[place.id] ?? null,
      { openapi: { type: ['string', 'null'] } },
    )

export const PlaceForGuestsSerializer = (place: Place, passthrough: { locale: LocalesEnum } & PlaceSummaryForGuestsPassthrough) =>
  PlaceSummaryForGuestsSerializer(place, passthrough)
    .attribute('style')
    .customAttribute('displayStyle', () => i18n(passthrough.locale, `places.style.${place.style}`), {
      openapi: 'string',
    })
    .attribute('sleeps')
    .rendersMany('rooms', { serializerKey: 'forGuests' })
