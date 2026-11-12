import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import RecipeCard from '../components/RecipeCard.jsx'
import { useApp } from '../context/useApp.js'
import { recipeById } from '../data/recipes.js'

export default function Favorites() {
  const { favorites } = useApp()
  const saved = favorites.map((id) => recipeById[id]).filter(Boolean)
  return <div><PageHeader eyebrow="RECIPES TO RETURN TO" title="Saved for another day." description="Keep your promising ideas close. Your saved recipes stay on this device." />
    {saved.length ? <div className="recipe-grid">{saved.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}</div> : <div className="empty-state"><p className="eyebrow">A LITTLE SPACE FOR GOOD IDEAS</p><h2>No saved recipes yet.</h2><p>Save a recipe from your recommendations and it will be waiting here.</p><Link className="button button-primary" to="/recommendations">Browse recipes <span aria-hidden="true">→</span></Link></div>}
  </div>
}
