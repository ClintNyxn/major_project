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

  assert.equal(await loadAccountData(client, 'account-1'), row)
  assert.deepEqual(calls, [
    ['from', 'user_data'],
    ['select', 'data, updated_at'],
    ['eq', 'user_id', 'account-1'],
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

  assert.equal(await saveAccountData(client, 'account-1', state), row.updated_at)
  assert.equal(saved.values.user_id, 'account-1')
  assert.equal(saved.values.data, state)
  assert.equal(saved.options.onConflict, 'user_id')
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

  await assert.rejects(loadAccountData(client, 'account-1'), /Could not load your account data: permission denied/)
})
