<template>
  <div class="file-entry">
    <div class="file-icon-wrapper">
      <template v-if="stat">
        <img class="folder-icon" src="./assets/images/folder.svg" v-if="isdir">
        <file-icon :ext="extname" :height="60" v-else></file-icon>
      </template>
    </div>
    <div class="file-name">{{ name }}</div>
  </div>
</template>

<script>
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
    path: state('path/full'),
    extname() {
      return extname(this.name)
    },
    isdir() {
      return this.stat && this.stat.isDirectory()
    }
  },
  created() {
    lstat(join(this.path, this.name), (err, stat) => {
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
}
</style>
