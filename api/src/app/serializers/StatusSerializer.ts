import { ObjectSerializer } from '@rvoh/dream'

export type StatusResponse = {
  status: 'ok'
}

export const StatusSerializer = (status: StatusResponse) =>
  ObjectSerializer(status).attribute('status', { openapi: 'string' })
