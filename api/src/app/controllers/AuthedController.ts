import { TERMS_OF_SERVICE_REQUIRED_ERROR } from '@conf/termsOfService.js'
import ApplicationController from '@controllers/ApplicationController.js'
import resolveCurrentUser from '@controllers/helpers/resolveCurrentUser.js'
import User from '@models/User.js'
import { BeforeAction } from '@rvoh/psychic'

export default class AuthedController extends ApplicationController {
  protected currentUser: User

  @BeforeAction()
  protected async authenticate() {
    const user = await resolveCurrentUser(this)
    if (!user) return this.unauthorized()
    this.currentUser = user
  }

  // Provisioning a user does not record terms-of-service consent, so any
  // authenticated action is refused until the user has accepted the current
  // terms. The sign-up flow records consent and lives outside this base
  // (on the maybe-authed Visitor surface), so it remains reachable.
  @BeforeAction()
  protected requireTermsOfServiceConsent() {
    if (!this.currentUser.hasCurrentTermsOfServiceConsent())
      return this.forbidden(TERMS_OF_SERVICE_REQUIRED_ERROR)
  }
}
