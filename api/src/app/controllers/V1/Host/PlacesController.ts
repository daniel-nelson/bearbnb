import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import HostPlace from '@models/HostPlace.js'
import LocalizedText from '@models/LocalizedText.js'
import {
  DEFAULT_LOCALE,
  localizedTextParams,
  reconcileLocalizedTexts,
} from '@src/app/services/LocalizedTextReconciler.js'
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
    description: 'Fetch a Place, with localized text rows and embedded Rooms',
    serializerKey: 'forHost',
    fastJsonStringify: true,
  })
  public async show() {
    const place = await this.currentHost
      .associationQuery('places')
      .preloadFor('forHost')
      .findOrFail(this.castParam('id', 'uuid'))
    this.ok(place)
  }

  @OpenAPI(Place, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Place, with multi-locale localized text',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
      combining: {
        localizedTexts: {
          type: 'array',
          items: OpenAPI.forDream(LocalizedText, {
            params: localizedTextParams,
            required: localizedTextParams,
          }),
        },
      },
    },
    responses: {
      422: { description: `Missing ${DEFAULT_LOCALE} title and description` },
    },
  })
  public async create() {
    const placeParams = this.extractParams(Place, paramSafeColumns)
    const localizedTexts = this.extractLocalizedTexts()

    const defaultText = localizedTexts.find(text => text.locale === DEFAULT_LOCALE)
    if (!defaultText?.title || !defaultText?.markdown)
      return this.unprocessableContent({
        errors: { localizedTexts: [`must include a ${DEFAULT_LOCALE} title and description`] },
      })

    let place = await ApplicationModel.transaction(async txn => {
      const place = await Place.txn(txn).create(placeParams)
      await HostPlace.txn(txn).create({ host: this.currentHost, place })
      await reconcileLocalizedTexts(place, localizedTexts, txn)
      return place
    })

    place = await place.loadFor('default').execute()
    this.created(place)
  }

  @OpenAPI(Place, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Place, with multi-locale localized text',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
      combining: {
        localizedTexts: {
          type: 'array',
          items: OpenAPI.forDream(LocalizedText, {
            params: localizedTextParams,
            required: localizedTextParams,
          }),
        },
      },
    },
    responses: {
      422: { description: `Missing ${DEFAULT_LOCALE} title and description` },
    },
  })
  public async update() {
    const placeParams = this.extractParams(Place, paramSafeColumns)
    const localizedTexts = this.extractLocalizedTexts()

    const defaultText = localizedTexts.find(text => text.locale === DEFAULT_LOCALE)
    if (!defaultText?.title || !defaultText?.markdown)
      return this.unprocessableContent({
        errors: { localizedTexts: [`must include a ${DEFAULT_LOCALE} title and description`] },
      })

    const place = await this.place()
    await ApplicationModel.transaction(async txn => {
      await place.txn(txn).update(placeParams)
      await reconcileLocalizedTexts(place, localizedTexts, txn, { removeMissing: true })
    })

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

  private extractLocalizedTexts() {
    return this.extractParams(LocalizedText, localizedTextParams, {
      key: 'localizedTexts',
      array: true,
    })
  }

  private async place() {
    return await this.currentHost
      .associationQuery('places')
      .preloadFor('default')
      .findOrFail(this.castParam('id', 'uuid'))
  }
}
