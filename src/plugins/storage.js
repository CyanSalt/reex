import {readFile, readFileSync, writeFile, mkdir, access} from 'fs'
import {dirname, resolve} from 'path'
import {promisify} from 'util'

const promises = {
  readFile: promisify(readFile),
  access: promisify(access),
  mkdir: promisify(mkdir),
  writeFile: promisify(writeFile),
}

const PATH = process.env.NODE_ENV === 'production' ?
  dirname(process.execPath) : __dirname

export const FileStorage = {
  async load(basename) {
    try {
      return JSON.parse(await this.content(basename))
    } catch (e) {
      return null
    }
  },
  loadSync(basename) {
    try {
      return JSON.parse(this.contentSync(basename))
    } catch (e) {
      return null
    }
  },
  async save(basename, data) {
    const filename = this.filename(basename)
    try {
      await promises.mkdir(dirname(filename))
    } catch (e) {}
    return promises.writeFile(filename, this.stringify(data))
  },
  async content(basename) {
    try {
      return await promises.readFile(this.filename(basename))
    } catch (e) {
      return null
    }
  },
  contentSync(basename) {
    try {
      return readFileSync(this.filename(basename))
    } catch (e) {
      return null
    }
  },
  require(basename) {
    const filename = this.filename(basename)
    try {
      return global.require(filename)
    } catch (e) {
      return null
    }
  },
  stringify(data) {
    return JSON.stringify(data, null, 2)
  },
  filename(basename) {
    return resolve(PATH, 'storage', basename)
  },
}

export default {
  install(Vue, options) {
    Vue.prototype.$storage = FileStorage
  }
}
