import {remote} from 'electron'
import {sep, join, basename, dirname} from 'path'
import {readdir, watch, mkdir, copyFile, writeFile, lstat} from 'fs'
import {promisify} from 'util'

export default {
  data: {
    'settings/default': {},
    'settings/user': {},
    'path/full': '',
    'path/stack': [],
    'path/forwards': [],
    'path/defined': [],
    'path/watcher': [],
    'files/all': [],
    'files/vision': false,
    'files/selected': [],
    'templates/all': [],
  },
  computed: {
    'path/floors'() {
      const floors = this['path/full'].split(sep)
      return floors[floors.length - 1] ? floors : floors.slice(0, -1)
    },
    'path/steps'() {
      return this['path/floors'].map((floor, index) => {
        const path = this['path/floors'].slice(0, index + 1).join(sep)
        const name = this['file/name'](path)
        return {name, path}
      })
    },
    'files/visible'() {
      if (this['files/vision']) return this['files/all']
      return this['files/all'].filter(file => !this['file/hidden'](file))
    },
  },
  methods: {
    'settings/load'(data) {
      this['settings/user'] = data
      // load other states in store
      const path = data['explorer.startup.path']
      this['path/replace'](this['path/interpret'](path))
      // emit loaded event
      this.$emit('settings/loaded', data)
    },
    'path/load'() {
      readdir(this['path/full'], (err, files) => {
        if (err) {
          if (err.code === 'ENOENT') {
            this['path/upward']()
          }
          return
        }
        this['files/all'] = files
        this['files/selected'] = []
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
    },
    'path/watch'() {
      if (this['path/watcher'].length) {
        this['path/watcher'].forEach(watcher => watcher.close())
      }
      this['path/watcher'] = this['folder/watch']({
        path: this['path/full'],
        callback() {
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
        {shortname: 'home'},
        {shortname: 'appData'},
        {shortname: 'temp'},
        {shortname: 'desktop', name: 'Desktop#!1'},
        {shortname: 'documents', name: 'Documents#!2'},
        {shortname: 'downloads', name: 'Downloads#!3'},
        {shortname: 'music', name: 'Music#!4'},
        {shortname: 'pictures', name: 'Pictures#!5'},
        {shortname: 'videos', name: 'Videos#!6'},
      ]
      for (const data of electronPaths) {
        try {
          if (data.name) data.name = this.i18n(data.name)
          data.path = data.shortname === 'reex' ? remote.app.getAppPath() :
            remote.app.getPath(data.shortname)
        } catch (e) {}
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
    },
    'file/hidden'(file) {
      return file.charAt(0) === '.'
    },
    'file/select'(file) {
      if (!this['files/selected'].includes(file)) {
        this['files/selected'].push(file)
      }
    },
    'file/specify'(file) {
      this['files/selected'] = file ? [file] : []
    },
    'file/name'(file) {
      const target = this['path/defined'].find(data => data.path === file)
      return (target && target.name) || basename(file) || '/'
    },
    'folder/watch'({path, callback}) {
      const parent = dirname(path)
      const watchers = []
      try {
        watchers[0] = watch(path, (type, file) => {
          if (file === '.DS_Store') return
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
      const lstatAsync = promisify(lstat)
      readdir(templates, (err, files) => {
        if (err) return
        Promise.all(files.map(
          file => lstatAsync(join(templates, file))
            .then(stats => [file, stats])
        )).then(entries => {
          this['templates/all'] = entries
            .filter(([file, stats]) => stats.isFile())
            .map(([file, stats]) => file)
        })
      })
    },
    // Context menu actions
    'contextmenu/create-folder'() {
      const path = this['path/full']
      const name = this.i18n('New folder#!8')
      ;(function create(times) {
        const realname = times ? `${name} (${times})` : name
        mkdir(join(path, realname), err => {
          if (err) create(times + 1)
        })
      })(0)
    },
    'contextmenu/create-file'({data}) {
      const path = this['path/full']
      const name = data || this.i18n('New file#!10')
      const templates = this.$storage.filename('templates')
      ;(function create(times) {
        const realname = times ? `${name} (${times})` : name
        const callback = err => {
          if (err) create(times + 1)
        }
        if (data) {
          copyFile(join(templates, name), join(path, realname), callback)
        } else {
          writeFile(join(path, realname), '', {flag: 'wx'}, callback)
        }
      })(0)
    },
    'contextmenu/refresh'() {
      this['path/load']()
    },
  },
}
