<template>
  <div class="file-entry">{{ name }}</div>
</template>

<script>
import {state} from '../plugins/flux'

export default {
  name: 'file-entry',
  props: {
    name: String,
  },
  computed: {
    path: state('path/full'),
  }
}
</script>

<style>
.file-entry {
  width: 84px;
  height: 84px;
}
</style>
