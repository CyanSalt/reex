<template>
  <div :class="['file-entry', { selected: focused }]" @mousedown="select"
    @contextmenu="contextmenu" @dblclick="execute">
    <div class="file-icon-wrapper">
      <template v-if="stat">
        <img class="folder-icon" src="./assets/images/folder.svg" v-if="isdir">
        <file-icon :ext="extname" :height="60" v-else></file-icon>
      </template>
    </div>
    <div class="file-name">{{ nickname }}</div>
  </div>
</template>

<script>
import {shell, ipcRenderer} from 'electron'
import {join, extname} from 'path'
import {lstat} from 'fs'
import FileIcon from './file-icon'
import {state} from '../plugins/flux'

export default {
  name: 'file-entry',
  components: {
    'file-icon': FileIcon,
  },
  props: {
    name: String,
  },
  data() {
    return {
      stat: null,
    }
  },
  computed: {
    location: state('path/full'),
    selected: state('files/selected'),
    path() {
      return join(this.location, this.name)
    },
    extname() {
      return extname(this.name)
    },
    isdir() {
      return this.stat && this.stat.isDirectory()
    },
    focused() {
      return this.selected.includes(this.path)
    },
    nickname() {
      return this.$flux.dispatch('file/name', this.path)
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
        this.$flux.dispatch('path/redirect', this.path)
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
  created() {
    lstat(this.path, (err, stat) => {
      if (err) return
      this.stat = stat
    })
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
.file-entry .file-name {
  height: 24px;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
