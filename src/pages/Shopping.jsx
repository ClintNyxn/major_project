import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { useApp } from '../context/useApp.js'
import { getIngredientCost } from '../utils/recipeMath.js'

export default function Shopping() {
  const { shopping, updateShoppingItem, removeShoppingItem, addCustomShopping, ingredientById } = useApp()
  const [customItem, setCustomItem] = useState('')
  const total = useMemo(() => shopping.filter((item) => !item.purchased).reduce((sum, item) => sum + Number(item.cost || 0), 0), [shopping])
  function add(event) {
    event.preventDefault()
    if (!customItem.trim()) return
    addCustomShopping(customItem.trim())
    setCustomItem('')
  }
  return <div><PageHeader eyebrow="ONLY WHAT'S MISSING" title="A list for the market." description="Missing ingredients from recipes you've chosen, gathered in one place. No ordering, just a plan." action={<span className="estimated-total">₹{total.toFixed(0)}<small>estimated · unpurchased items</small></span>} />
    <form className="custom-ingredient-form shopping-add-form" onSubmit={add}><input aria-label="Custom shopping-list item" value={customItem} onChange={(event) => setCustomItem(event.target.value)} placeholder="Add an item to your list" /><button className="button button-outline" type="submit">Add item</button></form>
    <div className="shopping-list">
      {shopping.map((item) => <article className={`shopping-row ${item.purchased ? 'purchased' : ''}`} key={item.id}>
        <label className="shopping-check"><input type="checkbox" checked={item.purchased} onChange={(event) => updateShoppingItem(item.id, { purchased: event.target.checked })} /><span className="check-mark" /></label>
        <div className="shopping-item-name"><strong>{item.name}</strong><small>{item.recipeName ? <Link to={`/recipe/${item.recipeId}`}>For {item.recipeName}</Link> : 'Added by you'}</small></div>
        <label className="shopping-quantity"><span className="sr-only">Quantity for {item.name}</span><input type="number" min="0.1" step="0.1" value={item.quantity} onChange={(event) => {
          const quantity = Number(event.target.value)
          updateShoppingItem(item.id, { quantity, cost: getIngredientCost(item, quantity, item.unit, ingredientById) })
        }} /><span>{item.unit}</span></label>
        <strong className="shopping-cost">{item.cost ? `₹${Number(item.cost).toFixed(0)}` : 'No estimate'}</strong>
        <button className="remove-button" onClick={() => removeShoppingItem(item.id)} aria-label={`Remove ${item.name}`}>×</button>
      </article>)}
      {!shopping.length && <div className="empty-state"><p className="eyebrow">YOUR SHOPPING LIST IS CLEAR</p><h2>Nothing to pick up yet.</h2><p>Choose a recipe and add its missing ingredients here.</p><Link className="button button-primary" to="/recommendations">Find recipes <span aria-hidden="true">→</span></Link></div>}
    </div>
    <div className="shopping-footnote"><span>Sample price estimates only. No store availability or live pricing is connected.</span><Link to="/recommendations">Find recipes →</Link></div>
  </div>
}
