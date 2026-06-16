import { BeforeAction, OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import Booking from '@models/Booking.js'
import Guest from '@models/Guest.js'
import V1GuestBaseController from './BaseController.js'

const openApiTags = ['bookings']

const paramSafeColumns: DreamParamSafeColumnNames<Booking>[] = ['startsOn', 'endsOn']

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
  })
  public async create() {
    let booking = await this.currentGuest.createAssociation('bookings', {
      placeId: this.castParam('placeId', 'uuid'),
      ...this.extractParams(Booking, paramSafeColumns),
    })
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
  })
  public async update() {
    const booking = await this.booking()
    await booking.update(this.extractParams(Booking, paramSafeColumns))
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
}
