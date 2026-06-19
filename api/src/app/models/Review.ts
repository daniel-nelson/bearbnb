import { Decorators, SoftDelete } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import Booking from '@models/Booking.js'

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

  @deco.BelongsTo('Booking', { on: 'bookingId' })
  public booking: Booking
  public bookingId: DreamColumn<Review, 'bookingId'>

  @deco.Validate()
  public validateRating(this: Review) {
    if (this.rating === null || this.rating === undefined) return
    if (this.rating >= 1 && this.rating <= 5) return

    this.addError('rating', 'must be between 1 and 5')
  }

  @deco.Validate()
  public validateBody(this: Review) {
    if (this.body?.trim()) return

    this.addError('body', 'must be present')
  }
}
