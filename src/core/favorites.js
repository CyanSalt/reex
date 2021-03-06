export default {
  states: {
    list: [],
  },
  actions: {
    load() {
      const favorites = this.$core.settings.user['quickaccess.favorites']
        .map(entry => this.$core.utilities.interpretPath(entry))
      this.$core.system.readAll(favorites).then(entries => {
        this.list = entries
      })
    },
  },
}
