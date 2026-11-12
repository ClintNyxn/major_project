import { Link } from 'react-router-dom'

export default function OnboardingLayout({ step, title, description, children, backTo, onBack, onNext, nextLabel = 'Continue', nextDisabled = false }) {
  return <main className="onboarding-screen">
    <header className="onboarding-topbar"><Link to="/" className="brand-lockup"><span className="brand-mark">K</span><span>KhaanaKya<span className="brand-question">?</span></span></Link><span className="step-count">STEP {step} OF 4</span></header>
    <div className="onboarding-progress"><span style={{ width: `${step * 25}%` }} /></div>
    <section className="onboarding-content">
      <p className="eyebrow">A better meal starts here</p>
      <h1>{title}</h1>
      <p className="page-description">{description}</p>
      <div className="onboarding-form">{children}</div>
      <div className="onboarding-actions">
        {backTo ? <Link to={backTo} className="button button-text">Back</Link> : onBack ? <button className="button button-text" onClick={onBack}>Back</button> : <span />}
        <button className="button button-primary" onClick={onNext} disabled={nextDisabled}>{nextLabel}<span aria-hidden="true">→</span></button>
      </div>
    </section>
  </main>
}
