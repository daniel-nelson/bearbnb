import * as dotenv from 'dotenv'

if (!process.env.NODE_ENV) {
  ;(process.env as { NODE_ENV?: string }).NODE_ENV = 'test'
}

dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', override: false })
