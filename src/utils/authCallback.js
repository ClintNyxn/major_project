const authCallbackKeys = ['access_token', 'refresh_token', 'error', 'error_code', 'error_description', 'code']

export function hasSupabaseAuthCallback(hash = '', search = '') {
  const fragment = hash.replace(/^#\/?/, '')
  const fragmentParams = new URLSearchParams(fragment)
  const queryParams = new URLSearchParams(search)
  return authCallbackKeys.some((key) => fragmentParams.has(key) || queryParams.has(key))
}

export async function completeSupabaseAuthCallback(client, callbackUrl) {
  const callback = new URL(callbackUrl)
  const params = new URLSearchParams(callback.search)
  const fragment = new URLSearchParams(callback.hash.replace(/^#\/?/, ''))
  for (const [key, value] of fragment) {
    if (!params.has(key)) params.set(key, value)
  }

  const authError = params.get('error_description') || params.get('error')
  if (authError) throw new Error(authError)

  const code = params.get('code')
  const result = code
    ? await client.auth.exchangeCodeForSession(code)
    : params.has('access_token') && params.has('refresh_token')
      ? await client.auth.setSession({
        access_token: params.get('access_token'),
        refresh_token: params.get('refresh_token'),
      })
      : null

  if (!result) throw new Error('The sign-in link did not contain a valid session.')
  if (result.error) throw result.error
  return { ...result.data, type: params.get('type') }
}
