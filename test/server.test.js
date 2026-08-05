import assert from 'node:assert/strict'
import { test, before, after } from 'node:test'
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApp, leaderboard } from '../server/app.js'
import { createHub } from '../server/hub.js'
import { createStore } from '../server/store.js'

let server
let base
let tmpDir

before(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checkrealm-test-'))
  const store = createStore(path.join(tmpDir, 'db.json'))
  const hub = createHub(store)
  const app = createApp(store, hub)
  server = http.createServer(app)
  server.on('upgrade', (req, socket, head) => hub.handleUpgrade(req, socket, head))
  await new Promise((resolve) => server.listen(0, resolve))
  base = `http://localhost:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

async function api(method, url, { token, body } = {}) {
  const res = await fetch(`${base}${url}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, body: await res.json() }
}

test('health endpoint responds', async () => {
  const res = await api('GET', '/api/health')
  assert.equal(res.status, 200)
  assert.equal(res.body.status, 'ok')
})

test('register validates input', async () => {
  let res = await api('POST', '/api/auth/register', { body: { username: 'x', password: 'secret1' } })
  assert.equal(res.status, 400)
  res = await api('POST', '/api/auth/register', { body: { username: 'Lancelot', password: 'abc' } })
  assert.equal(res.status, 400)
})

test('register, me, duplicate rejection', async () => {
  const res = await api('POST', '/api/auth/register', {
    body: { username: 'Lancelot', password: 'grail123' },
  })
  assert.equal(res.status, 201)
  assert.ok(res.body.token)
  assert.equal(res.body.user.name, 'Lancelot')

  const me = await api('GET', '/api/auth/me', { token: res.body.token })
  assert.equal(me.status, 200)
  assert.equal(me.body.user.name, 'Lancelot')
  assert.equal(me.body.hasSave, false)

  const dup = await api('POST', '/api/auth/register', {
    body: { username: 'lancelot', password: 'other123' },
  })
  assert.equal(dup.status, 409)
})

test('login with right and wrong password', async () => {
  await api('POST', '/api/auth/register', { body: { username: 'Guinevere', password: 'camelot' } })
  const ok = await api('POST', '/api/auth/login', {
    body: { username: 'guinevere', password: 'camelot' },
  })
  assert.equal(ok.status, 200)
  assert.ok(ok.body.token)

  const bad = await api('POST', '/api/auth/login', {
    body: { username: 'guinevere', password: 'wrong' },
  })
  assert.equal(bad.status, 401)
})

test('save round-trips and score only rises', async () => {
  const reg = await api('POST', '/api/auth/register', {
    body: { username: 'Merlin', password: 'dragons' },
  })
  const token = reg.body.token

  const state = { version: 1, villages: [{ name: 'Avalon' }] }
  let res = await api('PUT', '/api/save', { token, body: { state, score: 420, victories: 2 } })
  assert.equal(res.status, 200)
  assert.equal(res.body.user.bestScore, 420)
  assert.equal(res.body.user.victories, 2)

  const got = await api('GET', '/api/save', { token })
  assert.deepEqual(got.body.state, state)

  // Lower score must not overwrite the best.
  res = await api('PUT', '/api/save', { token, body: { state, score: 10, victories: 1 } })
  assert.equal(res.body.user.bestScore, 420)
  assert.equal(res.body.user.victories, 2)
})

test('unauthorized access is rejected', async () => {
  const res = await api('GET', '/api/save', { token: 'not-a-token' })
  assert.equal(res.status, 401)
})

test('leaderboard sorts by score', async () => {
  const res = await api('GET', '/api/leaderboard')
  assert.equal(res.status, 200)
  const scores = res.body.entries.map((e) => e.score)
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a))
  assert.ok(res.body.entries.some((e) => e.name === 'Merlin' && e.score === 420))
})

test('leaderboard helper caps and sorts', () => {
  const store = createStore(path.join(tmpDir, 'unused.json'))
  for (let i = 0; i < 40; i++) {
    store.data.users[`user${i}`] = { name: `User${i}`, bestScore: i, victories: 0, createdAt: 1 }
  }
  const entries = leaderboard(store)
  assert.equal(entries.length, 25)
  assert.equal(entries[0].score, 39)
})
