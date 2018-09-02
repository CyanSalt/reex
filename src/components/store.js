import {remote, shell, clipboard} from 'electron'
import {sep, join, basename, dirname, resolve, extname} from 'path'
import {readdir, watch, mkdir, copyFile, writeFile, lstat, readlink, stat} from 'fs'
import {promisify} from 'util'
import settings from '../resources/default/settings.json'
import {exec, spawn} from 'child_process'

const promises = {
  lstat: promisify(lstat),
  readlink: promisify(readlink),
  stat: promisify(stat),
  copyFile: promisify(copyFile),
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
      const span = document.createElement('span')
      span.style.display = 'none'
      document.body.appendChild(span)
      const style = getComputedStyle(span, '::before')
      for (const data of electronPaths) {
        if (data.name) {
          data.name = this.i18n(data.name)
        }
        if (!data.waterchar && data.watermark) {
          span.className = data.watermark
          data.waterchar = style.getPropertyValue('content')[1]
        }
        if (!data.path) {
          if (data.shortname === 'reex') {
            data.path = remote.app.getAppPath()
          } else {
            data.path = remote.app.getPath(data.shortname)
          }
        }
      }
      document.body.removeChild(span)
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
    'file/watermark'(path) {
      const target = this['path/defined'].find(data => data.path === path)
      return target && target.watermark
    },
    'file/waterchar'(path) {
      const target = this['path/defined'].find(data => data.path === path)
      return target && target.waterchar
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
      const images = [
        '.apng', '.bmp', '.cgm', '.g3', '.gif', '.ief', '.jp2', '.jpg2',
        '.jpeg', '.jpg', '.jpe', '.jpm', '.jpx', '.jpf', '.ktx', '.png',
        '.sgi', '.svg', '.svgz', '.tiff', '.tif', '.webp',
      ]
      if (images.includes(ext)) return 'image'
      return ''
    },
    'file/avoid'({name, times}) {
      if (!times) return name
      const steps = name.split('.')
      return steps.slice(0, -1).join('.') + ` (${times}).` +
        steps[steps.length - 1]
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
            tell context to write text "cd ${path}; clear; pwd"
            activate
          end tell`
        } else {
          script = `tell application "Terminal"
            do script "cd ${path}; clear; pwd"
            activate
          end tell`
        }
        spawn('osascript', ['-e', script])
      }
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
          copyFile(data, join(path, realname), callback)
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
      const current = this['path/full']
      Promise.all(files.map(path => {
        const name = basename(path)
        const create = times => {
          const realname = this['file/avoid']({name, times})
          const target = join(current, realname)
          return promises.copyFile(path, target).then(() => target)
            .catch(() => create(times + 1))
        }
        return create(dirname(path) === current ? 1 : 0)
      })).then(paths => {
        this['files/selecting'] = paths
      })
    },
    'contextmenu/selectall'() {
      this['file/specify'](this['files/visible'].map(file => file.path))
    },
  },
}
