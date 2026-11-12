import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { useApp } from '../context/useApp.js'

export default function Profile() {
  const app = useApp()
  const [values, setValues] = useState({ ...app.profile, servings: app.servings })
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  function save() {
    if (!values.name.trim()) return setError('Name cannot be empty.')
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return setError('Enter a valid email address.')
    if (values.phone && !/^[+()\d\s-]{7,20}$/.test(values.phone)) return setError('Enter a valid phone number.')
    if (values.pinCode && !/^\d{6}$/.test(values.pinCode)) return setError('Enter a valid 6-digit PIN code.')
    app.updateProfile(values)
    app.setServings(values.servings)
    setError('')
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: key === 'servings' ? Number(event.target.value) : event.target.value }))
  return <div><PageHeader eyebrow="YOUR ACCOUNT, YOUR WAY" title="Profile settings." description="Your profile and default serving size are stored on this device." />
    {saved && <p className="success-note" role="status">Profile details saved.</p>}
    <section className="settings-section"><div className="form-grid">
      <label className="form-field"><span>Full name</span><input value={values.name} onChange={set('name')} autoComplete="name" /></label>
      <label className="form-field"><span>Email address</span><input type="email" value={values.email} onChange={set('email')} autoComplete="email" /></label>
      <label className="form-field"><span>Phone number</span><input type="tel" value={values.phone} onChange={set('phone')} autoComplete="tel" /></label>
      <label className="form-field"><span>City or location</span><input value={values.city} onChange={set('city')} autoComplete="address-level2" /></label>
      <label className="form-field"><span>Address <small>Optional</small></span><input value={values.address} onChange={set('address')} autoComplete="street-address" /></label>
      <label className="form-field"><span>PIN code <small>Optional</small></span><input value={values.pinCode} onChange={set('pinCode')} inputMode="numeric" /></label>
      <label className="form-field"><span>Default number of people</span><input type="number" min="1" max="20" value={values.servings} onChange={set('servings')} /></label>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <p className="tiny-note">Food preferences, health goals and allergy exclusions can be changed on the <Link className="text-link" to="/preferences">preferences page</Link>.</p>
    <button className="button button-primary settings-save" onClick={save}>Save profile</button></section>
  </div>
}
