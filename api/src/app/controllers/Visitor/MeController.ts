import { OpenAPI } from '@rvoh/psychic'
import { CurrentUserSerializer } from '@serializers/CurrentUserSerializer.js'
import VisitorBaseController from './BaseController.js'

const openApiTags = ['v1-me']

export default class VisitorMeController extends VisitorBaseController {
  @OpenAPI(CurrentUserSerializer, {
    status: 200,
    tags: openApiTags,
    description: 'Current Firebase-authenticated BearBnB user',
    fastJsonStringify: true,
  })
  public show() {
    if (!this.currentUser) return this.unauthorized()
    this.ok(this.currentUser)
  }
}
