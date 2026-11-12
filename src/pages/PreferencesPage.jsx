import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { useApp } from '../context/useApp.js'

const foodTypes = ['Vegetarian', 'Non-Vegetarian', 'Pescatarian', 'Vegan', 'Eggetarian', 'No preference']
const goals = ['High Protein', 'Low Calorie', 'Low Carb', 'Balanced Diet', 'Weight Management', 'Muscle Building', 'Low Sugar', 'Gluten Free', 'Dairy Free']
const allergens = ['Peanuts', 'Tree nuts', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Fish', 'Shellfish', 'Sesame']

function MultiSelect({ title, options, value, onChange }) {
  return <fieldset className="choice-group"><legend>{title}</legend><div className="choice-options">{options.map((item) => <button key={item} type="button" className={`choice-chip ${value.includes(item) ? 'selected' : ''}`} onClick={() => onChange(value.includes(item) ? value.filter((option) => option !== item) : [...value, item])}>{item}</button>)}</div></fieldset>
}

export default function PreferencesPage() {
  const app = useApp()
  const cuisines = [...new Set(app.catalogRecipes.map((recipe) => recipe.cuisine))].sort()
  const [values, setValues] = useState(app.preferences)
  const [saved, setSaved] = useState(false)
  function save() { app.updatePreferences(values); setSaved(true); window.setTimeout(() => setSaved(false), 2500) }
  return <div><PageHeader eyebrow="TUNED TO YOUR TASTE" title="Your food preferences." description="These settings shape recommendation ranking. Allergy selections exclude matching recipes." action={<button className="button button-primary" onClick={save}>Save preferences</button>} />
    {saved && <p className="success-note" role="status">Your preferences have been saved on this device.</p>}
    <section className="settings-section"><h2>Food preference</h2><div className="choice-options">{foodTypes.map((item) => <button key={item} className={`choice-chip ${values.foodType === item ? 'selected' : ''}`} onClick={() => setValues({ ...values, foodType: item })}>{item}</button>)}</div></section>
    <section className="settings-section"><MultiSelect title="Cuisines" options={cuisines} value={values.cuisines} onChange={(cuisinesValue) => setValues({ ...values, cuisines: cuisinesValue })} />{app.catalogStatus === 'loading' && <p role="status" className="tiny-note">Loading available cuisines…</p>}{app.catalogStatus === 'error' && <p role="alert" className="form-error">{app.catalogError}</p>}</section>
    <section className="settings-section"><MultiSelect title="Health goals" options={goals} value={values.healthGoals} onChange={(healthGoals) => setValues({ ...values, healthGoals })} /></section>
    <section className="settings-section"><MultiSelect title="Allergies and intolerances" options={allergens} value={values.allergies} onChange={(allergiesValue) => setValues({ ...values, allergies: allergiesValue })} /><p className="safety-note">Allergens are strict exclusions in this prototype. Custom allergy entries can be added during onboarding.</p></section>
    <section className="settings-section"><h2>Budget and cooking time</h2><div className="form-grid"><label className="form-field"><span>Meal budget (₹)</span><input type="number" min="1" value={values.budget} onChange={(event) => setValues({ ...values, budget: Number(event.target.value) })} /></label><label className="form-field"><span>Budget applies to</span><select value={values.budgetScope} onChange={(event) => setValues({ ...values, budgetScope: event.target.value })}><option>per person</option><option>complete meal</option></select></label><label className="form-field"><span>Maximum preparation time</span><select value={values.maxTime} onChange={(event) => setValues({ ...values, maxTime: Number(event.target.value) })}><option value="20">20 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="120">No time limit</option></select></label></div></section>
    <div className="page-action-row"><Link className="button button-outline" to="/profile">Edit profile details</Link><button className="button button-primary" onClick={save}>Save preferences</button></div>
  </div>
}
