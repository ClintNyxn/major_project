import { useMemo, useState } from 'react'
import { useApp } from '../context/useApp.js'

export default function IngredientPicker({ value, onChange, pantryAlwaysAvailable, onPantryChange }) {
  const app = useApp()
  const ingredients = app.catalogIngredients
  const ingredientById = app.ingredientById
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [customName, setCustomName] = useState('')
  const selected = new Map(value.map((item) => [item.id, item]))
  const filtered = useMemo(() => ingredients.filter((item) => {
    const matchesText = item.name.toLowerCase().includes(query.toLowerCase())
    return matchesText && (category === 'All' || item.category === category)
  }), [category, ingredients, query])
  const categories = ['All', ...new Set(ingredients.map((item) => item.category))]

  function toggle(item) {
    if (selected.has(item.id)) onChange(value.filter((entry) => entry.id !== item.id))
    else onChange([...value, {
      id: item.id,
      quantity: item.priceUnit === 'kg' ? 500 : item.priceUnit === 'litre' ? 500 : 1,
      unit: item.priceUnit === 'kg' ? 'g' : item.priceUnit === 'litre' ? 'ml' : item.priceUnit,
    }])
  }

  function update(id, updates) {
    onChange(value.map((item) => item.id === id ? { ...item, ...updates } : item))
  }

  function addCustom(event) {
    event.preventDefault()
    const name = customName.trim()
    if (!name) return
    const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    if (!selected.has(id)) onChange([...value, { id, name, quantity: 1, unit: 'piece', custom: true }])
    setCustomName('')
  }

  return (
    <div className="ingredient-picker">
      <div className="ingredient-library">
        {app.catalogStatus === 'loading' && <p className="loading-view" role="status">Loading ingredients from the food catalog…</p>}
        {app.catalogStatus === 'error' && <div className="error-panel" role="alert"><div><strong>The ingredient catalog is unavailable.</strong><p>{app.catalogError}</p></div><button className="button button-outline" type="button" onClick={app.retryCatalog}>Try again</button></div>}
        {app.catalogStatus === 'success' && !ingredients.length && <p className="empty-state">No ingredients are available in the catalog yet.</p>}
        <div className="picker-tools">
          <label className="search-field"><span className="sr-only">Search ingredients</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ingredients..." /></label>
          <div className="category-tabs" aria-label="Ingredient categories">
            {categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
        </div>
        <div className="ingredient-grid">
          {filtered.map((item) => <button key={item.id} className={`ingredient-option ${selected.has(item.id) ? 'selected' : ''}`} onClick={() => toggle(item)} aria-pressed={selected.has(item.id)}>
            <span className="ingredient-option-mark">{selected.has(item.id) ? '−' : '+'}</span>
            <span>{item.name}</span>
          </button>)}
          {!filtered.length && <p className="muted">No ingredients match that search.</p>}
        </div>
        <form className="custom-ingredient-form" onSubmit={addCustom}>
          <input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Add an ingredient not listed" aria-label="Custom ingredient name" />
          <button className="button button-outline" type="submit">Add ingredient</button>
        </form>
      </div>
      <aside className="selected-ingredients">
        <div className="section-title-row"><div><p className="eyebrow">Your kitchen</p><h3>Selected ingredients <span className="count-pill">{value.length}</span></h3></div></div>
        <label className="toggle-row"><input type="checkbox" checked={pantryAlwaysAvailable} onChange={(event) => onPantryChange(event.target.checked)} /><span>Assume pantry basics are available</span></label>
        {pantryAlwaysAvailable && <p className="tiny-note">Oil, salt and mixed spices will be counted as available.</p>}
        <div className="selected-list">
          {value.map((item) => {
            const details = ingredientById[item.id]
            const name = item.name || details?.name || item.id
            return <div className="selected-ingredient" key={item.id}>
              <span className="selected-name">{name}</span>
              <input aria-label={`${name} quantity`} type="number" min="0.1" step="0.1" value={item.quantity} onChange={(event) => update(item.id, { quantity: Number(event.target.value) })} />
              <select aria-label={`${name} unit`} value={item.unit} onChange={(event) => update(item.id, { unit: event.target.value })}>
                {['g', 'kg', 'piece', 'cup', 'ml', 'litre'].map((unit) => <option key={unit}>{unit}</option>)}
              </select>
              <button className="remove-button" onClick={() => onChange(value.filter((entry) => entry.id !== item.id))} aria-label={`Remove ${name}`}>×</button>
            </div>
          })}
          {!value.length && <div className="empty-inline">Choose a few ingredients to get started. You can still browse all recipe ideas.</div>}
        </div>
      </aside>
    </div>
  )
}
