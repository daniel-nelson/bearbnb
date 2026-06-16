import ApplicationController from '@controllers/ApplicationController.js'
import resolveCurrentUser from '@controllers/helpers/resolveCurrentUser.js'
import { BeforeAction } from '@rvoh/psychic'
import User from '@models/User.js'

export default class MaybeAuthedController extends ApplicationController {
  protected currentUser: User | null = null

  @BeforeAction()
  protected async authenticate() {
    this.currentUser = await resolveCurrentUser(this)
  }
}
