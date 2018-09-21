import {ipcRenderer} from 'electron'

export default {
  states: {
    waiting: null,
  },
  actions: {
    confirm(options) {
      const waiting = this.waiting
      if (waiting) {
        return waiting.promise.then(() => {
          return this.send(options)
        })
      }
      const current = {}
      current.promise = new Promise(fulfill => {
        current.fulfill = fulfill
        ipcRenderer.send('confirm', options)
      })
      this.waiting = current
      return current.promise
    },
    receive(response) {
      const waiting = this.waiting
      if (waiting) {
        waiting.fulfill(response)
      }
    },
  },
}
