import assert from 'node:assert/strict'
import test from 'node:test'
import { authErrorMessage } from '../src/utils/authErrors.js'

test('explains Supabase default SMTP recipient restrictions', () => {
  assert.match(authErrorMessage({ message: 'Email address not authorized' }, 'fallback'), /built-in email sender only delivers to project team addresses/)
})

test('explains email rate limits and preserves other provider errors', () => {
  assert.match(authErrorMessage({ status: 429, message: 'Too many requests' }, 'fallback'), /rate-limiting email requests/)
  assert.equal(authErrorMessage({ message: 'SMTP connection failed' }, 'fallback'), 'SMTP connection failed')
  assert.equal(authErrorMessage(null, 'fallback'), 'fallback')
})
