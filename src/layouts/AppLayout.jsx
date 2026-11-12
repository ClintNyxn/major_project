import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../context/useApp.js'

const navigation = [
  ['Dashboard', '/dashboard', '01'],
  ['Find my food', '/recommendations', '02'],
  ['My ingredients', '/ingredients', '03'],
  ['My preferences', '/preferences', '04'],
  ['Saved recipes', '/favorites', '05'],
  ['Shopping list', '/shopping', '06'],
  ['My profile', '/profile', '07'],
  ['Help & support', '/help', '08'],
]

export default function AppLayout() {
  const { profile } = useApp()
  const location = useLocation()
  const active = navigation.find(([, path]) => location.pathname.startsWith(path))
  return <div className="app-shell">
    <aside className="sidebar">
      <Link to="/dashboard" className="brand-lockup"><span className="brand-mark">K</span><span>KhaanaKya<span className="brand-question">?</span></span></Link>
      <div className="sidebar-caption">YOUR KITCHEN, CONSIDERED</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigation.map(([label, path, number]) => <NavLink key={path} to={path} className={({ isActive }) => `nav-item ${isActive || (path === '/recommendations' && location.pathname.startsWith('/recipe/')) ? 'active' : ''}`}><span className="nav-number">{number}</span><span>{label}</span></NavLink>)}
      </nav>
      <div className="sidebar-bottom"><span className="sidebar-avatar">{profile.name?.trim().charAt(0).toUpperCase() || 'K'}</span><div><strong>{profile.name || 'Your kitchen'}</strong><small>Personal meal planner</small></div></div>
    </aside>
    <div className="main-column">
      <header className="app-topbar">
        <div className="topbar-context"><span className="status-dot" />Prototype workspace <span className="topbar-divider">/</span>{active?.[0] || 'Your meal plan'}</div>
        <div className="topbar-right"><span className="sample-label">SAMPLE PRICES</span><span className="avatar-small">{profile.name?.trim().charAt(0).toUpperCase() || 'K'}</span></div>
      </header>
      <main className="page-content"><Outlet /></main>
      <footer className="app-footer"><span>KhaanaKya? · A thoughtful way to plan the next meal.</span><span><Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link> · Sample data, not medical advice</span></footer>
    </div>
  </div>
}
