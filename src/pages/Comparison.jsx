import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { useApp } from '../context/useApp.js'
import { getAvailability, getRecipeCosts } from '../utils/recipeMath.js'
import fallbackImage from '../assets/dashboard-meal.svg'
import { ScaleIcon, CheckIcon } from '../components/Icons.jsx'

const metrics = [
  'Calories per serving',
  'Protein',
  'Carbohydrates',
  'Fat',
  'Fibre',
  'Estimated recipe cost',
  'Preparation time',
  'Ingredient match',
]

function metricNumber(label, recipe, app) {
  if (label === 'Calories per serving') return recipe.nutrition.calories
  if (label === 'Protein') return recipe.nutrition.protein
  if (label === 'Carbohydrates') return recipe.nutrition.carbs
  if (label === 'Fat') return recipe.nutrition.fat
  if (label === 'Fibre') return recipe.nutrition.fibre
  if (label === 'Estimated recipe cost')
    return getRecipeCosts(recipe, app.servings, app.ingredientById).total
  if (label === 'Preparation time') return recipe.prepTime + recipe.cookTime
  return getAvailability(
    recipe,
    app.ingredients,
    app.pantryAlwaysAvailable ? ['oil', 'salt', 'spices'] : [],
    app.ingredientById
  ).match
}

function metricValue(label, recipe, app) {
  const number = metricNumber(label, recipe, app)
  if (label === 'Calories per serving') return `${number} kcal`
  if (['Protein', 'Carbohydrates', 'Fat', 'Fibre'].includes(label)) return `${number}g`
  if (label === 'Estimated recipe cost') return `₹${Math.round(number)}`
  if (label === 'Preparation time') return `${number} mins`
  return `${number}%`
}

function isRelevantBest(label, recipe, candidates, app) {
  if (candidates.length < 2) return false
  const values = candidates.map((item) => metricNumber(label, item, app))
  const current = metricNumber(label, recipe, app)
  const goals = app.preferences.healthGoals

  const lowerIsBetter =
    label === 'Estimated recipe cost' ||
    label === 'Preparation time' ||
    (label === 'Calories per serving' &&
      goals.some((goal) => ['Low Calorie', 'Weight Management'].includes(goal))) ||
    (label === 'Carbohydrates' && goals.includes('Low Carb'))

  const higherIsBetter =
    (label === 'Protein' &&
      goals.some((goal) => ['High Protein', 'Muscle Building'].includes(goal))) ||
    (label === 'Fibre' && goals.includes('High Fibre')) ||
    label === 'Ingredient match'

  if (!lowerIsBetter && !higherIsBetter) return false
  const target = lowerIsBetter ? Math.min(...values) : Math.max(...values)
  return current === target
}

export default function Comparison() {
  const app = useApp()
  const navigate = useNavigate()
  const { compared, toggleCompare } = app

  const selected = compared.map((id) => app.recipeById[id]).filter(Boolean)

  if (app.catalogStatus === 'loading') {
    return (
      <main className="loading-view" role="status">
        <div className="nearby-spinner" aria-hidden="true" />
        <p>Loading recipe comparisons…</p>
      </main>
    )
  }

  if (app.catalogStatus === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div>
          <strong>Recipe comparisons are unavailable.</strong>
          <p>{app.catalogError}</p>
        </div>
        <button className="button button-outline" type="button" onClick={app.retryCatalog}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="comparison-page">
      <PageHeader
        eyebrow="SIDE-BY-SIDE NUTRITION"
        title="Compare recipe metrics."
        description="Weigh calories, protein, pantry compatibility, and costs to make the best meal choice for your day."
        action={
          <div className="header-action-group">
            <span className="sample-label">CALCULATED FOR {app.servings} SERVINGS</span>
          </div>
        }
      />

      {!selected.length ? (
        <div className="empty-state">
          <ScaleIcon className="empty-icon" />
          <p className="eyebrow">NO RECIPES SELECTED</p>
          <h2>Choose up to 3 recipes to compare.</h2>
          <p>
            Tap "Compare" on any recipe card on the recommendations or dashboard pages to inspect
            macronutrients, cooking times, and costs side-by-side.
          </p>
          <Link className="button button-primary" to="/recommendations">
            Browse recommendations →
          </Link>
        </div>
      ) : (
        <div className="comparison-wrap card-surface">
          <div className="comparison-header-strip">
            <span className="summary-label">
              Comparing <strong>{selected.length} of 3</strong> recipes · Scaling for{' '}
              <strong>{app.servings} people</strong>
            </span>
            {selected.length < 3 && (
              <Link to="/recommendations" className="button button-small button-outline">
                + Add another recipe
              </Link>
            )}
          </div>

          <div className="comparison-scroll">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="metric-header-cell">Recipe</th>
                  {selected.map((recipe) => (
                    <th key={recipe.id} className="recipe-compare-header">
                      <div className="comparison-recipe-card">
                        <img
                          src={recipe.image || fallbackImage}
                          alt={recipe.name}
                          className="compare-recipe-thumb"
                          onError={(e) => {
                            e.currentTarget.src = fallbackImage
                          }}
                        />
                        <div className="compare-recipe-meta">
                          <strong>{recipe.name}</strong>
                          <small>{recipe.cuisine} · {recipe.category}</small>
                        </div>
                        <div className="compare-recipe-actions">
                          <button
                            type="button"
                            className="button button-small button-primary"
                            onClick={() => navigate(`/recipe/${recipe.id}`)}
                          >
                            View recipe →
                          </button>
                          <button
                            type="button"
                            className="remove-compare-btn"
                            onClick={() => toggleCompare(recipe.id)}
                            aria-label={`Remove ${recipe.name}`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((label) => (
                  <tr key={label}>
                    <th className="metric-label-cell">{label}</th>
                    {selected.map((recipe) => {
                      const current = metricValue(label, recipe, app)
                      const best = isRelevantBest(label, recipe, selected, app)
                      return (
                        <td
                          className={`metric-value-cell ${best ? 'comparison-best' : ''}`}
                          key={recipe.id}
                        >
                          <div className="metric-cell-inner">
                            <span className="metric-number-display">{current}</span>
                            {best && (
                              <span className="best-badge">
                                <CheckIcon /> Top fit
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="comparison-footer-notes">
            <p className="safety-note">
              Highlighting reflects relative comparisons across chosen recipes and your personal
              health goals. Recipe costs and quantities are scaled to your current household servings
              ({app.servings}).
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
