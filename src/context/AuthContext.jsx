import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext.js'
import { supabase as configuredClient, supabaseConfigError } from '../services/supabaseClient.js'
import { leaveGuestMode } from '../utils/guestMode.js'

const browserAuthAvailable = typeof window !== 'undefined' && window.location.protocol !== 'file:'
const supabase = browserAuthAvailable ? configuredClient : null
const configError = browserAuthAvailable
  ? supabaseConfigError
  : 'Account sign-in is available in the web app. Continue as a guest in the packaged desktop app.'

function unavailableError() {
  return new Error(configError || 'Account sign-in is unavailable in this app.')
}

function redirectUrl() {
  return import.meta.env.VITE_SUPABASE_REDIRECT_URL?.trim() || window.location.origin
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setSessionError('')
      if (nextSession?.user) leaveGuestMode()
      if (event === 'PASSWORD_RECOVERY') window.location.hash = '/auth/update-password'
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setSessionError(`Could not restore your sign-in session: ${error.message}`)
      else setSession(data.session)
      setLoading(false)
    }).catch((error) => {
      if (!active) return
      setSessionError(`Could not restore your sign-in session: ${error.message}`)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const actions = useMemo(() => ({
    signUp: async ({ name, email, password }) => {
      if (!supabase) throw unavailableError()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: redirectUrl(),
        },
      })
      if (error) throw error
      return data
    },
    signIn: async ({ email, password }) => {
      if (!supabase) throw unavailableError()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    },
    signOut: async () => {
      if (!supabase) return
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    resetPassword: async (email) => {
      if (!supabase) throw unavailableError()
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() })
      if (error) throw error
    },
    updatePassword: async (password) => {
      if (!supabase) throw unavailableError()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
    resendConfirmation: async (email) => {
      if (!supabase) throw unavailableError()
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) throw error
    },
  }), [])

  const value = useMemo(() => ({
    ...actions,
    client: supabase,
    configError,
    loading,
    session,
    sessionError,
    user: session?.user || null,
  }), [actions, loading, session, sessionError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
