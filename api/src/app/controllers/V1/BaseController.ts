import MaybeAuthedController from '@controllers/MaybeAuthedController.js'
import User from '@models/User.js'

export default class V1BaseController extends MaybeAuthedController {
  protected requireCurrentUser(): User | undefined {
    if (!this.currentUser) {
      this.unauthorized()
      return
    }

    return this.currentUser
  }
}
