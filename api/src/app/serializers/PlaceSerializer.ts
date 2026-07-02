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
    .delegatedAttribute('currentLocalizedText', 'title', { openapi: 'string' })
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
