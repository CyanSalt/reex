export default {
  states: {
    stack: [],
    forwards: [],
  },
  actions: {
    back() {
      if (!this.stack.length) return
      const path = this.stack.pop()
      this.forwards.push(this.$core['path/full'])
      this.$core['path/replace'](path)
    },
    forward() {
      if (!this.forwards.length) return
      const path = this.forwards.pop()
      this.stack.push(this.$core['path/full'])
      this.$core['path/replace'](path)
    },
    pushState(path) {
      this.stack.push(path)
      this.forwards = []
    },
  },
}
