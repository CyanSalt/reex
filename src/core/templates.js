import {readdir} from 'fs'
import {join} from 'path'
import {promisify} from 'util'

const promises = {
  readdir: promisify(readdir),
}

export default {
  states: {
    list: [],
    watchers: null,
  },
  actions: {
    async load() {
      const folder = this.$core.utilities.interpretPath(
        this.$core.settings.user['explorer.templates.path']
      )
      const files = await promises.readdir(folder).catch(() => [])
      const paths = files.map(file => join(folder, file))
      const entries = await this.$core.system.readAll(paths)
      this.list = entries
        .filter(({stats}) => stats.isFile())
        .map(({path}) => path)
    },
    watch() {
      const folder = this.$core.utilities.interpretPath(
        this.$core.settings.user['explorer.templates.path']
      )
      if (this.watchers) {
        this.watchers.forEach(watcher => watcher.close())
      }
      this.watchers = this.$core.system.watch(folder, () => this.load())
      this.load()
    },
  },
}
