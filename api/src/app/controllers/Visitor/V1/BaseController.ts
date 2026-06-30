import Guest from '@models/Guest.js'
import { BeforeAction } from '@rvoh/psychic'
import VisitorBaseController from '../BaseController.js'

export default class VisitorV1BaseController extends VisitorBaseController {
  protected currentGuest: Guest | null = null

  @BeforeAction()
  protected async loadCurrentGuest() {
    if (!this.currentUser) return

    this.currentGuest = await this.currentUser.associationQuery('guest').first()
  }
}
