import {remote} from 'electron'
import {sep, join} from 'path'
import {readdir} from 'fs'
import {promisify} from 'util'

const promises = {
  readdir: promisify(readdir),
}

const {additionalArguments} = remote.getCurrentWindow()

export default {
  states: {
    path: '',
    watchers: null,
  },
  getters: {
    floors() {
      const floors = this.path.split(sep)
      return floors[floors.length - 1] ? floors : floors.slice(0, -1)
    },
    steps() {
      return this.floors.map((floor, index) => {
        const path = index === 0 && !floor ? '/' :
          this.floors.slice(0, index + 1).join(sep)
        const name = this.$core.utilities.basename(path)
        return {name, path}
      })
    },
  },
  actions: {
    async load() {
      const path = this.path
      try {
        const files = await promises.readdir(path)
        this.$core.explorer.show(files.map(file => join(path, file)))
      } catch (e) {
        if (e.code === 'ENOENT') this.upward()
      }
    },
    assign(path) {
      if (path === this.path) return
      this.$core.history.pushState(this.path)
      this.replace(path)
    },
    replace(path) {
      if (path === this.path) return
      this.path = path
      document.title = this.$core.utilities.basename(path)
      this.watch()
    },
    watch() {
      if (this.watchers) {
        this.watchers.forEach(watcher => watcher.close())
      }
      this.watchers = this.$core.system.watch(this.path, () => this.load())
      this.load()
    },
    upward() {
      const {length} = this.floors
      if (length > 1) {
        const path = this.floors.slice(0, length - 1).join(sep) || '/'
        this.assign(path)
      }
    },
    start() {
      let {path} = additionalArguments
      if (!path) {
        const startupPath = this.$core.settings.user['explorer.startup.path']
        path = this.$core.utilities.interpretPath(startupPath)
      }
      this.replace(path)
    }
  }
}
