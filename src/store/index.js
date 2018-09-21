import settings from './settings'
import location from './location'
import explorer from './explorer'
import selection from './selection'
import history from './history'
import templates from './templates'
import devices from './devices'
import favorites from './favorites'
import dialog from './dialog'
import clipboard from './clipboard'
import presets from './presets'
import system from './system'
import shell from './shell'
import commands from './commands'

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
    commands,
  },
}
