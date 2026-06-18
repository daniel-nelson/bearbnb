import { Decorators, SoftDelete } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import Guest from '@models/Guest.js'
import Booking from '@models/Booking.js'
import Place from '@models/Place.js'

const deco = new Decorators<typeof Review>()
const bodyMaxLength = 2000

@SoftDelete()
export default class Review extends ApplicationModel {
  public override get table() {
    return 'reviews' as const
  }

  public get serializers(): DreamSerializers<Review> {
    return {
      default: 'ReviewSerializer',
      summary: 'ReviewSummarySerializer',
      forPlaceGuests: 'ReviewForPlaceGuestsSerializer',
    }
  }

  public id: DreamColumn<Review, 'id'>
  @deco.Validates('numericality', { min: 1, max: 5 })
  public rating: DreamColumn<Review, 'rating'>
  @deco.Validates('length', { min: 1, max: bodyMaxLength })
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

  @deco.Validate()
  public async validateBookingHasNoReview(this: Review) {
    if (!this.bookingId) return

    let query = Review.where({ bookingId: this.bookingId })
    if (this.isPersisted) query = query.whereNot({ id: this.id })

    if (await query.exists()) this.addError('bookingId', 'has already been reviewed')
  }
}
