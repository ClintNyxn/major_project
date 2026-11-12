import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ServingSelector from '../components/ServingSelector.jsx'
import { recipeById } from '../data/recipes.js'
import { ingredientById } from '../data/ingredients.js'
import { useApp } from '../context/useApp.js'
import { getAvailability, getRecipeCosts } from '../utils/recipeMath.js'

const nutrients = [
  ['Calories', 'calories', 'kcal', 700],
  ['Protein', 'protein', 'g', 50],
  ['Carbohydrates', 'carbs', 'g', 100],
  ['Fat', 'fat', 'g', 70],
  ['Fibre', 'fibre', 'g', 30],
]

export default function RecipeDetail() {
  const { recipeId } = useParams()
  const navigate = useNavigate()
  const { servings: defaultServings, setServings: setDefaultServings, ingredients, pantryAlwaysAvailable, markViewed, addShopping, toggleFavorite, favorites, toggleCompare } = useApp()
  const recipe = recipeById[recipeId]
  const [servings, setServings] = useState(defaultServings)
  const costs = useMemo(() => recipe ? getRecipeCosts(recipe, servings) : null, [recipe, servings])
  const availability = recipe ? getAvailability(recipe, ingredients, pantryAlwaysAvailable ? ['oil', 'salt', 'spices'] : []) : null

  useEffect(() => {
    if (recipe) markViewed(recipe.id)
  }, [recipe, markViewed])

  if (!recipe) return <div className="empty-state"><h1>Recipe not found</h1><Link className="button button-primary" to="/recommendations">Back to recipes</Link></div>

  const availableIds = new Set(availability.available.map((item) => item.ingredientId))
  const missingIds = new Set(availability.missing.map((item) => item.ingredientId))
  const availableCost = costs.lineItems.filter((item) => availableIds.has(item.ingredientId)).reduce((sum, item) => sum + item.cost, 0)
  const missingCost = costs.lineItems.filter((item) => missingIds.has(item.ingredientId)).reduce((sum, item) => sum + item.cost, 0)
  const imageLabel = `${recipe.name}, a prepared ${recipe.cuisine} dish`

  function addMissingIngredients() {
    const items = costs.lineItems.filter((item) => missingIds.has(item.ingredientId)).map((item) => ({
      ...item, recipeId: recipe.id, recipeName: recipe.name,
    }))
    addShopping(items)
    navigate('/thank-you', { state: { recipeId: recipe.id } })
  }

  function changeServings(value) {
    setServings(value)
    setDefaultServings(value)
  }

  function saveRecipe() {
    const alreadySaved = favorites.includes(recipe.id)
    toggleFavorite(recipe.id)
    if (!alreadySaved) navigate('/thank-you', { state: { recipeId: recipe.id, saved: true } })
  }

  return <article className="recipe-detail">
    <div className="detail-back-row"><Link to="/recommendations" className="back-link">← All recommendations</Link><span className="sample-label">SAMPLE RECIPE · ESTIMATES</span></div>
    <div className="detail-hero"><img src={recipe.image} alt={imageLabel} /><div className="detail-hero-overlay"><p className="eyebrow">{recipe.cuisine.toUpperCase()} · {recipe.category.toUpperCase()}</p><h1>{recipe.name}</h1><p>{recipe.description}</p><div className="detail-quick-meta"><span>{recipe.prepTime + recipe.cookTime} min</span><span>{recipe.difficulty}</span><span>{servings} servings</span><span>{availability.match}% ingredient match</span></div></div></div>
    <div className="detail-grid">
      <div className="detail-main">
        <section className="detail-section">
          <div className="section-title-row"><div><p className="eyebrow">WHAT YOU'LL NEED</p><h2>Ingredients in your kitchen</h2></div><ServingSelector compact value={servings} onChange={changeServings} /></div>
          <p className="tiny-note">Quantities and estimated costs recalculate for {servings} servings. Recipe amounts are sample estimates.</p>
          <div className="availability-grid">
            <div className="availability-column available-column"><h3>Available <span>{availability.available.length}</span></h3>{availability.available.map((item) => <div className="availability-item" key={item.ingredientId}><span>{ingredientById[item.ingredientId]?.name || item.ingredientId}</span><span>{item.quantity * servings / recipe.servings} {item.unit}</span></div>)}{!availability.available.length && <p className="muted">No required ingredients selected yet.</p>}</div>
            <div className="availability-column missing-column"><h3>To pick up <span>{availability.missing.length}</span></h3>{availability.missing.map((item) => <div className="availability-item" key={item.ingredientId}><span>{ingredientById[item.ingredientId]?.name || item.ingredientId}</span><span>{item.quantity * servings / recipe.servings} {item.unit}</span></div>)}{!availability.missing.length && <p className="muted">You have everything for this recipe.</p>}</div>
          </div>
        </section>
        <section className="detail-section">
          <div className="section-title-row"><div><p className="eyebrow">A TRANSPARENT ESTIMATE</p><h2>Ingredient cost breakdown</h2></div><span className="sample-label">SAMPLE PRICES</span></div>
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Ingredient</th><th>Quantity</th><th>Sample unit price</th><th>Estimated cost</th><th>Status</th></tr></thead><tbody>
            {costs.lineItems.map((item) => {
              const info = ingredientById[item.ingredientId]
              const isAvailable = availableIds.has(item.ingredientId)
              const unitLabel = info?.priceUnit === 'kg' ? 'kg' : info?.priceUnit === 'litre' ? 'litre' : info?.priceUnit || item.unit
              return <tr key={item.ingredientId}><td>{item.name}</td><td>{item.quantity} {item.unit}</td><td>₹{info?.price || 0}/{unitLabel}</td><td>₹{item.cost.toFixed(2)}</td><td><span className={`status-tag ${isAvailable ? 'status-available' : 'status-missing'}`}>{isAvailable ? 'In kitchen' : 'To buy'}</span></td></tr>
            })}
          </tbody></table></div>
          <div className="cost-summary"><div><span>Already in your kitchen</span><strong>₹{availableCost.toFixed(2)}</strong></div><div><span>Estimated missing items</span><strong>₹{missingCost.toFixed(2)}</strong></div><div className="cost-total"><span>Total recipe estimate</span><strong>₹{costs.total}</strong><small>₹{costs.perPerson} per serving · Prices are illustrative, not live store prices.</small></div></div>
        </section>
        <section className="detail-section instructions-section"><p className="eyebrow">FROM PREP TO PLATE</p><h2>How to make it</h2><ol className="instruction-list">{recipe.instructions.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol></section>
      </div>
      <aside className="detail-aside">
        <section className="nutrition-panel"><p className="eyebrow">NUTRITION ESTIMATE</p><h2>Per serving</h2><p className="tiny-note">Approximate values, not medical advice.</p>
          {nutrients.map(([label, key, unit, max]) => <div className="nutrient-row" key={key}><div><span>{label}</span><strong>{recipe.nutrition[key]} {unit}</strong></div><div className="nutrient-track"><span style={{ width: `${Math.min(100, (recipe.nutrition[key] / max) * 100)}%` }} /></div></div>)}
        </section>
        <section className="recipe-actions-panel"><p className="eyebrow">MAKE A PLAN</p><button className="button button-primary button-wide" onClick={addMissingIngredients}>Add missing items to list</button><button className="button button-outline button-wide" onClick={saveRecipe}>{favorites.includes(recipe.id) ? 'Remove from saved' : 'Save this recipe'}</button><button className="button button-text button-wide" onClick={() => { toggleCompare(recipe.id); navigate('/compare') }}>Compare nutrition</button></section>
      </aside>
    </div>
  </article>
}
