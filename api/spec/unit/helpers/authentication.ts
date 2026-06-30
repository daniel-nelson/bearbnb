import AppEnv from '@conf/AppEnv.js'
import User from '@models/User.js'
import { Dream } from '@rvoh/dream'
import { PsychicServer } from '@rvoh/psychic'
import { OpenapiRequestBody, OpenapiRequestQuery, OpenapiSpecRequest } from '@rvoh/psychic-spec-helpers'
import { paths as OpenapiPaths } from '@src/types/openapi/tests.openapi.js'

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

async function userBearerToken(user: User): Promise<string> {
  const firebaseUid = user.firebaseUid ?? user.id
  if (!user.firebaseUid) await user.update({ firebaseUid })

  return firebaseTestBearerToken({
    uid: firebaseUid,
    email: user.email,
  })
}

// eslint-disable-next-line @typescript-eslint/require-await
async function adminUserBearerToken(adminUser: Dream): Promise<string> {
  const uid = String(adminUser.primaryKeyValue())

  return firebaseTestBearerToken({
    uid,
    email: `${uid}@admin.example.com`,
  })
}

// eslint-disable-next-line @typescript-eslint/require-await
async function internalUserBearerToken(internalUser: Dream): Promise<string> {
  const uid = String(internalUser.primaryKeyValue())

  return firebaseTestBearerToken({
    uid,
    email: `${uid}@internal.example.com`,
  })
}

export function firebaseTestBearerToken({
  uid,
  email,
  emailVerified = true,
}: {
  uid: string
  email: string
  emailVerified?: boolean
}) {
  AppEnv.string('FIREBASE_PROJECT_ID')
  return `test-firebase:${Buffer.from(JSON.stringify({ uid, email, emailVerified })).toString('base64url')}`
}

export async function session(user: Dream) {
  const request = new OpenapiSpecRequest<OpenapiPaths>()
  await request.init(PsychicServer)

  /** if using bearer-token authentication*/
  let bearerToken: string
  if (user instanceof User) {
    bearerToken = await userBearerToken(user)
  } else if (user.sanitizedConstructorName === 'InternalUser') {
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
