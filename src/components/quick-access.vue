<template>
  <div class="quick-access">
    <div class="favorite-title">{{ i18n('Favorites#!14') }}</div>
    <div class="favorites">
      <div v-for="file in favorites" @click="redirect(file.path)"
        :class="['favorite-entry', { active: active(file) }]">
        <div class="entry-icon">
          <span class="icon-folder" v-if="isFolder(file)"></span>
          <span class="icon-file" v-else></span>
        </div>
        <div class="entry-name">{{ name(file.path) }}</div>
      </div>
    </div>
    <div class="devices"></div>
  </div>
</template>

<script>
import {state, action} from '../plugins/flux'

export default {
  name: 'quick-access',
  computed: {
    path: state('path/full'),
    favorites: state('path/favorites'),
  },
  methods: {
    name: action('file/name'),
    redirect: action('path/redirect'),
    active(file) {
      return file.path === this.path || (
        file.link && file.link.path === this.path)
    },
    isFolder(file) {
      const stats = file.link ? file.link.stats : file.stats
      return stats.isDirectory()
    },
  },
}
</script>

<style>
.quick-access {
  flex: none;
  width: 210px;
  padding-top: 48px;
  background: rgba(255, 255, 255, 0.9);
  color: #4f5b66;
}
.quick-access .favorite-title {
  margin-left: 16px;
  line-height: 34px;
}
.quick-access .favorite-entry {
  display: flex;
  padding-left: 24px;
  line-height: 32px;
  cursor: pointer;
}
.quick-access .favorite-entry.active,
.quick-access .favorite-entry:hover {
  background: rgba(216, 222, 233, 0.5);
}
.quick-access .favorite-entry .entry-icon {
  flex: none;
  width: 24px;
  text-align: center;
}
.quick-access .favorite-entry .entry-name {
  flex: auto;
}
</style>
