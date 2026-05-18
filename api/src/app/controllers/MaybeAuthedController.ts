import ApplicationController from '@controllers/ApplicationController.js'
import resolveCurrentUser from '@controllers/helpers/resolveCurrentUser.js'
import { BeforeAction } from '@rvoh/psychic'
/** uncomment after creating User model */
// import User from '@models/User.js'

export default class MaybeAuthedController extends ApplicationController {
  /** uncomment after creating User model */
  // protected currentUser: User | null = null

  @BeforeAction()
  protected async authenticate() {
    /** uncomment after creating User model */
    // this.currentUser = await resolveCurrentUser(this)
  }
}
