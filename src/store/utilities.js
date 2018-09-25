import {basename} from 'path'

const windowsVariables = /%([^%]+)%/g
const unixVariables = /\$\{([^}]+)\}/g

export default {
  states: {
    iconCache: {},
  },
  actions: {
    icon(icon) {
      if (this.iconCache[icon]) {
        return this.iconCache[icon]
      }
      const matches = icon.match(/^@([^/]+)\/(.+)$/)
      if (!matches) return null
      const span = document.createElement('span')
      span.style.display = 'none'
      span.className = [matches[1] + '-icon', matches[2]].join(' ')
      document.body.appendChild(span)
      const style = getComputedStyle(span, '::before')
      const family = style.fontFamily
      const char = style.getPropertyValue('content')[1]
      document.body.removeChild(span)
      const detail = {char, family}
      this.iconCache[icon] = detail
      return detail
    },
    basename(path) {
      const variable = this.$core.presets.getVariable(path)
      return (variable && variable.name) || basename(path) || '/'
    },
    interpretPath(path) {
      const {variables} = this.$core.presets
      const ids = variables.map(data => data.id)
      const presetVariables = new RegExp(`\\[(${ids.join('|')})\\]`, 'g')
      const systemReplacement = (full, name) => {
        return process.env[name] || full
      }
      const presetReplacement = (full, name) => {
        const target = variables.find(data => data.id === name)
        return target ? target.path : full
      }
      return path.replace(windowsVariables, systemReplacement)
        .replace(unixVariables, systemReplacement)
        .replace(presetVariables, presetReplacement)
    },
  },
}
