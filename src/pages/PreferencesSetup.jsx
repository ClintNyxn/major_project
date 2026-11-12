import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../components/OnboardingLayout.jsx'
import { useApp } from '../context/useApp.js'

const foodTypes = ['Vegetarian', 'Non-Vegetarian', 'Pescatarian', 'Vegan', 'Eggetarian', 'No preference']
const cuisines = ['North Indian', 'South Indian', 'Chinese', 'Italian', 'Mexican', 'Continental', 'Thai', 'Japanese', 'Mediterranean', 'Street Food', 'Other']
const goals = ['High Protein', 'Low Calorie', 'Low Carb', 'Balanced Diet', 'Weight Management', 'Muscle Building', 'Low Sugar', 'Gluten Free', 'Dairy Free']
const allergies = ['Peanuts', 'Tree nuts', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Fish', 'Shellfish']
const budgets = [100, 200, 400, 600, 1000]

function ChoiceGroup({ title, options, selected, onToggle }) {
  return <fieldset className="choice-group"><legend>{title}</legend><div className="choice-options">{options.map((option) => <button type="button" key={option} className={`choice-chip ${selected.includes(option) ? 'selected' : ''}`} onClick={() => onToggle(option)} aria-pressed={selected.includes(option)}>{option}</button>)}</div></fieldset>
}

export default function PreferencesSetup() {
  const { preferences, updatePreferences } = useApp()
  const navigate = useNavigate()
  const [values, setValues] = useState(preferences)
  const [allergyText, setAllergyText] = useState('')
  const toggle = (field, item, single = false) => setValues((current) => ({
    ...current,
    [field]: single ? [item] : current[field].includes(item) ? current[field].filter((value) => value !== item) : [...current[field], item],
  }))
  const selectedFood = [values.foodType]

  function addAllergy() {
    const item = allergyText.trim()
    if (item && !values.allergies.some((allergy) => allergy.toLowerCase() === item.toLowerCase())) {
      setValues((current) => ({ ...current, allergies: [...current.allergies, item] }))
    }
    setAllergyText('')
  }

  function next() {
    updatePreferences(values)
    navigate('/setup/ingredients')
  }

  return <OnboardingLayout step={2} title="How do you like to eat?" description="Your preferences shape what we suggest. You can update these any time." backTo="/setup/profile" onNext={next} nextLabel="Continue to ingredients">
    <ChoiceGroup title="Food preference" options={foodTypes} selected={selectedFood} onToggle={(value) => setValues((current) => ({ ...current, foodType: value }))} />
    <ChoiceGroup title="Cuisines you enjoy" options={cuisines} selected={values.cuisines} onToggle={(value) => toggle('cuisines', value)} />
    <ChoiceGroup title="Health goals" options={goals} selected={values.healthGoals} onToggle={(value) => toggle('healthGoals', value)} />
    <fieldset className="choice-group"><legend>Allergies and intolerances</legend><div className="choice-options">{allergies.map((item) => <button type="button" key={item} className={`choice-chip allergy-chip ${values.allergies.includes(item) ? 'selected' : ''}`} onClick={() => toggle('allergies', item)} aria-pressed={values.allergies.includes(item)}>{item}</button>)}</div>
      <div className="custom-ingredient-form"><input value={allergyText} onChange={(event) => setAllergyText(event.target.value)} placeholder="Add another allergy" aria-label="Custom allergy" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addAllergy() } }} /><button type="button" className="button button-outline" onClick={addAllergy}>Add</button></div>
      {values.allergies.some((item) => !allergies.includes(item)) && <p className="tiny-note">Custom exclusions: {values.allergies.filter((item) => !allergies.includes(item)).join(', ')}</p>}
    </fieldset>
    <fieldset className="choice-group"><legend>Meal budget</legend><div className="choice-options">{budgets.map((amount, index) => {
      const label = index === 0 ? 'Under ₹100' : `₹${budgets[index - 1]}–₹${amount}`
      return <button type="button" key={amount} className={`choice-chip ${Number(values.budget) === amount ? 'selected' : ''}`} onClick={() => setValues((current) => ({ ...current, budget: amount }))}>{label}</button>
    })}<button type="button" className={`choice-chip ${values.budget > 1000 ? 'selected' : ''}`} onClick={() => setValues((current) => ({ ...current, budget: 1500 }))}>Custom</button></div>
      {values.budget > 1000 && <label className="inline-budget">Custom budget ₹ <input type="number" min="1" value={values.budget} onChange={(event) => setValues((current) => ({ ...current, budget: Number(event.target.value) }))} /></label>}
      <div className="budget-scope"><span>Budget applies to</span><button type="button" className={values.budgetScope === 'per person' ? 'active' : ''} onClick={() => setValues((current) => ({ ...current, budgetScope: 'per person' }))}>Per person</button><button type="button" className={values.budgetScope === 'complete meal' ? 'active' : ''} onClick={() => setValues((current) => ({ ...current, budgetScope: 'complete meal' }))}>Complete meal</button></div>
    </fieldset>
    <p className="safety-note">Allergy exclusions are applied strictly to recipe suggestions. Ingredient and nutrition data is an estimate.</p>
  </OnboardingLayout>
}
