import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import RecipeCard from '../components/RecipeCard.jsx'
import { useApp } from '../context/useApp.js'
import dashboardMeal from '../assets/dashboard-meal.svg'
import {
  PantryIcon,
  HeartIcon,
  ShoppingBagIcon,
  ClockIcon,
  SparklesIcon,
  ArrowRightIcon,
  ScaleIcon,
  MapPinIcon,
  HelpIcon,
} from '../components/Icons.jsx'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const app = useApp()
  const [greeting] = useState(getGreeting)

  const recentlyViewed = useMemo(
    () => app.viewed.map((id) => app.recipeById[id]).filter(Boolean).slice(0, 3),
    [app.viewed, app.recipeById]
  )

  const recentRecommendations = useMemo(
    () => app.recentRecommendations.map((id) => app.recipeById[id]).filter(Boolean).slice(0, 3),
    [app.recentRecommendations, app.recipeById]
  )

  const saved = useMemo(
    () => app.favorites.map((id) => app.recipeById[id]).filter(Boolean).slice(0, 3),
    [app.favorites, app.recipeById]
  )

  const quickPicks = useMemo(() => {
    return app.catalogRecipes
      .filter((r) => r.prepTime + r.cookTime <= 30)
      .slice(0, 3)
  }, [app.catalogRecipes])

  const pendingShoppingCount = app.shopping.filter((item) => !item.purchased).length

  if (app.catalogStatus === 'loading') {
    return (
      <main className="loading-view" role="status">
        <div className="nearby-spinner" aria-hidden="true" />
        <p>Loading your kitchen catalog…</p>
      </main>
    )
  }

  if (app.catalogStatus === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div>
          <strong>Your food catalog is unavailable.</strong>
          <p>{app.catalogError}</p>
        </div>
        <button className="button button-outline" type="button" onClick={app.retryCatalog}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <PageHeader
        eyebrow="YOUR KITCHEN, AT A GLANCE"
        title={`${greeting}${app.profile.name ? `, ${app.profile.name.split(' ')[0]}` : ''}.`}
        description="A little less wondering what to cook. A little more making something delicious."
        action={
          <Link className="button button-primary" to="/recommendations">
            <SparklesIcon /> Find recipes <span aria-hidden="true">→</span>
          </Link>
        }
      />

      {/* Kitchen Overview Stats Cards */}
      <section className="dashboard-stats-grid" aria-label="Kitchen summary metrics">
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-emerald">
            <PantryIcon />
          </div>
          <div className="stat-content">
            <span className="stat-value">{app.ingredients.length}</span>
            <span className="stat-label">Ingredients on hand</span>
          </div>
          <Link to="/ingredients" className="stat-link" title="Manage ingredients">
            Edit →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-amber">
            <ShoppingBagIcon />
          </div>
          <div className="stat-content">
            <span className="stat-value">{pendingShoppingCount}</span>
            <span className="stat-label">Items on shopping list</span>
          </div>
          <Link to="/shopping" className="stat-link" title="View shopping list">
            View →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-rose">
            <HeartIcon filled={app.favorites.length > 0} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{app.favorites.length}</span>
            <span className="stat-label">Saved favorites</span>
          </div>
          <Link to="/favorites" className="stat-link" title="See favorites">
            See all →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-blue">
            <ClockIcon />
          </div>
          <div className="stat-content">
            <span className="stat-value">₹{app.preferences.budget}</span>
            <span className="stat-label">Budget ({app.preferences.budgetScope})</span>
          </div>
          <Link to="/preferences" className="stat-link" title="Adjust budget">
            Change →
          </Link>
        </div>
      </section>

      {/* Spotlight Hero Banner */}
      <section className="dashboard-spotlight">
        <div className="spotlight-copy">
          <p className="eyebrow">WHAT'S FOR DINNER?</p>
          <h2>
            Start with what’s
            <br />
            already in your kitchen.
          </h2>
          <p>
            Choose your available ingredients and we’ll match recipes that fit your diet, pantry, and budget.
          </p>
          <div className="spotlight-actions">
            <Link className="button button-light" to="/setup/ingredients">
              <PantryIcon /> Add ingredients
            </Link>
            <Link className="button button-outline-light" to="/recommendations">
              Browse all recipes <ArrowRightIcon />
            </Link>
          </div>
          <div className="spotlight-quick-chips">
            <span>Quick filters:</span>
            <Link to="/recommendations?maxTime=30" className="quick-chip">⚡ Under 30 mins</Link>
            <Link to="/recommendations?sort=Highest+protein" className="quick-chip">💪 High protein</Link>
            <Link to="/recommendations?minMatch=100" className="quick-chip">🎯 100% pantry match</Link>
          </div>
        </div>
        <div className="spotlight-image-wrap">
          <img
            src={dashboardMeal}
            alt="Delicious meal prepared from fresh ingredients"
            className="spotlight-img"
          />
        </div>
      </section>

      {/* Split Section: Ingredients & Preferences Snapshot */}
      <div className="dashboard-split">
        <section className="dashboard-section card-surface">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">PANTRY SNAPSHOT</p>
              <h2>Your ingredients</h2>
            </div>
            <Link to="/ingredients" className="text-link">
              Manage pantry →
            </Link>
          </div>

          <div className="ingredient-summary-list">
            {app.ingredients.length ? (
              app.ingredients.slice(0, 14).map((item) => (
                <span className="ingredient-token" key={item.id}>
                  {item.name || app.ingredientById[item.id]?.name || item.id}
                </span>
              ))
            ) : (
              <div className="empty-inline-card">
                <p className="muted">No ingredients added yet.</p>
                <Link to="/ingredients" className="button button-primary button-small">
                  + Add what’s in your kitchen
                </Link>
              </div>
            )}
            {app.ingredients.length > 14 && (
              <span className="ingredient-token-more">+{app.ingredients.length - 14} more</span>
            )}
          </div>

          <div className="dashboard-inline-note">
            <span className="note-indicator" />
            {app.pantryAlwaysAvailable
              ? 'Pantry basics (oil, salt, common spices) are counted as available.'
              : 'Pantry basics are excluded from ingredient matching.'}
          </div>
        </section>

        <section className="dashboard-section card-surface">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">YOUR PREFERENCES</p>
              <h2>Diet & goals</h2>
            </div>
            <Link to="/preferences" className="text-link">
              Edit preferences →
            </Link>
          </div>

          <dl className="preference-summary">
            <div>
              <dt>Dietary style</dt>
              <dd className="pref-tag">{app.preferences.foodType}</dd>
            </div>
            <div>
              <dt>Health goals</dt>
              <dd>
                {app.preferences.healthGoals.length
                  ? app.preferences.healthGoals.slice(0, 3).join(', ')
                  : 'Balanced diet'}
              </dd>
            </div>
            <div>
              <dt>Serving budget</dt>
              <dd>₹{app.preferences.budget} · {app.preferences.budgetScope}</dd>
            </div>
            <div>
              <dt>Allergy filters</dt>
              <dd className={app.preferences.allergies.length ? 'allergy-alert-text' : ''}>
                {app.preferences.allergies.length
                  ? app.preferences.allergies.join(', ')
                  : 'None excluded'}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Visual Category Browse */}
      <section className="dashboard-section">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">EXPLORE BY OCCASION</p>
            <h2>Browse meal categories</h2>
          </div>
          <Link to="/recommendations" className="text-link">
            All categories →
          </Link>
        </div>

        <div className="category-cards-grid">
          {[
            { name: 'Breakfast', emoji: '🍳', desc: 'Fresh & energizing starts', color: 'cat-orange' },
            { name: 'Lunch', emoji: '🍲', desc: 'Wholesome & balanced meals', color: 'cat-green' },
            { name: 'Dinner', emoji: '🍛', desc: 'Comforting evening plates', color: 'cat-emerald' },
            { name: 'Snacks', emoji: '🥟', desc: 'Quick bites & afternoon tea', color: 'cat-amber' },
            { name: 'Sweets', emoji: '🍮', desc: 'Desserts & festival treats', color: 'cat-rose' },
          ].map((cat) => (
            <Link
              key={cat.name}
              to={`/recommendations?category=${cat.name}`}
              className={`category-card ${cat.color}`}
            >
              <span className="category-emoji" aria-hidden="true">
                {cat.emoji}
              </span>
              <div className="category-card-body">
                <strong>{cat.name}</strong>
                <small>{cat.desc}</small>
              </div>
              <span className="category-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick & Easy Under 30 Mins */}
      {quickPicks.length > 0 && (
        <section className="dashboard-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">FAST & TASTY</p>
              <h2>Ready in 30 minutes or less</h2>
            </div>
            <Link to="/recommendations?maxTime=30" className="text-link">
              See more quick meals →
            </Link>
          </div>
          <div className="recipe-grid">
            {quickPicks.map((item) => (
              <RecipeCard key={item.id} recipe={item} showActions={true} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Recommended */}
      {recentRecommendations.length > 0 && (
        <section className="dashboard-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">YOUR LAST SEARCH</p>
              <h2>Recently recommended for you</h2>
            </div>
            <Link to="/recommendations" className="text-link">
              Refresh ideas →
            </Link>
          </div>
          <div className="recipe-grid">
            {recentRecommendations.map((item) => (
              <RecipeCard key={item.id} recipe={item} showActions={true} />
            ))}
          </div>
        </section>
      )}

      {/* Saved Recipes */}
      {saved.length > 0 && (
        <section className="dashboard-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">YOUR COOKBOOK</p>
              <h2>Saved recipes</h2>
            </div>
            <Link to="/favorites" className="text-link">
              See all ({app.favorites.length}) →
            </Link>
          </div>
          <div className="recipe-grid">
            {saved.map((item) => (
              <RecipeCard key={item.id} recipe={item} showActions={true} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="dashboard-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">PICK UP WHERE YOU LEFT OFF</p>
              <h2>Recently viewed</h2>
            </div>
          </div>
          <div className="recipe-grid">
            {recentlyViewed.map((item) => (
              <RecipeCard key={item.id} recipe={item} showActions={true} />
            ))}
          </div>
        </section>
      )}

      {/* Kitchen Hub Action Tiles */}
      <section className="dashboard-quick-actions">
        <Link to="/shopping" className="hub-tile">
          <div className="hub-tile-icon hub-icon-amber">
            <ShoppingBagIcon />
          </div>
          <div className="hub-tile-body">
            <strong>Shopping List</strong>
            <small>{pendingShoppingCount} items pending</small>
          </div>
          <span className="hub-arrow">↗</span>
        </Link>

        <Link to="/compare" className="hub-tile">
          <div className="hub-tile-icon hub-icon-blue">
            <ScaleIcon />
          </div>
          <div className="hub-tile-body">
            <strong>Compare Nutrition</strong>
            <small>{app.compared.length} recipes selected</small>
          </div>
          <span className="hub-arrow">↗</span>
        </Link>

        <Link to="/nearby" className="hub-tile">
          <div className="hub-tile-icon hub-icon-green">
            <MapPinIcon />
          </div>
          <div className="hub-tile-body">
            <strong>Nearby Grocery & Dining</strong>
            <small>Find stores & eateries near you</small>
          </div>
          <span className="hub-arrow">↗</span>
        </Link>

        <Link to="/help" className="hub-tile">
          <div className="hub-tile-icon hub-icon-purple">
            <HelpIcon />
          </div>
          <div className="hub-tile-body">
            <strong>Kitchen Guide & FAQ</strong>
            <small>How matching & estimates work</small>
          </div>
          <span className="hub-arrow">↗</span>
        </Link>
      </section>
    </div>
  )
}
