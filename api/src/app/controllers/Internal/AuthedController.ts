import AppEnv from '@conf/AppEnv.js'
import ApplicationController from '@controllers/ApplicationController.js'
import { Encrypt } from '@rvoh/dream/utils'
import { BeforeAction } from '@rvoh/psychic'
import { PsychicOpenapiNames } from '@rvoh/psychic/openapi'
/** uncomment after creating InternalUser model */
// import InternalUser from '@models/InternalUser.js'

export default class InternalAuthedController extends ApplicationController {
  public static override get openapiNames(): PsychicOpenapiNames<ApplicationController> {
    return ['internal', 'tests']
  }

  /** uncomment after creating InternalUser model */
  // protected currentInternalUser: InternalUser

  @BeforeAction()
  // eslint-disable-next-line @typescript-eslint/require-await
  protected async authenticate() {
    /** uncomment after creating InternalUser model */
    //   const internalUserId = this.authedInternalUserId()
    //   if (!internalUserId) return this.unauthorized()
    //
    //   const internalUser = await InternalUser.find(internalUserId)
    //   if (!internalUser) return this.unauthorized()
    //
    //   this.currentInternalUser = internalUser
  }

  protected authedInternalUserId(): string | null {
    if (!AppEnv.isTest)
      throw new Error(
        'The current authentication scheme is only for early development. Replace with a production grade authentication scheme.'
      )

    const token = (this.header('authorization') ?? '').split(' ').at(-1)!

    const decrypted = Encrypt.decrypt(token, {
      algorithm: 'aes-256-gcm',
      key: AppEnv.string('APP_ENCRYPTION_KEY'),
    })

    return (
      (typeof decrypted === 'string' &&
        (JSON.parse(decrypted) as Record<'internalUserId', string>)?.internalUserId) ||
      null
    )
  }
}
