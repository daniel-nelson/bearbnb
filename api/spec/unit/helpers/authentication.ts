import AppEnv from '@conf/AppEnv.js'
import User from '@models/User.js'
import { Dream } from '@rvoh/dream'
import { untypedDb } from '@rvoh/dream/db'
import { Encrypt } from '@rvoh/dream/utils'
import { PsychicServer } from '@rvoh/psychic'
import { OpenapiRequestBody, OpenapiRequestQuery, OpenapiSpecRequest } from '@rvoh/psychic-spec-helpers'
import { paths as OpenapiPaths } from '@src/types/openapi/tests.openapi.js'
import { makeSignature } from 'better-auth/crypto'
import { sql } from 'kysely'
import { randomUUID } from 'node:crypto'

export type SpecRequestType = Awaited<ReturnType<typeof session>>

export type RequestBody<HttpMethod extends 'get' | 'post' | 'patch' | 'delete', Uri> = OpenapiRequestBody<
  OpenapiPaths,
  HttpMethod,
  Uri
>

export type RequestQuery<HttpMethod extends 'get' | 'post' | 'patch' | 'delete', Uri> = OpenapiRequestQuery<
  OpenapiPaths,
  HttpMethod,
  Uri
>

async function userSessionCookie(user: User): Promise<string> {
  const token = randomUUID()

  await untypedDb()
    .insertInto('auth_sessions')
    .values({
      id: randomUUID(),
      userId: user.primaryKeyValue(),
      token,
      expiresAt: sql`now() + interval '1 day'`,
      createdAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .execute()

  const secret =
    AppEnv.string('BETTER_AUTH_SECRET', { optional: !AppEnv.isProduction }) ||
    AppEnv.string('APP_ENCRYPTION_KEY')
  const signedToken = `${token}.${await makeSignature(token, secret)}`
  return `better-auth.session_token=${encodeURIComponent(signedToken)}`
}

// eslint-disable-next-line @typescript-eslint/require-await
async function adminUserBearerToken(adminUser: Dream): Promise<string> {
  /**
   * The current authentication scheme is only for early development.
   * Replace with a production grade authentication scheme.
   */
  return Encrypt.encrypt(JSON.stringify({ adminUserId: String(adminUser.primaryKeyValue()) }), {
    algorithm: 'aes-256-gcm',
    key: AppEnv.string('APP_ENCRYPTION_KEY'),
  })
}

// eslint-disable-next-line @typescript-eslint/require-await
async function internalUserBearerToken(internalUser: Dream): Promise<string> {
  /**
   * The current authentication scheme is only for early development.
   * Replace with a production grade authentication scheme.
   */
  return Encrypt.encrypt(JSON.stringify({ internalUserId: String(internalUser.primaryKeyValue()) }), {
    algorithm: 'aes-256-gcm',
    key: AppEnv.string('APP_ENCRYPTION_KEY'),
  })
}

export async function session(user: Dream) {
  const request = new OpenapiSpecRequest<OpenapiPaths>()
  await request.init(PsychicServer)

  if (user instanceof User) return request.setDefaultHeaders({ Cookie: await userSessionCookie(user) })

  /** if using bearer-token authentication*/
  let bearerToken: string
  if (user.sanitizedConstructorName === 'InternalUser') {
    bearerToken = await internalUserBearerToken(user)
  } else {
    bearerToken = await adminUserBearerToken(user)
  }
  return request.setDefaultHeaders({ Authorization: `Bearer ${bearerToken}` })

  /** if using password authentication*/
  // const sessionPath = user instanceof User ? '/session' : '/admin/session'
  // return await request.session('post', sessionPath, 204, {
  //   data: {
  //     email: user.email,
  //     password: 'spec-user-password',
  //   },
  // })
}
