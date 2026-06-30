import AppEnv from '@conf/AppEnv.js'
import { Encrypt } from '@rvoh/dream/utils'
import { PsychicController } from '@rvoh/psychic'
/** uncomment after creating InternalUser model */
// import InternalUser from '@models/InternalUser.js'

// eslint-disable-next-line @typescript-eslint/require-await
export default async function resolveCurrentInternalUser(controller: PsychicController): Promise<string | null> {
  /** replace previous line with uncommented next line after creating InternalUser model */
  // export default async function resolveCurrentInternalUser(controller: PsychicController): Promise<InternalUser | null> {
  if (!AppEnv.isTest)
    throw new Error(
      'The current authentication scheme is only for early development. Replace with a production grade authentication scheme.'
    )

  const token = (controller.header('authorization') ?? '').split(' ').at(-1)!

  const decrypted = Encrypt.decrypt(token, {
    algorithm: 'aes-256-gcm',
    key: AppEnv.string('APP_ENCRYPTION_KEY'),
  })

  const internalUserId =
    typeof decrypted === 'string' && (JSON.parse(decrypted) as Record<'userId', string>)?.userId
  if (!internalUserId) return null

  /** uncomment after creating InternalUser model */
  // return await InternalUser.find(internalUserId)
  return internalUserId
}
