<template>
  <div id="main" @dragover.prevent @drop.prevent>
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
  methods: {
    editing() {
      const {activeElement} = document
      return activeElement && activeElement !== document.body ?
        activeElement : null
    }
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
    this.$flux.dispatch('types/load')
    this.$flux.dispatch('icons/load')
    // load file templates
    this.$flux.dispatch('templates/watch')
    this.$flux.dispatch('devices/watch')
    ipcRenderer.on('contextmenu', (e, args) => {
      if (!args.action) return
      this.$flux.dispatch(`contextmenu/${args.action}`, args)
    })
    document.addEventListener('copy', e => {
      if (this.editing()) return
      e.preventDefault()
      this.$flux.dispatch('contextmenu/copy')
    })
    ipcRenderer.on('paste', (e, args) => {
      if (this.editing()) {
        document.execCommand('paste')
      } else {
        this.$flux.dispatch('contextmenu/paste')
      }
    })
    // make selection change every time except after `removeAllRanges`
    let manually = false
    document.addEventListener('selectionchange', e => {
      if (this.editing()) return
      e.preventDefault()
      if (manually) {
        manually = false
        return
      }
      manually = true
      const selection = window.getSelection()
      selection.removeAllRanges()
      this.$flux.dispatch('contextmenu/selectall', e)
    })
    ipcRenderer.on('confirm', (event, args) => {
      this.$flux.dispatch('confirm/receive', args)
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
  background: white;
}
</style>
