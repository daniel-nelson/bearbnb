import getAuth from '@conf/auth.js'
import User from '@models/User.js'
import { PsychicController } from '@rvoh/psychic'
import { fromNodeHeaders } from 'better-auth/node'

export default async function resolveCurrentUser(controller: PsychicController): Promise<User | null> {
  const session = await getAuth().api.getSession({
    headers: fromNodeHeaders(controller.ctx.headers),
  })

  if (!session) return null

  return await User.find(session.user.id)
}
