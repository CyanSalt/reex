<template>
  <div class="file-list" @click.self="free" @contextmenu.self="contextmenu">
    <file-entry v-for="file in files" :name="file" :key="file"></file-entry>
  </div>
</template>

<script>
import {ipcRenderer} from 'electron'
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
  },
  methods: {
    free() {
      this.$flux.dispatch('file/specify', null)
    },
    contextmenu() {
      ipcRenderer.send('contextmenu', [])
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
</style>
