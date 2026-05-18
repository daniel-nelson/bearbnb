import AppEnv from '@conf/AppEnv.js'
import { Encrypt } from '@rvoh/dream/utils'
import { PsychicController } from '@rvoh/psychic'
/** uncomment after creating AdminUser model */
// import AdminUser from '@models/AdminUser.js'

// eslint-disable-next-line @typescript-eslint/require-await
export default async function resolveCurrentAdminUser(controller: PsychicController): Promise<string | null> {
  /** replace previous line with uncommented next line after creating AdminUser model */
  // export default async function resolveCurrentAdminUser(controller: PsychicController): Promise<AdminUser | null> {
  if (!AppEnv.isTest)
    throw new Error(
      'The current authentication scheme is only for early development. Replace with a production grade authentication scheme.'
    )

  const token = (controller.header('authorization') ?? '').split(' ').at(-1)!

  const decrypted = Encrypt.decrypt(token, {
    algorithm: 'aes-256-gcm',
    key: AppEnv.string('APP_ENCRYPTION_KEY'),
  })

  const adminUserId =
    typeof decrypted === 'string' && (JSON.parse(decrypted) as Record<'userId', string>)?.userId
  if (!adminUserId) return null

  /** uncomment after creating AdminUser model */
  // return await AdminUser.find(adminUserId)
  return adminUserId
}
