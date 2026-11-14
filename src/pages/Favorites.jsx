import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import RecipeCard from '../components/RecipeCard.jsx'
import { useApp } from '../context/useApp.js'
import { HeartIcon, SearchIcon } from '../components/Icons.jsx'

export default function Favorites() {
  const app = useApp()
  const [filterQuery, setFilterQuery] = useState('')

  const saved = useMemo(
    () => app.favorites.map((id) => app.recipeById[id]).filter(Boolean),
    [app.favorites, app.recipeById]
  )

  const filtered = useMemo(() => {
    if (!filterQuery.trim()) return saved
    const q = filterQuery.toLowerCase()
    return saved.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.cuisine?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q)
    )
  }, [saved, filterQuery])

  if (app.catalogStatus === 'loading') {
    return (
      <main className="loading-view" role="status">
        <div className="nearby-spinner" aria-hidden="true" />
        <p>Loading your saved recipes…</p>
      </main>
    )
  }

  if (app.catalogStatus === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div>
          <strong>Your saved recipes are unavailable.</strong>
          <p>{app.catalogError}</p>
        </div>
        <button className="button button-outline" type="button" onClick={app.retryCatalog}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="favorites-page">
      <PageHeader
        eyebrow="YOUR PERSONAL COOKBOOK"
        title="Saved recipes to return to."
        description="Keep your most promising ideas close. Your cookbook stays synced across your kitchen sessions."
        action={
          <div className="header-action-group">
            <span className="count-pill-large">
              {saved.length} {saved.length === 1 ? 'recipe' : 'recipes'}
            </span>
          </div>
        }
      />

      {saved.length > 0 && (
        <div className="favorites-toolbar">
          <div className="filter-search-box">
            <SearchIcon className="filter-search-icon" />
            <input
              type="search"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter your saved recipes…"
              className="filter-search-input"
            />
            {filterQuery && (
              <button
                type="button"
                className="filter-search-clear"
                onClick={() => setFilterQuery('')}
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="recipe-grid">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : saved.length > 0 ? (
        <div className="empty-state">
          <p>No saved recipes match "{filterQuery}".</p>
          <button
            type="button"
            className="button button-outline"
            onClick={() => setFilterQuery('')}
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="empty-state">
          <HeartIcon className="empty-icon" />
          <p className="eyebrow">YOUR COOKBOOK IS EMPTY</p>
          <h2>No saved recipes yet.</h2>
          <p>
            When you see a dish you love in your recommendations, tap the heart button to save it
            here for quick access!
          </p>
          <Link className="button button-primary" to="/recommendations">
            Discover recipes <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}
    </div>
  )
}
