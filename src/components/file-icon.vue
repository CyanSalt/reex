<template>
  <svg class="file-icon" version="1.1" baseProfile="full" viewBox="0 0 50 66"
    :width="width" :height="height" xmlns="http://www.w3.org/2000/svg">
    <image v-pre x="0" y="0" width="50" height="66"
      xlink:href="./assets/images/file.svg"/>
    <g v-if="ext">
      <path d="M50,44L50,62c0,4,0,4,-4,4L4,66c-4,0,-4,0,-4,-4L0,44Z"
        :fill="color"/>
      <text x="25" y="60" font-size="14" text-anchor="middle"
        fill="#fff">{{ extname }}</text>
    </g>
  </svg>
</template>

<script>
export default {
  name: 'file-icon',
  props: {
    ext: String,
    width: Number,
    height: Number,
  },
  computed: {
    color() {
      if (!this.ext) return 'transparent'
      const digit = Array.from(this.ext).reduce((total, char) =>
        total + char.charCodeAt(0), 0)
      const colors = [
        '#ec5f67', '#f99157', '#fac863', '#99c794',
        '#5fb3b3', '#6699cc', '#c594c5', '#ab7967',
      ]
      return colors[digit % colors.length]
    },
    extname() {
      let ext = this.ext
      while (ext[0] === '.') ext = ext.slice(1)
      return ext.slice(0, 4).toUpperCase()
    },
  },
}
</script>
