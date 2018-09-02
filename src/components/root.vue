<template>
  <div id="main">
    <quick-access></quick-access>
    <file-explorer></file-explorer>
  </div>
</template>

<script>
import {ipcRenderer} from 'electron'
import QuickAccess from './quick-access'
import FileExplorer from './file-explorer'

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
    this.$flux.dispatch('path/preload')
    this.$flux.dispatch('settings/load')
    // load file templates
    this.$flux.dispatch('templates/watch')
    this.$flux.dispatch('devices/watch')
    ipcRenderer.on('contextmenu', (e, args) => {
      if (!args.action) return
      this.$flux.dispatch(`contextmenu/${args.action}`, args)
    })
    document.addEventListener('copy', e => {
      e.preventDefault()
      this.$flux.dispatch('contextmenu/copy', e)
    })
    document.addEventListener('paste', e => {
      e.preventDefault()
      this.$flux.dispatch('contextmenu/paste', e)
    })
    document.addEventListener('selectionchange', e => {
      e.preventDefault()
      // FIXME: `selectionchange` might not be triggered
      this.$flux.dispatch('contextmenu/selectall', e)
    })
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
