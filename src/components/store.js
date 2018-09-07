import {remote, shell, clipboard, ipcRenderer} from 'electron'
import {sep, join, basename, dirname, resolve, extname} from 'path'
import {
  readdir, watch, mkdir, copyFile, writeFile,
  lstat, readlink, stat, rename, unlink,
  constants as fsconst,
} from 'fs'
import {promisify} from 'util'
import settings from '../resources/default/settings.json'
import types from '../utilities/file-types'
import {exec, spawn} from 'child_process'

const promises = {
  lstat: promisify(lstat),
  readlink: promisify(readlink),
  stat: promisify(stat),
  copyFile: promisify(copyFile),
  rename: promisify(rename),
  unlink: promisify(unlink),
}

export default {
  data: {
    'settings/default': {},
    'settings/user': {},
    'path/full': '',
    'path/stack': [],
    'path/forwards': [],
    'path/defined': [],
    'path/watcher': [],
    'path/favorites': [],
    'files/info': [],
    'files/vision': false,
    'files/selected': [],
    'files/selecting': [],
    'files/recentlog': {},
    'file/executed': null,
    'templates/all': [],
    'devices/all': [],
    'devices/removable': [],
    'explorer/loading': false,
    'confirm/waiting': null,
    'icons/cache': {},
    'file/types': [],
  },
  computed: {
    'path/floors'() {
      const floors = this['path/full'].split(sep)
      return floors[floors.length - 1] ? floors : floors.slice(0, -1)
    },
    'path/steps'() {
      return this['path/floors'].map((floor, index) => {
        const path = index === 0 && !floor ? '/' :
          this['path/floors'].slice(0, index + 1).join(sep)
        const name = this['file/name'](path)
        return {name, path}
      })
    },
    'files/visible'() {
      if (this['files/vision']) return this['files/info']
      return this['files/info'].filter(file => !this['file/hidden'](file.path))
    },
  },
  methods: {
    'settings/load'() {
      // load default settings
      this.$flux.set('settings/default', settings)
      // custom script
      this.$storage.require('custom.js', init => init(this))
      // load user settings
      this.$storage.load('settings.json', (err, data) => {
        const copied = JSON.parse(JSON.stringify(settings))
        data = err ? copied : {...copied, ...data}
        this['settings/user'] = data
        // load other states in store
        const path = data['explorer.startup.path']
        this['path/replace'](this['path/interpret'](path))
        const favorites = data['quickaccess.favorites']
          .map(entry => this['path/interpret'](entry))
        this['file/read'](favorites).then(entries => {
          this['path/favorites'] = entries
        })
        // emit loaded event
        this.$emit('settings/loaded', data)
        // filter default values on saving
        const reducer = (diff, [key, value]) => {
          if (JSON.stringify(value) !== JSON.stringify(data[key])) {
            diff[key] = data[key]
          }
          return diff
        }
        this.$flux.on('settings/save', () => {
          const computed = Object.entries(settings).reduce(reducer, {})
          this.$storage.save('settings.json', computed)
        })
      })
    },
    'path/load'() {
      const path = this['path/full']
      readdir(path, (err, files) => {
        if (err) {
          if (err.code === 'ENOENT') {
            this['path/upward']()
          }
          return
        }
        this['explorer/show'](files.map(file => join(path, file)))
      })
    },
    'path/redirect'(path) {
      if (path === this['path/full']) return
      this['path/stack'].push(this['path/full'])
      this['path/forwards'] = []
      this['path/replace'](path)
    },
    'path/replace'(path) {
      if (path === this['path/full']) return
      this['path/full'] = path
      this['path/load']()
      this['path/watch']()
      document.title = this['file/name'](path)
    },
    'path/watch'() {
      if (this['path/watcher'].length) {
        this['path/watcher'].forEach(watcher => watcher.close())
      }
      this['path/watcher'] = this['folder/watch']({
        path: this['path/full'],
        callback: () => {
          this['path/load']()
        }
      })
    },
    'path/back'() {
      if (this['path/stack'].length) {
        const path = this['path/stack'].pop()
        this['path/forwards'].push(this['path/full'])
        this['path/replace'](path)
      }
    },
    'path/forward'() {
      if (this['path/forwards'].length) {
        const path = this['path/forwards'].pop()
        this['path/stack'].push(this['path/full'])
        this['path/replace'](path)
      }
    },
    'path/upward'() {
      const {length} = this['path/floors']
      if (length > 1) {
        const path = this['path/floors'].slice(0, length - 1).join(sep) || '/'
        this['path/redirect'](path)
      }
    },
    'path/preload'() {
      const electronPaths = [
        {shortname: 'reex'},
        {shortname: 'home', watermark: 'icon-home'},
        {shortname: 'appData'},
        {shortname: 'temp'},
        {shortname: 'desktop', name: 'Desktop#!1', watermark: 'icon-monitor'},
        {shortname: 'documents', name: 'Documents#!2', watermark: 'icon-file-text'},
        {shortname: 'downloads', name: 'Downloads#!3', watermark: 'icon-download'},
        {shortname: 'music', name: 'Music#!4', watermark: 'icon-music'},
        {shortname: 'pictures', name: 'Pictures#!5', watermark: 'icon-image'},
        {shortname: 'videos', name: 'Videos#!6', watermark: 'icon-film'},
      ]
      for (const data of electronPaths) {
        if (data.name) {
          data.name = this.i18n(data.name)
        }
        if (!data.path) {
          if (data.shortname === 'reex') {
            data.path = remote.app.getAppPath()
          } else {
            data.path = remote.app.getPath(data.shortname)
          }
        }
      }
      this['path/defined'] = electronPaths
    },
    'path/interpret'(path) {
      const windowsVariables = /%([^%]+)%/g
      const unixVariables = /\$\{([^}]+)\}/g
      const electronPaths = this['path/defined'].map(data => data.shortname)
      const electronVariables = new RegExp(`\\[(${
        electronPaths.join('|')
      })\\]`, 'g')
      const systemReplacement = (full, name) => {
        return process.env[name] || full
      }
      const electronReplacement = (full, name) => {
        const target = this['path/defined'].find(
          data => data.shortname === name
        )
        return target ? target.path : full
      }
      return path.replace(windowsVariables, systemReplacement)
        .replace(unixVariables, systemReplacement)
        .replace(electronVariables, electronReplacement)
    },
    'vision/toggle'() {
      this['files/vision'] = !this['files/vision']
      if (!this['files/vision']) {
        this['files/selected'] = this['files/selected']
          .filter(path => !this['file/hidden'](path))
      }
    },
    'file/hidden'(path) {
      return basename(path).charAt(0) === '.'
    },
    'file/select'(path) {
      if (!this['files/selected'].includes(path)) {
        this['files/selected'].push(path)
      }
    },
    'file/unselect'(path) {
      const index = this['files/selected'].indexOf(path)
      if (index !== -1) {
        this['files/selected'].splice(index, 1)
      }
    },
    'file/specify'(path) {
      const paths = Array.isArray(path) ? path : [path]
      this['files/selected'] = paths
    },
    'file/name'(path) {
      const target = this['path/defined'].find(data => data.path === path)
      return (target && target.name) || basename(path) || '/'
    },
    'file/follow'(info) {
      const {path, stats} = info
      if (!stats.isSymbolicLink()) return info
      return promises.readlink(path).then(link => {
        const targetPath = resolve(dirname(path), link)
        return promises.stat(targetPath).then(targetStats => {
          return {path: targetPath, stats: targetStats}
        })
      })
    },
    'file/sort'([a, b]) {
      const statsA = a.link ? a.link.stats : a.stats
      const statsB = b.link ? b.link.stats : b.stats
      const dirA = statsA.isDirectory()
      const dirB = statsB.isDirectory()
      const baseA = basename(a.path)
      const baseB = basename(b.path)
      if (dirA && !dirB) return -1
      if (!dirA && dirB) return 1
      return baseA.localeCompare(baseB)
    },
    'file/read'(paths) {
      return Promise.all(paths.map(path => {
        return promises.lstat(path)
          .then(stats => {
            const info = {path, stats}
            if (!stats.isSymbolicLink()) {
              return info
            }
            return this['file/follow'](info).then(link => {
              return Object.assign(info, {link})
            }).catch(() => {
              return Object.assign(info, {link: info})
            })
          })
      }))
    },
    'file/execute'(path) {
      this['file/executed'] = path
      shell.openItem(path)
    },
    'file/open'(info) {
      const path = info.link ? info.link.path : info.path
      const stats = info.link ? info.link.stats : info.stats
      if (stats.isDirectory()) {
        this['path/redirect'](path)
      } else {
        this['file/execute'](path)
      }
    },
    'file/type'(path) {
      const ext = extname(path)
      for (const {type, extension} of this['file/types']) {
        if (extension.includes(ext)) return type
      }
      return ''
    },
    'file/avoid'({name, times}) {
      if (!times) return name
      return `${basename(name)} (${times})${extname(name)}`
    },
    'file/order'(files, factory, collection = []) {
      if (!files.length) {
        return collection
      }
      return factory(files[0])
        .then(result => this['file/order'](
          files.slice(1), factory, collection.concat([result])
        )).catch(() => collection)
    },
    'file/copy'(source) {
      const current = this['path/full']
      this['file/order'](source, path => {
        const name = basename(path)
        const locally = dirname(path) === current
        const create = times => {
          const realname = this['file/avoid']({name, times})
          const target = join(current, realname)
          return promises.copyFile(path, target, fsconst.COPYFILE_EXCL)
            .then(() => target)
            .catch(() => {
              if (locally) return create(times + 1)
              const text = this.i18n('the copying file#!20')
              return this['confirm/duplicate'](realname, text)
                .then(response => {
                  if (response === 0) {
                    return create(times + 1)
                  } else if (response === 1) {
                    return promises.rename(path, target).then(() => target)
                  }
                  return null
                })
            })
        }
        return create(locally ? 1 : 0)
      }).then(paths => {
        this['files/selecting'] = paths.filter(Boolean)
      })
    },
    'file/move'(source) {
      const current = this['path/full']
      this['file/order'](source, path => {
        const name = basename(path)
        const create = times => {
          const realname = this['file/avoid']({name, times})
          const target = join(current, realname)
          if (target === path) return path
          return promises.rename(path, target).then(() => target)
            .catch(() => {
              const text = this.i18n('the moving file#!21')
              return this['confirm/duplicate'](realname, text)
                .then(response => {
                  if (response === 0) {
                    return create(times + 1)
                  } else if (response === 1) {
                    return promises.unlink(target)
                      .then(() => promises.rename(path, target))
                      .then(() => target)
                  }
                  return null
                })
            })
        }
        return create(0)
      }).then(paths => {
        this['files/selecting'] = paths.filter(Boolean)
      })
    },
    'icon/defined'(path) {
      const target = this['path/defined'].find(data => data.path === path)
      return target && target.watermark
    },
    'icon/type'(path) {
      const type = this['file/type'](path)
      const group = this['file/types'].find(item => item.type === type)
      return (group && group.icon) || null
    },
    'icon/character'(icon) {
      if (this['icons/cache'][icon]) {
        return this['icons/cache'][icon]
      }
      const span = document.createElement('span')
      span.style.display = 'none'
      document.body.appendChild(span)
      const style = getComputedStyle(span, '::before')
      span.className = icon
      const char = style.getPropertyValue('content')[1]
      document.body.removeChild(span)
      this['icons/cache'][icon] = char
      return char
    },
    'folder/watch'({path, callback}) {
      const parent = dirname(path)
      const watchers = []
      try {
        watchers[0] = watch(path, (type, file) => {
          if (file === '.DS_Store') return
          if (this['file/executed'] &&
            join(path, file) === this['file/executed']
          ) {
            this['file/executed'] = null
            return
          }
          callback()
        })
        if (parent && parent !== path) {
          watchers[1] = watch(parent, (type, file) => {
            if (file === '.DS_Store') return
            if (join(parent, file) === path) {
              callback()
            }
          })
        }
      } catch (e) {}
      return watchers
    },
    'types/define'(definition) {
      if (Array.isArray(definition)) {
        definition.forEach(item => this['types/define'](item))
        return
      }
      let {type, extension, icon} = definition
      if (!Array.isArray(extension)) {
        extension = [extension]
      }
      const allTypes = this['file/types']
      const group = allTypes.find(item => item.type === type)
      if (!group) {
        allTypes.push({type, extension, icon})
      } else {
        group.icon = icon
        const list = group.extension
        extension.forEach(ext => {
          if (!list.includes(ext)) list.push(ext)
        })
      }
    },
    'types/load'() {
      this['types/define']([
        {type: 'image', extension: types.images, icon: 'icon-image'},
        {type: 'video', extension: types.videos, icon: 'icon-film'},
        {type: 'audio', extension: types.audios, icon: 'icon-music'},
        {type: 'code', extension: types.codes, icon: 'icon-code'},
        {type: 'font', extension: types.fonts, icon: 'icon-type'},
        {type: 'text', extension: types.texts, icon: 'icon-align-left'},
      ])
    },
    'templates/load'() {
      const templates = this.$storage.filename('templates')
      readdir(templates, (err, files) => {
        if (err) return
        const paths = files.map(file => join(templates, file))
        this['file/read'](paths).then(entries => {
          this['templates/all'] = entries
            .filter(({stats}) => stats.isFile())
            .map(({path}) => path)
        })
      })
    },
    'templates/watch'() {
      this['templates/load']()
      this['folder/watch']({
        path: this.$storage.filename('templates'),
        callback: () => {
          this['templates/load']()
        }
      })
    },
    'devices/load'() {
      if (process.platform === 'darwin') {
        const path = '/Volumes'
        readdir(path, (err, files) => {
          if (err) return
          const paths = files.map(file => join(path, file))
          this['file/read'](paths).then(entries => {
            this['devices/all'] = entries
          })
          files.forEach(file => {
            const name = file.replace(/\s/g, c => '\\' + c)
            const command = [
              `diskutil info ${name}`,
              'awk \'/Removable Media:/{print $3}\'',
            ].join(' | ')
            exec(command, (error, stdout) => {
              if (!error && stdout.toString().trim() === 'Removable') {
                this['devices/removable'].push(join(path, file))
              }
            })
          })
        })
      }
    },
    'devices/watch'() {
      this['devices/load']()
      if (process.platform === 'darwin') {
        this['folder/watch']({
          path: '/Volumes',
          callback: () => {
            this['devices/load']()
          }
        })
      }
    },
    'devices/unmount'(info) {
      if (process.platform === 'darwin') {
        const name = basename(info.path).replace(/\s/g, c => '\\' + c)
        exec(`diskutil unmount ${name}`)
      }
    },
    'explorer/show'(paths) {
      this['files/info'] = []
      this['files/selected'] = []
      this['explorer/loading'] = true
      this['file/read'](paths).then(entries => {
        this['explorer/loading'] = false
        this['files/info'] = entries.sort((a, b) => this['file/sort']([a, b]))
        if (this['files/selecting'].length) {
          this['files/selected'] = this['files/selecting']
          this['files/selecting'] = []
        }
      })
    },
    'clipboard/files'() {
      const files = []
      if (process.platform === 'darwin') {
        const plist = clipboard.read('NSFilenamesPboardType')
        const regex = /<string>(.+)<\/string>/g
        while (true) {
          const matches = regex.exec(plist)
          if (!matches) break
          files.push(matches[1])
        }
      }
      return files
    },
    'terminal/open'() {
      const path = this['path/full']
      const command = this['settings/user']['terminal.command']
        .replace('%PATH%', path)
      if (process.platform === 'darwin') {
        const name = this['settings/user']['terminal.darwin.name']
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
    'confirm/send'(options) {
      const waiting = this['confirm/waiting']
      if (waiting) {
        return waiting.promise.then(() => {
          return this['confirm/send'](options)
        })
      }
      const current = {}
      current.promise = new Promise(fulfill => {
        current.fulfill = fulfill
        ipcRenderer.send('confirm', options)
      })
      this['confirm/waiting'] = current
      return current.promise
    },
    'confirm/receive'(response) {
      const waiting = this['confirm/waiting']
      if (waiting) {
        waiting.fulfill(response)
      }
    },
    'confirm/duplicate'(name, target) {
      return this['confirm/send']({
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
      const path = this['path/full']
      const name = this.i18n('New folder#!8')
      const create = times => {
        const realname = this['file/avoid']({name, times})
        mkdir(join(path, realname), err => {
          if (err) create(times + 1)
        })
      }
      create(0)
    },
    'contextmenu/create-file'({data}) {
      const path = this['path/full']
      const name = basename(data) || this.i18n('New file#!10')
      const create = times => {
        const realname = this['file/avoid']({name, times})
        const callback = err => {
          if (err) create(times + 1)
        }
        if (data) {
          copyFile(data, join(path, realname), fsconst.COPYFILE_EXCL, callback)
        } else {
          writeFile(join(path, realname), '', {flag: 'wx'}, callback)
        }
      }
      create(0)
    },
    'contextmenu/refresh'() {
      this['path/load']()
    },
    'contextmenu/delete'() {
      const files = this['files/selected']
      for (const file of files) {
        shell.moveItemToTrash(file)
      }
      this['files/recentlog'] = {
        action: 'delete',
        target: files,
      }
    },
    'contextmenu/copy'() {
      const files = this['files/selected']
      if (process.platform === 'darwin') {
        clipboard.writeBuffer('NSFilenamesPboardType', Buffer.from(`
          <?xml version="1.0" encoding="UTF-8"?>
          <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
            "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
          <plist version="1.0">
            <array>
              ${ files.map(path => `<string>${path}</string>`).join('') }
            </array>
          </plist>
        `))
      }
    },
    'contextmenu/paste'() {
      const files = this['clipboard/files']()
      this['file/copy'](files)
    },
    'contextmenu/selectall'() {
      this['file/specify'](this['files/visible'].map(file => file.path))
    },
  },
}
