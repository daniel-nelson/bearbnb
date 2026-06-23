import { OpenAPI } from '@rvoh/psychic'
import Favorite from '@models/Favorite.js'
import Place from '@models/Place.js'
import V1GuestAuthedController from './AuthedController.js'

const openApiTags = ['favorites']

export default class V1GuestFavoritesController extends V1GuestAuthedController {
  @OpenAPI(Favorite, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Favorite',
    fastJsonStringify: true,
    requestBody: {
      including: ['placeId'],
    },
  })
  public async create() {
    const placeId = this.castParam('placeId', 'uuid')
    await Place.findOrFail(placeId)

    const favorite = await Favorite.createOrFindBy({ guestId: this.currentGuest.id, placeId })

    this.created(await favorite.loadFor('default').execute())
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a Favorite',
    fastJsonStringify: true,
  })
  public async destroy() {
    const favorite = await this.favorite()
    await favorite.destroy()
    this.noContent()
  }

  private async favorite() {
    return await this.currentGuest
      .associationQuery('favorites')
      .preloadFor('default')
      .findOrFail(this.castParam('id', 'uuid'))
  }
}
