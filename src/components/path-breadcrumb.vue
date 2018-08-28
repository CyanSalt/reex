<template>
  <div class="path-breadcrumb">
    <template v-for="(step, index) in steps">
      <div :class="['path-floor', { current: index === steps.length - 1 }]"
        @click="redirect(step.path)">{{ step.name }}</div>
      <div class="path-sep" v-if="index < steps.length - 1">
        <span class="icon-chevron-right"></span>
      </div>
    </template>
  </div>
</template>

<script>
import {state, action} from '../plugins/flux'

export default {
  name: 'path-breadcrumb',
  computed: {
    floors: state('path/floors'),
    steps: state('path/steps'),
  },
  methods: {
    redirect: action('path/redirect'),
  }
}
</script>

<style>
.path-breadcrumb {
  flex: none;
  display: flex;
  margin: 0 12px;
  height: 32px;
  line-height: 32px;
  white-space: nowrap;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  overflow-x: auto;
  overflow-y: hidden;
}
.path-floor {
  padding: 0 8px;
  color: #c0c5ce;
  cursor: pointer;
}
.path-floor.current {
  color: #353d46;
}
.path-floor:hover {
  color: #353d46;
  background: #eaeef3;
}
.path-sep {
  width: 18px;
  text-align: center;
  color: #c0c5ce;
}
</style>
