const commands = {
  'create-folder'() {
    const path = this.$core.location.path
    this.$core.shell.createFolder(path)
  },
  'create-file'(data) {
    const path = this.$core.location.path
    this.$core.shell.createFile(path, data)
  },
  'delete'() {
    const files = this.$core.selection.range
    this.$core.shell.delete(files)
  },
  'copy'() {
    const files = this.$core.selection.range
    this.$core.clipboard.writeFiles(files)
  },
  'paste'() {
    const files = this.$core.clipboard.readFiles()
    const path = this.$core.location.path
    this.$core.shell.copy(files, path)
  },
  'open'(data) {
    const {path, isDirectory} = data
    if (isDirectory) {
      this.$core.location.assign(path)
    } else {
      this.$core.shell.openFile(path)
    }
  },
  'open-path'(data) {
    this.$core.location.assign(data)
  },
  'open-window'(data) {
    this.$core.shell.openWindow(data)
  },
  'open-property'(data) {
    this.$core.shell.openProperty(data)
  },
  'refresh'() {
    this.$core.location.load()
  },
}

export default {
  actions: {
    exec(command, data) {
      if (!commands[command]) return
      commands[command].call(this, data)
    },
  },
}
