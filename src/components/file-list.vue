<template>
  <div class="file-list">
    <file-entry v-for="file in files" :name="file" :key="file"></file-entry>
  </div>
</template>

<script>
import ReexFileEntry from './file-entry'
import {state} from '../plugins/flux'

export default {
  name: 'file-list',
  components: {
    'file-entry': ReexFileEntry,
  },
  computed: {
    files: state('files/visible'),
  },
}
</script>

<style>
.file-list {
  flex-grow: 1;
  display: flex;
  flex-wrap: wrap;
  overflow: auto;
}
</style>
