<template>
  <svg class="single-file-icon" version="1.1" baseProfile="full" viewBox="0 0 50 66"
    xmlns="http://www.w3.org/2000/svg">
    <use xlink:href="./assets/images/file-icons.svg#file"/>
    <g v-if="ext">
      <path d="M50,44V62c0,4,0,4,-4,4H4c-4,0,-4,0,-4,-4V44Z" :fill="color"/>
      <text x="25" y="60" font-size="14" text-anchor="middle"
        fill="white">{{ extname }}</text>
    </g>
    <text x="25" y="36" font-size="24" text-anchor="middle"
      font-family="icomoon" fill="black" opacity="0.1" v-if="watermark"
      >{{ watermark }}</text>
    <text x="51" y="66" font-size="14" text-anchor="end" font-family="icomoon"
      fill="#353d46" v-if="link" stroke="white" stroke-width="3"
      paint-order="stroke">&#xe904;</text>
  </svg>
</template>

<script>
export default {
  name: 'single-file-icon',
  props: {
    ext: String,
    watermark: String,
    link: Boolean,
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
