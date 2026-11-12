import PageHeader from '../components/PageHeader.jsx'

const faqs = [
  ['How does KhaanaKya recommend recipes?', 'The prototype compares recipe ingredient lists with the ingredients you select, then filters out recipes that conflict with your food preference or listed allergies. Cuisine, health goals, preparation time and sample budget help rank what remains.'],
  ['Can I get recommendations with only a few ingredients?', 'Yes. Recipes with partial ingredient matches can still appear. Each result shows what is available and what is missing so you can decide whether it is practical.'],
  ['How are nutritional values calculated?', 'Nutrition values are sample estimates attached to each recipe. A future backend can calculate them from ingredient quantities and trusted nutrition data. They are not medical advice.'],
  ['How are ingredient prices estimated?', 'The prototype uses illustrative sample prices in Indian rupees from its local ingredient dataset. Prices are not live, location-specific or verified store prices.'],
  ['Can I change my dietary preferences and allergies?', 'Yes. Visit My Preferences at any time. Selected allergies are treated as strict exclusions by the prototype recommendation service.'],
]

export default function Help() {
  return <div><PageHeader eyebrow="A FEW THINGS WORTH KNOWING" title="Help & support." description="A clearer picture of how recommendations and estimates work." />
    <div className="faq-list">{faqs.map(([question, answer], index) => <details className="faq-item" key={question}><summary><span className="faq-number">0{index + 1}</span><span>{question}</span><span className="faq-indicator">+</span></summary><p>{answer}</p></details>)}</div>
    <section className="support-block"><p className="eyebrow">STILL HAVE A QUESTION?</p><h2>We're here to help.</h2><p>This desktop prototype has no support inbox connected yet. For project feedback, contact the team maintaining your installation.</p><p className="tiny-note">A support inbox is not connected in this prototype.</p></section>
  </div>
}
