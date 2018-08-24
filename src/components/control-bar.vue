<template>
  <div class="control-bar">
    <div class="directory-control">
      <div :class="['back', 'button', { disabled: !pathStack.length }]"
        @click="back">
        <span class="icon-arrow-left"></span>
      </div>
      <div :class="['forward', 'button', { disabled: !pathForwards.length }]"
        @click="forward">
        <span class="icon-arrow-right"></span>
      </div>
      <div class="parent button">
        <span class="icon-arrow-up"></span>
      </div>
      <div class="vision button" @click="vision">
        <span :class="visible ? 'icon-eye-off' : 'icon-eye'"></span>
      </div>
    </div>
    <div class="window-control">
      <div class="minimize button" @click="minimize">
        <span class="icon-minus"></span>
      </div>
      <div class="maximize button" @click="maximize">
        <span :class="maximized ? 'icon-minimize-2' : 'icon-maximize-2'"></span>
      </div>
      <div class="close button" @click="close">
        <span class="icon-x"></span>
      </div>
    </div>
  </div>
</template>

<script>
import {remote, ipcRenderer} from 'electron'
import {state} from '../plugins/flux'

export default {
  name: 'control-bar',
  data() {
    const frame = remote.getCurrentWindow()
    return {
      frame,
      maximized: frame.isMaximized(),
      visible: true,
    }
  },
  computed: {
    pathStack: state('explorer/pathStack'),
    pathForwards: state('explorer/pathForwards'),
  },
  methods: {
    back() {
      this.$flux.dispatch('path/back')
    },
    forward() {
      this.$flux.dispatch('path/forward')
    },
    vision() {
      this.visible = !this.visible
    },
    minimize() {
      this.frame.minimize()
    },
    maximize() {
      if (this.frame.isMaximized()) {
        this.frame.unmaximize()
      } else {
        this.frame.maximize()
      }
    },
    close() {
      this.frame.close()
    },
  },
  created() {
    ipcRenderer.on('maximize', () => {
      this.maximized = true
    })
    ipcRenderer.on('unmaximize', () => {
      this.maximized = false
    })
  },
}
</script>

<style>
.control-bar {
  display: flex;
  justify-content: space-between;
  color: #a7adba;
  -webkit-app-region: drag;
  user-select: none;
}
.control-bar .directory-control,
.control-bar .window-control {
  padding: 8px;
  display: flex;
  font-size: 16px;
  -webkit-app-region: no-drag;
}
.control-bar .button {
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
}
.control-bar .button + .button {
  margin-left: 4px;
}
.control-bar .button.disabled {
  color: #eaeef3;
}
.control-bar .button:not(.disabled):hover {
  color: #353d46;
  background: #eaeef3;
}
.control-bar .button.minimize:hover {
  color: #259b24;
}
.control-bar .button.maximize:hover {
  color: #2196f3;
}
.control-bar .button.close:hover {
  background: #ed5e63;
  color: #fff;
}
</style>
