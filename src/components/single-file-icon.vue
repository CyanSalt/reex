<template>
  <svg class="single-file-icon" version="1.1" baseProfile="full" viewBox="0 0 50 66"
    xmlns="http://www.w3.org/2000/svg">
    <use xlink:href="./assets/images/file-icons.svg#file"/>
    <g v-if="ext">
      <path d="M50,44V62c0,4,0,4,-4,4H4c-4,0,-4,0,-4,-4V44Z" :fill="color"/>
      <text x="25" y="60" font-size="14" text-anchor="middle"
        :fill="foreground">{{ extname }}</text>
    </g>
    <image :xlink:href="subicon" v-if="subicon" x="10" y="13" width="30"/>
    <text x="25" y="36" font-size="24" text-anchor="middle" fill="black"
      :font-family="watermark.family" opacity="0.1" v-else-if="watermark"
      >{{ watermark.char }}</text>
    <text x="51" y="66" font-size="14" text-anchor="end" font-family="Reex Icon"
      fill="#353d46" v-if="link" stroke="white" stroke-width="3"
      paint-order="stroke">{{ linkIcon.char }}</text>
  </svg>
</template>

<script>
import {state} from '../plugins/flux'

export default {
  name: 'single-file-icon',
  props: {
    ext: String,
    subicon: String,
    watermark: Object,
    link: Boolean,
    background: String,
    foreground: {
      type: String,
      default: 'white',
    },
  },
  computed: {
    settings: state('settings/user'),
    linkIcon() {
      return this.$flux.dispatch('icons/detail', '@reex/icon-corner-up-right')
    },
    color() {
      if (!this.ext) return 'transparent'
      if (this.background) return this.background
      if (!this.settings['explorer.icon.colorful']) {
        return this.settings['explorer.icon.black']
      }
      const digit = Array.from(this.ext).reduce((total, char) =>
        total + char.charCodeAt(0), 0)
      const colors = this.settings['explorer.icon.colors']
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
