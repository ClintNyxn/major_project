import { Link } from 'react-router-dom'
import { useApp } from '../context/useApp.js'
import { useToast } from '../context/useToast.js'
import { getRecipeCosts, getAvailability } from '../utils/recipeMath.js'
import { HeartIcon, ClockIcon, ScaleIcon, UsersIcon } from './Icons.jsx'
import fallbackImage from '../assets/dashboard-meal.svg'

export default function RecipeCard({ recipe, showActions = true }) {
  const {
    favorites,
    toggleFavorite,
    compared,
    toggleCompare,
    servings,
    ingredients,
    pantryAlwaysAvailable,
    ingredientById,
    addShopping,
  } = useApp()

  const { addToast } = useToast()

  const saved = favorites.includes(recipe.id)
  const selected = compared.includes(recipe.id)

  const availability = recipe.available
    ? { available: recipe.available, missing: recipe.missing || [] }
    : getAvailability(
        recipe,
        ingredients,
        pantryAlwaysAvailable ? ['oil', 'salt', 'spices'] : [],
        ingredientById
      )

  const match = recipe.match ?? availability.match
  const costs = recipe.costs || getRecipeCosts(recipe, servings, ingredientById)
  const cost = costs.total
  const missingNames = availability.missing.map(
    (item) => ingredientById[item.ingredientId]?.name || item.ingredientId
  )

  function handleSaveClick(e) {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(recipe.id)
    if (!saved) {
      addToast({
        message: `Saved "${recipe.name}" to your favorites!`,
        type: 'success',
      })
    } else {
      addToast({
        message: `Removed "${recipe.name}" from favorites.`,
        type: 'info',
      })
    }
  }

  function handleAddMissingClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!availability.missing.length) return

    const missingItems = costs.lineItems
      .filter((item) => availability.missing.some((m) => m.ingredientId === item.ingredientId))
      .map((item) => ({
        ...item,
        recipeId: recipe.id,
        recipeName: recipe.name,
      }))

    addShopping(missingItems)
    addToast({
      message: `Added ${missingItems.length} missing ingredient${missingItems.length > 1 ? 's' : ''} to your shopping list!`,
      type: 'success',
    })
  }

  // Color-coded match badge class
  const matchBadgeClass =
    match === 100
      ? 'match-badge-perfect'
      : match >= 75
      ? 'match-badge-high'
      : 'match-badge-partial'

  return (
    <article className="recipe-card">
      <div className="recipe-image-wrap">
        <Link to={`/recipe/${recipe.id}`} className="recipe-image-link" aria-label={`View recipe for ${recipe.name}`}>
          <img
            className="recipe-image"
            src={recipe.image || fallbackImage}
            alt={recipe.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = fallbackImage
            }}
          />
        </Link>

        {/* Floating Match Pill */}
        <span className={`image-label ${matchBadgeClass}`}>
          {match}% Match
        </span>

        {/* Floating Heart Button */}
        {showActions && (
          <button
            type="button"
            className={`save-heart-btn ${saved ? 'is-saved' : ''}`}
            onClick={handleSaveClick}
            aria-label={saved ? 'Remove from saved recipes' : 'Save to favorites'}
            title={saved ? 'Remove from favorites' : 'Save to favorites'}
          >
            <HeartIcon filled={saved} />
          </button>
        )}
      </div>

      <div className="recipe-card-body">
        {/* Topline metadata */}
        <div className="recipe-card-topline">
          <span className="recipe-cuisine-badge">{recipe.cuisine}</span>
          <span className="recipe-category-tag">{recipe.category}</span>
          {recipe.foodType && (
            <span className={`recipe-diet-tag diet-${recipe.foodType.toLowerCase().replace(/[^a-z]/g, '-')}`}>
              {recipe.foodType}
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/recipe/${recipe.id}`} className="recipe-title-link">
          <h3>{recipe.name}</h3>
        </Link>

        {/* Description or recommendation reason */}
        <p className="recipe-reason">{recipe.reason || recipe.description}</p>

        {/* Missing / Available ingredients status */}
        <div className="ingredients-status-row">
          {missingNames.length === 0 ? (
            <span className="status-all-available">
              ✓ All ingredients ready in kitchen
            </span>
          ) : (
            <div className="status-missing-wrap">
              <span className="status-missing-label">
                Missing {missingNames.length}: <em>{missingNames.slice(0, 2).join(', ')}{missingNames.length > 2 ? ` +${missingNames.length - 2}` : ''}</em>
              </span>
              {showActions && (
                <button
                  type="button"
                  className="add-missing-pill-btn"
                  onClick={handleAddMissingClick}
                  title="Add missing items to shopping list"
                >
                  + Add to list
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick meta indicators */}
        <div className="recipe-meta">
          <span title="Total preparation & cooking time">
            <ClockIcon /> {recipe.prepTime + recipe.cookTime}m
          </span>
          <span title="Cooking difficulty">{recipe.difficulty}</span>
          <span title="Number of servings">
            <UsersIcon /> {servings} serv
          </span>
          <span title="Calories per serving">
            🔥 {recipe.nutrition.calories} kcal
          </span>
        </div>

        {/* Bottom card footer: Cost & Actions */}
        <div className="recipe-card-bottom">
          <div className="recipe-cost-block">
            <strong>₹{Math.round(cost)}</strong>
            <small>total · ₹{Math.round(costs.perPerson)}/serv</small>
            <span className="protein-note">
              💪 {recipe.nutrition.protein}g protein
            </span>
          </div>

          <div className="recipe-card-controls">
            <Link to={`/recipe/${recipe.id}`} className="button button-small button-primary">
              Cook →
            </Link>
            {showActions && (
              <button
                type="button"
                className={`compare-toggle ${selected ? 'selected' : ''}`}
                onClick={() => toggleCompare(recipe.id)}
                disabled={compared.length >= 3 && !selected}
                title={selected ? 'Remove from compare' : 'Compare nutrition with other recipes'}
              >
                <ScaleIcon /> {selected ? 'Comparing' : 'Compare'}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
