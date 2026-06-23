import Place from '@models/Place.js'
import { OpenAPI } from '@rvoh/psychic'
import VisitorBaseController from './BaseController.js'

const openApiTags = ['visitor-places']

export default class VisitorPlacesController extends VisitorBaseController {
  @OpenAPI(Place, {
    status: 200,
    tags: openApiTags,
    description: 'Place index endpoint for Visitors',
    cursorPaginate: true,
    serializerKey: 'summaryForVisitors',
    fastJsonStringify: true,
  })
  public async index() {
    const places = await Place.passthrough({ locale: this.locale })
      .preloadFor('summaryForVisitors')
      .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    this.ok(places)
  }

  @OpenAPI(Place, {
    status: 200,
    tags: openApiTags,
    description: 'Place show endpoint for Visitors',
    serializerKey: 'forVisitors',
    fastJsonStringify: true,
  })
  public async show() {
    this.ok(
      await Place.passthrough({ locale: this.locale })
        .preloadFor('forVisitors')
        .findOrFail(this.castParam('id', 'uuid')),
    )
  }
}
