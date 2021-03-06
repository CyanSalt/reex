<template>
  <div :class="['file-entry', { selected: focused, hidden }]" draggable
    @dragstart="drag" @mousedown="select" @contextmenu="contextmenu"
    @dblclick="open(file)">
    <div class="file-icon-wrapper">
      <img class="image-preview" :src="real.path" v-if="preview && isImage"
        @error="preview = false">
      <file-icon :file="file" v-once v-else></file-icon>
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
    file: {
      type: Object,
      required: true,
      validator(value) {
        return value.path && value.stats
      }
    },
  },
  data() {
    return {
      preview: false,
    }
  },
  computed: {
    location: state('location.path'),
    selected: state('selection.range'),
    isImage() {
      return this.$core.presets.getFileType(this.real.path) === 'image'
    },
    focused() {
      return this.selected.includes(this.file.path)
    },
    hidden() {
      return this.$core.system.isHidden(this.file.path)
    },
    nickname() {
      let name = this.$core.utilities.basename(this.file.path)
      if (process.platform === 'darwin' &&
        this.$core.system.isExecutable(this.real)
      ) name = name.slice(0, -4)
      return name
    },
    real() {
      return this.file.link || this.file
    },
  },
  methods: {
    open: action('shell.openEntry'),
    select(e) {
      const {path} = this.file
      const multiple = process.platform === 'darwin' ?
        e.metaKey : e.ctrlKey
      const rightclick = e.buttons & 2
      const selected = this.selected.includes(path)
      if (rightclick) {
        if (!selected) {
          this.$core.selection.select([path])
        }
      } else if (!multiple) {
        this.$core.selection.select([path])
      } else if (selected) {
        this.$core.selection.remove(path)
      } else {
        this.$core.selection.add(path)
      }
    },
    // eslint-disable-next-line max-lines-per-function
    contextmenu() {
      let open = []
      let property = []
      if (this.selected.length === 1 && this.focused) {
        const isDirectory = this.real.stats.isDirectory()
        open = [
          {
            label: this.i18n('Open#!26'),
            command: 'open',
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
            command: 'open-property',
            data: this.file.path,
          },
        ]
        if (isDirectory) {
          open.splice(1, 0, {
            label: this.i18n('Open in new window#!27'),
            command: 'open-window',
            data: this.real.path,
          })
          if (this.$core.system.isExecutable(this.real)) {
            open.splice(1, 0, {
              label: this.i18n('Show package content#!29'),
              command: 'navigate',
              data: this.real.path,
            })
          }
        }
      }
      ipcRenderer.send('contextmenu', [
        ...open,
        {
          label: this.i18n('Copy#!16'),
          command: 'copy',
        },
        {
          label: this.i18n('Delete#!12'),
          command: 'delete',
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
.file-entry:not(.selected):hover {
  background: rgba(234, 238, 243, 0.3);
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
