import { config } from 'dotenv'
import { resolve } from 'path'
import { neon } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

config({ path: resolve(process.cwd(), '.env.local'), override: true })

type DB = NeonHttpDatabase<typeof schema>

function createDb(): DB {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return drizzle(neon(url), { schema })
}

let instance: DB | undefined

export const db: DB = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    if (!instance) instance = createDb()
    const value = Reflect.get(instance, prop, receiver)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})
