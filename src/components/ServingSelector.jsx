import { useApp } from '../context/useApp.js'

export default function ServingSelector({ value, onChange, compact = false }) {
  const app = useApp()
  const servings = value ?? app.servings
  const setServings = onChange ?? app.setServings
  return <div className={`serving-selector ${compact ? 'compact' : ''}`}>
    <button onClick={() => setServings(Math.max(1, Number(servings) - 1))} aria-label="Decrease servings" disabled={servings <= 1}>−</button>
    <span><strong>{servings}</strong><small>{compact ? ' servings' : ' people'}</small></span>
    <button onClick={() => setServings(Math.min(20, Number(servings) + 1))} aria-label="Increase servings" disabled={servings >= 20}>+</button>
  </div>
}
