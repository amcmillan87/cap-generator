const { app, BrowserWindow, dialog, shell, Menu } = require('electron')
const https = require('https')

const GITHUB_OWNER = 'amcmillan87'
const GITHUB_REPO  = 'cap-generator'

function checkForUpdates(win, silent) {
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
    headers: { 'User-Agent': 'CAP-Generator-' + app.getVersion() },
    rejectUnauthorized: false  // bypass corporate SSL inspection proxy
  }
  https.get(options, (res) => {
    let data = ''
    res.on('data', chunk => data += chunk)
    res.on('end', () => {
      try {
        const release = JSON.parse(data)
        if (!release.tag_name) {
          if (!silent) dialog.showMessageBox(win, { type:'error', title:'Update Check Failed', message:'Could not read release info from GitHub.', detail: data.slice(0, 300) })
          return
        }
        const latest  = release.tag_name.replace(/^v/, '')
        const current = app.getVersion()
        if (latest !== current) {
          dialog.showMessageBox(win, {
            type: 'info',
            title: 'Update Available',
            message: `CAP Generator v${latest} is available`,
            detail: `You're running v${current}. Download the latest version?`,
            buttons: ['Download', 'Later'],
            defaultId: 0
          }).then(r => { if (r.response === 0) shell.openExternal(release.html_url) })
        } else if (!silent) {
          dialog.showMessageBox(win, { type:'info', title:'Up to Date', message:`CAP Generator v${current} is the latest version.` })
        }
      } catch(e) {
        if (!silent) dialog.showMessageBox(win, { type:'error', title:'Update Check Failed', message: e.message, detail: data.slice(0, 300) })
      }
    })
  }).on('error', (e) => {
    if (!silent) dialog.showMessageBox(win, { type:'error', title:'Update Check Failed', message:'Network error: ' + e.message })
  })
}

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1400,
    height: 820,
    titleBarStyle: 'default',
    webPreferences: { contextIsolation: true }
  })
  win.loadFile('CAP_Generator.html')

  // Native menu with Check for Updates item
  const menu = Menu.buildFromTemplate([
    { role: 'appMenu' },
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates…',
          click: () => checkForUpdates(win, false)
        },
        {
          label: `Version ${app.getVersion()}`,
          enabled: false
        }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)

  // Auto-check on launch (silent — only shows dialog if update found)
  setTimeout(() => checkForUpdates(win, true), 3000)
})

app.on('window-all-closed', () => app.quit())
