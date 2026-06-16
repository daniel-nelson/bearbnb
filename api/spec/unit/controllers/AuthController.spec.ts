import AuthAccount from '@models/Auth/Account.js'
import AuthSession from '@models/Auth/Session.js'
import User from '@models/User.js'
import { PsychicServer } from '@rvoh/psychic'
import { createPsychicServer } from '@rvoh/psychic-spec-helpers'
import supertest from 'supertest'
import type { Response } from 'supertest'

type TestServer = {
  koaApp: {
    callback(): Parameters<typeof supertest>[0]
  }
}

type AuthUserBody = {
  id: string
  email: string
  name: string
  emailVerified: boolean
}

type AuthSessionBody = {
  user: AuthUserBody
}

type AuthSignUpBody = AuthSessionBody & {
  token: string
}

type AuthSignInBody = AuthSignUpBody & {
  redirect: boolean
  url: string | null
}

type AuthSignOutBody = {
  success: boolean
}

describe('Better Auth endpoints', () => {
  let server: TestServer

  beforeEach(async () => {
    server = (await createPsychicServer(PsychicServer)) as TestServer
  })

  it('signs up, resolves the session, signs out, and signs back in', async () => {
    const email = 'bear-auth@example.com'
    const password = 'bearbnb-password'

    const signUpResponse = await post('/api/auth/sign-up/email', {
      name: 'Test Bear',
      email,
      password,
    })
    const signUpBody = responseBody<AuthSignUpBody>(signUpResponse)

    const user = await User.findBy({ email })
    expect(user).not.toBeNull()
    expect(signUpBody.user).toEqual(
      expect.objectContaining({
        id: user?.id,
        email,
        name: 'Test Bear',
        emailVerified: false,
      }),
    )
    expect(signUpBody.token).toEqual(expect.any(String))

    const credentialAccount = await AuthAccount.findBy({ userId: user!.id, providerId: 'credential' })
    expect(credentialAccount?.accountId).toEqual(user?.id)
    expect(credentialAccount?.password).toEqual(expect.any(String))

    expect(await AuthSession.where({ userId: user!.id }).count()).toEqual(1)

    const sessionCookie = sessionCookieFrom(signUpResponse)
    const getSessionResponse = await get('/api/auth/get-session', { Cookie: sessionCookie })
    const getSessionBody = responseBody<AuthSessionBody>(getSessionResponse)
    expect(getSessionBody.user).toEqual(
      expect.objectContaining({
        id: user?.id,
        email,
      }),
    )

    const signOutResponse = await post('/api/auth/sign-out', {}, { Cookie: sessionCookie })
    expect(responseBody<AuthSignOutBody>(signOutResponse)).toEqual({ success: true })
    expect(await AuthSession.where({ userId: user!.id }).count()).toEqual(0)

    const signInResponse = await post('/api/auth/sign-in/email', {
      email,
      password,
    })
    const signInBody = responseBody<AuthSignInBody>(signInResponse)
    expect(signInBody.redirect).toBe(false)
    expect(typeof signInBody.token).toBe('string')
    expect(signInBody.user).toEqual(
      expect.objectContaining({
        id: user?.id,
        email,
      }),
    )
    expect(sessionCookieFrom(signInResponse)).toMatch(/^better-auth\.session_token=/)
    expect(await AuthSession.where({ userId: user!.id }).count()).toEqual(1)
  })

  async function get(path: string, headers: Record<string, string> = {}): Promise<Response> {
    return await supertest(server.koaApp.callback()).get(path).set(headers).expect(200)
  }

  async function post(path: string, data: object, headers: Record<string, string> = {}): Promise<Response> {
    return await supertest(server.koaApp.callback()).post(path).set(headers).send(data).expect(200)
  }
})

function sessionCookieFrom(response: Response): string {
  const headers = response.headers as Record<string, string | string[] | undefined>
  const setCookieHeader = headers['set-cookie']
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
  const sessionCookie = cookies.find(cookie => cookie?.startsWith('better-auth.session_token='))

  if (!sessionCookie) throw new Error('Expected Better Auth session cookie')

  return sessionCookie.split(';')[0]!
}

function responseBody<T>(response: Response): T {
  return response.body as T
}
