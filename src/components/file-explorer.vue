<template>
  <div class="file-explorer">
    <control-bar></control-bar>
    <path-breadcrumb></path-breadcrumb>
  </div>
</template>

<script>
import ControlBar from './control-bar'
import PathBreadcrumb from './path-breadcrumb'

export default {
  name: 'file-explorer',
  components: {
    'control-bar': ControlBar,
    'path-breadcrumb': PathBreadcrumb,
  }
}
</script>

<style>
.file-explorer {
  flex-grow: 1;
  background: #fff;
}
</style>
