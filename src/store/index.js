import {remote, shell, clipboard, ipcRenderer} from 'electron'
import {sep, join, basename, dirname, resolve, extname} from 'path'
import {
  readdir, watch, mkdir, copyFile, writeFile,
  lstat, readlink, stat, rename, unlink,
  constants as fsconst,
} from 'fs'
import {promisify} from 'util'
import {exec, spawn} from 'child_process'

import history from './modules/history'
import settings from './modules/settings'
import fileTypes from '../presets/file-types'
import fileIcons from '../presets/file-icons'
import fileColors from '../presets/file-colors'
import folderIcons from '../presets/folder-icons'

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
    history,
  },
  states: {
    'path/full': '',
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
    'types/all': [],
    'icons/all': [],
    'icons/haystack': [],
    'colors/all': [],
  },
  getters: {
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
  actions: {
    async 'path/load'() {
      const path = this['path/full']
      try {
        const files = await promises.readdir(path)
        this['explorer/show'](files.map(file => join(path, file)))
      } catch (e) {
        if (e.code === 'ENOENT') this['path/upward']()
      }
    },
    'path/redirect'(path) {
      if (path === this['path/full']) return
      this.$core.history.pushState(path)
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
        {shortname: 'home', icon: '@feather/icon-home'},
        {shortname: 'appData'},
        {shortname: 'temp'},
        {shortname: 'desktop', name: 'Desktop#!1', icon: '@feather/icon-monitor'},
        {shortname: 'documents', name: 'Documents#!2', icon: '@feather/icon-file-text'},
        {shortname: 'downloads', name: 'Downloads#!3', icon: '@feather/icon-download'},
        {shortname: 'music', name: 'Music#!4', icon: '@feather/icon-music'},
        {shortname: 'pictures', name: 'Pictures#!5', icon: '@feather/icon-image'},
        {shortname: 'videos', name: 'Videos#!6', icon: '@feather/icon-film'},
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
    'path/icon'(path) {
      const target = this['path/defined'].find(data => data.path === path)
      return target && target.icon
    },
    'vision/toggle'() {
      this['files/vision'] = !this['files/vision']
      if (!this['files/vision']) {
        this['files/selected'] = this['files/selected']
          .filter(path => !this['file/hidden'](path))
      }
    },
    'file/hidden'(path) {
      const {settings} = this.$core
      if (process.platform !== 'win32') {
        return basename(path).charAt(0) === '.'
      }
      const hideDotFiles = settings.user['explorer.win32.hidedotfiles']
      if (hideDotFiles) {
        const isDotFile = basename(path).charAt(0) === '.'
        if (isDotFile) return true
      }
      // TODO: support winattr
      return false
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
    async 'file/follow'({type, path}) {
      if (type === 'shortcut') {
        const {target, args} = shell.readShortcutLink(path)
        const targetStats = await promises.stat(target)
        return {path: target, stats: targetStats, args}
      }
      const link = await promises.readlink(path)
      const targetPath = resolve(dirname(path), link)
      const targetStats = await promises.stat(targetPath)
      return {path: targetPath, stats: targetStats}
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
    'file/link'(info) {
      const {path, stats} = info
      if (process.platform === 'win32' &&
        extname(path) === '.lnk') return 'shortcut'
      if (stats.isSymbolicLink()) return 'symbolic'
      return false
    },
    'file/read'(paths) {
      return Promise.all(paths.map(async path => {
        const stats = await promises.lstat(path).catch(() => {})
        if (!stats) return null
        const info = {path, stats}
        const type = this['file/link'](info)
        if (!type) return info
        try {
          const link = await this['file/follow']({type, path})
          return Object.assign(info, {link})
        } catch (e) {
          return Object.assign(info, {link: info})
        }
      })).then(all => all.filter(Boolean))
    },
    'file/execute'(path) {
      this['file/executed'] = path
      shell.openItem(path)
    },
    'file/open'(info) {
      const path = info.link ? info.link.path : info.path
      const stats = info.link ? info.link.stats : info.stats
      return this['contextmenu/open']({
        data: {path, isDirectory: stats.isDirectory()}
      })
    },
    'file/type'(path) {
      // TODO: consider using `mdls`
      path = path.toLowerCase()
      for (const {type, rules} of this['types/all']) {
        if (this['rules/match']({path, rules})) return type
      }
      return null
    },
    'file/icon'(path) {
      for (const {icon, rules} of this['icons/all']) {
        if (this['rules/match']({path, rules})) return icon
      }
      return null
    },
    'file/color'(path) {
      for (const {color, rules} of this['colors/all']) {
        if (this['rules/match']({path, rules})) return color
      }
      return null
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
      const current = this['path/full']
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
        this['files/selecting'] = paths.filter(Boolean)
        this['files/recentlog'] = {
          action: 'copy',
          target: paths,
        }
      })
    },
    'file/move'(source) {
      const current = this['path/full']
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
        this['files/selecting'] = paths.filter(Boolean)
        this['files/recentlog'] = {
          action: 'move',
          target: paths,
          source,
        }
      })
    },
    'file/executable'(info) {
      const {path, stats} = info
      // TODO: cross platform
      if (process.platform === 'darwin') {
        return stats.isDirectory() && path.endsWith('.app')
      }
      return false
    },
    'folder/icon'(path) {
      for (const {icon, rules} of this['icons/haystack']) {
        if (this['rules/match']({path, rules})) return icon
      }
      return null
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
      let {type, rules} = definition
      if (!Array.isArray(rules)) {
        rules = [rules]
      }
      const allTypes = this['types/all']
      const group = allTypes.find(item => item.type === type)
      if (!group) {
        allTypes.unshift({type, rules})
      } else {
        group.rules = rules.concat(group.rules)
      }
    },
    'types/load'() {
      this['types/define'](fileTypes)
    },
    'icons/load'() {
      this['icons/define'](fileIcons)
      this['icons/tell'](folderIcons)
    },
    'icons/define'(definition) {
      if (Array.isArray(definition)) {
        definition.forEach(item => this['icons/define'](item))
        return
      }
      let {icon, rules} = definition
      if (!Array.isArray(rules)) rules = [rules]
      this['icons/all'].unshift({icon, rules})
    },
    'icons/tell'(definition) {
      if (Array.isArray(definition)) {
        definition.forEach(item => this['icons/tell'](item))
        return
      }
      let {icon, rules} = definition
      if (!Array.isArray(rules)) rules = [rules]
      this['icons/haystack'].unshift({icon, rules})
    },
    'icons/detail'(icon) {
      if (this['icons/cache'][icon]) {
        return this['icons/cache'][icon]
      }
      const matches = icon.match(/^@([^/]+)\/(.+)$/)
      if (!matches) return null
      const span = document.createElement('span')
      span.style.display = 'none'
      span.className = [matches[1] + '-icon', matches[2]].join(' ')
      document.body.appendChild(span)
      const style = getComputedStyle(span, '::before')
      const family = style.fontFamily
      const char = style.getPropertyValue('content')[1]
      document.body.removeChild(span)
      const detail = {char, family}
      this['icons/cache'][icon] = detail
      return detail
    },
    'colors/load'() {
      this['colors/define'](fileColors)
    },
    'colors/define'(definition) {
      if (Array.isArray(definition)) {
        definition.forEach(item => this['colors/define'](item))
        return
      }
      let {color, rules} = definition
      if (!Array.isArray(color)) color = [color]
      if (!Array.isArray(rules)) rules = [rules]
      this['colors/all'].unshift({color, rules})
    },
    'rules/match'({path, rules}) {
      return rules.find(rule => {
        if (typeof rule !== 'string') return path.match(rule)
        return rule.startsWith('*.') ? path.endsWith(rule.slice(1)) :
          basename(path) === rule
      })
    },
    async 'templates/load'() {
      const templates = this.$storage.filename('templates')
      const files = await promises.readdir(templates).catch(() => [])
      const paths = files.map(file => join(templates, file))
      const entries = await this['file/read'](paths)
      this['templates/all'] = entries
        .filter(({stats}) => stats.isFile())
        .map(({path}) => path)
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
    async 'devices/load'() {
      // TODO: cross platform
      if (process.platform === 'darwin') {
        const path = '/Volumes'
        // Note: display error in console
        const files = await promises.readdir(path)
        const paths = files.map(file => join(path, file))
        const entries = await this['file/read'](paths)
        this['devices/all'] = entries
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
      }
    },
    'devices/watch'() {
      this['devices/load']()
      // TODO: cross platform
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
      // TODO: cross platform
      if (process.platform === 'darwin') {
        const name = basename(info.path).replace(/\s/g, c => '\\' + c)
        exec(`diskutil unmount ${name}`)
      }
    },
    async 'explorer/show'(paths) {
      this['files/info'] = []
      this['files/selected'] = []
      this['explorer/loading'] = true
      const entries = await this['file/read'](paths)
      this['explorer/loading'] = false
      this['files/info'] = entries.sort((a, b) => this['file/sort']([a, b]))
      if (this['files/selecting'].length) {
        this['files/selected'] = this['files/selecting']
        this['files/selecting'] = []
      }
    },
    'clipboard/files'() {
      const files = []
      // TODO: cross platform
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
      const {settings} = this.$core
      const path = this['path/full']
      const command = settings.user['terminal.command']
        .replace('%PATH%', path)
      // TODO: cross platform
      if (process.platform === 'darwin') {
        const name = settings.user['terminal.darwin.name']
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
      const name = (data && basename(data)) || this.i18n('New file#!10')
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
      // TODO: cross platform
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
    'contextmenu/open'({data}) {
      const {path, isDirectory} = data
      if (isDirectory) {
        this['path/redirect'](path)
      } else {
        this['file/execute'](path)
      }
    },
    'contextmenu/open-window'({data}) {
      ipcRenderer.send('open-window', {path: data})
    },
    'contextmenu/property'({data}) {
      ipcRenderer.send('property', {path: data})
    },
  },
}
