import {shell} from 'electron'
import {stat, lstat, readlink, watch} from 'fs'
import {resolve, dirname, extname, join} from 'path'
import {promisify} from 'util'

const promises = {
  stat: promisify(stat),
  lstat: promisify(lstat),
  readlink: promisify(readlink),
}

export default {
  states: {
    executed: null,
  },
  actions: {
    linking(info) {
      const {path, stats} = info
      if (process.platform === 'win32' &&
        extname(path) === '.lnk') return 'shortcut'
      if (stats.isSymbolicLink()) return 'symbolic'
      return false
    },
    async follow(type, path) {
      if (type === 'shortcut') {
        const {target, args} = shell.readShortcutLink(path)
        const targetStats = await promises.stat(target)
        return {path: target, stats: targetStats, args}
      }
      const link = await promises.readlink(path)
      const targetPath = resolve(dirname(path), link)
      const targetStats = await promises.stat(targetPath)
      return {path: targetPath, stats: targetStats}
    },
    async read(path) {
      const stats = await promises.lstat(path).catch(() => {})
      if (!stats) return null
      const info = {path, stats}
      const type = this.linking(info)
      if (!type) return info
      try {
        const link = await this.follow(type, path)
        return Object.assign(info, {link})
      } catch (e) {
        return Object.assign(info, {link: info})
      }
    },
    async readAll(paths) {
      const all = await Promise.all(paths.map(path => this.read(path)))
      return all.filter(Boolean)
    },
    watch(path, callback) {
      const parent = dirname(path)
      const watchers = []
      try {
        watchers[0] = watch(path, (type, file) => {
          if (file === '.DS_Store') return
          if (this.executed && join(path, file) === this.executed) {
            this.executed = null
            return
          }
          callback()
        })
        if (parent && parent !== path) {
          watchers[1] = watch(parent, (type, file) => {
            if (file === '.DS_Store') return
            if (join(parent, file) === path) {
              callback()
            }
          })
        }
      } catch (e) {}
      return watchers
    },
    open(path) {
      this.executed = path
      shell.openItem(path)
    },
  },
}
