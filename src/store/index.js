import {join, basename, dirname, extname} from 'path'
import {
  readdir, copyFile,
  lstat, readlink, stat, rename, unlink,
  constants as fsconst,
} from 'fs'
import {promisify} from 'util'

import settings from './modules/settings'
import location from './modules/location'
import explorer from './modules/explorer'
import selection from './modules/selection'
import history from './modules/history'
import devices from './modules/devices'
import dialog from './modules/dialog'
import clipboard from './modules/clipboard'
import presets from './modules/presets'
import system from './modules/system'
import shell from './modules/shell'

const promises = {
  readdir: promisify(readdir),
  lstat: promisify(lstat),
  readlink: promisify(readlink),
  stat: promisify(stat),
  copyFile: promisify(copyFile),
  rename: promisify(rename),
  unlink: promisify(unlink),
}

// TODO: support permission like jorangreef/sudo-prompt
// TODO: use session to share in different window
export default {
  modules: {
    settings,
    location,
    explorer,
    selection,
    history,
    devices,
    dialog,
    clipboard,
    presets,
    system,
    shell,
  },
  states: {
    'path/favorites': [],
    'files/recentlog': {},
    'templates/all': [],
  },
  actions: {
    'file/open'(info) {
      const path = info.link ? info.link.path : info.path
      const stats = info.link ? info.link.stats : info.stats
      const isDirectory = stats.isDirectory()
      if (isDirectory) {
        this.$core.location.assign(path)
      } else {
        this.$core.shell.openFile(path)
      }
    },
    'file/avoid'({name, times}) {
      if (!times) return name
      return `${basename(name)} (${times})${extname(name)}`
    },
    'file/order'(files, factory, collection = []) {
      if (!files.length) {
        return Promise.resolve(collection)
      }
      return factory(files[0])
        .then(result => this['file/order'](
          files.slice(1), factory, collection.concat([result])
        )).catch(() => collection)
    },
    'file/copy'(source) {
      const current = this.$core.location.path
      this['file/order'](source, path => {
        const name = basename(path)
        const locally = dirname(path) === current
        let overwrite = false
        let silence = locally
        const create = async times => {
          const realname = this['file/avoid']({name, times})
          const target = join(current, realname)
          const flag = overwrite ? [] : [fsconst.COPYFILE_EXCL]
          try {
            await promises.copyFile(path, target, ...flag)
          } catch (e) {
            if (silence) return create(times + 1)
            const text = this.i18n('the copying file#!20')
            const response = await this['confirm/duplicate'](realname, text)
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
        this['files/recentlog'] = {
          action: 'copy',
          target: paths,
        }
      })
    },
    'file/move'(source) {
      const current = this.$core.location.path
      this['file/order'](source, path => {
        const name = basename(path)
        const create = async times => {
          const realname = this['file/avoid']({name, times})
          const target = join(current, realname)
          if (target === path) return path
          let silence = false
          try {
            await promises.rename(path, target)
          } catch (e) {
            if (silence) return create(times + 1)
            const text = this.i18n('the moving file#!21')
            const response = await this['confirm/duplicate'](realname, text)
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
        this['files/recentlog'] = {
          action: 'move',
          target: paths,
          source,
        }
      })
    },
    async 'templates/load'(folder) {
      const files = await promises.readdir(folder).catch(() => [])
      const paths = files.map(file => join(folder, file))
      const entries = await this.$core.system.readAll(paths)
      this['templates/all'] = entries
        .filter(({stats}) => stats.isFile())
        .map(({path}) => path)
    },
    'templates/watch'(folder) {
      this['templates/load'](folder)
      this.$core.system.watch(folder, () => {
        this['templates/load'](folder)
      })
    },
    'confirm/duplicate'(name, target) {
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
    // Context menu actions
    'contextmenu/create-folder'() {
      const path = this.$core.location.path
      this.$core.shell.createFolder(path)
    },
    'contextmenu/create-file'({data}) {
      const path = this.$core.location.path
      this.$core.shell.createFile(path, data)
    },
    'contextmenu/delete'() {
      const files = this.$core.selection.range
      this.$core.shell.delete(files)
    },
    'contextmenu/copy'() {
      const files = this.$core.selection.range
      this.$core.clipboard.writeFiles(files)
    },
    'contextmenu/paste'() {
      const files = this.$core.clipboard.readFiles()
      this['file/copy'](files)
    },
    'contextmenu/open'({data}) {
      const {path, isDirectory} = data
      if (isDirectory) {
        this.$core.location.assign(path)
      } else {
        this.$core.shell.openFile(path)
      }
    },
    'contextmenu/open-window'({data}) {
      this.$core.shell.openWindow(data)
    },
    'contextmenu/property'({data}) {
      this.$core.shell.openProperty(data)
    },
    'contextmenu/refresh'() {
      this.$core.location.load()
    },
  },
}
