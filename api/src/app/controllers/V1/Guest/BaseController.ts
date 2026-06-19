import Guest from '@models/Guest.js'
import V1BaseController from '../BaseController.js'

export default class V1GuestBaseController extends V1BaseController {
  protected currentGuest: Guest | null = null

  protected override async authenticate() {
    await super.authenticate()
    if (!this.currentUser) return

    this.currentGuest = await this.currentUser.associationQuery('guest').first()
  }
}
