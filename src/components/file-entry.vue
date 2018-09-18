<template>
  <div :class="['file-entry', { selected: focused, hidden }]" draggable
    @dragstart="drag" @mousedown="select" @contextmenu="contextmenu"
    @dblclick="open(file)">
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
import {state, action} from '../plugins/relax'

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
      return this.$relax.dispatch('file/type', this.real.path) === 'image'
    },
    focused() {
      return this.selected.includes(this.file.path)
    },
    hidden() {
      return this.$relax.dispatch('file/hidden', this.file.path)
    },
    nickname() {
      let name = this.$relax.dispatch('file/name', this.file.path)
      if (process.platform === 'darwin' &&
        this.$relax.dispatch('file/executable', this.real)
      ) name = name.slice(0, -4)
      return name
    },
    real() {
      return this.file.link || this.file
    },
  },
  methods: {
    open: action('file/open'),
    select(e) {
      const {path} = this.file
      const multiple = process.platform === 'darwin' ?
        e.metaKey : e.ctrlKey
      const rightclick = e.buttons & 2
      const selected = this.selected.includes(path)
      if (rightclick) {
        if (!selected) {
          this.$relax.dispatch('file/specify', path)
        }
      } else if (!multiple) {
        this.$relax.dispatch('file/specify', path)
      } else if (selected) {
        this.$relax.dispatch('file/unselect', path)
      } else {
        this.$relax.dispatch('file/select', path)
      }
    },
    contextmenu() {
      let open = []
      let property = []
      if (this.selected.length === 1 && this.focused) {
        const isDirectory = this.real.stats.isDirectory()
        open = [
          {
            label: this.i18n('Open#!26'),
            action: 'open',
            data: {
              path: this.real.path,
              isDirectory,
            },
          },
          {type: 'separator'},
        ]
        property = [
          {type: 'separator'},
          {
            label: this.i18n('Properties#!28'),
            action: 'property',
            data: this.file.path,
          },
        ]
        if (isDirectory) {
          open.splice(1, 0, {
            label: this.i18n('Open in new window#!27'),
            action: 'open-window',
            data: this.real.path,
          })
        }
      }
      ipcRenderer.send('contextmenu', [
        ...open,
        {
          label: this.i18n('Copy#!16'),
          action: 'copy',
        },
        {
          label: this.i18n('Delete#!12'),
          action: 'delete',
        },
        ...property,
      ])
    },
    drag(e) {
      e.preventDefault()
      ipcRenderer.send('dragstart', [this.file.path])
    },
  },
  mounted() {
    if (this.isImage && this.real.stats.size < 10 * (2 ** 20)) {
      requestIdleCallback(() => {this.preview = true})
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
