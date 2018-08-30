<template>
  <div :class="['file-entry', { selected: focused, hidden }]" @mousedown="select"
    @contextmenu="contextmenu" @dblclick="execute">
    <div class="file-icon-wrapper">
      <folder-icon :watermark="watermark" :link="!!link"
        v-if="isFolder"></folder-icon>
      <img class="image-preview" :src="path" v-else-if="preview && isImage"
        @error="preview = false">
      <file-icon :ext="extname" :link="!!link" v-else></file-icon>
    </div>
    <div class="file-name">{{ nickname }}</div>
  </div>
</template>

<script>
import {shell, ipcRenderer} from 'electron'
import {extname} from 'path'
import FileIcon from './file-icon'
import FolderIcon from './folder-icon'
import {state} from '../plugins/flux'

export default {
  name: 'file-entry',
  components: {
    'file-icon': FileIcon,
    'folder-icon': FolderIcon,
  },
  props: {
    path: String,
    stats: Object,
    link: Object,
  },
  data() {
    return {
      preview: false,
    }
  },
  computed: {
    location: state('path/full'),
    selected: state('files/selected'),
    extname() {
      return extname(this.path)
    },
    isFolder() {
      return this.realstats.isDirectory()
    },
    isImage() {
      return [
        '.apng', '.bmp', '.cgm', '.g3', '.gif', '.ief', '.jp2', '.jpg2',
        '.jpeg', '.jpg', '.jpe', '.jpm', '.jpx', '.jpf', '.ktx', '.png',
        '.sgi', '.svg', '.svgz', '.tiff', '.tif', '.webp',
      ].includes(this.extname)
    },
    focused() {
      return this.selected.includes(this.path)
    },
    hidden() {
      return this.$flux.dispatch('file/hidden', this.path)
    },
    nickname() {
      return this.$flux.dispatch('file/name', this.path)
    },
    watermark() {
      if (!this.isFolder) return null
      return this.$flux.dispatch('file/watermark', this.realpath)
    },
    realpath() {
      return this.link ? this.link.path : this.path
    },
    realstats() {
      return this.link ? this.link.stats : this.stats
    },
  },
  methods: {
    select(e) {
      const multiple = process.platform === 'darwin' ?
        e.metaKey : e.ctrlKey
      const rightclick = e.button === 2 || e.button === 3
      const selected = this.selected.includes(this.path)
      if (rightclick) {
        if (!selected) {
          this.$flux.dispatch('file/specify', this.path)
        }
      } else if (!multiple) {
        this.$flux.dispatch('file/specify', this.path)
      } else if (selected) {
        this.$flux.dispatch('file/unselect', this.path)
      } else {
        this.$flux.dispatch('file/select', this.path)
      }
    },
    execute() {
      if (this.isFolder) {
        this.$flux.dispatch('path/redirect', this.realpath)
      } else {
        shell.openItem(this.path)
      }
    },
    contextmenu() {
      ipcRenderer.send('contextmenu', [
        {
          label: this.i18n('Delete#!12'),
          action: 'delete',
        },
      ])
    },
  },
  mounted() {
    if (this.isImage) {
      requestIdleCallback(() => {
        this.preview = true
      })
    }
  },
}
</script>

<style>
.file-entry {
  margin: 12px;
  width: 96px;
  height: 96px;
  text-align: center;
}
.file-entry.selected {
  background: #eaeef3;
}
.file-entry .file-icon-wrapper {
  height: 72px;
  line-height: 70px;
}
.file-entry.hidden {
  opacity: 0.5;
}
.file-entry .file-icon,
.file-entry .folder-icon {
  display: inline-block;
  vertical-align: middle;
}
.file-entry .file-icon {
  height: 60px;
}
.file-entry .folder-icon {
  height: 56px;
}
.file-entry .image-preview {
  display: inline-block;
  vertical-align: middle;
  max-width: 100%;
  max-height: 100%;
}
.file-entry .file-name {
  height: 24px;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
