const { app, BrowserWindow } = require('electron')
const path = require('node:path')

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#f4f0e7',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const developmentUrl = process.env.VITE_DEV_SERVER_URL
    || (!app.isPackaged ? 'http://127.0.0.1:5173' : null)
  if (developmentUrl) {
    window.loadURL(developmentUrl)
  } else {
    window.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
