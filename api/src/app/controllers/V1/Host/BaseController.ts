import Host from '@models/Host.js'
import { BeforeAction } from '@rvoh/psychic'
import V1BaseController from '../BaseController.js'

export default class V1HostBaseController extends V1BaseController {
  protected currentHost: Host

  @BeforeAction()
  protected async loadCurrentHost() {
    if (!this.currentUser) return this.unauthorized()

    const host = await this.currentUser.associationQuery('host').first()
    if (!host) return this.forbidden()

    this.currentHost = host
  }
}
