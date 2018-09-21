<template>
  <div class="file-list" @contextmenu.self="contextmenu"
    @mousedown.left.self="selectStart" @dragover="dragover" @drop="drop">
    <div class="loading" v-if="loading">{{ i18n('Loading...#!13') }}</div>
    <template v-else>
      <file-entry v-for="file in files" :file="file"
        :key="file.path" ref="entries"></file-entry>
    </template>
    <div class="selection" :style="selectionStyle" v-if="dragging"></div>
  </div>
</template>

<script>
import {ipcRenderer} from 'electron'
import {basename, extname} from 'fs'
import ReexFileEntry from './file-entry'
import {state, action} from '../plugins/relax'

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
    path: state('location.path'),
    files: state('explorer.files'),
    selected: state('selection.range'),
    loading: state('explorer.loading'),
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
        top: selection.top + 'px',
        right: bounding.width - scrollBarWidth - selection.right + 'px',
        bottom: bounding.height - scrollBarHeight - selection.bottom + 'px',
        left: selection.left + 'px',
      }
    },
  },
  methods: {
    select: action('selection.select'),
    // eslint-disable-next-line max-lines-per-function
    contextmenu() {
      this.select([])
      const creation = {
        label: this.i18n('Create new file#!9'),
      }
      const templates = this.$relax.access('templates/all')
      if (templates.length) {
        creation.submenu = templates.map(template => {
          return {
            label: basename(template, extname(template)),
            data: template,
            action: 'contextmenu/create-file'
          }
        })
      } else {
        creation.action = 'create-file'
      }
      let pasting = [
        {type: 'separator'},
        {
          label: this.i18n('Paste#!17'),
          role: 'paste'
        }
      ]
      const files = this.$core.clipboard.readFiles()
      if (!files.length) {
        if (process.platform === 'darwin') {
          pasting = []
        } else {
          pasting[1].enabled = false
        }
      }
      ipcRenderer.send('contextmenu', [
        {
          label: this.i18n('Refresh#!11'),
          action: 'contextmenu/refresh',
        },
        ...pasting,
        {type: 'separator'},
        {
          label: this.i18n('Create new folder#!7'),
          action: 'contextmenu/create-folder',
        },
        creation,
        {type: 'separator'},
        {
          label: this.i18n('Properties#!28'),
          action: 'contextmenu/property',
          data: this.path,
        },
      ])
    },
    selectStart(e) {
      const bounding = this.$el.getBoundingClientRect()
      const handler = event => {
        const {scrollTop, scrollLeft} = this.$el
        this.dragging.end = {
          x: event.clientX + scrollLeft - bounding.x,
          y: event.clientY + scrollTop - bounding.y,
        }
      }
      const cancelation = () => {
        this.selectEnd()
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
    selectEnd() {
      if (!this.dragging) return
      window.removeEventListener('mousemove', this.dragging.handler)
      window.removeEventListener('mouseup', this.dragging.cancelation)
      this.resolveSelection()
      this.dragging = null
    },
    resolveSelection() {
      const {selection} = this
      const all = []
      const entries = this.$refs.entries || []
      for (const {$el: el, file} of entries) {
        const {offsetTop, offsetLeft, scrollWidth, scrollHeight} = el
        if (offsetTop > selection.bottom) break
        if (offsetLeft > selection.right) continue
        const offsetRight = offsetLeft + scrollWidth
        const offsetBottom = offsetTop + scrollHeight
        if (offsetBottom < selection.top ||
          offsetRight < selection.left) continue
        all.push(file.path)
      }
      this.select(all)
    },
    dragover(e) {
      const copying = process.platform === 'darwin' ? e.altKey : e.ctrlKey
      e.dataTransfer.dropEffect = copying ? 'copy' : 'move'
    },
    drop(e) {
      const copying = process.platform === 'darwin' ? e.altKey : e.ctrlKey
      const paths = Array.from(e.dataTransfer.files).map(file => file.path)
      this.$relax.dispatch(copying ? 'file/copy' : 'file/move', paths)
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
  pointer-events: none;
}
</style>
