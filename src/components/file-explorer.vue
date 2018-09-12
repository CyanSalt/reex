<template>
  <div class="file-explorer">
    <control-bar></control-bar>
    <path-breadcrumb></path-breadcrumb>
    <file-list></file-list>
  </div>
</template>

<script>
import ControlBar from './control-bar'
import PathBreadcrumb from './path-breadcrumb'
import ReexFileList from './file-list'

export default {
  name: 'file-explorer',
  components: {
    'control-bar': ControlBar,
    'path-breadcrumb': PathBreadcrumb,
    'file-list': ReexFileList,
  }
}
</script>

<style>
.file-explorer {
  width: 0;
  flex: auto;
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
