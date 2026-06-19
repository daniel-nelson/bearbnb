import { OpenAPI } from '@rvoh/psychic'
import V1GuestPlacesBaseController from './BaseController.js'
import Review from '@models/Review.js'

const openApiTags = ['reviews']

export default class V1GuestPlacesReviewsController extends V1GuestPlacesBaseController {
  @OpenAPI(Review, {
    status: 200,
    tags: openApiTags,
    description: 'Paginated index of Reviews',
    cursorPaginate: true,
    serializerKey: 'default',
    fastJsonStringify: true,
  })
  public async index() {
    const reviews = await this.currentPlace
      .associationQuery('reviews')
      .preloadFor('default')
      .order({ createdAt: 'desc' })
      .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    this.ok(reviews)
  }
}
