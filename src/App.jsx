import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { AppProvider } from './context/AppContext.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import Welcome from './pages/Welcome.jsx'
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
import { recipeById } from './data/recipes.js'

const Nearby = lazy(() => import('./pages/Nearby.jsx'))

function RouteMetadata() {
  const { pathname } = useLocation()
  const recipeId = pathname.startsWith('/recipe/') ? pathname.split('/')[2] : null
  useEffect(() => {
    const recipe = recipeId ? recipeById[recipeId] : null
    const page = pathname === '/' ? 'Your next meal, figured out'
      : pathname === '/setup/profile' ? 'Your profile'
        : pathname === '/setup/preferences' ? 'Dietary preferences'
          : pathname === '/setup/ingredients' ? 'Available ingredients'
            : pathname === '/setup/servings' ? 'Choose servings'
        : pathname === '/recommendations' ? 'Recipe recommendations'
          : pathname.startsWith('/recipe/') ? recipe?.name || 'Recipe details'
            : pathname.slice(1).replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    document.title = `KhaanaKya? | ${page}`
  }, [pathname, recipeId])
  return null
}

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <RouteMetadata />
        <Routes>
          <Route path="/" element={<Welcome />} />
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
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}

export default App
