import Favorite from '#models/Favorite.js'
import Place from '#models/Place.js'
import { OpenAPI } from '@rvoh/psychic'
import V1GuestBaseController from './BaseController.js'

const openApiTags = ['favorites']

export default class V1GuestFavoritesController extends V1GuestBaseController {
  @OpenAPI(Favorite, {
    status: 200,
    tags: openApiTags,
    description: 'Paginated index of Favorites',
    cursorPaginate: true,
    serializerKey: 'summary',
    fastJsonStringify: true,
  })
  public async index() {
    const favorites = await this.currentGuest
      .associationQuery('favorites')
      .preloadFor('summary')
      .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    this.ok(favorites)
  }

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
    const place = await Place.findOrFail(this.castParam('placeId', 'uuid'))
    let favorite =
      (await this.currentGuest.associationQuery('favorites').where({ place }).first()) ??
      (await this.currentGuest.createAssociation('favorites', { place }))
    favorite = await favorite.loadFor('default').execute()
    this.created(favorite)
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
