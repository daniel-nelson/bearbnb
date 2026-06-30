import AppEnv from '@conf/AppEnv.js'
import User from '@models/User.js'
import { getApps, initializeApp } from 'firebase-admin/app'
import { FirebaseAuthError, getAuth } from 'firebase-admin/auth'

type FirebaseUserPayload = {
  uid: string
  email: string
  emailVerified: boolean
}

export default class FirebaseAuth {
  private static readonly expectedFirebaseAuthErrorCodes = [
    'auth/argument-error',
    'auth/id-token-expired',
    'auth/id-token-revoked',
    'auth/invalid-id-token',
    'auth/user-disabled',
    'auth/user-not-found',
  ]

  public static async userFromBearerToken(authorizationHeader: string | undefined): Promise<User | null> {
    const payload = await this.payloadFromBearerToken(authorizationHeader)
    if (!payload) return null

    const existingUser = await User.removeDefaultScope('dream:SoftDelete').findBy({
      firebaseUid: payload.uid,
    })
    if (existingUser?.deletedAt) return null
    if (existingUser) return await this.reconcileExistingUserEmail(existingUser, payload.email)

    const unlinkedUserByEmail = await User.removeDefaultScope('dream:SoftDelete').findBy({
      email: payload.email,
    })
    if (unlinkedUserByEmail) return null

    return await User.createOrFindBy(
      { firebaseUid: payload.uid },
      {
        createWith: {
          email: payload.email,
        },
      },
    )
  }

  public static async uidFromBearerToken(authorizationHeader: string | undefined): Promise<string | null> {
    return (await this.payloadFromBearerToken(authorizationHeader))?.uid ?? null
  }

  private static async reconcileExistingUserEmail(user: User, email: string): Promise<User | null> {
    if (user.email === email) return user

    const userByEmail = await User.removeDefaultScope('dream:SoftDelete').findBy({ email })
    if (userByEmail && userByEmail.id !== user.id) return null

    await user.update({ email })
    return user
  }

  private static async payloadFromBearerToken(
    authorizationHeader: string | undefined,
  ): Promise<FirebaseUserPayload | null> {
    const token = this.bearerToken(authorizationHeader)
    if (!token) return null

    return await this.verifyToken(token)
  }

  private static bearerToken(authorizationHeader: string | undefined) {
    const [scheme, token] = authorizationHeader?.split(' ') ?? []
    return scheme === 'Bearer' && token ? token : null
  }

  private static async verifyToken(token: string): Promise<FirebaseUserPayload | null> {
    if (AppEnv.isTest && token.startsWith('test-firebase:')) return this.testPayload(token)

    this.initialize()

    try {
      const decodedToken = await this.firebaseVerifier().verifyIdToken(token, true)
      return this.firebasePayload(decodedToken)
    } catch (err) {
      if (this.expectedFirebaseAuthError(err)) return null
      throw err
    }
  }

  private static initialize() {
    this.validateEmulatorHost()

    if (getApps().length > 0) return

    initializeApp({
      projectId: AppEnv.string('FIREBASE_PROJECT_ID'),
    })
  }

  private static firebaseVerifier() {
    return getAuth()
  }

  private static firebasePayload(payload: { uid: string; email?: string; email_verified?: boolean }) {
    if (!payload.email) return null

    return {
      uid: payload.uid,
      email: payload.email,
      emailVerified: payload.email_verified ?? false,
    }
  }

  private static testPayload(token: string): FirebaseUserPayload | null {
    if (!AppEnv.isTest || !token.startsWith('test-firebase:')) return null

    try {
      const encodedPayload = token.replace(/^test-firebase:/, '')
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as unknown
      return this.validPayload(payload) ? payload : null
    } catch (err) {
      if (!(err instanceof SyntaxError)) throw err
      return null
    }
  }

  private static validPayload(payload: unknown): payload is FirebaseUserPayload {
    if (!payload || typeof payload !== 'object') return false
    const firebasePayload = payload as Partial<FirebaseUserPayload>

    return (
      typeof firebasePayload.uid === 'string' &&
      typeof firebasePayload.email === 'string' &&
      typeof firebasePayload.emailVerified === 'boolean'
    )
  }

  private static validateEmulatorHost() {
    if (!AppEnv.string('FIREBASE_AUTH_EMULATOR_HOST', { optional: true })) return
    if (AppEnv.isTest || AppEnv.isDevelopment) return

    throw new Error('FIREBASE_AUTH_EMULATOR_HOST may only be set in test or development')
  }

  private static expectedFirebaseAuthError(err: unknown) {
    return err instanceof FirebaseAuthError && this.expectedFirebaseAuthErrorCodes.includes(err.code)
  }
}
