import Guest from '@models/Guest.js'
import { BeforeAction } from '@rvoh/psychic'
import MaybeAuthedController from '../MaybeAuthedController.js'

export default class VisitorBaseController extends MaybeAuthedController {
  protected currentGuest: Guest | null = null

  @BeforeAction()
  protected async loadCurrentGuest() {
    if (!this.currentUser) return

    this.currentGuest = await this.currentUser.associationQuery('guest').first()
  }
}
