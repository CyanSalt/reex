import {join, basename} from 'path'
import {readdir} from 'fs'
import {promisify} from 'util'
import {exec} from 'child_process'

const promises = {
  readdir: promisify(readdir),
}

export default {
  states: {
    list: [],
    removable: [],
    watchers: null,
  },
  actions: {
    async load() {
      // TODO: cross platform
      if (process.platform === 'darwin') {
        const path = '/Volumes'
        // Note: display error in console
        const files = await promises.readdir(path)
        const paths = files.map(file => join(path, file))
        const entries = await this.$core.system.readAll(paths)
        this.list = entries
        files.forEach(file => {
          const name = file.replace(/\s/g, c => '\\' + c)
          const command = [
            `diskutil info ${name}`,
            'awk \'/Removable Media:/{print $3}\'',
          ].join(' | ')
          exec(command, (error, stdout) => {
            if (!error && stdout.toString().trim() === 'Removable') {
              this.removable.push(join(path, file))
            }
          })
        })
      }
    },
    watch() {
      if (this.watchers) {
        this.watchers.forEach(watcher => watcher.close())
      }
      // TODO: cross platform
      if (process.platform === 'darwin') {
        this.watchers = this.$core.system.watch('/Volumes', () => this.load())
      }
      this.load()
    },
    unmount(info) {
      // TODO: cross platform
      if (process.platform === 'darwin') {
        const name = basename(info.path).replace(/\s/g, c => '\\' + c)
        exec(`diskutil unmount ${name}`)
      }
    },
  }
}
