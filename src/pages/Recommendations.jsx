import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import RecipeCard from '../components/RecipeCard.jsx'
import { useApp } from '../context/useApp.js'
import { getRecommendations, recommendationGroups } from '../services/recommendationService.js'

const sorters = {
  'Best match': (a, b) => b.rankingScore - a.rankingScore || b.match - a.match,
  'Lowest cost': (a, b) => a.costs.total - b.costs.total,
  'Quickest': (a, b) => a.prepTime + a.cookTime - b.prepTime - b.cookTime,
  'Highest protein': (a, b) => b.nutrition.protein - a.nutrition.protein,
  'Lowest calories': (a, b) => a.nutrition.calories - b.nutrition.calories,
}
const EMPTY_RESULTS = []

export default function Recommendations() {
  const { profile, preferences, ingredients, servings, pantryAlwaysAvailable, compared, setRecentRecommendations, catalogRecipes, catalogStatus, catalogError, retryCatalog, ingredientById, ingredientAliases } = useApp()
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || ''
  const input = useMemo(() => ({ profile, preferences, ingredients, servings, pantryAlwaysAvailable }), [profile, preferences, ingredients, servings, pantryAlwaysAvailable])
  const catalog = useMemo(() => ({ recipes: catalogRecipes, ingredientById, ingredientAliases }), [catalogRecipes, ingredientById, ingredientAliases])
  const [retryToken, setRetryToken] = useState(0)
  const [request, setRequest] = useState({ key: '', status: 'loading', results: [], error: '' })
  const [filters, setFilters] = useState({ category: initialCategory, cuisine: '', maxTime: '', minMatch: 0, maxCost: '', maxCalories: '', minProtein: '', difficulty: '', sort: 'Best match' })
  const [expandedFilters, setExpandedFilters] = useState(false)
  const requestKey = `${JSON.stringify(input)}:${retryToken}`

  useEffect(() => {
    if (catalogStatus !== 'success') return undefined
    let active = true
    getRecommendations(input, catalog).then((data) => {
      if (active) {
        setRequest({ key: requestKey, status: 'success', results: data, error: '' })
        setRecentRecommendations(data.map((recipe) => recipe.id))
      }
    }).catch((requestError) => {
      console.error('Could not load recipe recommendations.', requestError)
      if (active) setRequest({ key: requestKey, status: 'error', results: [], error: requestError.message || 'Recommendations could not be loaded. Please try again.' })
    })
    return () => { active = false }
  }, [catalog, catalogStatus, input, requestKey, setRecentRecommendations])

  const loading = catalogStatus === 'loading' || (catalogStatus === 'success' && (request.key !== requestKey || request.status === 'loading'))
  const results = loading || request.status !== 'success' ? EMPTY_RESULTS : request.results
  const error = catalogStatus === 'error' ? catalogError : !loading && request.status === 'error' ? request.error : ''

  const filtered = useMemo(() => results.filter((recipe) =>
    (!filters.category || recipe.category === filters.category)
    && (!filters.cuisine || recipe.cuisine === filters.cuisine)
    && (!filters.maxTime || recipe.prepTime + recipe.cookTime <= Number(filters.maxTime))
    && recipe.match >= Number(filters.minMatch || 0)
    && (!filters.maxCost || (preferences.budgetScope === 'per person' ? recipe.costs.perPerson : recipe.costs.total) <= Number(filters.maxCost))
    && (!filters.maxCalories || recipe.nutrition.calories <= Number(filters.maxCalories))
    && (!filters.minProtein || recipe.nutrition.protein >= Number(filters.minProtein))
    && (!filters.difficulty || recipe.difficulty === filters.difficulty),
  ).sort(sorters[filters.sort]), [filters, preferences.budgetScope, results])

  const selectedRecipeCount = compared.length
  const retry = () => {
    if (catalogStatus !== 'success') retryCatalog()
    else setRetryToken((current) => current + 1)
  }

  return <div className="results-page">
    <div className="results-top"><Link to="/dashboard" className="back-link">← Workspace</Link><span className="sample-label">SUPABASE CATALOG · ESTIMATES</span></div>
    <PageHeader eyebrow="MADE FOR YOUR KITCHEN" title="Here's what you can make." description="Recipes ranked by ingredient match, your preferences and estimated cost. Match is a recipe fit score, not a confidence score." action={<Link className="button button-outline" to="/ingredients">Edit ingredients</Link>} />
    <div className="recommendation-summary">
      <div><small>FOOD PREFERENCE</small><strong>{preferences.foodType}</strong></div>
      <div><small>COOKING FOR</small><strong>{servings} {servings === 1 ? 'person' : 'people'}</strong></div>
      <div><small>HEALTH GOALS</small><strong>{preferences.healthGoals.length ? preferences.healthGoals.slice(0, 2).join(', ') : 'No preference'}</strong></div>
      <div><small>MEAL BUDGET</small><strong>₹{preferences.budget} / {preferences.budgetScope}</strong></div>
      <div><small>IN YOUR KITCHEN</small><strong>{ingredients.length} ingredients</strong></div>
    </div>
    <div className="filter-toolbar">
      <button className={`filter-toggle ${expandedFilters ? 'active' : ''}`} onClick={() => setExpandedFilters(!expandedFilters)}>{expandedFilters ? 'Hide filters' : 'Filter recipes'} <span>{expandedFilters ? '−' : '+'}</span></button>
      <label className="sort-control">Sort by <select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}>{Object.keys(sorters).map((item) => <option key={item}>{item}</option>)}</select></label>
      <span className="results-count">{filtered.length} recipe{filtered.length === 1 ? '' : 's'}</span>
    </div>
    {expandedFilters && <div className="filters-panel">
      <label>Meal<select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}><option value="">All meals</option>{['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Sweets'].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Cuisine<select value={filters.cuisine} onChange={(event) => setFilters({ ...filters, cuisine: event.target.value })}><option value="">All cuisines</option>{[...new Set(results.map((item) => item.cuisine))].sort().map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Ready within<select value={filters.maxTime} onChange={(event) => setFilters({ ...filters, maxTime: event.target.value })}><option value="">Any time</option><option value="20">20 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option></select></label>
      <label>Minimum match<select value={filters.minMatch} onChange={(event) => setFilters({ ...filters, minMatch: event.target.value })}><option value="0">Any match</option><option value="50">50%+</option><option value="75">75%+</option><option value="100">100%</option></select></label>
      <label>Maximum cost ({preferences.budgetScope})<input type="number" min="0" value={filters.maxCost} onChange={(event) => setFilters({ ...filters, maxCost: event.target.value })} placeholder={`₹${preferences.budget}`} /></label>
      <label>Max calories / serving<input type="number" min="0" value={filters.maxCalories} onChange={(event) => setFilters({ ...filters, maxCalories: event.target.value })} placeholder="Any" /></label>
      <label>Min protein / serving<input type="number" min="0" value={filters.minProtein} onChange={(event) => setFilters({ ...filters, minProtein: event.target.value })} placeholder="Any" /></label>
      <label>Difficulty<select value={filters.difficulty} onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })}><option value="">Any level</option><option>Easy</option><option>Medium</option></select></label>
    </div>}
    {error && <div className="error-panel" role="alert"><div><strong>We couldn't get your recommendations.</strong><p>{error}</p></div><button className="button button-outline" onClick={retry}>Try again</button></div>}
    {loading && <div className="loading-view"><p className="eyebrow">A MOMENT IN THE KITCHEN</p><h2>Finding your next favourite meal...</h2><p className="page-description">Checking your ingredients, applying preferences, reviewing nutrition, estimating cost and ranking recipe ideas.</p><div className="loading-context">{['Checking your available ingredients', 'Applying dietary preferences', 'Evaluating nutrition estimates', 'Calculating sample ingredient costs', 'Ranking your recipe options'].map((message) => <span key={message}>{message}</span>)}</div><div className="skeleton-grid">{[1, 2, 3].map((item) => <div className="skeleton-card" key={item}><div className="skeleton skeleton-photo" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /><div className="skeleton skeleton-line" /></div>)}</div></div>}
    {!loading && !error && !filtered.length && <div className="empty-state"><p className="eyebrow">NO RECIPES IN THIS FILTER</p><h2>Try widening your search.</h2><p>Change your filters or add more ingredients to see more recipe ideas.</p><button className="button button-outline" onClick={() => setFilters({ ...filters, category: '', cuisine: '', maxTime: '', minMatch: 0, maxCost: '', maxCalories: '', minProtein: '', difficulty: '' })}>Clear filters</button></div>}
    {!loading && !error && filtered.length > 0 && <div className="recommendation-groups">
      {recommendationGroups.map((group, index) => {
        const groupRecipes = filtered.filter((recipe) => group.test(recipe, preferences)).slice(0, index === 0 ? 6 : 3)
        if (!groupRecipes.length) return null
        return <section className="recipe-group" key={group.title}><div className="group-heading"><div><p className="eyebrow">0{index + 1} / RECIPE COLLECTION</p><h2>{group.title}</h2></div><span>{groupRecipes.length} ideas</span></div><div className="recipe-grid">{groupRecipes.map((item) => <RecipeCard key={`${group.title}-${item.id}`} recipe={item} />)}</div></section>
      })}
    </div>}
    {selectedRecipeCount > 0 && <div className="compare-dock"><span>{selectedRecipeCount} recipe{selectedRecipeCount > 1 ? 's' : ''} selected to compare <small>(up to 3)</small></span><Link className="button button-primary" to="/compare">Compare recipes →</Link></div>}
  </div>
}
