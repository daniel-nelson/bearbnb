import { PsychicController } from '@rvoh/psychic'
import FirebaseAuth from '@services/FirebaseAuth.js'
/** uncomment after creating AdminUser model */
// import AdminUser from '@models/AdminUser.js'

export default async function resolveCurrentAdminUser(controller: PsychicController): Promise<string | null> {
  /** replace previous line with uncommented next line after creating AdminUser model */
  // export default async function resolveCurrentAdminUser(controller: PsychicController): Promise<AdminUser | null> {
  const adminUserId = await FirebaseAuth.uidFromBearerToken(controller.header('authorization'))
  if (!adminUserId) return null

  /** replace the following throw after creating AdminUser model */
  // return await AdminUser.find(adminUserId)
  throw new Error(
    'Admin authentication requires an AdminUser model-backed lookup before admin routes can be used.',
  )
}
