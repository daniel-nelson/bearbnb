import { Decorators, ops, SoftDelete } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import { range } from '@rvoh/dream/utils'
import ApplicationModel from '@models/ApplicationModel.js'
import Guest from '@models/Guest.js'
import Place from '@models/Place.js'
import Review from '@models/Review.js'

const deco = new Decorators<typeof Booking>()

@SoftDelete()
export default class Booking extends ApplicationModel {
  public override get table() {
    return 'bookings' as const
  }

  public get serializers(): DreamSerializers<Booking> {
    return {
      default: 'BookingSerializer',
      bookedRange: 'BookingBookedRangeSerializer',
      summary: 'BookingSummarySerializer',
    }
  }

  public id: DreamColumn<Booking, 'id'>
  public startsOn: DreamColumn<Booking, 'startsOn'>
  public endsOn: DreamColumn<Booking, 'endsOn'>
  public createdAt: DreamColumn<Booking, 'createdAt'>
  public updatedAt: DreamColumn<Booking, 'updatedAt'>
  public deletedAt: DreamColumn<Booking, 'deletedAt'>

  @deco.BelongsTo('Guest', { on: 'guestId' })
  public guest: Guest
  public guestId: DreamColumn<Booking, 'guestId'>

  @deco.BelongsTo('Place', { on: 'placeId' })
  public place: Place
  public placeId: DreamColumn<Booking, 'placeId'>

  @deco.HasMany('Review', { dependent: 'destroy' })
  public reviews: Review[]

  @deco.Validate()
  public validateDateOrder(this: Booking) {
    if (this.startsOn && this.endsOn && this.startsOn > this.endsOn) {
      this.addError('endsOn', 'must be on or after startsOn')
    }
  }

  @deco.Validate()
  public async validateAvailability(this: Booking) {
    if (!this.placeId || !this.startsOn || !this.endsOn) return

    let query = Booking.where({
      placeId: this.placeId,
      startsOn: range(null, this.endsOn),
      endsOn: range(this.startsOn, null),
    })

    if (this.isPersisted) query = query.where({ id: ops.not.equal(this.id) })

    if (await query.exists()) this.addError('startsOn', 'is not available for this place')
  }
}
