const {app, BrowserWindow, Menu, ipcMain} = require('electron')

// let frame = null
const frames = []

function createWindow() {
  const frame = new BrowserWindow({
    title: app.getName(),
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
  if (process.platform !== 'darwin') {
    createWindowMenu(frame)
  }
  // these handler must be binded in main process
  transferEvents(frame)
  // reference to avoid GC
  frames.push(frame)
  frame.on('closed', () => {
    const index = frames.indexOf(frame)
    if (index !== -1) {
      frames.splice(index, 1)
    }
  })
}

function createApplicationMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: app.getName(),
      submenu: [
        {role: 'about'},
        {type: 'separator'},
        {role: 'services', submenu: []},
        {type: 'separator'},
        {role: 'hide'},
        {role: 'hideothers'},
        {role: 'unhide'},
        {type: 'separator'},
        {role: 'quit'},
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {role: 'copy'},
        {role: 'paste'},
        {role: 'selectall'},
      ],
    },
    {role: 'windowMenu'},
    {
      role: 'help',
      submenu: [{role: 'toggledevtools'}],
    },
  ])
  Menu.setApplicationMenu(menu)
}

function createWindowMenu(frame) {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Edit',
      submenu: [
        {role: 'copy'},
        {role: 'paste'},
        {role: 'selectall'},
      ],
    },
    {role: 'windowMenu'},
    {
      label: 'Help',
      submenu: [{role: 'toggledevtools'}],
    },
  ])
  frame.setMenu(menu)
  frame.setMenuBarVisibility(false)
}

function transferEvents(frame) {
  frame.on('maximize', () => {
    frame.webContents.send('maximize')
  })
  frame.on('unmaximize', () => {
    frame.webContents.send('unmaximize')
  })
  ipcMain.on('contextmenu', (event, args) => {
    Menu.buildFromTemplate(buildRendererMenu(frame, args)).popup({})
  })
}

function buildRendererMenu(frame, args) {
  if (Array.isArray(args)) {
    return args.map(item => buildRendererMenu(frame, item))
  }
  if (typeof args !== 'object') {
    return args
  }
  if (args.submenu) {
    args.submenu = buildRendererMenu(frame, args.submenu)
  }
  if (args.action) {
    args.click = () => {
      // the second argument might be null on macOS when window is not focused
      // Main process should register the window when IPC received
      frame.webContents.send('contextmenu', {
        action: args.action, data: args.data
      })
    }
  }
  return args
}

app.on('ready', () => {
  if (process.platform === 'darwin') {
    createApplicationMenu()
  }
  createWindow()
})

app.on('activate', () => {
  if (!frames.length) {
    createWindow()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
