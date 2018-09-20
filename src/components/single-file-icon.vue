<template>
  <svg class="single-file-icon" version="1.1" baseProfile="full" viewBox="0 0 50 66"
    xmlns="http://www.w3.org/2000/svg">
    <use xlink:href="./assets/images/file-icons.svg#file"/>
    <g v-if="ext">
      <path d="M50,44V62c0,4,0,4,-4,4H4c-4,0,-4,0,-4,-4V44Z" :fill="color"/>
      <text x="25" y="60" font-size="14" text-anchor="middle"
        :fill="textColor">{{ extname }}</text>
    </g>
    <image :xlink:href="subicon" v-if="subicon" x="10" y="13" width="30"/>
    <text x="25" y="36" font-size="24" text-anchor="middle" fill="#dfdfdf"
      :font-family="watermark.family" v-else-if="watermark"
      >{{ watermark.char }}</text>
    <text x="51" y="66" font-size="14" text-anchor="end" fill="#353d46"
      :font-family="linkIcon.family" v-if="link" stroke="white" stroke-width="3"
      paint-order="stroke">{{ linkIcon.char }}</text>
  </svg>
</template>

<script>
export default {
  name: 'single-file-icon',
  props: {
    ext: String,
    subicon: String,
    watermark: Object,
    link: Boolean,
    background: String,
    foreground: String,
  },
  computed: {
    linkIcon() {
      return this.$core.presets.getIconDetails('@feather/icon-corner-up-right')
    },
    color() {
      if (this.background) return this.background
      const color = this.$core.settings.user['theme.icons.background']
      if (!Array.isArray(color)) return color
      const digit = Array.from(this.ext).reduce((total, char) =>
        total + char.charCodeAt(0), 0)
      return color[digit % color.length]
    },
    textColor() {
      return this.foreground || 'white'
    },
    extname() {
      let ext = this.ext
      while (ext[0] === '.') ext = ext.slice(1)
      return ext.slice(0, 4).toUpperCase()
    },
  },
}
</script>
