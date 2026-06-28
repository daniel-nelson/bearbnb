import { CURRENT_TOS_VERSION } from '@conf/termsOfService.js'
import { OpenAPI } from '@rvoh/psychic'
import { DateTime } from '@rvoh/dream'
import { CurrentUserSerializer } from '@serializers/CurrentUserSerializer.js'
import V1BaseController from './BaseController.js'

const openApiTags = ['v1-sign-up']

export default class V1SignUpController extends V1BaseController {
  @OpenAPI(CurrentUserSerializer, {
    status: 201,
    tags: openApiTags,
    description: 'Provision the current Firebase-authenticated user and record terms-of-service consent',
    fastJsonStringify: true,
  })
  public async create() {
    await this.recordTermsOfServiceConsent()
    this.created(this.currentUser)
  }

  private async recordTermsOfServiceConsent() {
    if (this.currentUser.tosAcceptedAt && this.currentUser.tosVersion === CURRENT_TOS_VERSION) return

    await this.currentUser.update({
      tosAcceptedAt: DateTime.now(),
      tosVersion: CURRENT_TOS_VERSION,
    })
  }
}
