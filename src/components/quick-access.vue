<template>
  <div class="quick-access">
    <div class="application-title">Reex</div>
    <div class="group-title">{{ i18n('Favorites#!14') }}</div>
    <div class="group favorites">
      <div v-for="entry in favorites" @click="open(entry)"
        :class="['group-entry', { active: active(entry) }]">
        <div class="entry-icon">
          <span :class="['feather-icon', icon(entry)]"></span>
        </div>
        <div class="entry-name">{{ name(entry.path) }}</div>
      </div>
    </div>
    <div class="group-title">{{ i18n('Devices#!15') }}</div>
    <div class="group devices">
      <div v-for="entry in devices" @click="open(entry)"
        :class="['group-entry', { active: active(entry) }]">
        <div class="entry-icon">
          <span class="feather-icon icon-hard-drive"></span>
        </div>
        <div class="entry-name">{{ name(entry.path) }}</div>
        <div class="unmount-device" @click="unmount(entry)" v-if="loose(entry)">
          <span class="feather-icon icon-upload"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {state, action} from '../plugins/relax'

export default {
  name: 'quick-access',
  computed: {
    path: state('path/full'),
    favorites: state('path/favorites'),
    devices: state('devices/all'),
    removable: state('devices/removable'),
  },
  methods: {
    name: action('file/name'),
    open: action('file/open'),
    unmount: action('devices/unmount'),
    active(file) {
      return file.path === this.path || (
        file.link && file.link.path === this.path)
    },
    icon(file) {
      const path = file.link ? file.link.path : file.path
      const stats = file.link ? file.link.stats : file.stats
      const icon = this.$relax.dispatch('path/icon', path)
      const prefix = '@feather/'
      if (icon && icon.startsWith(prefix)) return icon.slice(prefix.length)
      return stats.isDirectory() ? 'icon-folder' : 'icon-file'
    },
    loose(device) {
      return this.removable.includes(device.path)
    },
  },
}
</script>

<style>
.quick-access {
  flex: none;
  width: 210px;
  color: #4f5b66;
  background: linear-gradient(to left top, #f0f0f0, white);
}
.quick-access .application-title {
  height: 48px;
  margin-left: 32px;
  font: italic 20px/48px serif;
  -webkit-app-region: drag;
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
  align-items: center;
  padding-left: 24px;
  padding-right: 12px;
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
.quick-access .group-entry .entry-icon,
.quick-access .group-entry .unmount-device {
  flex: none;
  width: 24px;
  height: 24px;
  line-height: 24px;
  border-radius: 50%;
  text-align: center;
}
.quick-access .group-entry .entry-name {
  flex: auto;
  padding: 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.quick-access .group-entry .unmount-device:hover {
  background: white;
}
</style>
