import {basename} from 'path'
import variables from '../../presets/variables'
import fileTypes from '../../presets/file-types'
import fileIcons from '../../presets/file-icons'
import fileColors from '../../presets/file-colors'
import folderIcons from '../../presets/folder-icons'

const windowsVariables = /%([^%]+)%/g
const unixVariables = /\$\{([^}]+)\}/g

export default {
  states: {
    variables: [],
    fileTypes: [],
    fileIcons: [],
    folderIcons: [],
    fileColors: [],
    iconCache: {},
  },
  actions: {
    defineVariable(definition) {
      if (Array.isArray(definition)) {
        definition.forEach(item => this.defineVariable(item))
        return
      }
      if (definition.name) {
        definition.name = this.i18n(definition.name)
      }
      this.variables.unshift(definition)
    },
    // TODO: remove from presets API
    interpretPath(path) {
      const ids = this.variables.map(data => data.id)
      const presetVariables = new RegExp(`\\[(${ids.join('|')})\\]`, 'g')
      const systemReplacement = (full, name) => {
        return process.env[name] || full
      }
      const presetReplacement = (full, name) => {
        const target = this.variables.find(
          data => data.id === name
        )
        return target ? target.path : full
      }
      return path.replace(windowsVariables, systemReplacement)
        .replace(unixVariables, systemReplacement)
        .replace(presetVariables, presetReplacement)
    },
    defineFileType(definition) {
      if (Array.isArray(definition)) {
        definition.forEach(item => this.defineFileType(item))
        return
      }
      let {type, rules} = definition
      if (!Array.isArray(rules)) {
        rules = [rules]
      }
      const allTypes = this.fileTypes
      const group = allTypes.find(item => item.type === type)
      if (!group) {
        allTypes.unshift({type, rules})
      } else {
        group.rules = rules.concat(group.rules)
      }
    },
    defineFileIcon(definition) {
      if (Array.isArray(definition)) {
        definition.forEach(item => this.defineFileIcon(item))
        return
      }
      let {icon, rules} = definition
      if (!Array.isArray(rules)) rules = [rules]
      this.fileIcons.unshift({icon, rules})
    },
    defineFolderIcon(definition) {
      if (Array.isArray(definition)) {
        definition.forEach(item => this.defineFolderIcon(item))
        return
      }
      let {icon, rules} = definition
      if (!Array.isArray(rules)) rules = [rules]
      this.folderIcons.unshift({icon, rules})
    },
    // TODO: remove from presets API
    getIconDetails(icon) {
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
    defineFileColor(definition) {
      if (Array.isArray(definition)) {
        definition.forEach(item => this.defineFileColor(item))
        return
      }
      let {color, rules} = definition
      if (!Array.isArray(color)) color = [color]
      if (!Array.isArray(rules)) rules = [rules]
      this.fileColors.unshift({color, rules})
    },
    load() {
      this.defineVariable(variables)
      this.defineFileType(fileTypes)
      this.defineFileIcon(fileIcons)
      this.defineFolderIcon(folderIcons)
      this.defineFileColor(fileColors)
    },
    matchRules(path, rules) {
      return rules.find(rule => {
        if (typeof rule !== 'string') return path.match(rule)
        return rule.startsWith('*.') ? path.endsWith(rule.slice(1)) :
          basename(path) === rule
      })
    },
    getVariable(path) {
      return this.variables.find(data => data.path === path)
    },
    getBasename(path) {
      const variable = this.$core.presets.getVariable(path)
      return (variable && variable.name) || basename(path) || '/'
    },
    getFileType(path) {
      // TODO: consider using `mdls`
      path = path.toLowerCase()
      for (const {type, rules} of this.fileTypes) {
        if (this.matchRules(path, rules)) return type
      }
      return null
    },
    getFileIcon(path) {
      for (const {icon, rules} of this.fileIcons) {
        if (this.matchRules(path, rules)) return icon
      }
      return null
    },
    getFileColor(path) {
      for (const {color, rules} of this.fileColors) {
        if (this.matchRules(path, rules)) return color
      }
      return null
    },
    getFolderIcon(path) {
      for (const {icon, rules} of this.folderIcons) {
        if (this.matchRules(path, rules)) return icon
      }
      return null
    },
  },
}
