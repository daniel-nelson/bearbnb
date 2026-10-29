import UnauthedController from '#controllers/UnauthedController.js'
import { StatusSerializer } from '#serializers/StatusSerializer.js'
import { OpenAPI } from '@rvoh/psychic'

const openApiTags = ['status']

export default class StatusController extends UnauthedController {
  @OpenAPI(StatusSerializer, {
    status: 200,
    tags: openApiTags,
    description: 'API status endpoint for frontend connectivity checks',
    fastJsonStringify: true,
  })
  public show() {
    this.ok({ status: 'ok' })
  }
}
