import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_SIZE_BYTES,
  formatAvatarError,
  validateAvatarFile,
} from '../src/utils/avatarUtils.js'

test('validates avatar file types correctly', () => {
  assert.equal(validateAvatarFile(null).valid, false)
  assert.equal(validateAvatarFile(undefined).valid, false)

  // Disallowed type (e.g. gif, svg, pdf)
  assert.equal(
    validateAvatarFile({ type: 'image/gif', size: 1024 }).valid,
    false
  )
  assert.equal(
    validateAvatarFile({ type: 'application/pdf', size: 1024 }).valid,
    false
  )

  // Allowed types
  for (const mime of ALLOWED_AVATAR_TYPES) {
    const result = validateAvatarFile({ type: mime, size: 500 * 1024 })
    assert.equal(result.valid, true)
    assert.equal(result.error, null)
  }
})

test('validates avatar file size limits', () => {
  // Exactly 2 MB is valid
  assert.equal(
    validateAvatarFile({ type: 'image/jpeg', size: MAX_AVATAR_SIZE_BYTES }).valid,
    true
  )

  // 1 byte over 2 MB is invalid
  const overSizeResult = validateAvatarFile({
    type: 'image/jpeg',
    size: MAX_AVATAR_SIZE_BYTES + 1,
  })
  assert.equal(overSizeResult.valid, false)
  assert.match(overSizeResult.error, /exceeds the 2 MB limit/)
})

test('formats friendly avatar errors', () => {
  // Bucket not found
  const bucketError = formatAvatarError(new Error('Bucket avatars not found'))
  assert.match(bucketError, /migration 002_avatars\.sql/)

  // RLS policy violation
  const rlsError = formatAvatarError(
    new Error('new row violates row-level security policy for table objects')
  )
  assert.match(rlsError, /Permission denied/)

  // Network error
  const netError = formatAvatarError(new Error('Failed to fetch'))
  assert.match(netError, /Network connection error/)

  // Fallback
  const genericError = formatAvatarError(new Error('Custom database error'))
  assert.equal(genericError, 'Custom database error')
})

