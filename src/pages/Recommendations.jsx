import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import RecipeCard from '../components/RecipeCard.jsx'
import { useApp } from '../context/useApp.js'
import { getRecommendations, recommendationGroups } from '../services/recommendationService.js'
import { SearchIcon, ScaleIcon } from '../components/Icons.jsx'

const sorters = {
  'Best match': (a, b) => b.rankingScore - a.rankingScore || b.match - a.match,
  'Lowest cost': (a, b) => a.costs.total - b.costs.total,
  'Quickest': (a, b) => a.prepTime + a.cookTime - b.prepTime - b.cookTime,
  'Highest protein': (a, b) => b.nutrition.protein - a.nutrition.protein,
  'Lowest calories': (a, b) => a.nutrition.calories - b.nutrition.calories,
}
const EMPTY_RESULTS = []

export default function Recommendations() {
  const {
    profile,
    preferences,
    ingredients,
    servings,
    pantryAlwaysAvailable,
    compared,
    toggleCompare,
    setRecentRecommendations,
    catalogRecipes,
    catalogStatus,
    catalogError,
    retryCatalog,
    ingredientById,
    ingredientAliases,
  } = useApp()

  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || ''
  const initialSearch = searchParams.get('q') || ''

  const input = useMemo(
    () => ({ profile, preferences, ingredients, servings, pantryAlwaysAvailable }),
    [profile, preferences, ingredients, servings, pantryAlwaysAvailable]
  )

  const catalog = useMemo(
    () => ({ recipes: catalogRecipes, ingredientById, ingredientAliases }),
    [catalogRecipes, ingredientById, ingredientAliases]
  )

  const [retryToken, setRetryToken] = useState(0)
  const [request, setRequest] = useState({ key: '', status: 'loading', results: [], error: '' })
  const [query, setQuery] = useState(initialSearch)
  const [quickChip, setQuickChip] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'compact'
  const [expandedFilters, setExpandedFilters] = useState(false)

  const [filters, setFilters] = useState({
    category: initialCategory,
    cuisine: '',
    maxTime: '',
    minMatch: 0,
    maxCost: '',
    maxCalories: '',
    minProtein: '',
    difficulty: '',
    sort: 'Best match',
  })

  const requestKey = `${JSON.stringify(input)}:${retryToken}`

  useEffect(() => {
    if (catalogStatus !== 'success') return undefined
    let active = true
    getRecommendations(input, catalog)
      .then((data) => {
        if (active) {
          setRequest({ key: requestKey, status: 'success', results: data, error: '' })
          setRecentRecommendations(data.map((recipe) => recipe.id))
        }
      })
      .catch((requestError) => {
        console.error('Could not load recipe recommendations.', requestError)
        if (active) {
          setRequest({
            key: requestKey,
            status: 'error',
            results: [],
            error: requestError.message || 'Recommendations could not be loaded. Please try again.',
          })
        }
      })
    return () => {
      active = false
    }
  }, [catalog, catalogStatus, input, requestKey, setRecentRecommendations])

  const loading =
    catalogStatus === 'loading' ||
    (catalogStatus === 'success' && (request.key !== requestKey || request.status === 'loading'))
  const results = loading || request.status !== 'success' ? EMPTY_RESULTS : request.results
  const error =
    catalogStatus === 'error' ? catalogError : !loading && request.status === 'error' ? request.error : ''

  // Filter pipeline
  const filtered = useMemo(() => {
    const activeQ = (query || searchParams.get('q') || '').trim().toLowerCase()
    const activeCategory = filters.category || searchParams.get('category') || ''

    return results
      .filter((recipe) => {
        // Search text matching name, description, cuisine or ingredients
        if (activeQ) {
          const matchesName = recipe.name.toLowerCase().includes(activeQ)
          const matchesDesc = recipe.description?.toLowerCase().includes(activeQ)
          const matchesCuisine = recipe.cuisine?.toLowerCase().includes(activeQ)
          const matchesIngredient = recipe.ingredients.some((ing) => {
            const name = ingredientById[ing.ingredientId]?.name || ing.ingredientId
            return name.toLowerCase().includes(activeQ)
          })
          if (!matchesName && !matchesDesc && !matchesCuisine && !matchesIngredient) return false
        }

        // Quick chip toggles
        if (quickChip === 'under30' && recipe.prepTime + recipe.cookTime > 30) return false
        if (quickChip === 'highProtein' && recipe.nutrition.protein < 18) return false
        if (quickChip === 'perfectMatch' && recipe.match < 100) return false
        if (quickChip === 'underBudget' && !recipe.underBudget) return false
        if (quickChip === 'veg' && recipe.foodType !== 'vegetarian' && recipe.foodType !== 'vegan') return false

        // Standard filters
        if (activeCategory && recipe.category !== activeCategory) return false
        if (filters.cuisine && recipe.cuisine !== filters.cuisine) return false
        if (filters.maxTime && recipe.prepTime + recipe.cookTime > Number(filters.maxTime)) return false
        if (recipe.match < Number(filters.minMatch || 0)) return false

        const costToEvaluate =
          preferences.budgetScope === 'per person' ? recipe.costs.perPerson : recipe.costs.total
        if (filters.maxCost && costToEvaluate > Number(filters.maxCost)) return false
        if (filters.maxCalories && recipe.nutrition.calories > Number(filters.maxCalories)) return false
        if (filters.minProtein && recipe.nutrition.protein < Number(filters.minProtein)) return false
        if (filters.difficulty && recipe.difficulty !== filters.difficulty) return false

        return true
      })
      .sort(sorters[filters.sort])
  }, [filters, preferences.budgetScope, results, query, searchParams, quickChip, ingredientById])

  const selectedRecipeCount = compared.length

  const retry = () => {
    if (catalogStatus !== 'success') retryCatalog()
    else setRetryToken((current) => current + 1)
  }

  const hasActiveFilters =
    Boolean(query) ||
    Boolean(quickChip) ||
    Boolean(filters.category) ||
    Boolean(filters.cuisine) ||
    Boolean(filters.maxTime) ||
    Number(filters.minMatch) > 0 ||
    Boolean(filters.maxCost) ||
    Boolean(filters.maxCalories) ||
    Boolean(filters.minProtein) ||
    Boolean(filters.difficulty)

  const clearAllFilters = () => {
    setQuery('')
    setQuickChip('')
    setFilters({
      category: '',
      cuisine: '',
      maxTime: '',
      minMatch: 0,
      maxCost: '',
      maxCalories: '',
      minProtein: '',
      difficulty: '',
      sort: 'Best match',
    })
    setSearchParams({})
  }

  return (
    <div className="results-page">
      <div className="results-top">
        <Link to="/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>
        <span className="sample-label">INTELLIGENT PANTRY MATCHING</span>
      </div>

      <PageHeader
        eyebrow="MADE FOR YOUR TABLE"
        title="Here's what you can make today."
        description="Recipes ranked in real-time by your kitchen ingredients, dietary preferences, and estimated costs."
        action={
          <div className="header-action-group">
            <Link className="button button-outline" to="/ingredients">
              Edit pantry ({ingredients.length})
            </Link>
          </div>
        }
      />

      {/* Modern Kitchen Snapshot Banner */}
      <section className="recommendation-summary-card" aria-label="Kitchen configuration">
        <div className="summary-pill">
          <span className="summary-label">Diet style</span>
          <strong>{preferences.foodType}</strong>
        </div>
        <div className="summary-pill">
          <span className="summary-label">Cooking for</span>
          <strong>{servings} {servings === 1 ? 'person' : 'people'}</strong>
        </div>
        <div className="summary-pill">
          <span className="summary-label">Health goals</span>
          <strong>
            {preferences.healthGoals.length
              ? preferences.healthGoals.slice(0, 2).join(', ')
              : 'Balanced diet'}
          </strong>
        </div>
        <div className="summary-pill">
          <span className="summary-label">Budget target</span>
          <strong>₹{preferences.budget} / {preferences.budgetScope}</strong>
        </div>
        <div className="summary-pill">
          <span className="summary-label">Kitchen ingredients</span>
          <strong>{ingredients.length} items</strong>
        </div>
      </section>

      {/* Quick Filter Chips */}
      <div className="quick-filter-strip">
        <button
          type="button"
          className={`quick-pill ${quickChip === 'under30' ? 'active' : ''}`}
          onClick={() => setQuickChip(quickChip === 'under30' ? '' : 'under30')}
        >
          ⚡ Under 30 mins
        </button>
        <button
          type="button"
          className={`quick-pill ${quickChip === 'perfectMatch' ? 'active' : ''}`}
          onClick={() => setQuickChip(quickChip === 'perfectMatch' ? '' : 'perfectMatch')}
        >
          🎯 100% Pantry Match
        </button>
        <button
          type="button"
          className={`quick-pill ${quickChip === 'highProtein' ? 'active' : ''}`}
          onClick={() => setQuickChip(quickChip === 'highProtein' ? '' : 'highProtein')}
        >
          💪 High Protein (18g+)
        </button>
        <button
          type="button"
          className={`quick-pill ${quickChip === 'underBudget' ? 'active' : ''}`}
          onClick={() => setQuickChip(quickChip === 'underBudget' ? '' : 'underBudget')}
        >
          💰 Under Budget
        </button>
        <button
          type="button"
          className={`quick-pill ${quickChip === 'veg' ? 'active' : ''}`}
          onClick={() => setQuickChip(quickChip === 'veg' ? '' : 'veg')}
        >
          🌱 Vegetarian / Vegan
        </button>
      </div>

      {/* Main Filter Toolbar */}
      <div className="filter-toolbar">
        {/* Instant Search within results */}
        <div className="filter-search-box">
          <SearchIcon className="filter-search-icon" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes, ingredients, cuisines…"
            className="filter-search-input"
          />
          {query && (
            <button
              type="button"
              className="filter-search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Drawer Toggle */}
        <button
          type="button"
          className={`filter-toggle ${expandedFilters ? 'active' : ''}`}
          onClick={() => setExpandedFilters(!expandedFilters)}
        >
          <span>{expandedFilters ? 'Hide filters' : 'More filters'}</span>
          <span className="toggle-symbol">{expandedFilters ? '−' : '+'}</span>
        </button>

        {/* Sort Dropdown */}
        <label className="sort-control">
          <span>Sort:</span>
          <select
            value={filters.sort}
            onChange={(event) => setFilters({ ...filters, sort: event.target.value })}
          >
            {Object.keys(sorters).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        {/* View Mode Toggle */}
        <div className="view-mode-toggle" role="radiogroup" aria-label="View layout">
          <button
            type="button"
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
            aria-label="Grid view"
          >
            ▦
          </button>
          <button
            type="button"
            className={`view-btn ${viewMode === 'compact' ? 'active' : ''}`}
            onClick={() => setViewMode('compact')}
            title="Compact list view"
            aria-label="Compact list view"
          >
            ☰
          </button>
        </div>

        {/* Results Counter & Clear Action */}
        <div className="results-count-wrap">
          <span className="results-count">
            <strong>{filtered.length}</strong> {filtered.length === 1 ? 'recipe' : 'recipes'}
          </span>
          {hasActiveFilters && (
            <button type="button" className="clear-filters-link" onClick={clearAllFilters}>
              Reset all
            </button>
          )}
        </div>
      </div>

      {/* Advanced Collapsible Filter Panel */}
      {expandedFilters && (
        <div className="filters-panel">
          <label>
            Meal type
            <select
              value={filters.category}
              onChange={(event) => setFilters({ ...filters, category: event.target.value })}
            >
              <option value="">All meal categories</option>
              {['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Sweets'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            Cuisine
            <select
              value={filters.cuisine}
              onChange={(event) => setFilters({ ...filters, cuisine: event.target.value })}
            >
              <option value="">All cuisines</option>
              {[...new Set(results.map((item) => item.cuisine))].sort().map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            Max preparation time
            <select
              value={filters.maxTime}
              onChange={(event) => setFilters({ ...filters, maxTime: event.target.value })}
            >
              <option value="">Any time</option>
              <option value="20">20 minutes or less</option>
              <option value="30">30 minutes or less</option>
              <option value="45">45 minutes or less</option>
              <option value="60">60 minutes or less</option>
            </select>
          </label>

          <label>
            Minimum pantry match
            <select
              value={filters.minMatch}
              onChange={(event) => setFilters({ ...filters, minMatch: event.target.value })}
            >
              <option value="0">Any match (show missing)</option>
              <option value="50">50% or higher</option>
              <option value="75">75% or higher</option>
              <option value="100">100% complete match</option>
            </select>
          </label>

          <label>
            Maximum cost ({preferences.budgetScope})
            <input
              type="number"
              min="0"
              value={filters.maxCost}
              onChange={(event) => setFilters({ ...filters, maxCost: event.target.value })}
              placeholder={`₹${preferences.budget}`}
            />
          </label>

          <label>
            Max calories / serving
            <input
              type="number"
              min="0"
              value={filters.maxCalories}
              onChange={(event) => setFilters({ ...filters, maxCalories: event.target.value })}
              placeholder="e.g. 500 kcal"
            />
          </label>

          <label>
            Min protein / serving
            <input
              type="number"
              min="0"
              value={filters.minProtein}
              onChange={(event) => setFilters({ ...filters, minProtein: event.target.value })}
              placeholder="e.g. 20g"
            />
          </label>

          <label>
            Difficulty
            <select
              value={filters.difficulty}
              onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })}
            >
              <option value="">Any difficulty</option>
              <option>Easy</option>
              <option>Medium</option>
            </select>
          </label>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="error-panel" role="alert">
          <div>
            <strong>We couldn't get your recommendations.</strong>
            <p>{error}</p>
          </div>
          <button className="button button-outline" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="loading-view">
          <div className="loading-spinner-wrap">
            <div className="nearby-spinner" aria-hidden="true" />
            <h2>Evaluating pantry combinations…</h2>
          </div>
          <p className="page-description">
            Ranking your ingredient matches, nutritional goals, and sample prices.
          </p>
          <div className="skeleton-grid">
            {[1, 2, 3, 4].map((item) => (
              <div className="skeleton-card" key={item}>
                <div className="skeleton skeleton-photo" />
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line short" />
                <div className="skeleton skeleton-line" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !filtered.length && (
        <div className="empty-state">
          <p className="eyebrow">NO RECIPES MATCH YOUR CRITERIA</p>
          <h2>Try broadening your search.</h2>
          <p>
            No recipes matched all active filters or ingredient searches. Clear your filters or add
            more items to your pantry to unlock more dishes!
          </p>
          <div className="empty-actions">
            <button className="button button-primary" onClick={clearAllFilters}>
              Clear all filters
            </button>
            <Link className="button button-outline" to="/ingredients">
              Add more pantry ingredients
            </Link>
          </div>
        </div>
      )}

      {/* Results Groups */}
      {!loading && !error && filtered.length > 0 && (
        <div className="recommendation-groups">
          {recommendationGroups.map((group, index) => {
            const groupRecipes = filtered
              .filter((recipe) => group.test(recipe, preferences))
              .slice(0, index === 0 ? 8 : 4)

            if (!groupRecipes.length) return null

            return (
              <section className="recipe-group" key={group.title}>
                <div className="group-heading">
                  <div>
                    <p className="eyebrow">COLLECTION 0{index + 1}</p>
                    <h2>{group.title}</h2>
                  </div>
                  <span className="group-count-badge">
                    {groupRecipes.length} {groupRecipes.length === 1 ? 'idea' : 'ideas'}
                  </span>
                </div>

                <div className={viewMode === 'grid' ? 'recipe-grid' : 'recipe-list-compact'}>
                  {groupRecipes.map((item) => (
                    <RecipeCard key={`${group.title}-${item.id}`} recipe={item} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Sticky Floating Compare Tray */}
      {selectedRecipeCount > 0 && (
        <div className="compare-dock">
          <div className="compare-dock-left">
            <ScaleIcon />
            <span>
              <strong>{selectedRecipeCount} of 3</strong> recipes ready to compare
            </span>
            <div className="compare-thumbnails">
              {compared.map((id) => {
                const r = catalog.recipes.find((item) => item.id === id)
                if (!r) return null
                return (
                  <span key={id} className="compare-thumb" title={r.name}>
                    {r.name.split(' ')[0]}
                    <button
                      type="button"
                      onClick={() => toggleCompare(id)}
                      aria-label={`Remove ${r.name}`}
                    >
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
          </div>
          <div className="compare-dock-actions">
            <Link className="button button-primary" to="/compare">
              Compare Side-by-Side →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
