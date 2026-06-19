import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import Review from '@models/Review.js'
import V1GuestAuthedController from './AuthedController.js'

const openApiTags = ['guest-reviews']

const paramSafeColumns: DreamParamSafeColumnNames<Review>[] = ['rating', 'body']

export default class V1GuestReviewsController extends V1GuestAuthedController {
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
    const booking = await this.currentGuest
      .associationQuery('bookings')
      .findOrFail(this.castParam('bookingId', 'uuid'))

    if (await booking.associationQuery('review').exists()) return this.badRequest()

    const review = await Review.create({
      booking,
      ...this.extractParams(Review, paramSafeColumns),
    })
    this.created(review)
  }
}
