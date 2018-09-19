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
  },
  actions: {
    async load() {
      // TODO: cross platform
      if (process.platform === 'darwin') {
        const path = '/Volumes'
        // Note: display error in console
        const files = await promises.readdir(path)
        const paths = files.map(file => join(path, file))
        const entries = await this.$core['file/read'](paths)
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
      this.load()
      // TODO: cross platform
      if (process.platform === 'darwin') {
        this.$core['folder/watch']({
          path: '/Volumes',
          callback: () => this.load(),
        })
      }
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
