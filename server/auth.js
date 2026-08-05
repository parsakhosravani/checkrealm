import crypto from 'node:crypto'

const SCRYPT_KEYLEN = 64

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex')
  return { salt, hash }
}

export function verifyPassword(password, salt, expectedHash) {
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN)
  const expected = Buffer.from(expectedHash, 'hex')
  return hash.length === expected.length && crypto.timingSafeEqual(hash, expected)
}

export function newToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function newId() {
  return crypto.randomUUID()
}
