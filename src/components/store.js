export default {
  data: {
    'global/defaultSettings': {},
    'global/settings': {},
    'explorer/path': '',
    'explorer/pathStack': [],
  },
  method: {
    redirect(path) {
      this['explorer/pathStack'].push(this['explorer/path'])
      this['explorer/path'] = path
    }
  },
}
