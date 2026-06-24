import { OpenAPI } from '@rvoh/psychic'
import { CurrentUserSerializer } from '@serializers/CurrentUserSerializer.js'
import V1BaseController from './BaseController.js'

const openApiTags = ['v1-me']

export default class V1MeController extends V1BaseController {
  @OpenAPI(CurrentUserSerializer, {
    status: 200,
    tags: openApiTags,
    description: 'Current Firebase-authenticated BearBnB user',
    fastJsonStringify: true,
  })
  public show() {
    this.ok(this.currentUser)
  }
}
