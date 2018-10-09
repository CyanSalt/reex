import {clipboard} from 'electron'

// TODO: add XML parser and builder
export default {
  actions: {
    readFiles() {
      const files = []
      // TODO: cross platform
      if (process.platform === 'darwin') {
        const plist = clipboard.read('NSFilenamesPboardType')
        const regex = /<string>(.+)<\/string>/g
        while (true) {
          const matches = regex.exec(plist)
          if (!matches) break
          files.push(matches[1])
        }
      }
      return files
    },
    writeFiles(files) {
      // TODO: cross platform
      if (process.platform === 'darwin') {
        clipboard.writeBuffer('NSFilenamesPboardType', Buffer.from(`
          <?xml version="1.0" encoding="UTF-8"?>
          <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
            "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
          <plist version="1.0">
            <array>
              ${ files.map(path => `<string>${path}</string>`).join('') }
            </array>
          </plist>
        `))
      }
    },
  }
}
