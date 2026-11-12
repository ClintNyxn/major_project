export async function loadAccountData(client, userId) {
  const { data, error } = await client
    .from('user_data')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`Could not load your account data: ${error.message}`)
  return data
}

export async function saveAccountData(client, userId, state) {
  const { data, error } = await client
    .from('user_data')
    .upsert({ user_id: userId, data: state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select('updated_at')
    .single()

  if (error) throw new Error(`Could not sync your account data: ${error.message}`)
  return data.updated_at
}
