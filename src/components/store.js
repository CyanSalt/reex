import {remote} from 'electron'

export default {
  data: {
    'global/defaultSettings': {},
    'global/settings': {},
    'explorer/path': '',
    'explorer/pathStack': [],
    'explorer/pathForwards': [],
  },
  methods: {
    'settings/load'(data) {
      this['global/settings'] = data
      // load other states in store
      const path = data['explorer.startup.path']
      this['explorer/path'] = this['path/interpret'](path)
      // emit loaded event
      this.$emit('settings/loaded', data)
    },
    'path/redirect'(path) {
      this['explorer/pathStack'].push(this['explorer/path'])
      this['explorer/pathForwards'] = []
      this['explorer/path'] = path
    },
    'path/back'() {
      if (this['explorer/pathStack'].length) {
        const path = this['explorer/pathStack'].pop()
        this['explorer/pathForwards'].push(this['explorer/path'])
        this['explorer/path'] = path
      }
    },
    'path/forward'() {
      if (this['explorer/pathForwards'].length) {
        const path = this['explorer/pathForwards'].pop()
        this['explorer/pathStack'].push(this['explorer/path'])
        this['explorer/path'] = path
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
          if (name === 'aniwhere') {
            return remote.app.getAppPath()
          }
          return remote.app.getPath(name)
        } catch (e) {}
        return full
      }
      return path.replace(windowsVariables, systemReplacement)
        .replace(unixVariables, systemReplacement)
        .replace(electronVariables, electronReplacement)
    }
  },
}
