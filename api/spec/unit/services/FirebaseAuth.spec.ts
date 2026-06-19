import { AuthErrorCode, FirebaseAuthError } from 'firebase-admin/auth'
import AppEnv from '@conf/AppEnv.js'
import User from '@models/User.js'
import FirebaseAuth from '@src/app/services/FirebaseAuth.js'

type FirebaseAuthWithPrivateVerifier = {
  firebaseVerifier: () => {
    verifyIdToken(token: string, checkRevoked?: boolean): Promise<unknown>
  }
}

describe('FirebaseAuth', () => {
  describe('.userFromBearerToken', () => {
    it('rejects revoked Firebase ID tokens', async () => {
      const verifyIdToken = stubFirebaseVerifier(AuthErrorCode.ID_TOKEN_REVOKED)

      await expect(FirebaseAuth.userFromBearerToken('Bearer revoked-token')).resolves.toBeNull()
      expect(verifyIdToken).toHaveBeenCalledWith('revoked-token', true)
    })

    it('rejects disabled Firebase users', async () => {
      const verifyIdToken = stubFirebaseVerifier(AuthErrorCode.USER_DISABLED)

      await expect(FirebaseAuth.userFromBearerToken('Bearer disabled-user-token')).resolves.toBeNull()
      expect(verifyIdToken).toHaveBeenCalledWith('disabled-user-token', true)
    })

    it('rejects tokens for deleted Firebase users', async () => {
      const verifyIdToken = stubFirebaseVerifier(AuthErrorCode.USER_NOT_FOUND)

      await expect(FirebaseAuth.userFromBearerToken('Bearer deleted-user-token')).resolves.toBeNull()
      expect(verifyIdToken).toHaveBeenCalledWith('deleted-user-token', true)
    })

    it('creates a user from a verified Firebase decoded token', async () => {
      const verifyIdToken = stubFirebaseVerifierSuccess({
        uid: 'verified-firebase-user',
        email: 'verified@example.com',
        email_verified: true,
      })

      const user = await FirebaseAuth.userFromBearerToken('Bearer verified-token')

      const persistedUser = await User.findBy({ firebaseUid: 'verified-firebase-user' })

      expect(verifyIdToken).toHaveBeenCalledWith('verified-token', true)
      expect(persistedUser).not.toBeNull()
      expect(user).toMatchDreamModel(persistedUser!)
      expect(user?.email).toEqual('verified@example.com')
      expect(user?.phone).toBeNull()
    })

    it('rejects Firebase decoded tokens without verified email', async () => {
      const verifyIdToken = stubFirebaseVerifierSuccess({
        uid: 'unverified-firebase-user',
        email: 'unverified@example.com',
        email_verified: false,
      })

      await expect(FirebaseAuth.userFromBearerToken('Bearer unverified-token')).resolves.toBeNull()
      expect(verifyIdToken).toHaveBeenCalledWith('unverified-token', true)
      expect(await User.where({ firebaseUid: 'unverified-firebase-user' }).exists()).toBe(false)
    })

    it('rejects test bearer tokens with non-object JSON payloads', async () => {
      const nullPayloadToken = Buffer.from('null').toString('base64url')
      const verifyIdToken = stubFirebaseVerifierSuccess({
        uid: 'should-not-reach-admin',
        email: 'admin@example.com',
        email_verified: true,
      })

      await expect(
        FirebaseAuth.userFromBearerToken(`Bearer test-firebase:${nullPayloadToken}`),
      ).resolves.toBeNull()
      expect(verifyIdToken).not.toHaveBeenCalled()
    })

    it('rejects test bearer tokens with non-string uid and email payloads', async () => {
      const numericPayloadToken = Buffer.from(
        JSON.stringify({ uid: 1, email: 2, emailVerified: true }),
      ).toString('base64url')

      await expect(
        FirebaseAuth.userFromBearerToken(`Bearer test-firebase:${numericPayloadToken}`),
      ).resolves.toBeNull()
    })

    it('rejects Firebase UIDs that belong to soft-deleted local users', async () => {
      const existingUser = await User.create({
        email: 'soft-deleted@example.com',
        firebaseUid: 'soft-deleted-firebase-user',
      })
      await existingUser.destroy()

      stubFirebaseVerifierSuccess({
        uid: existingUser.firebaseUid!,
        email: 'soft-deleted@example.com',
        email_verified: true,
      })

      await expect(FirebaseAuth.userFromBearerToken('Bearer soft-deleted-token')).resolves.toBeNull()
      expect(await User.where({ email: 'soft-deleted@example.com' }).exists()).toBe(false)
      expect(
        await User.removeAllDefaultScopes().where({ email: 'soft-deleted@example.com' }).count(),
      ).toEqual(1)
    })

    it('rejects Firebase Auth emulator configuration outside test and development', async () => {
      AppEnv.setString('FIREBASE_AUTH_EMULATOR_HOST', '127.0.0.1:9099')
      Object.defineProperty(AppEnv, 'isTest', { configurable: true, get: () => false })
      Object.defineProperty(AppEnv, 'isDevelopment', { configurable: true, get: () => false })
      onTestFinished(() => {
        AppEnv.unsetString('FIREBASE_AUTH_EMULATOR_HOST')
        delete (AppEnv as { isTest?: boolean }).isTest
        delete (AppEnv as { isDevelopment?: boolean }).isDevelopment
      })

      await expect(FirebaseAuth.userFromBearerToken('Bearer emulator-token')).rejects.toThrow(
        'FIREBASE_AUTH_EMULATOR_HOST may only be set in test or development',
      )
    })
  })
})

function stubFirebaseVerifier(errorCode: string) {
  const verifyIdToken = vi.fn().mockRejectedValue(
    new FirebaseAuthError(
      {
        code: errorCode,
        message: 'Firebase authentication failed.',
      },
      'Firebase authentication failed.',
    ),
  )

  const firebaseAuth = FirebaseAuth as unknown as FirebaseAuthWithPrivateVerifier
  const originalFirebaseVerifier = firebaseAuth.firebaseVerifier
  firebaseAuth.firebaseVerifier = vi.fn(() => ({ verifyIdToken }))
  onTestFinished(() => {
    firebaseAuth.firebaseVerifier = originalFirebaseVerifier
  })

  return verifyIdToken
}

function stubFirebaseVerifierSuccess(decodedToken: { uid: string; email: string; email_verified: boolean }) {
  const verifyIdToken = vi.fn().mockResolvedValue(decodedToken)

  const firebaseAuth = FirebaseAuth as unknown as FirebaseAuthWithPrivateVerifier
  const originalFirebaseVerifier = firebaseAuth.firebaseVerifier
  firebaseAuth.firebaseVerifier = vi.fn(() => ({ verifyIdToken }))
  onTestFinished(() => {
    firebaseAuth.firebaseVerifier = originalFirebaseVerifier
  })

  return verifyIdToken
}
