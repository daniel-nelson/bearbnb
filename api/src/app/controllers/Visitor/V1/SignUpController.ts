import { CURRENT_TOS_VERSION } from '@conf/termsOfService.js'
import { DateTime } from '@rvoh/dream'
import User from '@models/User.js'
import { OpenAPI } from '@rvoh/psychic'
import { CurrentUserSerializer } from '@serializers/CurrentUserSerializer.js'
import VisitorV1BaseController from './BaseController.js'

const openApiTags = ['v1-sign-up']

export default class VisitorV1SignUpController extends VisitorV1BaseController {
  @OpenAPI(CurrentUserSerializer, {
    status: 201,
    tags: openApiTags,
    description: 'Provision the current Firebase-authenticated user and record terms-of-service consent',
    fastJsonStringify: true,
  })
  public async create() {
    if (!this.currentUser) return this.unauthorized()

    await this.recordTermsOfServiceConsent(this.currentUser)
    this.created(this.currentUser)
  }

  private async recordTermsOfServiceConsent(user: User) {
    if (user.hasCurrentTermsOfServiceConsent()) return

    await user.update({
      tosAcceptedAt: DateTime.now(),
      tosVersion: CURRENT_TOS_VERSION,
    })
  }
}
