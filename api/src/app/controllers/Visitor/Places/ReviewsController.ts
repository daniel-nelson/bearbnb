import { OpenAPI } from '@rvoh/psychic'
import Review from '@models/Review.js'
import VisitorPlacesBaseController from './BaseController.js'

const openApiTags = ['visitor-place-reviews']

export default class VisitorPlacesReviewsController extends VisitorPlacesBaseController {
  @OpenAPI(Review, {
    status: 200,
    tags: openApiTags,
    description: 'Paginated review index for a visitor place',
    cursorPaginate: true,
    serializerKey: 'visitorSummary',
    fastJsonStringify: true,
  })
  public async index() {
    const reviews = await this.currentPlace
      .associationQuery('reviews')
      .preloadFor('visitorSummary')
      .order({ createdAt: 'desc' })
      .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    this.ok(reviews)
  }
}
