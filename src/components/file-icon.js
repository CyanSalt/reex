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
    let subicon = vm.$flux.dispatch('path/icon', real.path)
    if (!subicon) {
      if (isFolder) {
        subicon = vm.$flux.dispatch('folder/icon', real.path)
      } else {
        subicon = vm.$flux.dispatch('file/icon', real.path)
      }
    }
    if (subicon) {
      if (subicon.startsWith('@')) {
        const detail = vm.$flux.dispatch('icons/detail', subicon)
        props.watermark = detail
      } else if (!isFolder) {
        props.subicon = subicon
      }
    }
    if (isFolder) {
      return h(FolderIcon, {props}, context.children)
    }
    props.ext = extname(real.path)
    const colors = vm.$flux.dispatch('file/color', real.path)
    if (colors) {
      if (colors[0]) props.background = colors[0]
      if (colors[1]) props.foreground = colors[1]
    }
    const settings = vm.$flux.get('settings/user')
    const style = settings['explorer.icon.style']
    let UserFileIcon = SingleFileIcon
    if (style === 'sketch') UserFileIcon = SingleFileIconSketch
    if (style === 'impress') UserFileIcon = SingleFileIconImpress
    return h(UserFileIcon, {props}, context.children)
  },
}
