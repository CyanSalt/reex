<template>
  <div id="main">
    <quick-access></quick-access>
    <file-explorer></file-explorer>
  </div>
</template>

<script>
import QuickAccess from './quick-access'
import FileExplorer from './file-explorer'

export default {
  el: '#main',
  components: {
    'quick-access': QuickAccess,
    'file-explorer': FileExplorer,
  },
  data: {
  },
  computed: {
  },
  methods: {
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
    // custom script
    this.$storage.require('custom.js', init => init(this))
  }
}
</script>

<style>
#main {
  display: flex;
  height: 100vh;
}
</style>
