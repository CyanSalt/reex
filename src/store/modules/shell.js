import {shell, ipcRenderer} from 'electron'
import {basename, join, extname, dirname} from 'path'
import {
  copyFile, writeFile, mkdir, rename, unlink,
  constants as fsconst
} from 'fs'
import {spawn} from 'child_process'
import {promisify} from 'util'

const promises = {
  copyFile: promisify(copyFile),
  rename: promisify(rename),
  unlink: promisify(unlink),
}

export default {
  states: {
    recentLog: [],
  },
  actions: {
    generateName(name, times) {
      if (!times) return name
      return `${basename(name)} (${times})${extname(name)}`
    },
    createFile(path, template) {
      const name = template ? basename(template) : this.i18n('New file#!10')
      const create = times => {
        const realname = this.generateName(name, times)
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
        const realname = this.generateName(name, times)
        mkdir(join(path, realname), err => {
          if (err) create(times + 1)
        })
      }
      create(0)
    },
    traverse(files, factory, collection = []) {
      if (!files.length) {
        return Promise.resolve(collection)
      }
      return factory(files[0])
        .then(result => this.traverse(
          files.slice(1), factory, collection.concat([result])
        )).catch(() => collection)
    },
    duplicate(name, target) {
      return this.$core.dialog.confirm({
        type: 'question',
        title: this.i18n('Duplicate file name#!18'),
        message: this.i18n('There has been a file named "%NAME%". What to do with %TARGET%?#!19')
          .replace('%NAME%', name).replace('%TARGET%', target),
        buttons: [
          this.i18n('Rename#!22'),
          this.i18n('Replace#!23'),
          this.i18n('Skip#!24'),
          this.i18n('Cancel#!25'),
        ],
        defaultId: 0,
        cancelId: 2,
      })
    },
    copy(files, parent) {
      this.tranverse(files, path => {
        const name = basename(path)
        const locally = dirname(path) === parent
        let overwrite = false
        let silence = locally
        const create = async times => {
          const realname = this.generateName(name, times)
          const target = join(parent, realname)
          const flag = overwrite ? [] : [fsconst.COPYFILE_EXCL]
          try {
            await promises.copyFile(path, target, ...flag)
          } catch (e) {
            if (silence) return create(times + 1)
            const text = this.i18n('the copying file#!20')
            const response = await this.duplicate(realname, text)
            switch (response) {
              case 0: {
                silence = true
                return create(times + 1)
              }
              case 1: {
                overwrite = true
                return create(times)
              }
              case 2: return null
              default: throw e
            }
          }
          overwrite = false
          silence = locally
          return target
        }
        return create(locally ? 1 : 0)
      }).then(paths => {
        this.$core.selection.willSelect(paths.filter(Boolean))
        this.recentLog = {
          action: 'copy',
          target: paths,
        }
      })
    },
    move(files, parent) {
      this.tranverse(files, path => {
        const name = basename(path)
        const create = async times => {
          const realname = this.generateName(name, times)
          const target = join(parent, realname)
          if (target === path) return path
          let silence = false
          try {
            await promises.rename(path, target)
          } catch (e) {
            if (silence) return create(times + 1)
            const text = this.i18n('the moving file#!21')
            const response = await this.duplicate(realname, text)
            switch (response) {
              case 0: {
                silence = true
                return create(times + 1)
              }
              case 1: {
                try {
                  await promises.unlink(target)
                } catch (err) {
                  return null
                }
                return create(times)
              }
              case 2: return null
              default: throw e
            }
          }
          silence = false
          return target
        }
        return create(0)
      }).then(paths => {
        this.$core.selection.willSelect(paths.filter(Boolean))
        this.recentLog = {
          action: 'move',
          target: paths,
          source: files,
        }
      })
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
