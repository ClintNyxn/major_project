const { contextBridge, ipcRenderer } = require('electron')

const pendingAuthUrls = []
const listeners = new Set()

ipcRenderer.on('auth-deep-link', (_event, authUrl) => {
  if (listeners.size === 0) pendingAuthUrls.push(authUrl)
  else for (const listener of listeners) listener(authUrl)
})

contextBridge.exposeInMainWorld('khaanakyaDesktop', {
  onAuthDeepLink(listener) {
    if (typeof listener !== 'function') throw new TypeError('An auth deep-link listener is required.')
    listeners.add(listener)
    for (const authUrl of pendingAuthUrls.splice(0)) listener(authUrl)
    return () => listeners.delete(listener)
  },
})
