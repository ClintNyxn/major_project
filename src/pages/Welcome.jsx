import { Link } from 'react-router-dom'
import { enterGuestMode } from '../utils/guestMode.js'
import { SparklesIcon, ArrowRightIcon } from '../components/Icons.jsx'

export default function Welcome() {
  function continueAsGuest() {
    enterGuestMode()
  }

  return (
    <main className="welcome-screen">
      <header className="welcome-topbar">
        <Link to="/" className="brand-lockup">
          <span className="brand-mark">K</span>
          <span className="brand-text">KhaanaKya<span className="brand-question">?</span></span>
        </Link>
        <div className="welcome-topbar-actions">
          <Link to="/auth/login" className="button button-outline">
            Sign in
          </Link>
          <Link to="/auth/signup" className="button button-primary">
            Get started
          </Link>
        </div>
      </header>

      <section className="welcome-hero">
        <div className="welcome-copy">
          <div className="welcome-badge">
            <SparklesIcon />
            <span>PERSONALIZED KITCHEN INTELLIGENCE</span>
          </div>

          <h1>
            What can we
            <br />
            <em>cook today?</em>
          </h1>

          <p className="welcome-description">
            Discover delicious, wholesome meals using ingredients you already have in your kitchen.
            Honest pantry matching, dietary filters, nutrition estimates, and no delivery fees.
          </p>

          <div className="welcome-actions">
            <Link to="/auth/signup" className="button button-primary button-large">
              Start planning free <ArrowRightIcon />
            </Link>
            <Link
              to="/setup/profile"
              onClick={continueAsGuest}
              className="button button-outline button-large"
            >
              Try as Guest
            </Link>
          </div>

          <div className="welcome-highlights">
            <div className="highlight-item">
              <span className="highlight-icon">🥬</span>
              <div>
                <strong>Zero Waste Cooking</strong>
                <small>Cook with ingredients in your fridge first</small>
              </div>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">⏱️</span>
              <div>
                <strong>Quick & Practical</strong>
                <small>30-minute meals tailored to your kitchen</small>
              </div>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">🥗</span>
              <div>
                <strong>Diet & Health Goals</strong>
                <small>High protein, low carb, veg, or vegan</small>
              </div>
            </div>
          </div>
        </div>

        <div className="welcome-photo-wrap">
          <img
            src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=88"
            alt="A vibrant, delicious homemade meal with fresh vegetables and herbs"
            className="welcome-photo"
          />
          <div className="photo-caption">
            <span className="caption-index">KITCHEN EDITORIAL</span>
            <span>Everyday ingredients, thoughtfully put together.</span>
          </div>
        </div>
      </section>

      <footer className="welcome-footer">
        <span>KHAANAKYA? · ZERO FOOD WASTE MEAL PLANNER</span>
        <span>NO DELIVERY MARKS · JUST REAL FOOD</span>
        <span>MADE FOR HOME COOKS</span>
      </footer>
    </main>
  )
}
