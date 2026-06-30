import { BeforeAction } from '@rvoh/psychic'
import Place from '@models/Place.js'
import VisitorV1BaseController from '../BaseController.js'

export default class VisitorV1PlacesBaseController extends VisitorV1BaseController {
  protected currentPlace: Place

  @BeforeAction()
  protected async loadCurrentPlace() {
    this.currentPlace = await Place.findOrFail(this.castParam('placeId', 'uuid'))
  }
}
