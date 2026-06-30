import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import HostPlace from '@models/HostPlace.js'
import V1HostBaseController from './BaseController.js'
import Place from '@models/Place.js'

const openApiTags = ['places']

const paramSafeColumns: DreamParamSafeColumnNames<Place>[] = ['name', 'style', 'sleeps']

export default class V1HostPlacesController extends V1HostBaseController {
  @OpenAPI(Place, {
    status: 200,
    tags: openApiTags,
    description: 'Paginated index of Places',
    cursorPaginate: true,
    serializerKey: 'summary',
    fastJsonStringify: true,
  })
  public async index() {
    const places = await this.currentHost
      .associationQuery('places')
      .preloadFor('summary')
      .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    this.ok(places)
  }

  @OpenAPI(Place, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Place',
    fastJsonStringify: true,
  })
  public async show() {
    const place = await this.place()
    this.ok(place)
  }

  @OpenAPI(Place, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Place',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async create() {
    let place = await ApplicationModel.transaction(async txn => {
      const place = await Place.txn(txn).create(this.extractParams(Place, paramSafeColumns))
      await HostPlace.txn(txn).create({ host: this.currentHost, place })
      return place
    })

    if (place.isPersisted) place = await place.loadFor('default').execute()
    this.created(place)
  }

  @OpenAPI(Place, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Place',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async update() {
    const place = await this.place()
    await place.update(this.extractParams(Place, paramSafeColumns))
    this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a Place',
    fastJsonStringify: true,
  })
  public async destroy() {
    const place = await this.place()
    await place.destroy()
    this.noContent()
  }

  private async place() {
    return await this.currentHost
      .associationQuery('places')
      .preloadFor('default')
      .findOrFail(this.castParam('id', 'uuid'))
  }
}
