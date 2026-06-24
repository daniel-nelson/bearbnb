import { OpenAPI } from '@rvoh/psychic'
import { CalendarDate } from '@rvoh/dream'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import V1GuestBaseController from './BaseController.js'
import Booking from '@models/Booking.js'
import BookPlace, { BookingDatesUnavailable } from '@services/BookPlace.js'

const openApiTags = ['bookings']
const paramSafeColumns: DreamParamSafeColumnNames<Booking>[] = ['startsOn', 'endsOn']

export default class V1GuestBookingsController extends V1GuestBaseController {
  @OpenAPI(Booking, {
    status: 200,
    tags: openApiTags,
    description: 'Paginated index of Bookings',
    cursorPaginate: true,
    serializerKey: 'summary',
    fastJsonStringify: true,
  })
  public async index() {
    const bookings = await this.currentGuest
      .associationQuery('bookings')
      .preloadFor('summary')
      .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    this.ok(bookings)
  }

  @OpenAPI(Booking, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Booking',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
      including: ['placeId'],
    },
  })
  public async create() {
    try {
      let booking = await BookPlace.create(this.currentGuest, this.bookingParams())
      if (booking.isPersisted) booking = await booking.loadFor('default').execute()
      this.created(booking)
    } catch (err) {
      if (err instanceof BookingDatesUnavailable) return this.conflict('Booking dates are unavailable')
      throw err
    }
  }

  @OpenAPI(Booking, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Booking',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
      including: ['placeId'],
    },
  })
  public async update() {
    try {
      await BookPlace.update(await this.booking(), this.bookingParams())
      this.noContent()
    } catch (err) {
      if (err instanceof BookingDatesUnavailable) return this.conflict('Booking dates are unavailable')
      throw err
    }
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a Booking',
    fastJsonStringify: true,
  })
  public async destroy() {
    const booking = await this.booking()
    await booking.destroy()
    this.noContent()
  }

  private async booking() {
    return await this.currentGuest
      .associationQuery('bookings')
      .preloadFor('default')
      .findOrFail(this.castParam('id', 'uuid'))
  }

  private bookingParams(): { placeId: string; startsOn: CalendarDate; endsOn: CalendarDate } {
    return {
      placeId: this.castParam('placeId', 'uuid'),
      startsOn: this.castParam('startsOn', 'date'),
      endsOn: this.castParam('endsOn', 'date'),
    }
  }
}
