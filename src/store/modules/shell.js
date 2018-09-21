import {shell, ipcRenderer} from 'electron'
import {basename, join} from 'path'
import {copyFile, writeFile, mkdir, constants as fsconst} from 'fs'
import {spawn} from 'child_process'

export default {
  states: {
    recentLog: [],
  },
  actions: {
    createFile(path, template) {
      const name = template ? basename(template) : this.i18n('New file#!10')
      const create = times => {
        const realname = this.$core['file/avoid']({name, times})
        const callback = err => {
          if (err) create(times + 1)
        }
        const target = join(path, realname)
        if (template) {
          copyFile(template, target, fsconst.COPYFILE_EXCL, callback)
        } else {
          writeFile(target, '', {flag: 'wx'}, callback)
        }
      }
      create(0)
    },
    createFolder(path) {
      const name = this.i18n('New folder#!8')
      const create = times => {
        const realname = this.$core['file/avoid']({name, times})
        mkdir(join(path, realname), err => {
          if (err) create(times + 1)
        })
      }
      create(0)
    },
    delete(files) {
      for (const file of files) {
        shell.moveItemToTrash(file)
      }
      this.recentLog = {
        action: 'delete',
        target: files,
      }
    },
    openFile(path) {
      this.$core.system.ignoreOnce(path)
      shell.openItem(path)
    },
    openWindow(path) {
      ipcRenderer.send('open-window', {path})
    },
    openProperty(path) {
      ipcRenderer.send('property', {path})
    },
    openTerminal(path) {
      const config = this.$core.settings.user
      const command = config['terminal.command']
        .replace('%PATH%', path)
      // TODO: cross platform
      if (process.platform === 'darwin') {
        const name = config['terminal.darwin.name']
        let script
        if (name === 'iTerm2') {
          script = `tell application "iTerm"
            try
              set created to current window
              tell created
                create tab with default profile
                set context to current session
              end tell
            on error
              set created to (create window with default profile)
              tell created
                set context to current session
              end tell
            end try
            tell context to write text "${command}"
            activate
          end tell`
        } else {
          script = `tell application "Terminal"
            do script "${command}"
            activate
          end tell`
        }
        spawn('osascript', ['-e', script])
      }
    },
  },
}
