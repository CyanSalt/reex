import {basename} from 'path'

export default {
  states: {
    fileList: [],
    loading: false,
    visibility: false,
  },
  getters: {
    files() {
      if (this.visibility) return this.fileList
      return this.fileList.filter(file => {
        return !this.$core.system.isHidden(file.path)
      })
    },
  },
  actions: {
    async show(paths) {
      this.fileList = []
      this.$core.selection.range = []
      this.loading = true
      const entries = await this.$core.system.readAll(paths)
      this.loading = false
      this.fileList = entries.sort(this.compare)
      this.$core.selection.ensure()
    },
    compare(a, b) {
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
    setVisibility(visibility) {
      this.visibility = visibility
      if (!visibility) this.$core.selection.update()
    },
  },
}
