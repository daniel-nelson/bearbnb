import { BeforeAction, OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import { range } from '@rvoh/dream/utils'
import { type CalendarDate } from '@rvoh/dream'
import Booking from '@models/Booking.js'
import Guest from '@models/Guest.js'
import V1GuestBaseController from './BaseController.js'

const openApiTags = ['bookings']
const unavailableResponse = () => ({
  type: 'object' as const,
  required: ['errors'],
  properties: {
    errors: {
      type: 'object' as const,
      required: ['startsOn'],
      properties: {
        startsOn: {
          type: 'array' as const,
          items: { type: 'string' as const },
        },
      },
    },
  },
})

const paramSafeColumns: DreamParamSafeColumnNames<Booking>[] = ['startsOn', 'endsOn']
type BookingAvailabilityParams = { placeId: string; startsOn: CalendarDate; endsOn: CalendarDate }

export default class V1GuestBookingsController extends V1GuestBaseController {
  protected currentGuest: Guest

  @BeforeAction()
  protected async loadCurrentGuest() {
    if (!this.currentUser) return this.unauthorized()

    this.currentGuest =
      (await this.currentUser.associationQuery('guest').first()) ||
      (await this.currentUser.createAssociation('guest'))
  }

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
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Booking',
    fastJsonStringify: true,
  })
  public async show() {
    const booking = await this.booking()
    this.ok(booking)
  }

  @OpenAPI(Booking, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Booking',
    fastJsonStringify: true,
    requestBody: {
      only: paramSafeColumns,
      including: ['placeId'],
    },
    responses: {
      422: unavailableResponse(),
    },
  })
  public async create() {
    const startsOn = this.castParam('startsOn', 'date')
    const endsOn = this.castParam('endsOn', 'date')
    const bookingParams = {
      placeId: this.castParam('placeId', 'uuid'),
      startsOn,
      endsOn,
    }
    if (await this.datesAreUnavailable(bookingParams)) return this.unavailable()

    let booking: Booking
    try {
      booking = await this.currentGuest.createAssociation('bookings', bookingParams)
    } catch (error) {
      if (isAvailabilityConstraintError(error)) return this.unavailable()
      throw error
    }
    if (booking.isPersisted) booking = await booking.loadFor('default').execute()
    this.created(booking)
  }

  @OpenAPI(Booking, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Booking',
    fastJsonStringify: true,
    requestBody: {
      only: paramSafeColumns,
    },
    responses: {
      422: unavailableResponse(),
    },
  })
  public async update() {
    const booking = await this.booking()
    const startsOn = this.castParam('startsOn', 'date', { allowNull: true })
    const endsOn = this.castParam('endsOn', 'date', { allowNull: true })
    const bookingParams = this.extractParams(Booking, paramSafeColumns)
    if (
      await this.datesAreUnavailable(
        {
          placeId: booking.placeId,
          startsOn: startsOn ?? booking.startsOn,
          endsOn: endsOn ?? booking.endsOn,
        },
        booking,
      )
    )
      return this.unavailable()

    try {
      await booking.update(bookingParams)
    } catch (error) {
      if (isAvailabilityConstraintError(error)) return this.unavailable()
      throw error
    }
    this.noContent()
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

  private async datesAreUnavailable(bookingParams: BookingAvailabilityParams, bookingToIgnore?: Booking) {
    if (bookingParams.startsOn > bookingParams.endsOn) return true

    let query = Booking.where({
      placeId: bookingParams.placeId,
      startsOn: range(null, bookingParams.endsOn),
      endsOn: range(bookingParams.startsOn, null),
    })

    if (bookingToIgnore) query = query.whereNot({ id: bookingToIgnore.id })

    return await query.exists()
  }

  private unavailable() {
    this.unprocessableContent({ errors: { startsOn: ['is not available for this place'] } })
  }
}

function isAvailabilityConstraintError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  return 'constraint' in error && error.constraint === 'bookings_place_id_date_range_exclusion'
}
