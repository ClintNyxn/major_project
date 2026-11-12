const GUEST_MODE_KEY = 'khaanakya-guest-mode'

export function isGuestMode() {
  return window.sessionStorage.getItem(GUEST_MODE_KEY) === 'true'
}

export function enterGuestMode() {
  window.sessionStorage.setItem(GUEST_MODE_KEY, 'true')
}

export function leaveGuestMode() {
  window.sessionStorage.removeItem(GUEST_MODE_KEY)
}
