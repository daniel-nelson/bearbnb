import { Decorators, SoftDelete } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import Guest from '@models/Guest.js'
import Place from '@models/Place.js'

const deco = new Decorators<typeof Booking>()

@SoftDelete()
export default class Booking extends ApplicationModel {
  public override get table() {
    return 'bookings' as const
  }

  public get serializers(): DreamSerializers<Booking> {
    return {
      default: 'BookingSerializer',
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
}
