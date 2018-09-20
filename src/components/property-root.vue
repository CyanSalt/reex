<template>
  <div id="main" @dragover.prevent @drop.prevent>
    <property-title></property-title>
    <property-content></property-content>
  </div>
</template>

<script>
import PropertyTitle from './property-title'
import PropertyContent from './property-content'

export default {
  el: '#main',
  components: {
    'property-title': PropertyTitle,
    'property-content': PropertyContent,
  },
  beforeCreate() {
    // custom stylesheet
    const stylesheet = this.$storage.readSync('custom.css')
    if (stylesheet) {
      const element = document.createElement('style')
      element.appendChild(document.createTextNode(stylesheet))
      document.head.appendChild(element)
    }
  },
  created() {
    this.$core.presets.load()
    this.$core.settings.load().then(data => {
      // emit loaded event
      this.$emit('settings/loaded', data)
    })
    // custom script
    const initScript = this.$storage.require('custom.js')
    initScript && initScript(this)
  }
}
</script>
