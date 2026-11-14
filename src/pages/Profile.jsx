import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import Avatar from '../components/Avatar.jsx'
import { useApp } from '../context/useApp.js'
import { useAuth } from '../context/useAuth.js'
import { cropAndResizeImage, formatAvatarError, validateAvatarFile } from '../utils/avatarUtils.js'

export default function Profile() {
  const app = useApp()
  const auth = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [values, setValues] = useState({
    ...app.profile,
    email: auth.user?.email || app.profile.email,
    servings: app.servings,
  })
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [canSignOutAnyway, setCanSignOutAnyway] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // Avatar state
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [avatarSuccess, setAvatarSuccess] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)

  const currentAvatarUrl =
    previewUrl !== null
      ? previewUrl
      : values.avatar_url || app.profile.avatar_url || auth.user?.user_metadata?.avatar_url || ''

  async function handleFileSelect(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setAvatarError('')
    setAvatarSuccess('')

    const validation = validateAvatarFile(file)
    if (!validation.valid) {
      setAvatarError(validation.error)
      return
    }

    setAvatarLoading(true)

    try {
      const { blob, dataUrl } = await cropAndResizeImage(file, 256, 0.85)

      // Instant preview
      setPreviewUrl(dataUrl)

      if (!auth.user) {
        // Guest mode: save resized data URL in localStorage via AppContext
        app.updateProfile({ avatar_url: dataUrl })
        setValues((current) => ({ ...current, avatar_url: dataUrl }))
        setPreviewUrl(null)
        setAvatarSuccess('Profile picture saved on this device.')
        return
      }

      // Signed-in user: upload to Supabase Storage
      const client = auth.client
      if (!client) throw new Error('Supabase client is not connected.')

      const filePath = `${auth.user.id}/avatar.webp`
      const { error: uploadError } = await client.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: 'image/webp',
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = client.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const finalUrl = `${urlData.publicUrl}?v=${Date.now()}`

      // Update public.profiles table
      try {
        await client.from('profiles').upsert({
          id: auth.user.id,
          name: values.name || '',
          email: auth.user.email || '',
          avatar_url: finalUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
      } catch (profileErr) {
        console.warn('Could not update profiles table:', profileErr.message)
      }

      // Update auth user metadata
      try {
        await client.auth.updateUser({
          data: { avatar_url: finalUrl },
        })
      } catch (metaErr) {
        console.warn('Could not update auth user metadata:', metaErr.message)
      }

      // Update app state and local form state
      app.updateProfile({ avatar_url: finalUrl })
      setValues((current) => ({ ...current, avatar_url: finalUrl }))
      setPreviewUrl(null)
      setAvatarSuccess('Profile picture updated successfully.')
    } catch (err) {
      setPreviewUrl(null)
      setAvatarError(formatAvatarError(err))
    } finally {
      setAvatarLoading(false)
    }
  }

  async function handleRemovePhoto() {
    setAvatarError('')
    setAvatarSuccess('')
    setAvatarLoading(true)

    try {
      if (auth.user && auth.client) {
        const client = auth.client
        const filePath = `${auth.user.id}/avatar.webp`

        try {
          await client.storage.from('avatars').remove([filePath])
        } catch (storageErr) {
          console.warn('Could not delete avatar from storage:', storageErr.message)
        }

        try {
          await client.from('profiles').update({
            avatar_url: null,
            updated_at: new Date().toISOString(),
          }).eq('id', auth.user.id)
        } catch (profileErr) {
          console.warn('Could not update profiles table:', profileErr.message)
        }

        try {
          await client.auth.updateUser({
            data: { avatar_url: null },
          })
        } catch (metaErr) {
          console.warn('Could not update auth user metadata:', metaErr.message)
        }
      }

      app.updateProfile({ avatar_url: '' })
      setValues((current) => ({ ...current, avatar_url: '' }))
      setPreviewUrl(null)
      setAvatarSuccess('Profile picture removed.')
    } catch (err) {
      setAvatarError(formatAvatarError(err))
    } finally {
      setAvatarLoading(false)
    }
  }

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

    {/* Profile Picture Section */}
    <section className="profile-photo-card">
      <div className="profile-photo-row">
        <div className="profile-avatar-wrap">
          <Avatar
            size={96}
            user={{ ...auth.user, avatar_url: currentAvatarUrl, name: values.name }}
            className="profile-avatar-large"
          />
          {avatarLoading && (
            <div className="avatar-loading-overlay" aria-label="Loading...">
              <div className="avatar-spinner" />
            </div>
          )}
        </div>
        <div className="profile-photo-details">
          <h3>Profile picture</h3>
          <p className="profile-photo-hint">
            {auth.user
              ? 'Upload a photo in JPG, PNG, or WebP format up to 2 MB. It is automatically center-cropped to a square.'
              : 'Guest workspace: Your photo is stored on this device. Create an account to sync across devices.'}
          </p>
          <div className="profile-photo-actions">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <button
              type="button"
              className="button button-outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
            >
              {avatarLoading ? 'Processing…' : currentAvatarUrl ? 'Change photo' : 'Upload photo'}
            </button>
            {Boolean(currentAvatarUrl) && (
              <button
                type="button"
                className="button button-text profile-photo-remove"
                onClick={handleRemovePhoto}
                disabled={avatarLoading}
              >
                Remove
              </button>
            )}
          </div>
          {avatarError && <p className="form-error profile-photo-msg" role="alert">{avatarError}</p>}
          {avatarSuccess && <p className="success-note profile-photo-msg" role="status">{avatarSuccess}</p>}
        </div>
      </div>
    </section>

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
