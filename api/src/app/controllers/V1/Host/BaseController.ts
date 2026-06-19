import Host from '@models/Host.js'
import { BeforeAction } from '@rvoh/psychic'
import V1BaseController from '../BaseController.js'

export default class V1HostBaseController extends V1BaseController {
  protected currentHost: Host

  @BeforeAction()
  protected async loadCurrentHost() {
    const currentUser = this.requireCurrentUser()
    if (!currentUser) return

    const host = await currentUser.associationQuery('host').first()
    if (!host) return this.forbidden()

    this.currentHost = host
  }
}
