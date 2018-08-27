<template>
  <svg class="file-icon" version="1.1" baseProfile="full" viewBox="0 0 50 66"
    :width="width" :height="height" xmlns="http://www.w3.org/2000/svg">
    <image v-pre x="0" y="0" width="50" height="66"
      xlink:href="./assets/images/file.svg"/>
  </svg>
</template>

<script>
export default {
  name: 'file-icon',
  props: {
    width: {
      type: Number,
      default: 50,
    },
    height: {
      type: Number,
      default: 66,
    },
  }
}
</script>
