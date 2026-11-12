import { Link, useLocation } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'

export default function LegalPage() {
  const location = useLocation()
  const privacy = location.pathname === '/privacy'
  return <div><PageHeader eyebrow="THE IMPORTANT DETAILS" title={privacy ? 'Privacy, simply.' : 'Terms of use.'} description={privacy ? 'What this local prototype stores, and where.' : 'What to know before using KhaanaKya?'} />
    {privacy ? <section className="legal-copy"><h2>Data on this device</h2><p>Your profile, preferences, selected ingredients, saved recipes and shopping list are stored in this browser's local storage. This prototype does not send that information to a server unless you configure a backend endpoint.</p><h2>External services</h2><p>Food photographs and typefaces may load from Unsplash and Google Fonts. Those providers may receive normal network request data when the application is online. No analytics or advertising integration is enabled.</p><h2>Clear your local data</h2><p>Clear this application's site data in your browser or Electron profile to remove saved prototype data.</p></section>
      : <section className="legal-copy"><h2>Prototype information</h2><p>KhaanaKya? is an academic prototype for ingredient-based meal planning. Recipe instructions, ingredient availability, nutrition values and prices are sample estimates for demonstration.</p><h2>Use your judgement</h2><p>Nutrition estimates are not medical advice. Confirm ingredients and allergen information independently before cooking. Prices do not represent live offers, availability or store quotes.</p><h2>No transactions</h2><p>This application does not sell, order or deliver food. No payment or grocery purchase workflow is connected.</p></section>}
    <div className="page-action-row"><Link className="text-link" to="/dashboard">← Back to dashboard</Link><Link className="text-link" to={privacy ? '/terms' : '/privacy'}>{privacy ? 'Terms of use →' : 'Privacy →'}</Link></div>
  </div>
}
