import Place from '@models/Place.js'
import { ops } from '@rvoh/dream'
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
    query: {
      q: { required: false, schema: 'string' },
    },
  })
  public async index() {
    const q = this.castParam('q', 'string', { allowNull: true })?.trim()
    const query = Place.passthrough({
      locale: this.locale,
      guestId: this.currentGuest?.id ?? null,
    }).preloadFor('summaryForVisitors')
    const places = await (
      q ? query.where({ name: ops.ilike(`%${ops.like.escape(q)}%`) }) : query
    ).cursorPaginate({
      cursor: this.castParam('cursor', 'string', { allowNull: true }),
    })
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
      await Place.passthrough({ locale: this.locale, guestId: this.currentGuest?.id ?? null })
        .preloadFor('forVisitors')
        .findOrFail(this.castParam('id', 'uuid')),
    )
  }
}
