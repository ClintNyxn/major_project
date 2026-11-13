import assert from 'node:assert/strict'
import test from 'node:test'
import { completeSupabaseAuthCallback, hasSupabaseAuthCallback } from '../src/utils/authCallback.js'

test('recognizes Supabase auth parameters in hash-router callbacks', () => {
  assert.equal(hasSupabaseAuthCallback('#access_token=token&refresh_token=refresh'), true)
  assert.equal(hasSupabaseAuthCallback('#/access_token=token&expires_in=3600'), true)
  assert.equal(hasSupabaseAuthCallback('', '?code=pkce-code'), true)
  assert.equal(hasSupabaseAuthCallback('#/auth/login'), false)
  assert.equal(hasSupabaseAuthCallback('', '?category=breakfast'), false)
})

test('exchanges an Electron PKCE deep link for a Supabase session', async () => {
  let exchangedCode
  const expected = { session: { access_token: 'session-token' }, user: { id: 'user-1' } }
  const client = {
    auth: {
      exchangeCodeForSession: async (code) => {
        exchangedCode = code
        return { data: expected, error: null }
      },
    },
  }

  const result = await completeSupabaseAuthCallback(client, 'khaanakya://auth/callback?code=pkce-code&type=recovery')
  assert.equal(exchangedCode, 'pkce-code')
  assert.deepEqual(result, { ...expected, type: 'recovery' })
})

test('restores a session from token-fragment callbacks', async () => {
  let tokens
  const expected = { session: { access_token: 'access' }, user: { id: 'user-1' } }
  const client = {
    auth: {
      setSession: async (value) => {
        tokens = value
        return { data: expected, error: null }
      },
    },
  }

  const result = await completeSupabaseAuthCallback(client, 'khaanakya://auth/callback#access_token=access&refresh_token=refresh')
  assert.deepEqual(tokens, { access_token: 'access', refresh_token: 'refresh' })
  assert.deepEqual(result, { ...expected, type: null })
})

test('surfaces errors and invalid callback payloads', async () => {
  const client = { auth: {} }
  await assert.rejects(completeSupabaseAuthCallback(client, 'khaanakya://auth/callback?error_description=Link+expired'), /Link expired/)
  await assert.rejects(completeSupabaseAuthCallback(client, 'khaanakya://auth/callback'), /did not contain a valid session/)
})
