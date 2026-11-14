import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { useApp } from '../context/useApp.js'
import { useAuth } from '../context/useAuth.js'
import { useTheme } from '../context/useTheme.js'
import {
  DashboardIcon,
  ChefHatIcon,
  PantryIcon,
  PreferencesIcon,
  HeartIcon,
  ShoppingBagIcon,
  UserIcon,
  MapPinIcon,
  HelpIcon,
  SearchIcon,
  SunIcon,
  MoonIcon,
  MenuIcon,
  ScaleIcon,
} from '../components/Icons.jsx'

export default function AppLayout() {
  const { profile, ingredients, favorites, shopping, compared, servings, setServings } = useApp()
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const pendingShopping = shopping.filter((item) => !item.purchased).length
  const savedCount = favorites.length
  const ingredientsCount = ingredients.length
  const comparedCount = compared.length

  const navigation = [
    { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon, number: '01' },
    { label: 'Find my food', path: '/recommendations', icon: ChefHatIcon, number: '02' },
    { label: 'My ingredients', path: '/ingredients', icon: PantryIcon, number: '03', badge: ingredientsCount },
    { label: 'My preferences', path: '/preferences', icon: PreferencesIcon, number: '04' },
    { label: 'Saved recipes', path: '/favorites', icon: HeartIcon, number: '05', badge: savedCount },
    { label: 'Shopping list', path: '/shopping', icon: ShoppingBagIcon, number: '06', badge: pendingShopping },
    { label: 'Compare food', path: '/compare', icon: ScaleIcon, number: '07', badge: comparedCount },
    { label: 'Nearby places', path: '/nearby', icon: MapPinIcon, number: '08' },
    { label: 'My profile', path: '/profile', icon: UserIcon, number: '09' },
    { label: 'Help & support', path: '/help', icon: HelpIcon, number: '10' },
  ]

  const activeItem = navigation.find(({ path }) => location.pathname.startsWith(path))

  function handleSearchSubmit(event) {
    event.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    navigate(`/recommendations?q=${encodeURIComponent(q)}`)
    setSearchQuery('')
  }

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/dashboard" className="brand-lockup" title="KhaanaKya? - Dashboard" aria-label="KhaanaKya? Dashboard">
            <Logo size={38} className="sidebar-brand-logo" alt="KhaanaKya" />
            <span className="brand-text">KhaanaKya<span className="brand-question">?</span></span>
          </Link>
          <span className="app-badge">Beta</span>
        </div>

        <div className="sidebar-caption">YOUR KITCHEN COMPANION</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ label, path, icon: Icon, badge }) => (
            <NavLink
              key={path}
              to={path}
              title={label}
              aria-label={label}
              className={({ isActive }) =>
                `nav-item ${isActive || (path === '/recommendations' && location.pathname.startsWith('/recipe/')) ? 'active' : ''}`
              }
            >
              <span className="nav-icon-wrap">
                <Icon className="nav-icon" />
              </span>
              <span className="nav-label">{label}</span>
              {Boolean(badge) && <span className="nav-badge">{badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link to="/profile" className="user-profile-pill" title={profile.name ? `${profile.name} (Profile)` : 'My profile'} aria-label="My profile">
            <span className="sidebar-avatar">
              {profile.name?.trim().charAt(0).toUpperCase() || 'K'}
            </span>
            <div className="user-profile-info">
              <strong>{profile.name || 'Your kitchen'}</strong>
              <small>{user?.email ? 'Synced account' : 'Guest workspace'}</small>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-column">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-trigger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <MenuIcon />
            </button>
            <div className="topbar-context">
              <span className="status-dot" aria-hidden="true" />
              <span className="topbar-crumb-prefix">Kitchen</span>
              <span className="topbar-divider">/</span>
              <span className="topbar-current">{activeItem?.label || 'Your meal plan'}</span>
            </div>
          </div>

          <form className="topbar-search-form" onSubmit={handleSearchSubmit}>
            <SearchIcon className="search-input-icon" />
            <input
              type="search"
              className="topbar-search-input"
              placeholder="Search recipes, ingredients, cuisines…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Quick search recipes"
            />
          </form>

          <div className="topbar-right">
            {/* Quick Servings Pill */}
            <div className="servings-quick-stepper" title="Current servings">
              <span className="stepper-label">Servings:</span>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => setServings(Math.max(1, servings - 1))}
                disabled={servings <= 1}
                aria-label="Decrease servings"
              >
                −
              </button>
              <span className="stepper-value">{servings}</span>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => setServings(Math.min(20, servings + 1))}
                disabled={servings >= 20}
                aria-label="Increase servings"
              >
                +
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* User Avatar */}
            <Link to="/profile" className="avatar-small" title={profile.name || user?.email || 'Profile'}>
              {profile.name?.trim().charAt(0).toUpperCase() || 'K'}
            </Link>
          </div>
        </header>

        {user && <SyncNotice />}

        <main className="page-content">
          <Outlet />
        </main>

        <footer className="app-footer">
          <div className="footer-left">
            <span className="footer-brand">KhaanaKya?</span>
            <span>Personalized recipe intelligence for your kitchen pantry.</span>
          </div>
          <div className="footer-links">
            <Link to="/privacy">Privacy</Link>
            <span>·</span>
            <Link to="/terms">Terms</Link>
            <span>·</span>
            <Link to="/help">Help</Link>
            <span>·</span>
            <span className="footer-note">Sample prices · Not medical advice</span>
          </div>
        </footer>
      </div>

      {/* Mobile Drawer Backdrop and Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <Link to="/dashboard" className="brand-lockup" onClick={() => setMobileMenuOpen(false)}>
                <Logo size={36} alt="KhaanaKya" />
                <span>KhaanaKya?</span>
              </Link>
              <button
                type="button"
                className="mobile-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <nav className="mobile-drawer-nav">
              {navigation.map(({ label, path, icon: Icon, badge }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="nav-icon" />
                  <span>{label}</span>
                  {Boolean(badge) && <span className="nav-badge">{badge}</span>}
                </NavLink>
              ))}
            </nav>
            <div className="mobile-drawer-footer">
              <div className="mobile-drawer-user">
                <span className="sidebar-avatar">{profile.name?.trim().charAt(0).toUpperCase() || 'K'}</span>
                <div>
                  <strong>{profile.name || 'Your kitchen'}</strong>
                  <small>{user?.email || 'Guest mode'}</small>
                </div>
              </div>
              <button type="button" className="theme-toggle-btn" onClick={toggleTheme}>
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Quick mobile navigation">
        <NavLink to="/dashboard" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <DashboardIcon />
          <span>Home</span>
        </NavLink>
        <NavLink to="/recommendations" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <ChefHatIcon />
          <span>Find</span>
        </NavLink>
        <NavLink to="/ingredients" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <PantryIcon />
          <span>Pantry</span>
          {ingredientsCount > 0 && <span className="bottom-badge">{ingredientsCount}</span>}
        </NavLink>
        <NavLink to="/shopping" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <ShoppingBagIcon />
          <span>Shopping</span>
          {pendingShopping > 0 && <span className="bottom-badge">{pendingShopping}</span>}
        </NavLink>
        <button
          type="button"
          className="bottom-nav-item bottom-nav-more"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="More navigation links"
        >
          <MenuIcon />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  )
}

function SyncNotice() {
  const { syncError, syncStatus, retrySync } = useApp()
  if (!syncError && syncStatus !== 'syncing') return null
  return (
    <div className={`sync-notice ${syncError ? 'has-error' : ''}`} role={syncError ? 'alert' : 'status'}>
      <span>{syncError ? syncError : 'Saving your planner to your account…'}</span>
      {syncError && <button type="button" onClick={() => retrySync().catch(() => {})}>Try again</button>}
    </div>
  )
}
