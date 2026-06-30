import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import V1GuestBaseController from './BaseController.js'
import Review from '@models/Review.js'

const openApiTags = ['reviews']

const paramSafeColumns: DreamParamSafeColumnNames<Review>[] = ['rating', 'body']

export default class V1GuestReviewsController extends V1GuestBaseController {
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
    status: 201,
    tags: openApiTags,
    description: 'Create a Review',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
      including: ['bookingId'],
    },
  })
  public async create() {
    const booking = await this.currentGuest
      .associationQuery('bookings')
      .findOrFail(this.castParam('bookingId', 'uuid'))

    if (await booking.associationQuery('review').exists()) {
      return this.conflict('Booking already has a review')
    }

    let review = await booking.createAssociation('review', this.extractParams(Review, paramSafeColumns))
    if (review.isPersisted) review = await review.loadFor('default').execute()
    this.created(review)
  }

  @OpenAPI(Review, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Review',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
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
}
