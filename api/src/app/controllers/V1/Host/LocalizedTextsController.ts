import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import Room from '@models/Room.js'
import V1HostBaseController from './BaseController.js'
import LocalizedText from '@models/LocalizedText.js'
import { type LocalizedTypesEnum } from '@src/types/db.js'

const openApiTags = ['localized-texts']

const paramSafeColumns: DreamParamSafeColumnNames<LocalizedText>[] = ['locale', 'title', 'markdown']

export default class V1HostLocalizedTextsController extends V1HostBaseController {
  @OpenAPI(LocalizedText, {
    status: 204,
    tags: openApiTags,
    description: 'Update a LocalizedText',
    fastJsonStringify: true,
    requestBody: {
      only: paramSafeColumns,
    },
  })
  public async update() {
    const localizedText = await this.localizedText()
    await localizedText.update(this.extractParams(LocalizedText, paramSafeColumns))
    this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a LocalizedText',
    fastJsonStringify: true,
  })
  public async destroy() {
    const localizedText = await this.localizedText()
    await localizedText.destroy()
    this.noContent()
  }

  private async localizedText() {
    const id = this.castParam('id', 'uuid')
    const localizedText = await LocalizedText.findOrFail(id)
    const localizableType: LocalizedTypesEnum = localizedText.localizableType

    switch (localizableType) {
      case 'Host':
        return await this.currentHost.associationQuery('localizedTexts').preloadFor('default').findOrFail(id)
      case 'Place': {
        const place = await this.currentHost
          .associationQuery('places')
          .findOrFail(localizedText.localizableId)
        return await place.associationQuery('localizedTexts').preloadFor('default').findOrFail(id)
      }
      case 'Room': {
        const room = await Room.findOrFail(localizedText.localizableId)
        await this.currentHost.associationQuery('places').findOrFail(room.placeId)
        return await room.associationQuery('localizedTexts').preloadFor('default').findOrFail(id)
      }
      default: {
        const _never: never = localizableType
        throw new Error(`Unhandled LocalizedTypesEnum: ${String(_never)}`)
      }
    }
  }
}
