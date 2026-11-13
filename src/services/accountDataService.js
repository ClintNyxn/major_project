function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function loadAccountData(client, userId) {
  // user_id is a strict uuid column in Supabase; a fallback/local session id
  // (e.g. "usr_...") is never a uuid and would break the query, so treat it
  // as "no remote data yet" instead of crashing.
  if (!userId || !isUuid(userId)) return null
  try {
    const { data, error } = await client
      .from('user_data')
      .select('data, updated_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST205' || /schema cache|relation.*does not exist/i.test(error.message)) {
        return null
      }
      throw new Error(`Could not load your account data: ${error.message}`)
    }
    return data
  } catch (err) {
    if (/schema cache|relation.*does not exist/i.test(err.message)) {
      return null
    }
    throw err
  }
}

export async function saveAccountData(client, userId, state) {
  // Same guard as the read path: never send a non-uuid id to the uuid column.
  // Returning a timestamp lets the caller treat this as a local-only save.
  if (!userId || !isUuid(userId)) return new Date().toISOString()
  try {
    const { data, error } = await client
      .from('user_data')
      .upsert({ user_id: userId, data: state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select('updated_at')
      .single()

    if (error) {
      if (error.code === 'PGRST205' || /schema cache|relation.*does not exist/i.test(error.message)) {
        return new Date().toISOString()
      }
      throw new Error(`Could not sync your account data: ${error.message}`)
    }
    return data.updated_at
  } catch (err) {
    if (/schema cache|relation.*does not exist/i.test(err.message)) {
      return new Date().toISOString()
    }
    throw err
  }
}
