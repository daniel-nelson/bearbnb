import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import V1HostBaseController from './BaseController.js'
import LocalizedText from '@models/LocalizedText.js'

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
    // const localizedText = await this.localizedText()
    // await localizedText.update(this.extractParams(LocalizedText, paramSafeColumns))
    // this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a LocalizedText',
    fastJsonStringify: true,
  })
  public async destroy() {
    // const localizedText = await this.localizedText()
    // await localizedText.destroy()
    // this.noContent()
  }

  private async localizedText() {
    // return await this.currentUser.associationQuery('localizedTexts')
    //   .preloadFor('default')
    //   .findOrFail(this.castParam('id', 'string'))
  }
}
