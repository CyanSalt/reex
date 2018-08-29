<template>
  <div :class="['file-entry', { selected: focused }]" @mousedown="select"
    @contextmenu="contextmenu" @dblclick="execute">
    <div class="file-icon-wrapper">
      <img class="folder-icon" src="./assets/images/folder.svg" v-if="isdir">
      <file-icon :ext="extname" height="60" v-else></file-icon>
      <div class="symbolic-link" v-if="link">
        <span class="icon-corner-up-right"></span>
      </div>
      <div class="file-icon-watermark" v-if="watermark">
        <span :class="watermark"></span>
      </div>
    </div>
    <div class="file-name">{{ nickname }}</div>
  </div>
</template>

<script>
import {shell, ipcRenderer} from 'electron'
import {extname} from 'path'
import FileIcon from './file-icon'
import {state} from '../plugins/flux'

export default {
  name: 'file-entry',
  components: {
    'file-icon': FileIcon,
  },
  props: {
    path: String,
    stats: Object,
    link: Object,
  },
  computed: {
    location: state('path/full'),
    selected: state('files/selected'),
    extname() {
      return extname(this.path)
    },
    isdir() {
      return this.realstats.isDirectory()
    },
    focused() {
      return this.selected.includes(this.path)
    },
    nickname() {
      return this.$flux.dispatch('file/name', this.path)
    },
    watermark() {
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
      if (this.isdir) {
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
.file-entry .file-icon,
.file-entry .folder-icon {
  display: inline-block;
  vertical-align: middle;
}
.file-entry .folder-icon {
  height: 56px;
}
.file-entry .file-icon-wrapper {
  position: relative;
}
.file-entry .symbolic-link {
  position: absolute;
  line-height: initial;
}
.file-entry .folder-icon + .symbolic-link {
  right: 12px;
  bottom: 2px;
}
.file-entry .file-icon + .symbolic-link {
  right: 18px;
  bottom: 0;
}
.file-entry .file-icon-watermark {
  position: absolute;
  top: 6px;
  left: 0;
  right: 0;
  font-size: 24px;
  color: rgba(0, 0, 0, 0.2);
}
.file-entry .file-name {
  height: 24px;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
