<template>
  <div class="file-list" @click.self="free" @contextmenu.self="contextmenu">
    <div class="loading" v-if="loading">{{ i18n('Loading...#!13') }}</div>
    <template v-else>
      <file-entry v-for="file in files" :file="file"
        :key="file.path"></file-entry>
    </template>
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
  computed: {
    files: state('files/visible'),
    selected: state('files/selected'),
    loading: state('explorer/loading'),
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
  },
}
</script>

<style>
.file-list {
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
</style>
