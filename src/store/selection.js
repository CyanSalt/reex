export default {
  states: {
    range: [],
    waiting: [],
  },
  actions: {
    selectable(path) {
      const {explorer, system} = this.$core
      if (!explorer.visibility && system.isHidden(path)) return false
      return true
    },
    add(path) {
      if (this.range.includes(path)) return
      if (!this.selectable(path)) return
      this.range.push(path)
    },
    remove(path) {
      const index = this.range.indexOf(path)
      if (index === -1) return
      this.range.splice(index, 1)
    },
    select(paths) {
      const range = []
      paths.forEach(path => {
        if (range.includes(path)) return
        if (!this.selectable(path)) return
        range.push(path)
      })
      this.range = range
    },
    selectAll() {
      const files = this.$core.explorer.files.map(file => file.path)
      this.select(files)
    },
    update() {
      this.select(this.range)
    },
    willSelect(paths) {
      this.selecting = paths
    },
    ensure() {
      if (!this.waiting.length) return
      this.range = this.waiting
      this.waiting = []
    },
  },
}
