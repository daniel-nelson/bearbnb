import { Decorators } from '@rvoh/dream'
import { DreamColumn } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import User from '@models/User.js'

const deco = new Decorators<typeof AuthSession>()

export default class AuthSession extends ApplicationModel {
  public override get table() {
    return 'auth_sessions' as const
  }

  public id: DreamColumn<AuthSession, 'id'>
  public token: DreamColumn<AuthSession, 'token'>
  public expiresAt: DreamColumn<AuthSession, 'expiresAt'>
  public ipAddress: DreamColumn<AuthSession, 'ipAddress'>
  public userAgent: DreamColumn<AuthSession, 'userAgent'>
  public createdAt: DreamColumn<AuthSession, 'createdAt'>
  public updatedAt: DreamColumn<AuthSession, 'updatedAt'>

  @deco.BelongsTo('User', { on: 'userId' })
  public user: User
  public userId: DreamColumn<AuthSession, 'userId'>
}
