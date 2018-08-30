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
    const realpath = file.link ? file.link.path : file.path
    const realstats = file.link ? file.link.stats : file.stats
    if (realstats.isDirectory()) {
      props.watermark = vm.$flux.dispatch('file/watermark', realpath)
      return h(FolderIcon, {props}, context.children)
    }
    props.ext = extname(realpath)
    return h(SingleFileIcon, {props}, context.children)
  },
}
