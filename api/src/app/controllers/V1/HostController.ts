import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import Host from '@models/Host.js'
import LocalizedText from '@models/LocalizedText.js'
import {
  DEFAULT_LOCALE,
  localizedTextParams,
  reconcileLocalizedTexts,
} from '@src/app/services/LocalizedTextReconciler.js'
import V1BaseController from './BaseController.js'

const openApiTags = ['host']

const paramSafeColumns: DreamParamSafeColumnNames<Host>[] = ['legalName', 'signedHostAgreementAt']

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
      await reconcileLocalizedTexts(host, localizedTexts, txn)
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
      await reconcileLocalizedTexts(host, localizedTexts, txn, { removeMissing: true })
    })

    this.noContent()
  }

  private extractLocalizedTexts() {
    return this.extractParams(LocalizedText, localizedTextParams, {
      key: 'localizedTexts',
      array: true,
    })
  }

  private async host() {
    return await this.currentUser.associationQuery('host').preloadFor('default').firstOrFail()
  }
}
