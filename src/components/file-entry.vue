<template>
  <div :class="['file-entry', { selected: focused, hidden }]" @mousedown="select"
    @contextmenu="contextmenu" @dblclick="execute">
    <div class="file-icon-wrapper">
      <img class="image-preview" :src="real.path" v-if="preview && isImage"
        @error="preview = false">
      <file-icon :file="file" v-else></file-icon>
    </div>
    <div class="file-name">{{ nickname }}</div>
  </div>
</template>

<script>
import {ipcRenderer} from 'electron'
import FileIcon from './file-icon'
import {state} from '../plugins/flux'

export default {
  name: 'file-entry',
  components: {
    'file-icon': FileIcon,
  },
  props: {
    file: Object,
  },
  data() {
    return {
      preview: false,
    }
  },
  computed: {
    location: state('path/full'),
    selected: state('files/selected'),
    isImage() {
      return [
        '.apng', '.bmp', '.cgm', '.g3', '.gif', '.ief', '.jp2', '.jpg2',
        '.jpeg', '.jpg', '.jpe', '.jpm', '.jpx', '.jpf', '.ktx', '.png',
        '.sgi', '.svg', '.svgz', '.tiff', '.tif', '.webp',
      ].find(ext => this.real.path.slice(0 - ext.length) === ext)
    },
    focused() {
      return this.selected.includes(this.file.path)
    },
    hidden() {
      return this.$flux.dispatch('file/hidden', this.file.path)
    },
    nickname() {
      return this.$flux.dispatch('file/name', this.file.path)
    },
    real() {
      return this.file.link || this.file
    },
  },
  methods: {
    select(e) {
      const {path} = this.file
      const multiple = process.platform === 'darwin' ?
        e.metaKey : e.ctrlKey
      const rightclick = e.buttons & 2
      const selected = this.selected.includes(path)
      if (rightclick) {
        if (!selected) {
          this.$flux.dispatch('file/specify', path)
        }
      } else if (!multiple) {
        this.$flux.dispatch('file/specify', path)
      } else if (selected) {
        this.$flux.dispatch('file/unselect', path)
      } else {
        this.$flux.dispatch('file/select', path)
      }
    },
    execute() {
      const {stats, path} = this.real
      if (stats.isDirectory()) {
        this.$flux.dispatch('path/redirect', path)
      } else {
        this.$flux.dispatch('file/execute', path)
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
  background: rgba(234, 238, 243, 0.7);
}
.file-entry .file-icon-wrapper {
  height: 72px;
  line-height: 70px;
}
.file-entry.hidden .file-icon-wrapper,
.file-entry.hidden .file-name {
  opacity: 0.5;
}
.file-entry .single-file-icon,
.file-entry .folder-icon {
  display: inline-block;
  vertical-align: middle;
}
.file-entry .single-file-icon {
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
