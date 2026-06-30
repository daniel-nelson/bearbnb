import AppEnv from '@conf/AppEnv.js'
import User from '@models/User.js'
import { Encrypt } from '@rvoh/dream/utils'
import { PsychicController } from '@rvoh/psychic'

export default async function resolveCurrentUser(controller: PsychicController): Promise<User | null> {
  if (!AppEnv.isTest)
    throw new Error(
      'The current authentication scheme is only for early development. Replace with a production grade authentication scheme.',
    )

  const token = (controller.header('authorization') ?? '').split(' ').at(-1)!
  if (!token) return null

  const decrypted = Encrypt.decrypt(token, {
    algorithm: 'aes-256-gcm',
    key: AppEnv.string('APP_ENCRYPTION_KEY'),
  })

  const userId = typeof decrypted === 'string' && (JSON.parse(decrypted) as Record<'userId', string>)?.userId
  if (!userId) return null

  return await User.find(userId)
}
