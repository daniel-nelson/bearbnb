import { OpenAPI } from '@rvoh/psychic'
import { DreamTransaction } from '@rvoh/dream'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import HostPlace from '@models/HostPlace.js'
import LocalizedText from '@models/LocalizedText.js'
import V1HostBaseController from './BaseController.js'
import Place from '@models/Place.js'
import { LocalesEnum } from '@src/types/db.js'

const openApiTags = ['places']

const DEFAULT_LOCALE: LocalesEnum = 'en-US'

const paramSafeColumns: DreamParamSafeColumnNames<Place>[] = ['name', 'style', 'sleeps']

const localizedTextParams: DreamParamSafeColumnNames<LocalizedText>[] = ['locale', 'title', 'markdown']

type LocalizedTextParams = Partial<{
  locale: LocalesEnum | undefined
  title: string | null | undefined
  markdown: string | null | undefined
}>

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
      await this.reconcileLocalizedTexts(place, localizedTexts, txn)
      return place
    })

    place = await place.loadFor('default').execute()
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

  private extractLocalizedTexts() {
    return this.extractParams(LocalizedText, localizedTextParams, {
      key: 'localizedTexts',
      array: true,
    })
  }

  // Upserts each provided locale's text through the owning Place, and (on update)
  // removes non-default locales the Place no longer provides. `en-US` is always retained so
  // Visitor reads can fall back to it. Ownership is already proven by loading the Place from
  // the current Host, so this performs no separate reverse-lookup authorization.
  private async reconcileLocalizedTexts(
    place: Place,
    localizedTexts: LocalizedTextParams[],
    txn: DreamTransaction<ApplicationModel>,
    { removeMissing = false }: { removeMissing?: boolean } = {},
  ) {
    for (const { locale, title, markdown } of localizedTexts) {
      if (!locale) continue

      const existing = await place.txn(txn).associationQuery('localizedTexts', { and: { locale } }).first()

      if (existing) {
        await existing.txn(txn).update({ title, markdown })
      } else {
        await place.txn(txn).createAssociation('localizedTexts', { locale, title, markdown })
      }
    }

    if (!removeMissing) return

    const providedLocales = localizedTexts.map(localizedText => localizedText.locale)
    const existingTexts = await place.txn(txn).associationQuery('localizedTexts').all()

    for (const existing of existingTexts) {
      if (existing.locale !== DEFAULT_LOCALE && !providedLocales.includes(existing.locale))
        await existing.txn(txn).destroy()
    }
  }

  private async place() {
    return await this.currentHost
      .associationQuery('places')
      .preloadFor('default')
      .findOrFail(this.castParam('id', 'uuid'))
  }
}
