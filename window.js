const {app, BrowserWindow, Menu} = require('electron')

let frame = null

function init() {
  frame = new BrowserWindow({
    title: 'Reex',
    width: 900,
    height: 600,
    minWidth: 450,
    frame: false,
    transparent: true,
    webPreferences: {
      experimentalFeatures: true,
    },
  })
  frame.loadURL(`file://${__dirname}/src/index.html`)
  frame.on('closed', () => {
    frame = null
  })
  const menu = createMenu()
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(menu)
  } else {
    frame.setMenu(menu)
    frame.setMenuBarVisibility(false)
  }
  // these handler must be binded in main process
  transferEvents()
}

function createMenu() {
  return Menu.buildFromTemplate([
    {
      label: app.getName(),
      submenu: [{role: 'toggledevtools'}]
    }
  ])
}

function transferEvents() {
  frame.on('maximize', () => {
    frame.webContents.send('maximize')
  })
  frame.on('unmaximize', () => {
    frame.webContents.send('unmaximize')
  })
}

const second = app.makeSingleInstance((argv, directory) => {
  if (frame) {
    if (frame.isMinimized()) {
      frame.restore()
    }
    frame.focus()
  }
  return true
})

if (second) {
  app.quit()
}

app.on('ready', init)

app.on('activate', () => {
  if (frame === null) {
    init()
  }
})

app.on('window-all-closed', () => {
  app.quit()
})
