import { Decorators, SoftDelete } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import Guest from '@models/Guest.js'
import Booking from '@models/Booking.js'
import Place from '@models/Place.js'

const deco = new Decorators<typeof Review>()

@SoftDelete()
export default class Review extends ApplicationModel {
  public override get table() {
    return 'reviews' as const
  }

  public get serializers(): DreamSerializers<Review> {
    return {
      default: 'ReviewSerializer',
      summary: 'ReviewSummarySerializer',
    }
  }

  public id: DreamColumn<Review, 'id'>
  public rating: DreamColumn<Review, 'rating'>
  public body: DreamColumn<Review, 'body'>
  public createdAt: DreamColumn<Review, 'createdAt'>
  public updatedAt: DreamColumn<Review, 'updatedAt'>
  public deletedAt: DreamColumn<Review, 'deletedAt'>

  @deco.BelongsTo('Guest', { on: 'guestId' })
  public guest: Guest
  public guestId: DreamColumn<Review, 'guestId'>

  @deco.BelongsTo('Booking', { on: 'bookingId' })
  public booking: Booking
  public bookingId: DreamColumn<Review, 'bookingId'>

  @deco.BelongsTo('Place', { on: 'placeId' })
  public place: Place
  public placeId: DreamColumn<Review, 'placeId'>
}
