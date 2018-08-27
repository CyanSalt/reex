<template>
  <div id="main">
    <quick-access></quick-access>
    <file-explorer></file-explorer>
  </div>
</template>

<script>
import QuickAccess from './quick-access'
import FileExplorer from './file-explorer'
import settings from '../resources/default/settings.json'

export default {
  el: '#main',
  components: {
    'quick-access': QuickAccess,
    'file-explorer': FileExplorer,
  },
  beforeCreate() {
    // custom stylesheet
    const stylesheet = this.$storage.rawdataSync('custom.css')
    if (stylesheet) {
      const element = document.createElement('style')
      element.appendChild(document.createTextNode(stylesheet))
      document.head.appendChild(element)
    }
  },
  created() {
    // load default settings
    this.$flux.set('settings/default', settings)
    // custom script
    this.$storage.require('custom.js', init => init(this))
    // load user settings
    this.$storage.load('settings.json', (err, data) => {
      const copied = JSON.parse(JSON.stringify(settings))
      data = err ? copied : {...copied, ...data}
      this.$flux.dispatch('settings/load', data)
      // filter default values on saving
      const reducer = (diff, [key, value]) => {
        if (JSON.stringify(value) !== JSON.stringify(data[key])) {
          diff[key] = data[key]
        }
        return diff
      }
      this.$flux.on('settings/save', () => {
        const computed = Object.entries(settings).reduce(reducer, {})
        this.$storage.save('settings.json', computed)
      })
    })
  }
}
</script>

<style>
#main {
  display: flex;
  height: 100vh;
}
</style>
