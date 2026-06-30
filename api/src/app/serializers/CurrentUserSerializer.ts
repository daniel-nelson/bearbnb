import User from '@models/User.js'
import { DreamSerializer } from '@rvoh/dream'

export const CurrentUserSerializer = (user: User) => DreamSerializer(User, user).attribute('id').attribute('email')
