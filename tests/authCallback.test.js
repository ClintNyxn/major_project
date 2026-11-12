import assert from 'node:assert/strict'
import test from 'node:test'
import { hasSupabaseAuthCallback } from '../src/utils/authCallback.js'

test('recognizes Supabase auth parameters in hash-router callbacks', () => {
  assert.equal(hasSupabaseAuthCallback('#access_token=token&refresh_token=refresh'), true)
  assert.equal(hasSupabaseAuthCallback('#/access_token=token&expires_in=3600'), true)
  assert.equal(hasSupabaseAuthCallback('', '?code=pkce-code'), true)
  assert.equal(hasSupabaseAuthCallback('#/auth/login'), false)
  assert.equal(hasSupabaseAuthCallback('', '?category=breakfast'), false)
})
