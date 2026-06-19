import User from '@models/User.js'
import FirebaseAuth from '@services/FirebaseAuth.js'
import { PsychicController } from '@rvoh/psychic'

export default async function resolveCurrentUser(controller: PsychicController): Promise<User | null> {
  return await FirebaseAuth.userFromBearerToken(controller.header('authorization'))
}
