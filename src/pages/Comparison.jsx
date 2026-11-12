import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { useApp } from '../context/useApp.js'
import { recipeById } from '../data/recipes.js'
import { getAvailability, getRecipeCosts } from '../utils/recipeMath.js'

const metrics = ['Calories per serving', 'Protein', 'Carbohydrates', 'Fat', 'Fibre', 'Estimated recipe cost', 'Preparation time', 'Ingredient match']

function metricNumber(label, recipe, app) {
  if (label === 'Calories per serving') return recipe.nutrition.calories
  if (label === 'Protein') return recipe.nutrition.protein
  if (label === 'Carbohydrates') return recipe.nutrition.carbs
  if (label === 'Fat') return recipe.nutrition.fat
  if (label === 'Fibre') return recipe.nutrition.fibre
  if (label === 'Estimated recipe cost') return getRecipeCosts(recipe, app.servings).total
  if (label === 'Preparation time') return recipe.prepTime + recipe.cookTime
  return getAvailability(recipe, app.ingredients, app.pantryAlwaysAvailable ? ['oil', 'salt', 'spices'] : []).match
}

function metricValue(label, recipe, app) {
  const number = metricNumber(label, recipe, app)
  if (label === 'Calories per serving') return `${number} kcal`
  if (['Protein', 'Carbohydrates', 'Fat', 'Fibre'].includes(label)) return `${number} g`
  if (label === 'Estimated recipe cost') return `₹${number}`
  if (label === 'Preparation time') return `${number} min`
  return `${number}%`
}

function isRelevantBest(label, recipe, candidates, app) {
  if (candidates.length < 2) return false
  const values = candidates.map((item) => metricNumber(label, item, app))
  const current = metricNumber(label, recipe, app)
  const goals = app.preferences.healthGoals
  const lowerIsBetter = label === 'Estimated recipe cost' || label === 'Preparation time'
    || (label === 'Calories per serving' && goals.some((goal) => ['Low Calorie', 'Weight Management'].includes(goal)))
    || (label === 'Carbohydrates' && goals.includes('Low Carb'))
  const higherIsBetter = (label === 'Protein' && goals.some((goal) => ['High Protein', 'Muscle Building'].includes(goal)))
    || (label === 'Fibre' && goals.includes('High Fibre'))
    || (label === 'Ingredient match')
  if (!lowerIsBetter && !higherIsBetter) return false
  const target = lowerIsBetter ? Math.min(...values) : Math.max(...values)
  return current === target
}

export default function Comparison() {
  const app = useApp()
  const { compared, toggleCompare } = app
  const selected = compared.map((id) => recipeById[id]).filter(Boolean)
  return <div><PageHeader eyebrow="SIDE BY SIDE, NO GUESSWORK" title="Compare your options." description="Nutrition values are per serving. What suits you depends on the goals you've chosen." action={<span className="sample-label">ESTIMATES · NOT MEDICAL ADVICE</span>} />
    {!selected.length ? <div className="empty-state"><p className="eyebrow">YOUR COMPARISON IS EMPTY</p><h2>Choose up to three recipes.</h2><p>Select Compare on a recipe card, then return here to weigh up your options.</p><Link className="button button-primary" to="/recommendations">Browse recommendations →</Link></div> : <div className="comparison-wrap">
      <p className="tiny-note">{selected.length} of 3 recipe{selected.length === 1 ? '' : 's'} selected · cooking for {app.servings}</p>
      <div className="comparison-scroll"><table className="comparison-table"><thead><tr><th>Per recipe</th>{selected.map((recipe) => <th key={recipe.id}><div className="comparison-recipe"><img src={recipe.image} alt="" /><span>{recipe.name}</span><button className="remove-compare" onClick={() => toggleCompare(recipe.id)} aria-label={`Remove ${recipe.name} from comparison`}>Remove</button></div></th>)}</tr></thead><tbody>
        {metrics.map((label) => <tr key={label}><th>{label}</th>{selected.map((recipe) => {
          const current = metricValue(label, recipe, app)
          const best = isRelevantBest(label, recipe, selected, app)
          return <td className={best ? 'comparison-best' : ''} key={recipe.id}>{current}{best && <small>Best for this measure</small>}</td>
        })}</tr>)}
      </tbody></table></div>
      <p className="safety-note">The table highlights relative values among selected recipes. It doesn't label a recipe universally healthy. Match percentages are recalculated on the recommendation screen using your kitchen selection.</p>
      <Link to="/recommendations" className="text-link">Add another recipe →</Link>
    </div>}
  </div>
}
