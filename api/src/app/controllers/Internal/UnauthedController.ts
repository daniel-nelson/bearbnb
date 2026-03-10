import ApplicationController from '@controllers/ApplicationController.js'
import { PsychicOpenapiNames } from '@rvoh/psychic/openapi'

export default class InternalUnauthedController extends ApplicationController {
  public static override get openapiNames(): PsychicOpenapiNames<ApplicationController> {
    return ['internal', 'tests']
  }
}
