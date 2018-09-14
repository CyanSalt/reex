<template>
  <div class="property-title">
    <div class="window-control button-group">
      <div class="minimize button" @click="minimize">
        <span class="reex-icon icon-minus"></span>
      </div>
      <div class="close button" @click="close">
        <span class="reex-icon icon-x"></span>
      </div>
    </div>
  </div>
</template>

<script>
import {remote} from 'electron'

export default {
  name: 'control-bar',
  data() {
    return {
      frame: remote.getCurrentWindow(),
    }
  },
  methods: {
    minimize() {
      this.frame.minimize()
    },
    close() {
      this.frame.close()
    },
  },
}
</script>

<style>
.property-title {
  flex: none;
  width: 100%;
  display: flex;
  justify-content: flex-end;
  color: #a7adba;
  -webkit-app-region: drag;
}
.property-title .button-group {
  padding: 8px;
  display: flex;
  font-size: 16px;
  -webkit-app-region: no-drag;
}
</style>
