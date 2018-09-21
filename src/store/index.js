import settings from './modules/settings'
import location from './modules/location'
import explorer from './modules/explorer'
import selection from './modules/selection'
import history from './modules/history'
import templates from './modules/templates'
import devices from './modules/devices'
import favorites from './modules/favorites'
import dialog from './modules/dialog'
import clipboard from './modules/clipboard'
import presets from './modules/presets'
import system from './modules/system'
import shell from './modules/shell'

// TODO: support permission like jorangreef/sudo-prompt
// TODO: use session to share in different window
export default {
  modules: {
    settings,
    location,
    explorer,
    selection,
    history,
    templates,
    devices,
    favorites,
    dialog,
    clipboard,
    presets,
    system,
    shell,
  },
  actions: {
    // Context menu actions
    'contextmenu/create-folder'() {
      const path = this.$core.location.path
      this.$core.shell.createFolder(path)
    },
    'contextmenu/create-file'({data}) {
      const path = this.$core.location.path
      this.$core.shell.createFile(path, data)
    },
    'contextmenu/delete'() {
      const files = this.$core.selection.range
      this.$core.shell.delete(files)
    },
    'contextmenu/copy'() {
      const files = this.$core.selection.range
      this.$core.clipboard.writeFiles(files)
    },
    'contextmenu/paste'() {
      const files = this.$core.clipboard.readFiles()
      const path = this.$core.location.path
      this.$core.shell.copy(files, path)
    },
    'contextmenu/open'({data}) {
      const {path, isDirectory} = data
      if (isDirectory) {
        this.$core.location.assign(path)
      } else {
        this.$core.shell.openFile(path)
      }
    },
    'contextmenu/open-window'({data}) {
      this.$core.shell.openWindow(data)
    },
    'contextmenu/property'({data}) {
      this.$core.shell.openProperty(data)
    },
    'contextmenu/refresh'() {
      this.$core.location.load()
    },
  },
}
