import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ServingSelector from '../components/ServingSelector.jsx'
import RecipeImage from '../components/RecipeImage.jsx'
import { useApp } from '../context/useApp.js'
import { useToast } from '../context/useToast.js'
import { getAvailability, getRecipeCosts } from '../utils/recipeMath.js'
import { getPhotoCredit } from '../utils/recipeImageFallback.js'
import {
  HeartIcon,
  ShoppingBagIcon,
  ScaleIcon,
  ClockIcon,
  CheckIcon,
  UsersIcon,
} from '../components/Icons.jsx'

const nutrients = [
  ['Calories', 'calories', 'kcal', 700],
  ['Protein', 'protein', 'g', 50],
  ['Carbohydrates', 'carbs', 'g', 100],
  ['Fat', 'fat', 'g', 70],
  ['Fibre', 'fibre', 'g', 30],
  ['Sugar', 'sugar', 'g', 50],
  ['Sodium', 'sodium', 'mg', 2000],
]

export default function RecipeDetail() {
  const { recipeId } = useParams()
  const navigate = useNavigate()
  const app = useApp()
  const { addToast } = useToast()

  const {
    servings: defaultServings,
    setServings: setDefaultServings,
    ingredients,
    pantryAlwaysAvailable,
    markViewed,
    addShopping,
    toggleFavorite,
    favorites,
    toggleCompare,
    compared,
  } = app

  const recipe = app.recipeById[recipeId]
  const [servings, setServings] = useState(defaultServings)
  const [cookMode, setCookMode] = useState(false)
  const [completedSteps, setCompletedSteps] = useState([])
  const [resolvedHeroUrl, setResolvedHeroUrl] = useState('')

  const photoCredit = useMemo(() => {
    return getPhotoCredit(resolvedHeroUrl || recipe?.image_url || recipe?.image)
  }, [resolvedHeroUrl, recipe?.image_url, recipe?.image])

  const costs = useMemo(
    () => (recipe ? getRecipeCosts(recipe, servings, app.ingredientById) : null),
    [recipe, servings, app.ingredientById]
  )

  const availability = useMemo(
    () =>
      recipe
        ? getAvailability(
            recipe,
            ingredients,
            pantryAlwaysAvailable ? ['oil', 'salt', 'spices'] : [],
            app.ingredientById
          )
        : null,
    [recipe, ingredients, pantryAlwaysAvailable, app.ingredientById]
  )

  useEffect(() => {
    if (recipe) markViewed(recipe.id)
  }, [recipe, markViewed])

  if (app.catalogStatus === 'loading') {
    return (
      <main className="loading-view" role="status">
        <div className="nearby-spinner" aria-hidden="true" />
        <p>Loading recipe details…</p>
      </main>
    )
  }

  if (app.catalogStatus === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div>
          <strong>Recipe details are unavailable.</strong>
          <p>{app.catalogError}</p>
        </div>
        <button className="button button-outline" type="button" onClick={app.retryCatalog}>
          Try again
        </button>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="empty-state">
        <h1>Recipe not found</h1>
        <p>The recipe you are looking for does not exist in our catalog.</p>
        <Link className="button button-primary" to="/recommendations">
          Back to recommendations
        </Link>
      </div>
    )
  }

  const availableIds = new Set(availability.available.map((item) => item.ingredientId))
  const missingIds = new Set(availability.missing.map((item) => item.ingredientId))
  const availableCost = costs.lineItems
    .filter((item) => availableIds.has(item.ingredientId))
    .reduce((sum, item) => sum + item.cost, 0)
  const missingCost = costs.lineItems
    .filter((item) => missingIds.has(item.ingredientId))
    .reduce((sum, item) => sum + item.cost, 0)

  const isSaved = favorites.includes(recipe.id)
  const isComparing = compared.includes(recipe.id)

  function handleAddMissing() {
    if (!missingIds.size) {
      addToast({
        message: 'You already have all the ingredients in your kitchen!',
        type: 'info',
      })
      return
    }

    const items = costs.lineItems
      .filter((item) => missingIds.has(item.ingredientId))
      .map((item) => ({
        ...item,
        recipeId: recipe.id,
        recipeName: recipe.name,
      }))

    addShopping(items)
    addToast({
      message: `Added ${items.length} missing ingredient${items.length > 1 ? 's' : ''} to your shopping list.`,
      type: 'success',
      action: {
        label: 'View list →',
        onClick: () => navigate('/shopping'),
      },
    })
  }

  function handleToggleFavorite() {
    toggleFavorite(recipe.id)
    if (!isSaved) {
      addToast({
        message: `Saved "${recipe.name}" to your cookbook!`,
        type: 'success',
        action: {
          label: 'View saved →',
          onClick: () => navigate('/favorites'),
        },
      })
    } else {
      addToast({
        message: `Removed "${recipe.name}" from favorites.`,
        type: 'info',
      })
    }
  }

  function changeServings(val) {
    setServings(val)
    setDefaultServings(val)
  }

  function toggleStep(idx) {
    setCompletedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    )
  }

  const stepProgress = Math.round((completedSteps.length / recipe.instructions.length) * 100)

  return (
    <article className={`recipe-detail ${cookMode ? 'cook-mode-active' : ''}`}>
      {/* Top back navigation & badges */}
      <div className="detail-back-row">
        <Link to="/recommendations" className="back-link">
          ← All recommendations
        </Link>
        <div className="detail-top-tags">
          <span className="sample-label">VERIFIED KITCHEN RECIPE</span>
          <button
            type="button"
            className={`cook-mode-toggle-btn ${cookMode ? 'active' : ''}`}
            onClick={() => setCookMode(!cookMode)}
          >
            🍳 {cookMode ? 'Exit Cook Mode' : 'Enter Step-by-Step Cook Mode'}
          </button>
        </div>
      </div>

      {/* Hero Header Presentation */}
      <div className="detail-hero">
        <RecipeImage
          recipe={recipe}
          className="detail-hero-img"
          onResolvedUrl={setResolvedHeroUrl}
        />
        {photoCredit && (
          <span className="hero-photo-credit">
            Photo: {photoCredit}
          </span>
        )}
        <div className="detail-hero-overlay">
          <div className="detail-hero-badges">
            <span className="hero-pill">{recipe.cuisine}</span>
            <span className="hero-pill">{recipe.category}</span>
            {recipe.foodType && (
              <span className={`hero-pill diet-hero-${recipe.foodType}`}>
                {recipe.foodType}
              </span>
            )}
          </div>

          <h1>{recipe.name}</h1>
          <p className="detail-hero-desc">{recipe.description}</p>

          <div className="detail-quick-meta">
            <span>
              <ClockIcon /> {recipe.prepTime + recipe.cookTime} mins total
            </span>
            <span>🔥 {recipe.nutrition.calories} kcal/serv</span>
            <span>
              <UsersIcon /> {servings} {servings === 1 ? 'serving' : 'servings'}
            </span>
            <span className="match-hero-pill">
              🎯 {availability.match}% pantry match
            </span>
            <span>Difficulty: {recipe.difficulty}</span>
          </div>
        </div>
      </div>

      {/* Cook Mode Banner (if active) */}
      {cookMode && (
        <aside className="cook-mode-banner" aria-label="Cook mode progress">
          <div className="cook-progress-info">
            <strong>🍳 Cook Mode Active</strong>
            <span>
              {completedSteps.length} of {recipe.instructions.length} steps finished ({stepProgress}%)
            </span>
          </div>
          <div className="cook-progress-track">
            <div className="cook-progress-bar" style={{ width: `${stepProgress}%` }} />
          </div>
        </aside>
      )}

      {/* Main Grid: Left Main, Right Sticky Aside */}
      <div className="detail-grid">
        <div className="detail-main">
          {/* Section 1: Ingredients & Availability */}
          <section className="detail-section card-surface">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">WHAT YOU'LL NEED</p>
                <h2>Ingredients & pantry match</h2>
              </div>
              <div className="serving-scaler-wrap">
                <span className="scaler-label">Scale recipe:</span>
                <ServingSelector compact value={servings} onChange={changeServings} />
              </div>
            </div>

            <p className="tiny-note">
              Quantities and sample costs are scaled for {servings} {servings === 1 ? 'person' : 'people'}.
            </p>

            <div className="availability-grid">
              {/* Ready in kitchen */}
              <div className="availability-column available-column">
                <div className="avail-col-header">
                  <h3>
                    <CheckIcon /> Ready in your kitchen
                  </h3>
                  <span className="avail-badge-count">{availability.available.length} items</span>
                </div>
                <div className="avail-items-list">
                  {availability.available.map((item) => (
                    <div className="availability-item" key={item.ingredientId}>
                      <span className="avail-item-name">
                        {app.ingredientById[item.ingredientId]?.name || item.ingredientId}
                      </span>
                      <strong className="avail-item-qty">
                        {Math.round(((item.quantity * servings) / recipe.servings) * 10) / 10} {item.unit}
                      </strong>
                    </div>
                  ))}
                  {!availability.available.length && (
                    <p className="muted empty-avail-note">None of these ingredients are in your pantry yet.</p>
                  )}
                </div>
              </div>

              {/* To pick up */}
              <div className="availability-column missing-column">
                <div className="avail-col-header">
                  <h3>
                    <ShoppingBagIcon /> To pick up
                  </h3>
                  <span className="missing-badge-count">{availability.missing.length} items</span>
                </div>
                <div className="avail-items-list">
                  {availability.missing.map((item) => (
                    <div className="availability-item" key={item.ingredientId}>
                      <span className="avail-item-name">
                        {app.ingredientById[item.ingredientId]?.name || item.ingredientId}
                      </span>
                      <strong className="avail-item-qty">
                        {Math.round(((item.quantity * servings) / recipe.servings) * 10) / 10} {item.unit}
                      </strong>
                    </div>
                  ))}
                  {!availability.missing.length && (
                    <div className="all-stocked-banner">
                      <span>✓ You have everything you need in your kitchen!</span>
                    </div>
                  )}
                </div>

                {availability.missing.length > 0 && (
                  <button
                    type="button"
                    className="button button-primary button-small button-wide add-missing-action"
                    onClick={handleAddMissing}
                  >
                    + Add missing {availability.missing.length} items to shopping list
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: Transparent Cost Breakdown */}
          <section className="detail-section card-surface">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">TRANSPARENT ESTIMATE</p>
                <h2>Estimated ingredient costs</h2>
              </div>
              <span className="sample-label">REPRESENTATIVE SAMPLE PRICES</span>
            </div>

            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Scaled quantity</th>
                    <th>Ref price</th>
                    <th>Estimated cost</th>
                    <th>Pantry status</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.lineItems.map((item) => {
                    const info = app.ingredientById[item.ingredientId]
                    const isAvailable = availableIds.has(item.ingredientId)
                    return (
                      <tr key={item.ingredientId}>
                        <td><strong>{item.name}</strong></td>
                        <td>{item.quantity} {item.unit}</td>
                        <td>₹{info?.price_per_kg_inr || 0}/kg</td>
                        <td>₹{item.cost.toFixed(2)}</td>
                        <td>
                          <span
                            className={`status-tag ${
                              isAvailable ? 'status-available' : 'status-missing'
                            }`}
                          >
                            {isAvailable ? '✓ In kitchen' : '🛒 Need to buy'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="cost-summary-cards">
              <div className="cost-metric-card">
                <span>Already in kitchen</span>
                <strong>₹{availableCost.toFixed(0)}</strong>
                <small>No additional spend</small>
              </div>
              <div className="cost-metric-card cost-metric-buy">
                <span>Estimated to buy</span>
                <strong>₹{missingCost.toFixed(0)}</strong>
                <small>Items not in pantry</small>
              </div>
              <div className="cost-metric-card cost-metric-total">
                <span>Total dish value</span>
                <strong>₹{costs.total}</strong>
                <small>₹{costs.perPerson} per serving ({servings} serv)</small>
              </div>
            </div>
          </section>

          {/* Section 3: Preparation & Cooking Instructions */}
          <section className="detail-section instructions-section card-surface">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">STEP-BY-STEP GUIDE</p>
                <h2>Preparation & cooking</h2>
              </div>
              {cookMode && (
                <button
                  type="button"
                  className="clear-filters-link"
                  onClick={() => setCompletedSteps([])}
                >
                  Reset steps
                </button>
              )}
            </div>

            <ol className="instruction-list">
              {recipe.instructions.map((step, index) => {
                const isCompleted = completedSteps.includes(index)
                return (
                  <li
                    key={step}
                    className={`instruction-step ${isCompleted ? 'step-completed' : ''}`}
                    onClick={() => toggleStep(index)}
                  >
                    <div className="step-number-wrap">
                      <span className="step-circle">
                        {isCompleted ? '✓' : String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="step-body">
                      <p>{step}</p>
                      <span className="step-action-hint">
                        {isCompleted ? 'Completed ✓ (tap to undo)' : 'Tap step when completed'}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        </div>

        {/* Right Sticky Sidebar: Nutrition & Quick Actions */}
        <aside className="detail-aside">
          {/* Quick Actions Panel */}
          <section className="recipe-actions-panel card-surface">
            <p className="eyebrow">ACTIONS</p>
            <button
              type="button"
              className={`button button-wide ${isSaved ? 'button-outline' : 'button-primary'}`}
              onClick={handleToggleFavorite}
            >
              <HeartIcon filled={isSaved} />
              {isSaved ? 'Saved in Cookbook' : 'Save to Favorites'}
            </button>

            {availability.missing.length > 0 && (
              <button
                type="button"
                className="button button-outline button-wide"
                onClick={handleAddMissing}
              >
                <ShoppingBagIcon /> Add missing ({availability.missing.length}) to list
              </button>
            )}

            <button
              type="button"
              className={`button button-outline button-wide ${isComparing ? 'active-compare' : ''}`}
              onClick={() => {
                toggleCompare(recipe.id)
                navigate('/compare')
              }}
            >
              <ScaleIcon /> {isComparing ? 'Comparing Side-by-Side' : 'Compare Nutrition'}
            </button>

            <button
              type="button"
              className="button button-text button-wide"
              onClick={() => setCookMode(!cookMode)}
            >
              🍳 {cookMode ? 'Exit cook mode' : 'Toggle step checklist mode'}
            </button>
          </section>

          {/* Nutrition Panel */}
          <section className="nutrition-panel card-surface">
            <p className="eyebrow">NUTRITION PROFILE</p>
            <h2>Per serving</h2>
            <p className="tiny-note">Estimated nutritional values based on standard reference tables.</p>

            <div className="nutrients-list">
              {nutrients.map(([label, key, unit, max]) => {
                const val = recipe.nutrition[key]
                const percent = Math.min(100, Math.round((val / max) * 100))
                return (
                  <div className="nutrient-row" key={key}>
                    <div className="nutrient-header">
                      <span className="nutrient-name">{label}</span>
                      <strong className="nutrient-val">
                        {val} {unit}
                      </strong>
                    </div>
                    <div className="nutrient-track">
                      <span className="nutrient-fill" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </aside>
      </div>
    </article>
  )
}
