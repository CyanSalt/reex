import {extname} from 'path'
import SingleFileIcon from './single-file-icon'
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
    let watermark = vm.$flux.dispatch('icon/defined', real.path)
    if (!watermark && !isFolder) {
      watermark = vm.$flux.dispatch('icon/type', real.path)
    }
    if (watermark) {
      props.watermark = vm.$flux.dispatch('icon/character', watermark)
    }
    if (isFolder) {
      return h(FolderIcon, {props}, context.children)
    }
    props.ext = extname(real.path)
    return h(SingleFileIcon, {props}, context.children)
  },
}
