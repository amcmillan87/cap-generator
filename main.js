const { app, BrowserWindow, dialog, shell } = require('electron')
const https = require('https')

const GITHUB_OWNER = 'amcmillan87'
const GITHUB_REPO  = 'cap-generator'

function checkForUpdates(win) {
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
    headers: { 'User-Agent': 'CAP-Generator' }
  }
  https.get(options, (res) => {
    let data = ''
    res.on('data', chunk => data += chunk)
    res.on('end', () => {
      try {
        const release = JSON.parse(data)
        const latest  = release.tag_name.replace(/^v/, '')
        const current = app.getVersion()
        if (latest !== current) {
          dialog.showMessageBox(win, {
            type: 'info',
            title: 'Update Available',
            message: `CAP Generator v${latest} is available`,
            detail: `You're on v${current}. Download the latest version?`,
            buttons: ['Download', 'Later'],
            defaultId: 0
          }).then(r => { if (r.response === 0) shell.openExternal(release.html_url) })
        }
      } catch(e) {}
    })
  }).on('error', () => {})
}

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1400,
    height: 820,
    titleBarStyle: 'default',
    webPreferences: { contextIsolation: true }
  })
  win.loadFile('CAP_Generator.html')
  setTimeout(() => checkForUpdates(win), 3000)
})

app.on('window-all-closed', () => app.quit())
