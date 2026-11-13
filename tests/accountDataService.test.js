import assert from 'node:assert/strict'
import test from 'node:test'
import { loadAccountData, saveAccountData } from '../src/services/accountDataService.js'

test('loads planner data only for the requested account', async () => {
  const row = { data: { favorites: ['recipe-1'] }, updated_at: '2026-04-04T10:00:00.000Z' }
  const calls = []
  const client = {
    from(table) {
      calls.push(['from', table])
      return {
        select(columns) {
          calls.push(['select', columns])
          return {
            eq(column, value) {
              calls.push(['eq', column, value])
              return { maybeSingle: async () => ({ data: row, error: null }) }
            },
          }
        },
      }
    },
  }

  assert.equal(await loadAccountData(client, 'e0f7b0d0-1234-4a0b-8f0e-123456789abc'), row)
  assert.deepEqual(calls, [
    ['from', 'user_data'],
    ['select', 'data, updated_at'],
    ['eq', 'user_id', 'e0f7b0d0-1234-4a0b-8f0e-123456789abc'],
  ])
})

test('saves account data and returns the server timestamp', async () => {
  const state = { favorites: ['recipe-1'] }
  const row = { updated_at: '2026-04-04T10:00:00.000Z' }
  let saved
  const client = {
    from(table) {
      assert.equal(table, 'user_data')
      return {
        upsert(values, options) {
          saved = { values, options }
          return {
            select(columns) {
              assert.equal(columns, 'updated_at')
              return { single: async () => ({ data: row, error: null }) }
            },
          }
        },
      }
    },
  }

  assert.equal(await saveAccountData(client, 'e0f7b0d0-1234-4a0b-8f0e-123456789abc', state), row.updated_at)
  assert.equal(saved.values.user_id, 'e0f7b0d0-1234-4a0b-8f0e-123456789abc')
  assert.equal(saved.values.data, state)
  assert.equal(saved.options.onConflict, 'user_id')
})

test('treats non-uuid user ids as local-only (no remote query)', async () => {
  const client = {
    from() {
      throw new Error('should not query the remote table for a non-uuid id')
    },
  }
  assert.equal(await loadAccountData(client, null), null)
  assert.equal(await loadAccountData(client, 'usr_zsd5rie0'), null)
  const timestamp = await saveAccountData(client, 'usr_zsd5rie0', { favorites: ['x'] })
  assert.ok(timestamp)
})

test('treats a uuid user id as a real remote query', async () => {
  const row = { data: { favorites: ['recipe-1'] }, updated_at: '2026-04-04T10:00:00.000Z' }
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return { maybeSingle: async () => ({ data: row, error: null }) }
            },
          }
        },
      }
    },
  }
  assert.equal(await loadAccountData(client, 'e0f7b0d0-1234-4a0b-8f0e-123456789abc'), row)
})

test('surfaces account-data service errors', async () => {
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return { maybeSingle: async () => ({ data: null, error: { message: 'permission denied' } }) }
            },
          }
        },
      }
    },
  }

  await assert.rejects(loadAccountData(client, 'e0f7b0d0-1234-4a0b-8f0e-123456789abc'), /Could not load your account data: permission denied/)
})
