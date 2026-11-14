import { useMemo, useState } from 'react'
import { useApp } from '../context/useApp.js'
import { useToast } from '../context/useToast.js'
import { SearchIcon, CheckIcon, PantryIcon } from './Icons.jsx'

const categoryIcons = {
  All: '✨',
  Vegetables: '🥬',
  Produce: '🍅',
  Grains: '🌾',
  'Grains & Pulses': '🌾',
  Dal: '🥣',
  Pulses: '🥣',
  Dairy: '🥛',
  'Dairy & Eggs': '🥛',
  Spices: '🧂',
  'Spices & Seasonings': '🧂',
  Condiments: '🫒',
  Oils: '🫒',
  Meat: '🍗',
  Protein: '🍗',
  Seafood: '🐟',
}

const COMMON_STAPLE_IDS = [
  'cooking_oil',
  'oil',
  'salt',
  'red_onion',
  'onion',
  'tomato',
  'ginger',
  'garlic',
  'cumin_seeds',
  'cumin',
  'turmeric',
  'chili_powder',
]

export default function IngredientPicker({
  value,
  onChange,
  pantryAlwaysAvailable,
  onPantryChange,
}) {
  const app = useApp()
  const ingredients = app.catalogIngredients
  const ingredientById = app.ingredientById
  const { addToast } = useToast()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [customName, setCustomName] = useState('')

  const selected = new Map(value.map((item) => [item.id, item]))

  const categories = useMemo(() => {
    const set = new Set(ingredients.map((item) => item.category).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [ingredients])

  const filtered = useMemo(() => {
    return ingredients.filter((item) => {
      const matchesText = item.name.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = category === 'All' || item.category === category
      return matchesText && matchesCategory
    })
  }, [category, ingredients, query])

  function toggle(item) {
    if (selected.has(item.id)) {
      onChange(value.filter((entry) => entry.id !== item.id))
    } else {
      onChange([
        ...value,
        {
          id: item.id,
          name: item.name,
          quantity: item.priceUnit === 'kg' ? 500 : item.priceUnit === 'litre' ? 500 : 1,
          unit: item.priceUnit === 'kg' ? 'g' : item.priceUnit === 'litre' ? 'ml' : item.priceUnit,
        },
      ])
    }
  }

  function update(id, updates) {
    onChange(value.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }

  function addCustom(event) {
    event.preventDefault()
    const name = customName.trim()
    if (!name) return
    const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    if (!selected.has(id)) {
      onChange([...value, { id, name, quantity: 1, unit: 'piece', custom: true }])
      addToast({ message: `Added "${name}" to your pantry!`, type: 'success' })
    }
    setCustomName('')
  }

  function addStaples() {
    const newItems = []
    for (const stapleId of COMMON_STAPLE_IDS) {
      const match = ingredients.find((i) => i.id === stapleId)
      if (match && !selected.has(match.id)) {
        newItems.push({
          id: match.id,
          name: match.name,
          quantity: match.priceUnit === 'kg' ? 500 : 1,
          unit: match.priceUnit === 'kg' ? 'g' : match.priceUnit,
        })
      }
    }

    if (newItems.length > 0) {
      onChange([...value, ...newItems])
      addToast({
        message: `Added ${newItems.length} common pantry staples!`,
        type: 'success',
      })
    } else {
      addToast({
        message: 'All common pantry staples are already in your kitchen!',
        type: 'info',
      })
    }
  }

  function clearAll() {
    if (value.length === 0) return
    onChange([])
    addToast({ message: 'Cleared all kitchen ingredients.', type: 'info' })
  }

  return (
    <div className="ingredient-picker">
      {/* Left: Library of ingredients */}
      <div className="ingredient-library card-surface">
        {app.catalogStatus === 'loading' && (
          <div className="loading-view" role="status">
            <div className="nearby-spinner" aria-hidden="true" />
            <p>Loading pantry catalog…</p>
          </div>
        )}

        {app.catalogStatus === 'error' && (
          <div className="error-panel" role="alert">
            <div>
              <strong>The ingredient catalog is unavailable.</strong>
              <p>{app.catalogError}</p>
            </div>
            <button className="button button-outline" type="button" onClick={app.retryCatalog}>
              Try again
            </button>
          </div>
        )}

        <div className="picker-tools">
          <div className="picker-search-bar">
            <SearchIcon className="picker-search-icon" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search vegetables, spices, pulses, grains…"
              className="picker-search-input"
              aria-label="Search ingredients"
            />
            {query && (
              <button
                type="button"
                className="picker-search-clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="picker-shortcuts-bar">
            <button type="button" className="staples-quick-btn" onClick={addStaples}>
              ✨ + Add 8 Kitchen Staples (Oil, Salt, Onion, Tomato...)
            </button>
          </div>

          {/* Category Tabs */}
          <div className="category-tabs" role="tablist" aria-label="Ingredient categories">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={category === item}
                className={`category-tab-btn ${category === item ? 'active' : ''}`}
                onClick={() => setCategory(item)}
              >
                <span className="tab-icon" aria-hidden="true">
                  {categoryIcons[item] || '🥗'}
                </span>
                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ingredients Grid */}
        <div className="ingredient-grid">
          {filtered.map((item) => {
            const isSelected = selected.has(item.id)
            return (
              <button
                key={item.id}
                type="button"
                className={`ingredient-option ${isSelected ? 'selected' : ''}`}
                onClick={() => toggle(item)}
                aria-pressed={isSelected}
              >
                <span className="ingredient-option-mark">
                  {isSelected ? <CheckIcon /> : '+'}
                </span>
                <span className="ingredient-name-text">{item.name}</span>
                {item.category && <small className="ingredient-cat-label">{item.category}</small>}
              </button>
            )
          })}
          {!filtered.length && (
            <div className="empty-search-state">
              <p>No ingredients match "{query}".</p>
              <p className="tiny-note">You can add it as a custom ingredient below!</p>
            </div>
          )}
        </div>

        {/* Custom Ingredient Form */}
        <form className="custom-ingredient-form" onSubmit={addCustom}>
          <input
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            placeholder="Don't see your ingredient? Add it here (e.g. Kasuri Methi)"
            aria-label="Custom ingredient name"
          />
          <button className="button button-outline" type="submit">
            + Add custom
          </button>
        </form>
      </div>

      {/* Right: Selected Ingredients Pantry Aside */}
      <aside className="selected-ingredients card-surface">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">YOUR KITCHEN PANTRY</p>
            <h3>
              In Stock <span className="count-pill">{value.length}</span>
            </h3>
          </div>
          {value.length > 0 && (
            <button type="button" className="clear-pantry-btn" onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={pantryAlwaysAvailable}
            onChange={(event) => onPantryChange(event.target.checked)}
          />
          <span>Include pantry basics automatically</span>
        </label>
        {pantryAlwaysAvailable && (
          <p className="tiny-note">
            Oil, salt, and mixed spices are always counted as available in your kitchen.
          </p>
        )}

        <div className="selected-list">
          {value.map((item) => {
            const details = ingredientById[item.id]
            const name = item.name || details?.name || item.id
            return (
              <div className="selected-ingredient-card" key={item.id}>
                <div className="selected-card-main">
                  <span className="selected-name" title={name}>
                    {name}
                  </span>
                  <div className="selected-controls">
                    <input
                      aria-label={`${name} quantity`}
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={item.quantity}
                      onChange={(event) =>
                        update(item.id, { quantity: Number(event.target.value) })
                      }
                      className="quantity-input"
                    />
                    <select
                      aria-label={`${name} unit`}
                      value={item.unit}
                      onChange={(event) => update(item.id, { unit: event.target.value })}
                      className="unit-select"
                    >
                      {['g', 'kg', 'piece', 'cup', 'ml', 'litre'].map((unit) => (
                        <option key={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  className="remove-button"
                  onClick={() => onChange(value.filter((entry) => entry.id !== item.id))}
                  aria-label={`Remove ${name} from pantry`}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            )
          })}

          {!value.length && (
            <div className="empty-inline">
              <PantryIcon className="empty-icon" />
              <strong>Your pantry is currently empty.</strong>
              <p>
                Tap ingredients from the library on the left, or use the "Add 8 Staples" button to
                populate quickly.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
