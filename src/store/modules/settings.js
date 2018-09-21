import settings from '../../resources/default/settings.json'

export default {
  states: {
    default: settings,
    user: {},
  },
  actions: {
    async load() {
      // load user settings
      const copied = JSON.parse(JSON.stringify(settings))
      const declared = await this.$storage.load('settings.json')
      const data = declared ? {...copied, ...declared} : copied
      this.user = data
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
