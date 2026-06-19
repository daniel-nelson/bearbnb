import V1BaseController from '@controllers/V1/BaseController.js'
import Guest from '@models/Guest.js'
import { BeforeAction } from '@rvoh/psychic'

export default class V1GuestAuthedController extends V1BaseController {
  protected currentGuest: Guest

  @BeforeAction()
  protected async loadCurrentGuest() {
    const guest = await this.currentUser.associationQuery('guest').first()
    if (!guest) return this.forbidden()

    this.currentGuest = guest
  }
}
