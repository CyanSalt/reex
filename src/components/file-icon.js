import {extname} from 'path'
import SingleFileIcon from './single-file-icon'
import SingleFileIconSketch from './single-file-icon-sketch'
import SingleFileIconImpress from './single-file-icon-impress'
import FolderIcon from './folder-icon'

export default {
  name: 'file-icon',
  functional: true,
  props: {
    file: Object,
  },
  render(h, context) {
    const {file} = context.props
    const props = {link: Boolean(file.link)}
    const vm = context.parent
    const real = file.link || file
    const isFolder = real.stats.isDirectory()
    let subicon
    const variable = vm.$core.presets.getVariable(real.path)
    if (variable) {
      subicon = variable.icon
    } else if (isFolder) {
      subicon = vm.$core.presets.getFolderIcon(real.path)
    } else {
      subicon = vm.$core.presets.getFileIcon(real.path)
    }
    if (subicon) {
      if (subicon.startsWith('@')) {
        const details = vm.$core.utilities.icon(subicon)
        props.watermark = details
      } else if (!isFolder) {
        props.subicon = subicon
      }
    }
    if (isFolder) {
      return h(FolderIcon, {props}, context.children)
    }
    props.ext = extname(real.path)
    const colors = vm.$core.presets.getFileColor(real.path)
    if (colors) {
      if (colors[0]) props.background = colors[0]
      if (colors[1]) props.foreground = colors[1]
    }
    const settings = vm.$core.settings.user
    const style = settings['theme.icons.style']
    let UserFileIcon = SingleFileIcon
    if (style === 'sketch') UserFileIcon = SingleFileIconSketch
    if (style === 'impress') UserFileIcon = SingleFileIconImpress
    return h(UserFileIcon, {props}, context.children)
  },
}
