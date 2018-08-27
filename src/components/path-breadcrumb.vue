<template>
  <div class="path-breadcrumb">
    <template v-for="(floor, index) in floors">
      <div :class="['path-floor', { current: index === floors.length - 1 }]"
        @click="stop(index)">{{ names[index] }}</div>
      <div class="path-sep" v-if="index < floors.length - 1">
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
    names: state('path/names'),
  },
  methods: {
    stop: action('path/stop'),
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
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
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
