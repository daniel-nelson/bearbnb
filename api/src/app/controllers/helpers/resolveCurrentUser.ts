import AppEnv from '#conf/AppEnv.js'
import { DecryptionError, DecryptionRotationError } from '@rvoh/dream/errors'
import { Encrypt } from '@rvoh/dream/utils'
import { PsychicController } from '@rvoh/psychic'
/** uncomment after creating User model */
// import User from '#models/User.js'

// eslint-disable-next-line @typescript-eslint/require-await
export default async function resolveCurrentUser(controller: PsychicController): Promise<string | null> {
  /** replace previous line with uncommented next line after creating User model */
  // export default async function resolveCurrentUser(controller: PsychicController): Promise<User | null> {
  if (!AppEnv.isTest)
    throw new Error(
      'The current authentication scheme is only for early development. Replace with a production grade authentication scheme.',
    )

  const token = (controller.header('authorization') ?? '').split(' ').at(-1)!
  if (!token) return null

  let payload: { userId?: string } | null
  try {
    // returns the value given to Encrypt.encrypt, already parsed; do not JSON.parse it again
    payload = Encrypt.decrypt<{ userId?: string }>(token, {
      algorithm: 'aes-256-gcm',
      key: AppEnv.string('APP_ENCRYPTION_KEY'),
    })
  } catch (error) {
    // A token this app cannot open (forged, garbled, or encrypted under another key) means
    // signed out. Anything else, such as a DecryptionParseError for a token that opens but
    // holds malformed contents, is a bug in the app's own token code, so it propagates.
    if (!(error instanceof DecryptionError || error instanceof DecryptionRotationError)) throw error
    // Signed out without logging, as Psychic's getCookie does for a cookie it cannot open.
    return null
  }

  // Token minting encrypts an object, so a token that opens to anything else means the minting and
  // this helper disagree: a bug in the app's own token code, so fail loudly instead of signing out.
  // Fixed text only: never put the token or its contents in the error.
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload))
    throw new Error(
      'resolveCurrentUser: the bearer token opened but does not hold an object; the token minting and this helper disagree',
    )

  const userId = payload.userId
  if (!userId) return null

  /** uncomment after creating User model */
  // return await User.find(userId)
  return userId
}
