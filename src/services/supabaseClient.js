import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)?.trim()

let client = null
let configError = ''

if (!supabaseUrl && !supabaseAnonKey) {
  configError = 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) to your local .env file to enable accounts.'
} else if (!supabaseUrl || !supabaseAnonKey) {
  configError = 'A Supabase URL and public anon/publishable key are both required to enable accounts.'
} else {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        persistSession: true,
      },
    })
  } catch (error) {
    configError = `Supabase configuration is invalid: ${error.message}`
  }
}

export const supabase = client
export const supabaseConfigError = configError
