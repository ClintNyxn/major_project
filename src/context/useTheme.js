import { useContext } from 'react'
import { ThemeContext } from './themeContext.js'

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    return { theme: 'light', isDark: false, toggleTheme: () => {}, setTheme: () => {} }
  }
  return context
}
