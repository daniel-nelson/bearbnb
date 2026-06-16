import { Decorators } from '@rvoh/dream'
import { DreamColumn } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import User from '@models/User.js'

const deco = new Decorators<typeof AuthAccount>()

export default class AuthAccount extends ApplicationModel {
  public override get table() {
    return 'auth_accounts' as const
  }

  public id: DreamColumn<AuthAccount, 'id'>
  public accountId: DreamColumn<AuthAccount, 'accountId'>
  public providerId: DreamColumn<AuthAccount, 'providerId'>
  public accessToken: DreamColumn<AuthAccount, 'accessToken'>
  public refreshToken: DreamColumn<AuthAccount, 'refreshToken'>
  public accessTokenExpiresAt: DreamColumn<AuthAccount, 'accessTokenExpiresAt'>
  public refreshTokenExpiresAt: DreamColumn<AuthAccount, 'refreshTokenExpiresAt'>
  public scope: DreamColumn<AuthAccount, 'scope'>
  public idToken: DreamColumn<AuthAccount, 'idToken'>
  public password: DreamColumn<AuthAccount, 'password'>
  public createdAt: DreamColumn<AuthAccount, 'createdAt'>
  public updatedAt: DreamColumn<AuthAccount, 'updatedAt'>

  @deco.BelongsTo('User', { on: 'userId' })
  public user: User
  public userId: DreamColumn<AuthAccount, 'userId'>
}
