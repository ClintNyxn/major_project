import { HashRouter, Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import { AppProvider } from './context/AppContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { useAuth } from './context/useAuth.js'
import { useApp } from './context/useApp.js'
import AppLayout from './layouts/AppLayout.jsx'
import Welcome from './pages/Welcome.jsx'
import AuthPage from './pages/AuthPage.jsx'
import ProfileSetup from './pages/ProfileSetup.jsx'
import PreferencesSetup from './pages/PreferencesSetup.jsx'
import IngredientsSetup from './pages/IngredientsSetup.jsx'
import ServingsSetup from './pages/ServingsSetup.jsx'
import Recommendations from './pages/Recommendations.jsx'
import RecipeDetail from './pages/RecipeDetail.jsx'
import Dashboard from './pages/Dashboard.jsx'
import IngredientsPage from './pages/IngredientsPage.jsx'
import PreferencesPage from './pages/PreferencesPage.jsx'
import Favorites from './pages/Favorites.jsx'
import Shopping from './pages/Shopping.jsx'
import Profile from './pages/Profile.jsx'
import Comparison from './pages/Comparison.jsx'
import Help from './pages/Help.jsx'
import ThankYou from './pages/ThankYou.jsx'
import NotFound from './pages/NotFound.jsx'
import LegalPage from './pages/LegalPage.jsx'
import { isGuestMode } from './utils/guestMode.js'
import { hasSupabaseAuthCallback } from './utils/authCallback.js'

const Nearby = lazy(() => import('./pages/Nearby.jsx'))

function RouteMetadata() {
  const { pathname } = useLocation()
  const { recipeById } = useApp()
  const recipeId = pathname.startsWith('/recipe/') ? pathname.split('/')[2] : null
  useEffect(() => {
    const recipe = recipeId ? recipeById[recipeId] : null
    const page = pathname === '/' ? 'Your next meal, figured out'
      : pathname === '/setup/profile' ? 'Your profile'
        : pathname === '/setup/preferences' ? 'Dietary preferences'
          : pathname === '/setup/ingredients' ? 'Available ingredients'
            : pathname === '/setup/servings' ? 'Choose servings'
              : pathname === '/auth/signup' ? 'Create your account'
                : pathname === '/auth/login' ? 'Sign in'
                  : pathname.startsWith('/auth/forgot-password') ? 'Reset your password'
                    : pathname === '/auth/update-password' ? 'Choose a new password'
        : pathname === '/recommendations' ? 'Recipe recommendations'
          : pathname.startsWith('/recipe/') ? recipe?.name || 'Recipe details'
            : pathname.slice(1).replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    document.title = `KhaanaKya? | ${page}`
  }, [pathname, recipeId, recipeById])
  return null
}

function LoadingScreen({ message }) {
  return <main className="account-state-screen" role="status"><span className="nearby-spinner" aria-hidden="true" />{message}</main>
}

function UnknownRoute() {
  const { loading, user, sessionError } = useAuth()
  if (!hasSupabaseAuthCallback(window.location.hash, window.location.search)) return <Navigate to="/404" replace />
  if (loading) return <LoadingScreen message="Finishing your email verification…" />
  if (user) return <Navigate to="/dashboard" replace />
  return <main className="account-state-screen"><section className="account-state-card">
    <p className="eyebrow">EMAIL VERIFICATION</p><h1>We couldn’t finish signing you in.</h1>
    <p className="page-description" role="alert">{sessionError || 'Your email link may have expired or already been used. Try signing in, or request a fresh verification link.'}</p>
    <Link className="button button-primary" to="/auth/login">Continue to sign in <span aria-hidden="true">→</span></Link>
  </section></main>
}

function LandingRoute() {
  const { loading, user } = useAuth()
  if (loading) return <LoadingScreen message="Getting your kitchen ready…" />
  return user ? <Navigate to="/dashboard" replace /> : <Welcome />
}

function AuthOnlyRoute({ children, requireUser = false }) {
  const { loading, user } = useAuth()
  if (loading) return <LoadingScreen message="Checking your sign-in…" />
  if (requireUser) return user ? children : <Navigate to="/auth/login" replace />
  return user ? <Navigate to="/dashboard" replace /> : children
}

function AccountDataError() {
  const { dataError, retryDataLoad } = useApp()
  const { signOut } = useAuth()
  const [error, setError] = useState('')
  async function handleSignOut() {
    setError('')
    try {
      await signOut()
    } catch (signOutError) {
      setError(signOutError.message)
    }
  }
  return <main className="account-state-screen"><section className="account-state-card">
    <p className="eyebrow">ACCOUNT DATA</p><h1>We couldn’t load your planner.</h1>
    <p className="page-description" role="alert">{dataError}</p>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <div className="account-state-actions"><button className="button button-primary" type="button" onClick={retryDataLoad}>Try again</button><button className="button button-outline" type="button" onClick={handleSignOut}>Sign out</button></div>
  </section></main>
}

function AccountDataConflict() {
  const { resolveDataConflict, syncError } = useApp()
  const auth = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function choose(version) {
    setBusy(true)
    setError('')
    try {
      await resolveDataConflict(version)
    } catch (resolveError) {
      setError(resolveError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSignOut() {
    try {
      await auth.signOut()
      navigate('/auth/login', { replace: true })
    } catch (signOutError) {
      setError(signOutError.message)
    }
  }

  return <main className="account-state-screen"><section className="account-state-card">
    <p className="eyebrow">ACCOUNT SYNC</p><h1>Choose which planner to keep.</h1>
    <p className="page-description">This device has changes that haven’t synced, and your account has newer data from another session. Choose one version before continuing.</p>
    {(error || syncError) && <p className="auth-error" role="alert">{error || syncError}</p>}
    <div className="account-state-actions"><button className="button button-outline" type="button" disabled={busy} onClick={() => choose('cloud')}>Use account version</button><button className="button button-primary" type="button" disabled={busy} onClick={() => choose('device')}>Keep this device’s changes</button></div>
    <button className="auth-guest-link" type="button" onClick={handleSignOut} disabled={busy}>Sign out instead</button>
  </section></main>
}

function RequireAccess() {
  const { user, loading } = useAuth()
  const { dataReady, dataError, dataConflict } = useApp()
  const location = useLocation()
  if (loading) return <LoadingScreen message="Checking your sign-in…" />
  if (!user && !isGuestMode()) return <Navigate to="/auth/login" replace state={{ from: { pathname: location.pathname, search: location.search } }} />
  if (user && dataConflict) return <AccountDataConflict />
  if (user && !dataReady) return dataError ? <AccountDataError /> : <LoadingScreen message="Syncing your meal planner…" />
  return <Outlet />
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <HashRouter>
              <RouteMetadata />
              <Routes>
                <Route path="/" element={<LandingRoute />} />
                <Route path="/auth/signup" element={<AuthOnlyRoute><AuthPage mode="signup" /></AuthOnlyRoute>} />
                <Route path="/auth/login" element={<AuthOnlyRoute><AuthPage mode="login" /></AuthOnlyRoute>} />
                <Route path="/auth/forgot-password" element={<AuthOnlyRoute><AuthPage mode="forgot" /></AuthOnlyRoute>} />
                <Route path="/auth/update-password" element={<AuthOnlyRoute requireUser><AuthPage mode="update-password" /></AuthOnlyRoute>} />
                <Route element={<RequireAccess />}>
                  <Route path="/setup/profile" element={<ProfileSetup />} />
                  <Route path="/setup/preferences" element={<PreferencesSetup />} />
                  <Route path="/setup/ingredients" element={<IngredientsSetup />} />
                  <Route path="/setup/servings" element={<ServingsSetup />} />
                  <Route element={<AppLayout />}>
                    <Route path="/recommendations" element={<Recommendations />} />
                    <Route path="/recipe/:recipeId" element={<RecipeDetail />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/ingredients" element={<IngredientsPage />} />
                    <Route path="/preferences" element={<PreferencesPage />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/shopping" element={<Shopping />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/nearby" element={<Suspense fallback={<p className="route-loading" role="status">Loading nearby map…</p>}><Nearby /></Suspense>} />
                    <Route path="/compare" element={<Comparison />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/thank-you" element={<ThankYou />} />
                    <Route path="/privacy" element={<LegalPage />} />
                    <Route path="/terms" element={<LegalPage />} />
                  </Route>
                </Route>
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<UnknownRoute />} />
              </Routes>
            </HashRouter>
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
