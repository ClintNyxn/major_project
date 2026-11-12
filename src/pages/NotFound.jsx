import { Link } from 'react-router-dom'

export default function NotFound() {
  return <main className="not-found"><p className="eyebrow">404 · THIS WAY, PLEASE</p><h1>Looks like this recipe<br /><em>isn't on the menu.</em></h1><p>The page you were looking for isn't here. Your kitchen is still right where you left it.</p><Link className="button button-primary" to="/dashboard">Return to dashboard <span aria-hidden="true">→</span></Link></main>
}
