const {app, BrowserWindow, Menu, ipcMain, dialog} = require('electron')
const {resolve} = require('path')

const frames = []

function createWindow(args) {
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
  transferWindowEvents(frame)
  // reference to avoid GC
  frames.push(frame)
  frame.on('closed', () => {
    const index = frames.indexOf(frame)
    if (index !== -1) {
      frames.splice(index, 1)
    }
  })
  frame.additionalArguments = args || {}
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
        getPasteRoleMenuItem(),
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
        getPasteRoleMenuItem(),
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

// Note: the role `Paste` will trigger native paste event error
// when copying inside this app on macOS
function getPasteRoleMenuItem() {
  return {
    label: 'Paste',
    accelerator: 'CommandOrControl+V',
    click() {
      const window = BrowserWindow.getFocusedWindow()
      if (window) window.webContents.send('paste')
    },
  }
}

function transferWindowEvents(frame) {
  frame.on('maximize', () => {
    frame.webContents.send('maximize')
  })
  frame.on('unmaximize', () => {
    frame.webContents.send('unmaximize')
  })
}

const draggingIcon = resolve(__dirname, 'src/assets/images/dragging.png')

function transferCommonEvents() {
  ipcMain.on('contextmenu', (event, args) => {
    Menu.buildFromTemplate(buildRendererMenu(event.sender, args)).popup({})
  })
  ipcMain.on('dragstart', (event, args) => {
    event.sender.startDrag({
      files: args,
      icon: draggingIcon,
    })
  })
  ipcMain.on('confirm', (event, args) => {
    const {sender} = event
    const window = frames.find(frame => frame.webContents === sender)
    dialog.showMessageBox(window, args, response => {
      sender.send('confirm', response)
    })
  })
}

function buildRendererMenu(contents, args) {
  if (Array.isArray(args)) {
    return args.map(item => buildRendererMenu(contents, item))
  }
  if (typeof args !== 'object') {
    return args
  }
  if (args.submenu) {
    args.submenu = buildRendererMenu(contents, args.submenu)
  }
  if (args.action) {
    args.click = () => {
      // Note: the second argument might be null on macOS
      contents.send('contextmenu', {
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
  transferCommonEvents()
  const args = {}
  if (process.argv[1]) {
    args.path = resolve(process.cwd(), process.argv[1])
  }
  createWindow(args)
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
