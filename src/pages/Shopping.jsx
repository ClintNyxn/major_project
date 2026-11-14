import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { useApp } from '../context/useApp.js'
import { useToast } from '../context/useToast.js'
import { getIngredientCost } from '../utils/recipeMath.js'
import { ShoppingBagIcon, CheckIcon } from '../components/Icons.jsx'

export default function Shopping() {
  const { shopping, updateShoppingItem, removeShoppingItem, addCustomShopping, ingredientById } =
    useApp()
  const { addToast } = useToast()

  const [customItem, setCustomItem] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'pending' | 'purchased'

  const pendingItems = useMemo(() => shopping.filter((item) => !item.purchased), [shopping])
  const purchasedItems = useMemo(() => shopping.filter((item) => item.purchased), [shopping])

  const pendingTotal = useMemo(
    () => pendingItems.reduce((sum, item) => sum + Number(item.cost || 0), 0),
    [pendingItems]
  )

  const fullTotal = useMemo(
    () => shopping.reduce((sum, item) => sum + Number(item.cost || 0), 0),
    [shopping]
  )

  const progressPercent = shopping.length
    ? Math.round((purchasedItems.length / shopping.length) * 100)
    : 0

  function handleAdd(event) {
    event.preventDefault()
    if (!customItem.trim()) return
    addCustomShopping(customItem.trim())
    addToast({ message: `Added "${customItem.trim()}" to your list!`, type: 'success' })
    setCustomItem('')
  }

  function handleCopyList() {
    if (!shopping.length) return
    const textLines = [
      '🛒 KhaanaKya? Shopping List:',
      ...pendingItems.map(
        (i) => `• [ ] ${i.name} - ${i.quantity} ${i.unit} ${i.cost ? `(~₹${Math.round(i.cost)})` : ''}`
      ),
      ...(purchasedItems.length > 0
        ? [
            '',
            '✓ Already bought:',
            ...purchasedItems.map((i) => `• [x] ${i.name} - ${i.quantity} ${i.unit}`),
          ]
        : []),
      '',
      `Estimated total: ₹${Math.round(pendingTotal)}`,
    ]
    navigator.clipboard
      ?.writeText(textLines.join('\n'))
      .then(() => {
        addToast({ message: 'Shopping list copied to clipboard!', type: 'success' })
      })
      .catch(() => {
        addToast({ message: 'Could not copy to clipboard.', type: 'warn' })
      })
  }

  function handleClearPurchased() {
    purchasedItems.forEach((item) => removeShoppingItem(item.id))
    addToast({ message: 'Cleared completed items.', type: 'info' })
  }

  function toggleAll(purchased) {
    shopping.forEach((item) => updateShoppingItem(item.id, { purchased }))
  }

  const displayedItems =
    filter === 'pending' ? pendingItems : filter === 'purchased' ? purchasedItems : shopping

  return (
    <div className="shopping-page">
      <PageHeader
        eyebrow="ONLY WHAT'S MISSING"
        title="A practical list for the market."
        description="Missing items gathered from recipes you’ve chosen. Quantities and sample costs are pre-calculated."
        action={
          <div className="shopping-header-total">
            <span className="estimated-total">
              ₹{pendingTotal.toFixed(0)}
              <small>estimated · {pendingItems.length} items to buy</small>
            </span>
          </div>
        }
      />

      {/* Shopping Overview Card */}
      {shopping.length > 0 && (
        <section className="shopping-summary-card card-surface">
          <div className="shopping-progress-header">
            <div>
              <strong>
                {purchasedItems.length} of {shopping.length} items checked off ({progressPercent}%)
              </strong>
              <small className="muted">
                Total cart value: ₹{fullTotal.toFixed(0)} (₹{pendingTotal.toFixed(0)} remaining)
              </small>
            </div>

            <div className="shopping-quick-actions">
              <button
                type="button"
                className="button button-small button-outline"
                onClick={handleCopyList}
                title="Copy formatted list to share on WhatsApp or SMS"
              >
                📋 Copy list
              </button>
              {purchasedItems.length > 0 && (
                <button
                  type="button"
                  className="button button-small button-outline"
                  onClick={handleClearPurchased}
                >
                  Clear completed
                </button>
              )}
            </div>
          </div>

          <div className="shopping-progress-track">
            <div
              className="shopping-progress-bar"
              style={{ width: `${progressPercent}%` }}
              aria-valuenow={progressPercent}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </section>
      )}

      {/* Add Custom Item Form */}
      <form className="custom-ingredient-form shopping-add-form card-surface" onSubmit={handleAdd}>
        <input
          aria-label="Custom shopping-list item"
          value={customItem}
          onChange={(event) => setCustomItem(event.target.value)}
          placeholder="Add an item (e.g. 500g fresh paneer, 1 bunch coriander)"
          className="shopping-input"
        />
        <button className="button button-primary" type="submit">
          + Add item
        </button>
      </form>

      {/* Filter Tabs & Bulk Actions */}
      {shopping.length > 0 && (
        <div className="shopping-filter-toolbar">
          <div className="filter-pills-wrap">
            <button
              type="button"
              className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({shopping.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              To buy ({pendingItems.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === 'purchased' ? 'active' : ''}`}
              onClick={() => setFilter('purchased')}
            >
              Completed ({purchasedItems.length})
            </button>
          </div>

          <div className="shopping-bulk-links">
            <button
              type="button"
              className="text-link-small"
              onClick={() => toggleAll(true)}
            >
              Check all
            </button>
            <span>·</span>
            <button
              type="button"
              className="text-link-small"
              onClick={() => toggleAll(false)}
            >
              Uncheck all
            </button>
          </div>
        </div>
      )}

      {/* Shopping List Table / Rows */}
      <div className="shopping-list-container card-surface">
        {displayedItems.map((item) => (
          <article
            className={`shopping-row ${item.purchased ? 'purchased' : ''}`}
            key={item.id}
          >
            <label className="shopping-check" title={item.purchased ? 'Mark as to-buy' : 'Mark as purchased'}>
              <input
                type="checkbox"
                checked={item.purchased}
                onChange={(event) =>
                  updateShoppingItem(item.id, { purchased: event.target.checked })
                }
              />
              <span className="check-mark">
                {item.purchased && <CheckIcon className="check-svg" />}
              </span>
            </label>

            <div className="shopping-item-name">
              <strong>{item.name}</strong>
              <small>
                {item.recipeName ? (
                  <Link to={`/recipe/${item.recipeId}`}>Recipe: {item.recipeName}</Link>
                ) : (
                  'Added manually'
                )}
              </small>
            </div>

            <label className="shopping-quantity">
              <span className="sr-only">Quantity for {item.name}</span>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={item.quantity}
                onChange={(event) => {
                  const quantity = Number(event.target.value)
                  updateShoppingItem(item.id, {
                    quantity,
                    cost: getIngredientCost(item, quantity, item.unit, ingredientById),
                  })
                }}
                className="shopping-qty-input"
              />
              <span className="unit-label">{item.unit}</span>
            </label>

            <strong className="shopping-cost">
              {item.cost ? `₹${Number(item.cost).toFixed(0)}` : '—'}
            </strong>

            <button
              type="button"
              className="remove-button"
              onClick={() => removeShoppingItem(item.id)}
              aria-label={`Remove ${item.name}`}
              title="Remove from list"
            >
              ×
            </button>
          </article>
        ))}

        {!shopping.length && (
          <div className="empty-state">
            <ShoppingBagIcon className="empty-icon" />
            <p className="eyebrow">YOUR LIST IS CLEAR</p>
            <h2>Nothing on your shopping list.</h2>
            <p>
              When you browse recipes, any missing ingredients can be added here with one click.
            </p>
            <Link className="button button-primary" to="/recommendations">
              Browse recipes <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}

        {Boolean(shopping.length) && !displayedItems.length && (
          <div className="empty-state">
            <p>No items match this filter.</p>
            <button
              type="button"
              className="button button-outline"
              onClick={() => setFilter('all')}
            >
              View all items
            </button>
          </div>
        )}
      </div>

      <div className="shopping-footnote">
        <span>Sample price estimates only. No commercial store availability or live pricing.</span>
        <Link to="/recommendations" className="text-link">
          Find more recipes →
        </Link>
      </div>
    </div>
  )
}
