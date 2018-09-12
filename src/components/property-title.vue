<template>
  <div class="property-title">
    <div class="window-control">
      <div class="minimize button" @click="minimize">
        <span class="icon-minus"></span>
      </div>
      <div class="close button" @click="close">
        <span class="icon-x"></span>
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
  user-select: none;
}
.property-title .window-control {
  padding: 8px;
  display: flex;
  font-size: 16px;
  -webkit-app-region: no-drag;
}
.property-title .button {
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
}
.property-title .button + .button {
  margin-left: 4px;
}
.property-title .button.disabled {
  color: #eaeef3;
}
.property-title .button:not(.disabled):hover {
  color: #353d46;
  background: #eaeef3;
}
.property-title .button.minimize:hover {
  color: #259b24;
}
.property-title .button.close:hover {
  background: #ed5e63;
  color: white;
}
</style>
