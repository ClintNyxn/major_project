import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../components/OnboardingLayout.jsx'
import ServingSelector from '../components/ServingSelector.jsx'
import { useApp } from '../context/useApp.js'

export default function ServingsSetup() {
  const app = useApp()
  const navigate = useNavigate()
  return <OnboardingLayout step={4} title="How many are at the table?" description="Recipe quantities and estimated ingredient costs adjust to your serving size." backTo="/setup/ingredients" onNext={() => navigate('/recommendations')} nextLabel="Show my recommendations">
    <div className="servings-panel"><p className="eyebrow">YOUR HOUSEHOLD</p><ServingSelector /><label className="form-field servings-input"><span>Or enter a number</span><input type="number" min="1" max="20" value={app.servings} onChange={(event) => app.setServings(event.target.value)} /></label><p className="tiny-note">Choose from 1 to 20 servings.</p></div>
  </OnboardingLayout>
}
