import {remote} from 'electron'
import {sep} from 'path'
import {readdir} from 'fs'

export default {
  data: {
    'settings/default': {},
    'settings/user': {},
    'path/full': '',
    'path/stack': [],
    'path/forwards': [],
    'files/all': [],
    'files/vision': false,
  },
  computed: {
    'path/floors'() {
      return this['path/full'].split(sep)
    },
    'path/names'() {
      return this['path/floors'].map((floor, index) => {
        if (!floor && index === 0) {
          return '/'
        }
        return floor
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
      this['path/full'] = this['path/interpret'](path)
      this['path/load']()
      // emit loaded event
      this.$emit('settings/loaded', data)
    },
    'path/load'() {
      readdir(this['path/full'], (err, files) => {
        if (err) return
        this['files/all'] = files
      })
    },
    'path/redirect'(path) {
      this['path/stack'].push(this['path/full'])
      this['path/forwards'] = []
      this['path/full'] = path
      this['path/load']()
    },
    'path/back'() {
      if (this['path/stack'].length) {
        const path = this['path/stack'].pop()
        this['path/forwards'].push(this['path/full'])
        this['path/full'] = path
        this['path/load']()
      }
    },
    'path/forward'() {
      if (this['path/forwards'].length) {
        const path = this['path/forwards'].pop()
        this['path/stack'].push(this['path/full'])
        this['path/full'] = path
        this['path/load']()
      }
    },
    'path/stop'(index) {
      const path = this['path/floors'].slice(0, index + 1).join(sep) || '/'
      this['path/redirect'](path)
    },
    'path/upward'() {
      if (this['path/floors'].length > 1) {
        this['path/stop'](this['path/floors'].length - 2)
      }
    },
    'path/interpret'(path) {
      const windowsVariables = /%([^%]+)%/g
      const unixVariables = /\$\{([^}]+)\}/g
      const electronPaths = [
        'aniwhere', 'home', 'appData', 'temp',
        'desktop', 'documents', 'downloads',
        'music', 'pictures', 'videos',
      ]
      const electronVariables = new RegExp(`\\[(${
        electronPaths.join('|')
      })\\]`, 'g')
      const systemReplacement = (full, name) => {
        return process.env[name] || full
      }
      const electronReplacement = (full, name) => {
        try {
          if (name === 'reex') {
            return remote.app.getAppPath()
          }
          return remote.app.getPath(name)
        } catch (e) {}
        return full
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
  },
}
