import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { useApp } from '../context/useApp.js'
import { useAuth } from '../context/useAuth.js'

export default function Profile() {
  const app = useApp()
  const auth = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ ...app.profile, email: auth.user?.email || app.profile.email, servings: app.servings })
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [canSignOutAnyway, setCanSignOutAnyway] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
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
  async function signOut(force = false) {
    setSigningOut(true)
    setAccountError('')
    try {
      if (!force) await app.saveNow()
      await auth.signOut()
      navigate('/auth/login', { replace: true })
    } catch (signOutError) {
      setAccountError(`Could not sync before signing out. Your account is still active. ${signOutError.message}`)
      setCanSignOutAnyway(true)
    } finally {
      setSigningOut(false)
    }
  }
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: key === 'servings' ? Number(event.target.value) : event.target.value }))
  return <div><PageHeader eyebrow="YOUR ACCOUNT, YOUR WAY" title="Profile settings." description={auth.user ? 'Your profile and planner are synced to your account.' : 'Your profile and planner are stored on this device in guest mode.'} />
    {saved && <p className="success-note" role="status">Profile details saved.</p>}
    <section className="account-settings-panel">
      <div><p className="eyebrow">ACCOUNT</p><h2>{auth.user ? 'Your account is connected.' : 'You’re using a guest workspace.'}</h2><p>{auth.user ? `Signed in as ${auth.user.email}. Your planner is synced to your account.` : 'Create an account to sync your planner across devices.'}</p></div>
      {auth.user ? <div className="account-settings-actions">
        <Link className="button button-outline" to="/auth/update-password">Change password</Link>
        <button className="button button-outline" type="button" onClick={() => signOut()} disabled={signingOut}>{signingOut ? 'Signing out…' : 'Sign out'}</button>
      </div> : <Link className="button button-primary" to="/auth/signup">Create account</Link>}
      {accountError && <div className="account-settings-error"><p role="alert">{accountError}</p>{canSignOutAnyway && <button className="button button-text" type="button" onClick={() => signOut(true)} disabled={signingOut}>Sign out anyway</button>}</div>}
    </section>
    <section className="settings-section"><div className="form-grid">
      <label className="form-field"><span>Full name</span><input value={values.name} onChange={set('name')} autoComplete="name" /></label>
      <label className="form-field"><span>Email address</span><input type="email" value={values.email} onChange={set('email')} autoComplete="email" readOnly={Boolean(auth.user)} /></label>
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
