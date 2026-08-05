import fs from 'node:fs'
import path from 'node:path'

/**
 * Tiny JSON-file persistence layer. Good enough for a small realm:
 * everything lives in memory and is flushed to disk (atomically) on change.
 */
export function normalizeData(parsed) {
  const data = { users: {}, sessions: {}, herald: [] }
  if (parsed && typeof parsed === 'object') {
    data.users = parsed.users ?? {}
    data.sessions = parsed.sessions ?? {}
    data.herald = Array.isArray(parsed.herald) ? parsed.herald : []
  }
  return data
}

export function createStore(filePath) {
  const dir = path.dirname(filePath)
  let data = normalizeData(null)

  try {
    data = normalizeData(JSON.parse(fs.readFileSync(filePath, 'utf8')))
  } catch {
    // first boot or corrupt file — start fresh
  }

  let flushTimer = null

  function flush() {
    fs.mkdirSync(dir, { recursive: true })
    const tmp = `${filePath}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(data))
    fs.renameSync(tmp, filePath)
  }

  function scheduleFlush() {
    if (flushTimer) return
    flushTimer = setTimeout(() => {
      flushTimer = null
      try {
        flush()
      } catch (err) {
        console.error('[store] flush failed:', err.message)
      }
    }, 250)
    if (flushTimer.unref) flushTimer.unref()
  }

  return {
    get data() {
      return data
    },
    save: scheduleFlush,
    flushNow: flush,
  }
}
