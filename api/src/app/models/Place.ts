import { Decorators, DreamConst, SoftDelete } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import Booking from '@models/Booking.js'
import Favorite from '@models/Favorite.js'
import Host from '@models/Host.js'
import HostPlace from '@models/HostPlace.js'
import LocalizedText from '@models/LocalizedText.js'
import Review from '@models/Review.js'
import Room from '@models/Room.js'

const deco = new Decorators<typeof Place>()

@SoftDelete()
export default class Place extends ApplicationModel {
  public override get table() {
    return 'places' as const
  }

  public get serializers(): DreamSerializers<Place> {
    return {
      default: 'PlaceSerializer',
      summary: 'PlaceSummarySerializer',
      summaryForVisitors: 'PlaceSummaryForVisitorsSerializer',
      forVisitors: 'PlaceForVisitorsSerializer',
      forHost: 'PlaceForHostSerializer',
    }
  }

  public id: DreamColumn<Place, 'id'>
  public name: DreamColumn<Place, 'name'>
  public style: DreamColumn<Place, 'style'>
  public sleeps: DreamColumn<Place, 'sleeps'>
  public createdAt: DreamColumn<Place, 'createdAt'>
  public updatedAt: DreamColumn<Place, 'updatedAt'>
  public deletedAt: DreamColumn<Place, 'deletedAt'>

  @deco.HasMany('HostPlace', { dependent: 'destroy' })
  public hostPlaces: HostPlace[]

  @deco.HasMany('Host', { through: 'hostPlaces' })
  public hosts: Host[]

  @deco.HasMany('Room', { order: 'position', dependent: 'destroy' })
  public rooms: Room[]

  @deco.HasMany('Favorite', { dependent: 'destroy' })
  public favorites: Favorite[]

  @deco.HasMany('Booking', { dependent: 'destroy' })
  public bookings: Booking[]

  @deco.HasMany('Review', { through: 'bookings', source: 'review' })
  public reviews: Review[]

  @deco.HasOne('Favorite', {
    on: 'placeId',
    and: { guestId: DreamConst.passthrough },
  })
  public currentFavorite: Favorite

  @deco.HasMany('LocalizedText', { polymorphic: true, on: 'localizableId', dependent: 'destroy' })
  public localizedTexts: LocalizedText[]

  @deco.AfterCreate()
  public async createDefaultLocalizedText(this: Place) {
    await this.createAssociation('localizedTexts', { locale: 'en-US', title: `My ${this.style}` })
  }

  @deco.HasOne('LocalizedText', {
    polymorphic: true,
    on: 'localizableId',
    and: { locale: DreamConst.passthrough },
  })
  public currentLocalizedText: LocalizedText

  // Visitor-facing fallback: the default-locale (en-US) row is always present (the
  // AfterCreate hook creates it), so serializers can render it first and let the
  // requested-locale `currentLocalizedText` override it when that locale exists.
  // This lets Hosts save partial non-default translations without blanking Visitor pages.
  @deco.HasOne('LocalizedText', {
    polymorphic: true,
    on: 'localizableId',
    and: { locale: 'en-US' },
  })
  public fallbackCurrentLocalizedText: LocalizedText
}
