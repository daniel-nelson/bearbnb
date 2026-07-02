import { OpenAPI } from '@rvoh/psychic'
import { DreamTransaction } from '@rvoh/dream'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import Host from '@models/Host.js'
import LocalizedText from '@models/LocalizedText.js'
import V1BaseController from './BaseController.js'
import { LocalesEnum } from '@src/types/db.js'

const openApiTags = ['host']

const DEFAULT_LOCALE: LocalesEnum = 'en-US'

const paramSafeColumns: DreamParamSafeColumnNames<Host>[] = ['legalName', 'signedHostAgreementAt']

const localizedTextParams: DreamParamSafeColumnNames<LocalizedText>[] = ['locale', 'title', 'markdown']

type LocalizedTextParams = Partial<{
  locale: LocalesEnum | undefined
  title: string | null | undefined
  markdown: string | null | undefined
}>

export default class V1HostController extends V1BaseController {
  @OpenAPI(Host, {
    status: 200,
    tags: openApiTags,
    description: "Fetch the current User's Host",
    fastJsonStringify: true,
  })
  public async show() {
    this.ok(await this.host())
  }

  @OpenAPI(Host, {
    status: 201,
    tags: openApiTags,
    description: 'Create the Host for the current User, with multi-locale profile text',
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
      required: paramSafeColumns,
    },
    responses: {
      422: { description: `Missing ${DEFAULT_LOCALE} title and description` },
    },
  })
  public async create() {
    const hostParams = this.extractParams(Host, paramSafeColumns)
    const localizedTexts = this.extractLocalizedTexts()

    const defaultText = localizedTexts.find(text => text.locale === DEFAULT_LOCALE)
    if (!defaultText?.title || !defaultText?.markdown)
      return this.unprocessableContent({
        errors: { localizedTexts: [`must include a ${DEFAULT_LOCALE} title and description`] },
      })

    let host = await ApplicationModel.transaction(async txn => {
      const host = await this.currentUser.txn(txn).createAssociation('host', hostParams)
      await this.reconcileLocalizedTexts(host, localizedTexts, txn)
      return host
    })

    host = await host.loadFor('default').execute()
    this.created(host)
  }

  @OpenAPI(Host, {
    status: 204,
    tags: openApiTags,
    description: 'Update the current Host, adding or removing non-default profile locales',
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
  })
  public async update() {
    const host = await this.host()
    const hostParams = this.extractParams(Host, paramSafeColumns)
    const localizedTexts = this.extractLocalizedTexts()

    await ApplicationModel.transaction(async txn => {
      await host.txn(txn).update(hostParams)
      await this.reconcileLocalizedTexts(host, localizedTexts, txn, { removeMissing: true })
    })

    this.noContent()
  }

  private extractLocalizedTexts() {
    return this.extractParams(LocalizedText, localizedTextParams, {
      key: 'localizedTexts',
      array: true,
    })
  }

  // Upserts each provided locale's profile text through the owning Host, and (on update)
  // removes non-default locales the Host no longer provides. `en-US` is always retained so
  // Visitor reads can fall back to it. Ownership is already proven by loading the Host from
  // the current User, so this performs no separate reverse-lookup authorization.
  private async reconcileLocalizedTexts(
    host: Host,
    localizedTexts: LocalizedTextParams[],
    txn: DreamTransaction<ApplicationModel>,
    { removeMissing = false }: { removeMissing?: boolean } = {},
  ) {
    for (const { locale, title, markdown } of localizedTexts) {
      if (!locale) continue

      const existing = await host.txn(txn).associationQuery('localizedTexts', { and: { locale } }).first()

      if (existing) {
        await existing.txn(txn).update({ title, markdown })
      } else {
        await host.txn(txn).createAssociation('localizedTexts', { locale, title, markdown })
      }
    }

    if (!removeMissing) return

    const providedLocales = localizedTexts.map(localizedText => localizedText.locale)
    const existingTexts = await host.txn(txn).associationQuery('localizedTexts').all()

    for (const existing of existingTexts) {
      if (existing.locale !== DEFAULT_LOCALE && !providedLocales.includes(existing.locale))
        await existing.txn(txn).destroy()
    }
  }

  private async host() {
    return await this.currentUser.associationQuery('host').preloadFor('default').firstOrFail()
  }
}
