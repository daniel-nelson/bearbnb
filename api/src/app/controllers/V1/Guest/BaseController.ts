import Guest from '@models/Guest.js'
import { BeforeAction } from '@rvoh/psychic'
import V1BaseController from '../BaseController.js'

export default class V1GuestBaseController extends V1BaseController {
  protected currentGuest: Guest

  @BeforeAction()
  protected async loadCurrentGuest() {
    const guest = await this.currentUser.associationQuery('guest').first()
    if (!guest) return this.forbidden()

    this.currentGuest = guest
  }
}
