import {readdir} from 'fs'
import {join} from 'path'
import {promisify} from 'util'

const promises = {
  readdir: promisify(readdir),
}

export default {
  states: {
    list: []
  },
  actions: {
    async load(folder) {
      const files = await promises.readdir(folder).catch(() => [])
      const paths = files.map(file => join(folder, file))
      const entries = await this.$core.system.readAll(paths)
      this.list = entries
        .filter(({stats}) => stats.isFile())
        .map(({path}) => path)
    },
    watch(folder) {
      this.load(folder)
      this.$core.system.watch(folder, () => this.load(folder))
    },
  },
}
