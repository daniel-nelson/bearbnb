import { ops } from '@rvoh/dream'
import { OpenAPI } from '@rvoh/psychic'
import Place from '@models/Place.js'
import V1GuestBaseController from './BaseController.js'

const openApiTags = ['guest-places']
const placesPageSize = 18

export default class V1GuestPlacesController extends V1GuestBaseController {
  @OpenAPI(Place, {
    status: 200,
    tags: openApiTags,
    description: 'Place index endpoint for Guests',
    cursorPaginate: true,
    serializerKey: 'summaryForGuests',
    fastJsonStringify: true,
    query: {
      q: { required: false, schema: 'string' },
    },
  })
  public async index() {
    const q = this.castParam('q', 'string', { allowNull: true })?.trim()
    const query = Place.passthrough({ locale: this.locale }).preloadFor('summaryForGuests')
    const places = await (
      q ? query.where({ name: ops.ilike(`%${ops.like.escape(q)}%`) }) : query
    ).cursorPaginate({
      cursor: this.castParam('cursor', 'string', { allowNull: true }),
      pageSize: placesPageSize,
    })
    this.ok(places)
  }

  @OpenAPI(Place, {
    status: 200,
    tags: openApiTags,
    description: 'Place show endpoint for Guests',
    serializerKey: 'forGuests',
    fastJsonStringify: true,
  })
  public async show() {
    this.ok(
      await Place.passthrough({ locale: this.locale })
        .preloadFor('forGuests')
        .findOrFail(this.castParam('id', 'uuid')),
    )
  }
}
