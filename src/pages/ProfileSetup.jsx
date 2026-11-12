import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../components/OnboardingLayout.jsx'
import { useApp } from '../context/useApp.js'

export default function ProfileSetup() {
  const { profile, updateProfile } = useApp()
  const navigate = useNavigate()
  const [values, setValues] = useState(profile)
  const [error, setError] = useState('')
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))

  function next() {
    if (!values.name.trim()) return setError('Please enter your name to personalize your meal ideas.')
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return setError('Enter a valid email address.')
    if (values.phone && !/^[+()\d\s-]{7,20}$/.test(values.phone)) return setError('Enter a valid phone number.')
    if (values.pinCode && !/^\d{6}$/.test(values.pinCode)) return setError('Enter a valid 6-digit PIN code.')
    setError('')
    updateProfile(values)
    navigate('/setup/preferences')
  }

  return <OnboardingLayout step={1} title="Let's make this personal." description="A few details help us make your meal planning feel a little more like yours." onNext={next} nextLabel="Continue to preferences">
    <div className="form-grid">
      <label className="form-field full"><span>Full name <b>*</b></span><input value={values.name} onChange={set('name')} placeholder="Your name" autoComplete="name" /></label>
      <label className="form-field"><span>Email address</span><input value={values.email} onChange={set('email')} type="email" placeholder="you@example.com" autoComplete="email" /></label>
      <label className="form-field"><span>Phone number</span><input value={values.phone} onChange={set('phone')} type="tel" placeholder="+91 98765 43210" autoComplete="tel" /></label>
      <label className="form-field"><span>City or location</span><input value={values.city} onChange={set('city')} placeholder="e.g. Bengaluru" autoComplete="address-level2" /></label>
      <label className="form-field"><span>PIN code <small>Optional</small></span><input value={values.pinCode} onChange={set('pinCode')} placeholder="6-digit PIN" inputMode="numeric" /></label>
      <label className="form-field full"><span>Address <small>Optional</small></span><input value={values.address} onChange={set('address')} placeholder="You don't need a full address to get recipe ideas" autoComplete="street-address" /></label>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <p className="privacy-note">Your details stay on this device in this prototype.</p>
  </OnboardingLayout>
}
