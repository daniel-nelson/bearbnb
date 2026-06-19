import Place from '@models/Place.js'
import { BeforeAction } from '@rvoh/psychic'
import V1GuestBaseController from '../BaseController.js'

export default class V1GuestPlacesBaseController extends V1GuestBaseController {
  protected currentPlace: Place

  @BeforeAction()
  protected async loadCurrentPlace() {
    this.currentPlace = await Place.findOrFail(this.castParam('placeId', 'uuid'))
  }
}
