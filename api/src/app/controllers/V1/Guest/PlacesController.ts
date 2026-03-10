import Place from '@models/Place.js'
import { OpenAPI } from '@rvoh/psychic'
import V1GuestBaseController from './BaseController.js'

const openApiTags = ['guest-places']

export default class V1GuestPlacesController extends V1GuestBaseController {
  @OpenAPI(Place, {
    status: 200,
    tags: openApiTags,
    description: 'Place index endpoint for Guests',
    cursorPaginate: true,
    serializerKey: 'summaryForGuests',
    fastJsonStringify: true,
  })
  public async index() {
    const places = await Place.passthrough({ locale: this.locale })
      .preloadFor('summaryForGuests')
      .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
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
