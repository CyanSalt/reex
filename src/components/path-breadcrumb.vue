<template>
  <div class="path-breadcrumb" @click="edit">
    <input type="text" class="editor" :value="path" @click.stop
      @blur="withdraw" @keydown.enter="enter" ref="editor" v-if="editing">
    <template v-for="(step, index) in steps" v-else>
      <div :class="['path-floor', { current: index === steps.length - 1 }]"
        @click.stop="redirect(step.path)">{{ step.name }}</div>
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
  data() {
    return {
      editing: false,
    }
  },
  computed: {
    path: state('path/full'),
    steps: state('path/steps'),
  },
  methods: {
    redirect: action('path/redirect'),
    edit() {
      this.editing = true
      this.$flux.dispatch('file/specify', [])
      this.$nextTick(() => {
        const {editor} = this.$refs
        editor.focus()
        editor.select()
      })
    },
    withdraw(e) {
      this.editing = false
    },
    enter(e) {
      this.editing = false
      const {value} = e.target
      if (value === this.path) return
      const path = this.$flux.dispatch('path/interpret', value)
      this.redirect(path)
    },
  },
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
  cursor: text;
}
.path-breadcrumb .path-floor {
  padding: 0 8px;
  color: #c0c5ce;
  cursor: pointer;
}
.path-breadcrumb .path-floor.current {
  color: #353d46;
}
.path-breadcrumb .path-floor:hover {
  color: #353d46;
  background: #eaeef3;
}
.path-breadcrumb .path-sep {
  width: 18px;
  text-align: center;
  color: #c0c5ce;
}
.path-breadcrumb .editor {
  -webkit-appearance: none;
  width: 100%;
  padding: 0 8px;
  border: none;
  outline: none;
  font: inherit;
  color: inherit;
}
</style>
