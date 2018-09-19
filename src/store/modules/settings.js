import settings from '../../resources/default/settings.json'

export default {
  states: {
    default: settings,
    user: {},
    favorites: [],
  },
  actions: {
    async load() {
      // load user settings
      const copied = JSON.parse(JSON.stringify(settings))
      const declared = await this.$storage.load('settings.json')
      const data = declared ? {...copied, ...declared} : copied
      this.user = data
      // load other states in store
      const favorites = data['quickaccess.favorites']
        .map(entry => this.$core['path/interpret'](entry))
      this.$core['file/read'](favorites).then(entries => {
        this.$core['path/favorites'] = entries
      })
      return data
    },
    save() {
      // filter default values on saving
      const data = this.user
      const reducer = (diff, [key, value]) => {
        if (JSON.stringify(value) !== JSON.stringify(data[key])) {
          diff[key] = data[key]
        }
        return diff
      }
      const computed = Object.entries(settings).reduce(reducer, {})
      this.$storage.save('settings.json', computed)
    },
  },
}
