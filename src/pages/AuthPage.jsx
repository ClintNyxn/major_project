import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { enterGuestMode } from '../utils/guestMode.js'
import { authErrorMessage } from '../utils/authErrors.js'

const pageCopy = {
  signup: {
    eyebrow: 'A LITTLE MORE PERSONAL',
    title: 'Make room for good food.',
    description: 'Create an account to keep your recipes, preferences and shopping list in sync.',
    submit: 'Create account',
  },
  login: {
    eyebrow: 'WELCOME BACK',
    title: 'Your kitchen, right where you left it.',
    description: 'Sign in to pick up your meal plan and saved recipes.',
    submit: 'Sign in',
  },
  forgot: {
    eyebrow: 'ACCOUNT RECOVERY',
    title: 'Let’s get you back in.',
    description: 'We’ll send a secure password reset link to your email address.',
    submit: 'Send reset link',
  },
  'update-password': {
    eyebrow: 'ACCOUNT RECOVERY',
    title: 'Choose a new password.',
    description: 'Use a password you haven’t used for another account.',
    submit: 'Save new password',
  },
}

export default function AuthPage({ mode }) {
  const { client, configError, sessionError, signUp, signIn, resetPassword, updatePassword, resendConfirmation } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const copy = pageCopy[mode]
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (mode === 'signup' && !name.trim()) return setError('Enter your name to create an account.')
    if (mode === 'signup' || mode === 'update-password') {
      if (password.length < 8) return setError('Choose a password with at least 8 characters.')
      if (password !== confirmPassword) return setError('The passwords do not match.')
    }

    setBusy(true)
    try {
      if (mode === 'signup') {
        const result = await signUp({ name: name.trim(), email: email.trim(), password })
        if (result.session) {
          navigate('/dashboard', { replace: true })
        } else {
          setConfirmationEmail(email.trim())
          setNotice('Supabase accepted your sign-up. Check your inbox and spam folder for a verification link. If no email arrives, the project owner may need to configure email delivery.')
        }
      } else if (mode === 'login') {
        await signIn({ email: email.trim(), password })
        navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
      } else if (mode === 'forgot') {
        await resetPassword(email.trim())
        setNotice('If an account exists for that address, a password reset link is on its way.')
      } else {
        await updatePassword(password)
        setNotice('Your password has been updated.')
      }
    } catch (requestError) {
      if (mode === 'login' && requestError.code === 'email_not_confirmed') {
        setConfirmationEmail(email.trim())
        setNotice('This account still needs email verification. Request a fresh link below.')
      } else {
        setError(authErrorMessage(requestError, 'That request could not be completed. Please try again.'))
      }
    } finally {
      setBusy(false)
    }
  }

  async function resendVerification() {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await resendConfirmation(confirmationEmail)
      setNotice('Supabase accepted the resend request. Check your inbox and spam folder. If it does not arrive, the project owner may need to configure email delivery or check its sending limits.')
    } catch (requestError) {
      setError(authErrorMessage(requestError, 'The verification email could not be sent. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  function continueAsGuest() {
    enterGuestMode()
    navigate('/setup/profile')
  }

  return <main className="auth-screen">
    <header className="auth-topbar">
      <Link to="/" className="brand-lockup"><span className="brand-mark">K</span><span>KhaanaKya<span className="brand-question">?</span></span></Link>
      <Link to="/" className="auth-home-link">Back to home</Link>
    </header>
    <div className="auth-content">
      <aside className="auth-story">
        <p className="eyebrow">YOUR INGREDIENTS. YOUR NEXT MEAL.</p>
        <h2>Make everyday<br /><em>feel homemade.</em></h2>
        <p>Keep your tastes, favorite recipes and meal plans together, wherever you’re signed in.</p>
        <div className="auth-story-note"><span aria-hidden="true">✦</span><span>Thoughtful meal ideas, made around your kitchen.</span></div>
      </aside>
      <section className="auth-card">
        {confirmationEmail ? <>
          <div className="auth-success-mark" aria-hidden="true">✓</div>
          <p className="eyebrow">ONE LAST STEP</p>
          <h1>Check your inbox.</h1>
          <p className="auth-intro">Verify <strong>{confirmationEmail}</strong> before signing in. Verification emails are sent by the Supabase project, so delivery depends on its email provider configuration.</p>
          {notice && <p className="auth-notice" role="status">{notice}</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="button button-outline button-wide" type="button" onClick={resendVerification} disabled={busy || !client}>{busy ? 'Sending…' : 'Resend verification email'}</button>
          <p className="auth-switch">Already verified? <Link to="/auth/login">Sign in</Link></p>
        </> : <>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="auth-intro">{copy.description}</p>
          {sessionError && <p className="auth-error" role="alert">{sessionError}</p>}
          {!client && <p className="auth-setup-notice" role="status"><strong>Accounts need setup.</strong> {configError} You can still use the app as a guest.</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {notice && <p className="auth-notice" role="status">{notice}</p>}
          {mode === 'update-password' && notice ? <button className="button button-primary button-wide" type="button" onClick={() => navigate('/dashboard', { replace: true })}>Continue to your planner <span aria-hidden="true">→</span></button> : <form className="auth-form" onSubmit={submit}>
            <fieldset disabled={busy || !client}>
              {mode === 'signup' && <label className="form-field"><span>Your name</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label>}
              {mode !== 'update-password' && <label className="form-field"><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>}
              {mode !== 'forgot' && <label className="form-field"><span>{mode === 'update-password' ? 'New password' : 'Password'}</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required /><small>{mode === 'login' ? 'Your password is handled securely by Supabase.' : 'Use at least 8 characters.'}</small></label>}
              {(mode === 'signup' || mode === 'update-password') && <label className="form-field"><span>Confirm password</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>}
            </fieldset>
            {mode === 'login' && <div className="auth-form-links"><Link to="/auth/forgot-password">Forgot password?</Link></div>}
            <button className="button button-primary button-wide" type="submit" disabled={busy || !client}>{busy ? 'Please wait…' : copy.submit} <span aria-hidden="true">→</span></button>
          </form>}
          {mode === 'signup' && <p className="auth-switch">Already have an account? <Link to="/auth/login">Sign in</Link></p>}
          {mode === 'login' && <p className="auth-switch">New to KhaanaKya? <Link to="/auth/signup">Create an account</Link></p>}
          {mode === 'forgot' && <p className="auth-switch"><Link to="/auth/login">Back to sign in</Link></p>}
        </>}
        {mode !== 'update-password' && <button className="auth-guest-link" type="button" onClick={continueAsGuest}>Continue without an account <span aria-hidden="true">→</span></button>}
      </section>
    </div>
    <footer className="auth-footer"><span>Your account is yours. Your data stays tied to your sign-in.</span><span><Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link></span></footer>
  </main>
}
