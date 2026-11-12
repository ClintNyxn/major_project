import { Link } from 'react-router-dom'

export default function Welcome() {
  return <main className="welcome-screen">
    <header className="welcome-topbar"><Link to="/" className="brand-lockup"><span className="brand-mark">K</span><span>KhaanaKya<span className="brand-question">?</span></span></Link><Link to="/dashboard" className="button button-text">Open workspace <span aria-hidden="true">→</span></Link></header>
    <section className="welcome-hero">
      <div className="welcome-copy">
        <p className="eyebrow">YOUR INGREDIENTS. YOUR NEXT MEAL.</p>
        <h1>What can we<br /><em>make today?</em></h1>
        <p className="welcome-description">Discover delicious meals using ingredients you already have. Get recommendations that fit your taste, dietary preferences and budget.</p>
        <div className="welcome-actions"><Link to="/setup/profile" className="button button-primary">Find my food <span aria-hidden="true">→</span></Link><Link to="/recommendations" className="button button-outline">Explore recipes</Link></div>
        <div className="welcome-proof"><span className="proof-line" /><p>Cook with what you have. Plan for what you need.</p></div>
      </div>
      <div className="welcome-photo-wrap"><img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=88" alt="A colorful homemade meal with fresh vegetables and herbs" className="welcome-photo" /><div className="photo-caption"><span className="caption-index">01 / 03</span><span>Everyday ingredients,<br />thoughtfully put together.</span></div></div>
    </section>
    <footer className="welcome-footer"><span>PERSONALIZED RECIPE IDEAS</span><span>NO DELIVERY. JUST GOOD FOOD.</span><span>EST. FOR YOUR KITCHEN</span></footer>
  </main>
}
