import ApplicationController from '@controllers/ApplicationController.js'
import resolveCurrentUser from '@controllers/helpers/resolveCurrentUser.js'
import { BeforeAction } from '@rvoh/psychic'
/** uncomment after creating User model */
// import User from '@models/User.js'

export default class AuthedController extends ApplicationController {
  /** uncomment after creating User model */
  // protected currentUser: User

  @BeforeAction()
  protected async authenticate() {
    const user = await resolveCurrentUser(this)
    if (!user) return this.unauthorized()
    /** uncomment after creating User model */
    // this.currentUser = user
  }
}
