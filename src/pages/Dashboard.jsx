import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import RecipeCard from '../components/RecipeCard.jsx'
import { useApp } from '../context/useApp.js'
import { ingredientById } from '../data/ingredients.js'
import { recipeById } from '../data/recipes.js'
import dashboardMeal from '../assets/dashboard-meal.svg'

export default function Dashboard() {
  const app = useApp()
  const recentlyViewed = app.viewed.map((id) => recipeById[id]).filter(Boolean).slice(0, 3)
  const recentRecommendations = app.recentRecommendations.map((id) => recipeById[id]).filter(Boolean).slice(0, 3)
  const saved = app.favorites.map((id) => recipeById[id]).filter(Boolean).slice(0, 2)
  return <div>
    <PageHeader eyebrow="YOUR KITCHEN, AT A GLANCE" title={`Good to see you${app.profile.name ? `, ${app.profile.name.split(' ')[0]}` : ''}.`} description="A little less wondering what to cook. A little more making something good." action={<Link className="button button-primary" to="/setup/ingredients">Find recipes <span aria-hidden="true">→</span></Link>} />
    <section className="dashboard-spotlight">
      <div className="spotlight-copy"><p className="eyebrow">THE FIRST STEP TO YOUR NEXT MEAL</p><h2>Start with what's<br />already in your kitchen.</h2><p>Choose your ingredients and we'll find ideas that make sense for your table.</p><Link className="button button-light" to="/setup/ingredients">Find my food <span aria-hidden="true">→</span></Link></div>
      <img src={dashboardMeal} alt="Illustration of vegetable pulao with peas, carrots and fresh herbs" />
    </section>
    <div className="dashboard-split">
      <section className="dashboard-section"><div className="section-title-row"><div><p className="eyebrow">WHAT'S IN YOUR KITCHEN?</p><h2>Your ingredients</h2></div><Link to="/ingredients" className="text-link">Edit list →</Link></div>
        <div className="ingredient-summary-list">{app.ingredients.length ? app.ingredients.slice(0, 12).map((item) => <span className="ingredient-token" key={item.id}>{item.name || ingredientById[item.id]?.name || item.id}</span>) : <p className="muted">Add a few ingredients to get more relevant recipe matches.</p>}{app.ingredients.length > 12 && <span className="ingredient-token">+{app.ingredients.length - 12} more</span>}</div>
        <div className="dashboard-inline-note">{app.pantryAlwaysAvailable ? 'Pantry basics are counted as available.' : 'Pantry basics are not included in your ingredient matches.'}</div>
      </section>
      <section className="dashboard-section"><div className="section-title-row"><div><p className="eyebrow">YOUR STARTING POINT</p><h2>Meal preferences</h2></div><Link to="/preferences" className="text-link">Edit →</Link></div>
        <dl className="preference-summary"><div><dt>Food preference</dt><dd>{app.preferences.foodType}</dd></div><div><dt>Health goals</dt><dd>{app.preferences.healthGoals.length ? app.preferences.healthGoals.slice(0, 2).join(', ') : 'Not set'}</dd></div><div><dt>Budget</dt><dd>₹{app.preferences.budget} · {app.preferences.budgetScope}</dd></div><div><dt>Allergies</dt><dd>{app.preferences.allergies.length ? app.preferences.allergies.join(', ') : 'None listed'}</dd></div></dl>
      </section>
    </div>
    {recentlyViewed.length > 0 && <section className="dashboard-section"><div className="section-title-row"><div><p className="eyebrow">PICK UP WHERE YOU LEFT OFF</p><h2>Recently viewed</h2></div><Link to="/recommendations" className="text-link">All recipes →</Link></div><div className="recipe-grid">{recentlyViewed.map((item) => <RecipeCard key={item.id} recipe={item} showActions={false} />)}</div></section>}
    {recentRecommendations.length > 0 && <section className="dashboard-section"><div className="section-title-row"><div><p className="eyebrow">YOUR LAST MEAL SEARCH</p><h2>Recently recommended</h2></div><Link to="/recommendations" className="text-link">Refresh ideas →</Link></div><div className="recipe-grid">{recentRecommendations.map((item) => <RecipeCard key={item.id} recipe={item} showActions={false} />)}</div></section>}
    {saved.length > 0 && <section className="dashboard-section"><div className="section-title-row"><div><p className="eyebrow">KEEP CLOSE</p><h2>Saved recipes</h2></div><Link to="/favorites" className="text-link">See all →</Link></div><div className="recipe-grid">{saved.map((item) => <RecipeCard key={item.id} recipe={item} showActions={false} />)}</div></section>}
    <section className="dashboard-section"><div className="section-title-row"><div><p className="eyebrow">IDEAS FOR THE MOMENT</p><h2>Browse by meal</h2></div></div><div className="category-browse">{['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((category, index) => <Link key={category} to={`/recommendations?category=${category}`}><span>0{index + 1}</span><strong>{category}</strong><span>Find a recipe →</span></Link>)}</div></section>
    <div className="dashboard-links"><Link to="/shopping"><span>01</span><strong>Shopping list</strong><small>{app.shopping.filter((item) => !item.purchased).length} items to pick up</small>↗</Link><Link to="/compare"><span>02</span><strong>Compare nutrition</strong><small>{app.compared.length} recipes selected</small>↗</Link><Link to="/help"><span>03</span><strong>How it works</strong><small>Our estimates and recipe matching</small>↗</Link></div>
  </div>
}
