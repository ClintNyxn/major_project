import { useNavigate } from 'react-router-dom'
import IngredientPicker from '../components/IngredientPicker.jsx'
import OnboardingLayout from '../components/OnboardingLayout.jsx'
import { useApp } from '../context/useApp.js'

export default function IngredientsSetup() {
  const app = useApp()
  const navigate = useNavigate()
  return <OnboardingLayout step={3} title="What ingredients do you have?" description="Pick what's in your kitchen. The more you select, the closer the recipe matches can be." backTo="/setup/preferences" onNext={() => navigate('/setup/servings')} nextLabel="Choose servings">
    <IngredientPicker value={app.ingredients} onChange={app.setIngredients} pantryAlwaysAvailable={app.pantryAlwaysAvailable} onPantryChange={app.setPantryAlwaysAvailable} />
    {app.ingredients.length < 3 && <p className="privacy-note">A few ingredients are enough to begin. We'll also show recipes that need just a couple more.</p>}
  </OnboardingLayout>
}
