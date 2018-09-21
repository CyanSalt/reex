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
    const stylesheet = this.$storage.readSync('custom.css')
    if (stylesheet) {
      const element = document.createElement('style')
      element.appendChild(document.createTextNode(stylesheet))
      document.head.appendChild(element)
    }
  },
  // eslint-disable-next-line max-lines-per-function
  created() {
    this.$core.presets.load()
    this.$core.settings.load().then(data => {
      // emit loaded event
      this.$emit('settings/loaded', data)
      // load startup path
      this.$core.location.start()
      // load file templates
      this.$core.templates.watch()
      // load favorites
      this.$core.favorites.load()
    })
    this.$core.devices.watch()
    ipcRenderer.on('contextmenu', (e, args) => {
      if (!args.command) return
      this.$core.commands.exec(args.command, args.data)
    })
    document.addEventListener('copy', e => {
      if (this.editing()) return
      e.preventDefault()
      this.$core.commands.exec('copy')
    })
    ipcRenderer.on('paste', (e, args) => {
      if (this.editing()) {
        document.execCommand('paste')
      } else {
        this.$core.commands.exec('paste')
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
      this.$core.selection.selectAll()
    })
    ipcRenderer.on('confirm', (event, args) => {
      this.$core.dialog.receive(args)
    })
    // custom script
    const initScript = this.$storage.require('custom.js')
    initScript && initScript(this)
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
