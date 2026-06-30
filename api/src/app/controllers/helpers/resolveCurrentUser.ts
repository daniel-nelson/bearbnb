import User from '@models/User.js'
import { PsychicController } from '@rvoh/psychic'
import FirebaseAuth from '@services/FirebaseAuth.js'

export default async function resolveCurrentUser(controller: PsychicController): Promise<User | null> {
  return await FirebaseAuth.userFromBearerToken(controller.header('authorization'))
}
