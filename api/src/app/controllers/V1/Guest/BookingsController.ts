import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import Place from '@models/Place.js'
import BookPlace from '@services/BookPlace.js'
import V1GuestAuthedController from './AuthedController.js'
import Booking from '@models/Booking.js'
import BookingDatesUnavailable from '../../../errors/BookingDatesUnavailable.js'

const openApiTags = ['bookings']

const paramSafeColumns: DreamParamSafeColumnNames<Booking>[] = ['startsOn', 'endsOn']

export default class V1GuestBookingsController extends V1GuestAuthedController {
  @OpenAPI(Booking, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Booking',
    fastJsonStringify: true,
    requestBody: {
      only: paramSafeColumns,
      including: ['placeId'],
    },
  })
  public async create() {
    const place = await Place.findOrFail(this.castParam('placeId', 'uuid'))
    const startsOn = this.castParam('startsOn', 'date')
    const endsOn = this.castParam('endsOn', 'date')

    try {
      let booking = await BookPlace.create({ guest: this.currentGuest, place, startsOn, endsOn })
      if (booking.isPersisted) booking = await booking.loadFor('default').execute()
      this.created(booking)
    } catch (err) {
      if (err instanceof BookingDatesUnavailable) return this.badRequest()
      throw err
    }
  }
}
