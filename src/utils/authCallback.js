const authCallbackKeys = ['access_token', 'refresh_token', 'error', 'error_code', 'error_description', 'code']

export function hasSupabaseAuthCallback(hash = '', search = '') {
  const fragment = hash.replace(/^#\/?/, '')
  const fragmentParams = new URLSearchParams(fragment)
  const queryParams = new URLSearchParams(search)
  return authCallbackKeys.some((key) => fragmentParams.has(key) || queryParams.has(key))
}
