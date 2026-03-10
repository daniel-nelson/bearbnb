import { UpdateableProperties } from '@rvoh/dream/types'
import User from '@models/User.js'

let counter = 0

export default async function createUser(attrs: UpdateableProperties<User> = {}) {
  return await User.create({
    email: `email-${++counter}@example.com`,
    phone: `User phone ${counter}`,
    ...attrs,
  })
}
