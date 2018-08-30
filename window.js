const {app, BrowserWindow, Menu, ipcMain, webContents} = require('electron')

let frame = null

function init() {
  frame = new BrowserWindow({
    title: 'Reex',
    width: 952,
    height: 600,
    minWidth: 472,
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
  ipcMain.on('contextmenu', (event, args) => {
    Menu.buildFromTemplate(buildRendererMenu(args)).popup({})
  })
}

function buildRendererMenu(args) {
  if (Array.isArray(args)) {
    return args.map(buildRendererMenu)
  }
  if (typeof args !== 'object') {
    return args
  }
  if (args.submenu) {
    args.submenu = buildRendererMenu(args.submenu)
  }
  if (args.action) {
    args.click = function (item, window) {
      // FIXME: `window` might be null on macOS when that window is not focused
      // Main process should register the window when IPC received
      (window || frame).webContents.send('contextmenu', {
        action: args.action, data: args.data
      })
    }
  }
  return args
}

app.on('ready', init)

app.on('activate', () => {
  if (frame === null) {
    init()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
