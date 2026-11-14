const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const iconPath = path.join(__dirname, '../build/icon.png')
const authProtocol = 'khaanakya'
const gotSingleInstanceLock = app.requestSingleInstanceLock()
let mainWindow
let pendingAuthUrls = []

function isAuthCallbackUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === `${authProtocol}:` && url.hostname === 'auth' && url.pathname === '/callback'
  } catch {
    return false
  }
}

function deliverAuthUrl(value) {
  if (!isAuthCallbackUrl(value)) return
  if (!mainWindow || mainWindow.isDestroyed()) {
    pendingAuthUrls.push(value)
    if (app.isReady()) createWindow()
    return
  }
  if (mainWindow.webContents.isLoadingMainFrame()) {
    pendingAuthUrls.push(value)
    return
  }
  mainWindow.show()
  mainWindow.focus()
  mainWindow.webContents.send('auth-deep-link', value)
}

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    const authUrl = commandLine.find(isAuthCallbackUrl)
    if (authUrl) deliverAuthUrl(authUrl)
    else if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.on('open-url', (event, authUrl) => {
    event.preventDefault()
    deliverAuthUrl(authUrl)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#f4f0e7',
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  mainWindow.webContents.on('did-finish-load', () => {
    for (const authUrl of pendingAuthUrls) mainWindow.webContents.send('auth-deep-link', authUrl)
    pendingAuthUrls = []
  })
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  const developmentUrl = process.env.VITE_DEV_SERVER_URL
    || (!app.isPackaged ? 'http://127.0.0.1:5173' : null)
  if (developmentUrl) {
    mainWindow.loadURL(developmentUrl)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

if (gotSingleInstanceLock) {
  const initialAuthUrl = process.argv.find(isAuthCallbackUrl)
  if (initialAuthUrl) pendingAuthUrls.push(initialAuthUrl)

  app.whenReady().then(() => {
    if (process.platform === 'darwin' && app.dock && fs.existsSync(iconPath)) {
      try {
        app.dock.setIcon(iconPath)
      } catch (err) {
        console.warn('Could not set dock icon:', err.message)
      }
    }
    if (app.isPackaged) app.setAsDefaultProtocolClient(authProtocol)
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
