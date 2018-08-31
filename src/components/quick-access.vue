<template>
  <div class="quick-access">
    <div class="group-title">{{ i18n('Favorites#!14') }}</div>
    <div class="group favorites">
      <div v-for="entry in favorites" @click="open(entry)"
        :class="['group-entry', { active: active(entry) }]">
        <div class="entry-icon">
          <span :class="icon(entry)"></span>
        </div>
        <div class="entry-name">{{ name(entry.path) }}</div>
      </div>
    </div>
    <div class="group-title">{{ i18n('Devices#!15') }}</div>
    <div class="group devices">
      <div v-for="entry in devices" @click="open(entry)"
        :class="['group-entry', { active: active(entry) }]">
        <div class="entry-icon">
          <span class="icon-hard-drive"></span>
        </div>
        <div class="entry-name">{{ name(entry.path) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import {state, action} from '../plugins/flux'

export default {
  name: 'quick-access',
  computed: {
    path: state('path/full'),
    favorites: state('path/favorites'),
    devices: state('path/devices'),
  },
  methods: {
    name: action('file/name'),
    open: action('file/open'),
    active(file) {
      return file.path === this.path || (
        file.link && file.link.path === this.path)
    },
    icon(file) {
      const path = file.link ? file.link.path : file.path
      const stats = file.link ? file.link.stats : file.stats
      const watermark = this.$flux.dispatch('file/watermark', path)
      if (watermark) return watermark
      return stats.isDirectory() ? 'icon-folder' : 'icon-file'
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
.quick-access .group-title {
  margin-left: 16px;
  line-height: 34px;
}
.quick-access .group + .group-title {
  margin-top: 16px;
}
.quick-access .group-entry {
  position: relative;
  display: flex;
  padding-left: 24px;
  line-height: 32px;
  cursor: pointer;
}
.quick-access .group-entry.active::before {
  content: '';
  position: absolute;
  width: 2px;
  top: 8px;
  bottom: 8px;
  left: 16px;
  background: currentColor;
  opacity: 0.5;
}
.quick-access .group-entry:hover {
  background: rgba(216, 222, 233, 0.5);
}
.quick-access .group-entry .entry-icon {
  flex: none;
  width: 24px;
  text-align: center;
}
.quick-access .group-entry .entry-name {
  flex: auto;
  padding-left: 6px;
}
</style>
