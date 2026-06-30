import { CURRENT_TOS_VERSION } from '@conf/termsOfService.js'
import { Decorators, SoftDelete } from '@rvoh/dream'
import { DreamColumn } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import Guest from '@models/Guest.js'
import Host from '@models/Host.js'

const deco = new Decorators<typeof User>()

@SoftDelete()
export default class User extends ApplicationModel {
  public override get table() {
    return 'users' as const
  }

  public id: DreamColumn<User, 'id'>
  public email: DreamColumn<User, 'email'>
  public firebaseUid: DreamColumn<User, 'firebaseUid'>
  public tosAcceptedAt: DreamColumn<User, 'tosAcceptedAt'>
  public tosVersion: DreamColumn<User, 'tosVersion'>
  public createdAt: DreamColumn<User, 'createdAt'>
  public updatedAt: DreamColumn<User, 'updatedAt'>
  public deletedAt: DreamColumn<User, 'deletedAt'>

  @deco.Encrypted()
  public phone: DreamColumn<User, 'encryptedPhone'>

  /**
   * Whether this user has accepted the terms of service version currently in
   * force. Provisioning a user (e.g. via a bearer token on any authenticated
   * request) does not record consent, so a freshly-provisioned user returns
   * false here until they accept through the sign-up flow.
   */
  public hasCurrentTermsOfServiceConsent(this: User): boolean {
    return this.tosAcceptedAt !== null && this.tosVersion === CURRENT_TOS_VERSION
  }

  @deco.AfterCreate()
  public async createGuest(this: User) {
    this.guest = await this.createAssociation('guest')
  }

  @deco.HasOne('Guest')
  public guest: Guest

  @deco.HasOne('Host')
  public host: Host
}
