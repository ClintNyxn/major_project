import { Link } from 'react-router-dom'
import { useApp } from '../context/useApp.js'
import { getRecipeCosts } from '../utils/recipeMath.js'
import { getAvailability } from '../utils/recipeMath.js'
import { ingredientById } from '../data/ingredients.js'

export default function RecipeCard({ recipe, showActions = true }) {
  const { favorites, toggleFavorite, compared, toggleCompare, servings, ingredients, pantryAlwaysAvailable } = useApp()
  const saved = favorites.includes(recipe.id)
  const selected = compared.includes(recipe.id)
  const availability = recipe.available ? { available: recipe.available, missing: recipe.missing || [] } : getAvailability(recipe, ingredients, pantryAlwaysAvailable ? ['oil', 'salt', 'spices'] : [])
  const match = recipe.match ?? availability.match
  const costs = recipe.costs || getRecipeCosts(recipe, servings)
  const cost = costs.total
  const missingNames = availability.missing.map((item) => ingredientById[item.ingredientId]?.name || item.ingredientId)

  return (
    <article className="recipe-card">
      <Link to={`/recipe/${recipe.id}`} className="recipe-image-link" aria-label={`View ${recipe.name}`}>
        <img className="recipe-image" src={recipe.image} alt={recipe.name} loading="lazy" />
        <span className="image-label">{match}% ingredient match</span>
      </Link>
      <div className="recipe-card-body">
        <div className="recipe-card-topline">
          <span className="eyebrow">{recipe.cuisine} · {recipe.category}</span>
          {showActions && <button className={`save-button ${saved ? 'is-saved' : ''}`} onClick={() => toggleFavorite(recipe.id)} aria-label={saved ? 'Remove from saved recipes' : 'Save recipe'}>{saved ? 'Saved' : 'Save'}</button>}
        </div>
        <Link to={`/recipe/${recipe.id}`} className="recipe-title-link"><h3>{recipe.name}</h3></Link>
        <p className="recipe-reason">{recipe.reason || recipe.description}</p>
        <p className="ingredients-summary">{availability.available.length} of {recipe.ingredients.length} ingredients in your kitchen{missingNames.length ? ` · Missing ${missingNames.join(', ')}` : ' · Nothing missing'}</p>
        <div className="recipe-meta">
          <span>{recipe.prepTime + recipe.cookTime} min</span>
          <span>{recipe.difficulty}</span>
          <span>{recipe.servings} servings</span>
          <span>{recipe.nutrition.calories} kcal</span>
        </div>
        <div className="recipe-card-bottom">
          <div><strong>₹{Math.round(cost)}</strong><small> total · ₹{Math.round(costs.perPerson)} / person</small><span className="protein-note">{recipe.nutrition.protein}g protein / serving</span></div>
          <div className="recipe-card-controls"><Link to={`/recipe/${recipe.id}`} className="recipe-view-link">View recipe →</Link>{showActions && <button className={`compare-toggle ${selected ? 'selected' : ''}`} onClick={() => toggleCompare(recipe.id)} disabled={compared.length >= 3 && !selected}>{selected ? 'Comparing' : 'Compare'}</button>}</div>
        </div>
        {(recipe.tags?.length > 0 || recipe.underBudget) && <div className="recipe-tags">{recipe.underBudget && <span>Under budget</span>}{recipe.tags?.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div>}
      </div>
    </article>
  )
}
