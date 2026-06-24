import { BeforeAction } from '@rvoh/psychic'
import Place from '@models/Place.js'
import VisitorBaseController from '../BaseController.js'

export default class VisitorPlacesBaseController extends VisitorBaseController {
  protected currentPlace: Place

  @BeforeAction()
  protected async loadCurrentPlace() {
    this.currentPlace = await Place.findOrFail(this.castParam('placeId', 'uuid'))
  }
}
