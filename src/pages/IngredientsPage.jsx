import PageHeader from '../components/PageHeader.jsx'
import IngredientPicker from '../components/IngredientPicker.jsx'
import { useApp } from '../context/useApp.js'
import { Link } from 'react-router-dom'

export default function IngredientsPage() {
  const app = useApp()
  return <div><PageHeader eyebrow="YOUR PANTRY INVENTORY" title="What's in your kitchen?" description="Update the ingredients you have on hand. Recipe matches adjust as your selection changes." />
    <IngredientPicker value={app.ingredients} onChange={app.setIngredients} pantryAlwaysAvailable={app.pantryAlwaysAvailable} onPantryChange={app.setPantryAlwaysAvailable} />
    <div className="page-action-row"><span className="tiny-note">Your list is saved on this device.</span><Link className="button button-primary" to="/recommendations">See matching recipes →</Link></div>
  </div>
}
