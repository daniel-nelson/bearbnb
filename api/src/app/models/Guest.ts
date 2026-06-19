import { Decorators, SoftDelete } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import Booking from '@models/Booking.js'
import User from '@models/User.js'

const deco = new Decorators<typeof Guest>()

@SoftDelete()
export default class Guest extends ApplicationModel {
  public override get table() {
    return 'guests' as const
  }

  public get serializers(): DreamSerializers<Guest> {
    return {
      default: 'GuestSerializer',
      summary: 'GuestSummarySerializer',
    }
  }

  public id: DreamColumn<Guest, 'id'>
  public createdAt: DreamColumn<Guest, 'createdAt'>
  public updatedAt: DreamColumn<Guest, 'updatedAt'>
  public deletedAt: DreamColumn<Guest, 'deletedAt'>

  @deco.BelongsTo('User', { on: 'userId' })
  public user: User
  public userId: DreamColumn<Guest, 'userId'>

  @deco.HasMany('Booking', { dependent: 'destroy' })
  public bookings: Booking[]
}
