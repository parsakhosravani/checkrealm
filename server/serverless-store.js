import { normalizeData, createStore } from './store.js'

const KEY = 'checkrealm:db'

function redisEnv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url, token } : null
}

/**
 * Store for serverless hosts (Vercel): the whole database lives under one
 * key in Upstash Redis (installed via the Vercel Marketplace). Loaded once
 * per cold start; every change is written back immediately (last write wins).
 */
async function createRedisStore({ url, token }) {
  const headers = { authorization: `Bearer ${token}` }

  async function load() {
    const res = await fetch(`${url}/get/${KEY}`, { headers })
    if (!res.ok) throw new Error(`redis get failed (${res.status})`)
    const { result } = await res.json()
    return normalizeData(result ? JSON.parse(result) : null)
  }

  const data = await load()
  let writing = false
  let dirty = false

  async function write() {
    if (writing) {
      dirty = true
      return
    }
    writing = true
    try {
      do {
        dirty = false
        const res = await fetch(`${url}/set/${KEY}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        })
        if (!res.ok) console.error(`[store] redis set failed (${res.status})`)
      } while (dirty)
    } catch (err) {
      console.error('[store] redis write failed:', err.message)
    } finally {
      writing = false
    }
  }

  return {
    get data() {
      return data
    },
    save: () => {
      void write()
    },
    flushNow: write,
  }
}

/**
 * Pick the best store for the current environment. Without Redis config the
 * data lives in /tmp, which resets between serverless instances — fine for
 * trying things out, not for keeping accounts.
 */
export async function createServerlessStore() {
  const redis = redisEnv()
  if (redis) return createRedisStore(redis)
  console.warn(
    '[checkrealm] No Redis configured (KV_REST_API_URL/KV_REST_API_TOKEN) — using ephemeral /tmp storage. Accounts will not survive redeploys.',
  )
  return createStore('/tmp/checkrealm/db.json')
}
