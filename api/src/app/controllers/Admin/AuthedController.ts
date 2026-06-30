import ApplicationController from '@controllers/ApplicationController.js'
import resolveCurrentAdminUser from '@controllers/helpers/resolveCurrentAdminUser.js'
import { BeforeAction } from '@rvoh/psychic'
import { PsychicOpenapiNames } from '@rvoh/psychic/openapi'
/** uncomment after creating AdminUser model */
// import AdminUser from '@models/AdminUser.js'

export default class AdminAuthedController extends ApplicationController {
  public static override get openapiNames(): PsychicOpenapiNames<ApplicationController> {
    return ['admin', 'tests']
  }

  /** uncomment after creating AdminUser model */
  // protected currentAdminUser: AdminUser

  @BeforeAction()
  protected async authenticate() {
    const adminUser = await resolveCurrentAdminUser(this)
    if (!adminUser) return this.unauthorized()
    /** uncomment after creating AdminUser model */
    // this.currentAdminUser = adminUser
  }
}
