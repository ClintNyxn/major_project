import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext.js'
import { supabase as configuredClient, supabaseConfigError } from '../services/supabaseClient.js'
import { leaveGuestMode } from '../utils/guestMode.js'

const browserAuthAvailable = typeof window !== 'undefined' && window.location.protocol !== 'file:'
const supabase = browserAuthAvailable ? configuredClient : null
const configError = browserAuthAvailable
  ? supabaseConfigError
  : 'Account sign-in is available in the web app. Continue as a guest in the packaged desktop app.'

const FALLBACK_USERS_KEY = 'khaanakya_auth_users_v1'
const FALLBACK_SESSION_KEY = 'khaanakya_auth_session_v1'

function getFallbackUsers() {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_USERS_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveFallbackUser(user) {
  try {
    const users = getFallbackUsers()
    users[user.email.toLowerCase()] = user
    localStorage.setItem(FALLBACK_USERS_KEY, JSON.stringify(users))
  } catch (err) {
    console.error('Could not save fallback user', err)
  }
}

function getFallbackSession() {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

function saveFallbackSession(session) {
  try {
    if (session) localStorage.setItem(FALLBACK_SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(FALLBACK_SESSION_KEY)
  } catch (err) {
    console.error('Could not save fallback session', err)
  }
}

function createLocalSession(user) {
  return {
    access_token: 'local_jwt_' + Math.random().toString(36).slice(2),
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    user: {
      id: user.id || 'usr_' + Math.random().toString(36).slice(2, 10),
      email: user.email,
      user_metadata: user.user_metadata || {},
      app_metadata: { provider: 'email' },
      aud: 'authenticated',
      created_at: user.created_at || new Date().toISOString(),
    },
  }
}

function unavailableError() {
  return new Error(configError || 'Account sign-in is unavailable in this app.')
}

function redirectUrl() {
  return import.meta.env.VITE_SUPABASE_REDIRECT_URL?.trim() || window.location.origin
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getFallbackSession)
  const [loading, setLoading] = useState(() => Boolean(supabase) && !getFallbackSession())
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      if (nextSession) {
        setSession(nextSession)
        saveFallbackSession(null)
      }
      setSessionError('')
      if (nextSession?.user) leaveGuestMode()
      if (event === 'PASSWORD_RECOVERY') window.location.hash = '/auth/update-password'
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error && !local) setSessionError(`Could not restore your sign-in session: ${error.message}`)
      else if (data?.session) {
        setSession(data.session)
        saveFallbackSession(null)
      }
      setLoading(false)
    }).catch((error) => {
      if (!active) return
      if (!local) setSessionError(`Could not restore your sign-in session: ${error.message}`)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const actions = useMemo(() => ({
    signUp: async ({ name, email, password }) => {
      // When Supabase is not configured (e.g. packaged desktop app), use a
      // local-only session so the app still works offline.
      if (!supabase) {
        const user = {
          id: 'usr_' + Math.random().toString(36).slice(2, 10),
          email: email.trim().toLowerCase(),
          user_metadata: { full_name: name },
          password,
          created_at: new Date().toISOString(),
        }
        saveFallbackUser(user)
        const localSession = createLocalSession(user)
        saveFallbackSession(localSession)
        setSession(localSession)
        leaveGuestMode()
        return { user: localSession.user, session: localSession }
      }

      // Supabase is configured — trust the real auth flow. A fallback session
      // with a non-UUID id would break account-data sync (user_id is uuid).
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: redirectUrl(),
        },
      })
      if (error) throw error
      if (data.session) {
        saveFallbackSession(null)
        return data
      }
      // No session returned — email confirmation is required. Return the
      // data so the UI can show the "check your inbox" screen.
      return data
    },
    signIn: async ({ email, password }) => {
      if (!supabase) {
        const users = getFallbackUsers()
        const normalized = email.trim().toLowerCase()
        const localUser = users[normalized]
        if (localUser && localUser.password === password) {
          const localSession = createLocalSession(localUser)
          saveFallbackSession(localSession)
          setSession(localSession)
          leaveGuestMode()
          return { user: localSession.user, session: localSession }
        }
        throw unavailableError()
      }

      // Supabase is configured — trust the real auth flow.
      const normalized = email.trim().toLowerCase()
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password })
      if (error) throw error
      saveFallbackSession(null)
      return data
    },
    signOut: async () => {
      saveFallbackSession(null)
      setSession(null)
      if (!supabase) return
      try {
        await supabase.auth.signOut()
      } catch {
        // Ignore remote signout error
      }
    },
    resetPassword: async (email) => {
      if (!supabase) throw unavailableError()
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() })
        if (error) throw error
      } catch (err) {
        if (/sending|not authorized|rate limit/i.test(err.message)) {
          return // Silent success for reset request
        }
        throw err
      }
    },
    updatePassword: async (password) => {
      if (!supabase) throw unavailableError()
      const current = session?.user
      if (current) {
        const users = getFallbackUsers()
        if (users[current.email?.toLowerCase()]) {
          users[current.email.toLowerCase()].password = password
          saveFallbackUser(users[current.email.toLowerCase()])
        }
      }
      try {
        await supabase.auth.updateUser({ password })
      } catch {
        // Ignore if remote fails
      }
    },
    resendConfirmation: async (email) => {
      if (!supabase) throw unavailableError()
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) throw error
    },
  }), [session])

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
