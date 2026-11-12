import { Link, useLocation } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { useApp } from '../context/useApp.js'

export default function ThankYou() {
  const app = useApp()
  const location = useLocation()
  const saved = location.state?.saved
  const recipe = app.recipeById[location.state?.recipeId]
  const pending = app.shopping.filter((item) => !item.purchased)
  const estimate = pending.reduce((total, item) => total + Number(item.cost || 0), 0)
  return <div><PageHeader eyebrow="A LITTLE PLANNING GOES A LONG WAY" title={saved ? 'Your recipe is saved.' : recipe ? 'Your meal plan is ready.' : 'Your plan is ready.'} description={saved ? 'We kept your recipe in Saved Recipes so you can return to it later.' : 'Your chosen recipe and anything missing from your kitchen, gathered in one place.'} />
    <div className="thankyou-panel"><div className="thankyou-mark">✓</div><div><p className="eyebrow">READY WHEN YOU ARE</p><h2>{recipe?.name || 'A good next meal'}</h2><p>{app.servings} servings · {pending.length} item{pending.length === 1 ? '' : 's'} on your shopping list · estimated ₹{estimate}</p></div></div>
    {pending.length > 0 && <section className="dashboard-section"><div className="section-title-row"><div><p className="eyebrow">WHAT'S MISSING</p><h2>On your list</h2></div><Link className="text-link" to="/shopping">Open shopping list →</Link></div><div className="shopping-preview">{pending.slice(0, 5).map((item) => <div key={item.id}><span>{item.name}</span><span>{item.quantity} {item.unit}</span></div>)}</div></section>}
    <div className="page-action-row"><Link className="button button-primary" to="/recommendations">Find another meal</Link><Link className="button button-outline" to="/dashboard">Back to dashboard</Link></div>
  </div>
}
