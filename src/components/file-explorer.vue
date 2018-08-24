<template>
  <div class="file-explorer">
    <control-bar></control-bar>
  </div>
</template>

<script>
import ControlBar from './control-bar'

export default {
  name: 'file-explorer',
  components: {
    'control-bar': ControlBar,
  }
}
</script>

<style>
.file-explorer {
  flex-grow: 1;
  background: #fff;
}
</style>
