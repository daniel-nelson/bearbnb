import Guest from '@models/Guest.js'
import Review from '@models/Review.js'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import { BeforeAction, OpenAPI } from '@rvoh/psychic'
import V1GuestBaseController from './BaseController.js'

const openApiTags = ['reviews']

const paramSafeColumns: DreamParamSafeColumnNames<Review>[] = ['rating', 'body']

export default class V1GuestReviewsController extends V1GuestBaseController {
  protected currentGuest: Guest

  @BeforeAction()
  protected async loadCurrentGuest() {
    if (!this.currentUser) return this.unauthorized()

    this.currentGuest =
      (await this.currentUser.associationQuery('guest').first()) ||
      (await this.currentUser.createAssociation('guest'))
  }

  @OpenAPI(Review, {
    status: 200,
    tags: openApiTags,
    description: 'Paginated index of Reviews',
    cursorPaginate: true,
    serializerKey: 'summary',
    fastJsonStringify: true,
  })
  public async index() {
    const reviews = await this.currentGuest
      .associationQuery('reviews')
      .preloadFor('summary')
      .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    this.ok(reviews)
  }

  @OpenAPI(Review, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Review',
    fastJsonStringify: true,
  })
  public async show() {
    const review = await this.review()
    this.ok(review)
  }

  @OpenAPI(Review, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Review',
    fastJsonStringify: true,
    requestBody: {
      only: paramSafeColumns,
      including: ['bookingId'],
    },
  })
  public async create() {
    const booking = await this.reviewableBooking()
    if (await Review.where({ bookingId: booking.id }).exists()) return this.bookingAlreadyReviewed()

    let review = await this.currentGuest.createAssociation('reviews', {
      booking,
      placeId: booking.placeId,
      ...this.extractParams(Review, paramSafeColumns),
    })
    if (review.isPersisted) review = await review.loadFor('default').execute()
    this.created(review)
  }

  @OpenAPI(Review, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Review',
    fastJsonStringify: true,
    requestBody: {
      only: paramSafeColumns,
    },
  })
  public async update() {
    const review = await this.review()
    await review.update(this.extractParams(Review, paramSafeColumns))
    this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a Review',
    fastJsonStringify: true,
  })
  public async destroy() {
    const review = await this.review()
    await review.destroy()
    this.noContent()
  }

  private async review() {
    return await this.currentGuest
      .associationQuery('reviews')
      .preloadFor('default')
      .findOrFail(this.castParam('id', 'uuid'))
  }

  private async reviewableBooking() {
    return await this.currentGuest
      .associationQuery('bookings')
      .findOrFail(this.castParam('bookingId', 'uuid'))
  }

  private bookingAlreadyReviewed() {
    this.unprocessableContent({ errors: { bookingId: ['has already been reviewed'] } })
  }
}
