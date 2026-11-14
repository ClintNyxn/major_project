import { useContext } from 'react'
import { ToastContext } from './toastContext.js'

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    return {
      addToast: () => {},
      removeToast: () => {},
    }
  }
  return context
}
