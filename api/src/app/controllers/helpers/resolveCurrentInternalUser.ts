import { PsychicController } from '@rvoh/psychic'
import FirebaseAuth from '@services/FirebaseAuth.js'
/** uncomment after creating InternalUser model */
// import InternalUser from '@models/InternalUser.js'

export default async function resolveCurrentInternalUser(
  controller: PsychicController,
): Promise<string | null> {
  /** replace previous line with uncommented next line after creating InternalUser model */
  // export default async function resolveCurrentInternalUser(controller: PsychicController): Promise<InternalUser | null> {
  const internalUserId = await FirebaseAuth.uidFromBearerToken(controller.header('authorization'))
  if (!internalUserId) return null

  /** replace the following throw after creating InternalUser model */
  // return await InternalUser.find(internalUserId)
  throw new Error(
    'Internal authentication requires an InternalUser model-backed lookup before internal routes can be used.',
  )
}
