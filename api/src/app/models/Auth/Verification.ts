import { DreamColumn } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'

// Uncomment when adding decorators (@deco.BelongsTo, @deco.Validates, etc.):
// import { Decorators } from '@rvoh/dream'
// const deco = new Decorators<typeof AuthVerification>()

export default class AuthVerification extends ApplicationModel {
  public override get table() {
    return 'auth_verifications' as const
  }

  public id: DreamColumn<AuthVerification, 'id'>
  public identifier: DreamColumn<AuthVerification, 'identifier'>
  public value: DreamColumn<AuthVerification, 'value'>
  public expiresAt: DreamColumn<AuthVerification, 'expiresAt'>
  public createdAt: DreamColumn<AuthVerification, 'createdAt'>
  public updatedAt: DreamColumn<AuthVerification, 'updatedAt'>
}
