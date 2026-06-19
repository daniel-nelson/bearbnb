import { DreamSerializer } from '@rvoh/dream'
import User from '@models/User.js'

export const CurrentUserSerializer = (user: User) =>
  DreamSerializer(User, user)
    .attribute('id')
    .attribute('email')
