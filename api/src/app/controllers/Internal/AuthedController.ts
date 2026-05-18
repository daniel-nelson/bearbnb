import ApplicationController from '@controllers/ApplicationController.js'
import resolveCurrentInternalUser from '@controllers/helpers/resolveCurrentInternalUser.js'
import { BeforeAction } from '@rvoh/psychic'
import { PsychicOpenapiNames } from '@rvoh/psychic/openapi'
/** uncomment after creating InternalUser model */
// import InternalUser from '@models/InternalUser.js'

export default class InternalAuthedController extends ApplicationController {
  public static override get openapiNames(): PsychicOpenapiNames<ApplicationController> {
    return ['internal', 'tests']
  }

  /** uncomment after creating InternalUser model */
  // protected currentInternalUser: InternalUser

  @BeforeAction()
  protected async authenticate() {
    const internalUser = await resolveCurrentInternalUser(this)
    if (!internalUser) return this.unauthorized()
    /** uncomment after creating InternalUser model */
    // this.currentInternalUser = internalUser
  }
}
