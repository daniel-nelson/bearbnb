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
}
