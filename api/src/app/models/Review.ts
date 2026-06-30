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
      visitorSummary: 'ReviewVisitorSummarySerializer',
    }
  }

  public id: DreamColumn<Review, 'id'>

  @deco.Validates('numericality', { min: 1, max: 5 })
  public rating: DreamColumn<Review, 'rating'>

  @deco.Validates('presence')
  public body: DreamColumn<Review, 'body'>
  public createdAt: DreamColumn<Review, 'createdAt'>
  public updatedAt: DreamColumn<Review, 'updatedAt'>
  public deletedAt: DreamColumn<Review, 'deletedAt'>

  @deco.Validates('requiredBelongsTo')
  @deco.BelongsTo('Booking', { on: 'bookingId' })
  public booking: Booking
  public bookingId: DreamColumn<Review, 'bookingId'>
}
