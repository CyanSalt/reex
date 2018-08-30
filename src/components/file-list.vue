<template>
  <div class="file-list" @click.self="free" @contextmenu.self="contextmenu"
    @mousedown.left.self="selectstart">
    <div class="loading" v-if="loading">{{ i18n('Loading...#!13') }}</div>
    <template v-else>
      <file-entry v-for="file in files" :file="file"
        :key="file.path"></file-entry>
    </template>
    <div class="selection" :style="selectionStyle" v-if="dragging"></div>
  </div>
</template>

<script>
import {ipcRenderer} from 'electron'
import {basename, extname} from 'fs'
import ReexFileEntry from './file-entry'
import {state} from '../plugins/flux'

export default {
  name: 'file-list',
  components: {
    'file-entry': ReexFileEntry,
  },
  data() {
    return {
      dragging: null
    }
  },
  computed: {
    files: state('files/visible'),
    selected: state('files/selected'),
    loading: state('explorer/loading'),
    selection() {
      if (!this.dragging) return null
      const {start, end} = this.dragging
      return {
        top: Math.min(start.y, end.y),
        right: Math.max(start.x, end.x),
        bottom: Math.max(start.y, end.y),
        left: Math.min(start.x, end.x),
      }
    },
    selectionStyle() {
      if (!this.dragging) return null
      const {selection} = this
      const {scrollWidth, scrollHeight} = this.$el
      const bounding = this.$el.getBoundingClientRect()
      const scrollBarWidth = scrollHeight > bounding.height ? 6 : 0
      const scrollBarHeight = scrollWidth > bounding.width ? 6 : 0
      return {
        top: `${selection.top}px`,
        right: `${bounding.width - scrollBarWidth - selection.right}px`,
        bottom: `${bounding.height - scrollBarHeight - selection.bottom}px`,
        left: `${selection.left}px`,
      }
    },
  },
  methods: {
    free() {
      this.$flux.dispatch('file/specify', null)
    },
    contextmenu() {
      const creation = {
        label: this.i18n('Create new file#!9'),
      }
      const templates = this.$flux.get('templates/all')
      if (templates.length) {
        creation.submenu = templates.map(template => {
          return {
            label: basename(template, extname(template)),
            data: template,
            action: 'create-file'
          }
        })
      } else {
        creation.action = 'create-file'
      }
      ipcRenderer.send('contextmenu', [
        {
          label: this.i18n('Refresh#!11'),
          action: 'refresh',
        },
        {type: 'separator'},
        {
          label: this.i18n('Create new folder#!7'),
          action: 'create-folder',
        },
        creation,
      ])
    },
    selectstart(e) {
      const bounding = this.$el.getBoundingClientRect()
      const handler = event => {
        const {scrollTop, scrollLeft} = this.$el
        this.dragging.end = {
          x: event.clientX + scrollLeft - bounding.x,
          y: event.clientY + scrollTop - bounding.y,
        }
      }
      const cancelation = () => {
        this.selectend()
      }
      const {scrollTop, scrollLeft} = this.$el
      const start = {
        x: e.clientX + scrollLeft - bounding.x,
        y: e.clientY + scrollTop - bounding.y,
      }
      this.dragging = {start, end: start, handler, cancelation}
      window.addEventListener('mousemove', handler)
      window.addEventListener('mouseup', cancelation)
    },
    selectend() {
      if (!this.dragging) return
      window.removeEventListener('mousemove', this.dragging.handler)
      window.removeEventListener('mouseup', this.dragging.cancelation)
      this.dragging = null
    },
  },
}
</script>

<style>
.file-list {
  position: relative;
  flex: auto;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  padding: 8px;
  overflow: auto;
}
.file-list .loading {
  width: 100%;
  text-align: center;
  line-height: 48px;
  color: #c0c5ce;
}
.file-list .selection {
  position: absolute;
  background: rgba(0, 0, 0, 0.05);
  z-index: 10;
}
</style>
