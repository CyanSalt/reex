<template>
  <svg class="single-file-icon" version="1.1" baseProfile="full" viewBox="0 0 50 66"
    xmlns="http://www.w3.org/2000/svg">
    <use xlink:href="./assets/images/file-icons.svg#file-outline"
      :fill="color"/>
    <text x="25" y="60" font-size="14" text-anchor="middle"
      :fill="textColor" v-if="ext">{{ extname }}</text>
    <image :xlink:href="subicon" v-if="subicon" x="10" y="13" width="30"/>
    <text x="25" y="36" font-size="24" text-anchor="middle" :fill="textColor"
      :font-family="watermark.family" v-else-if="watermark"
      >{{ watermark.char }}</text>
    <text x="51" y="66" font-size="14" text-anchor="end" fill="#353d46"
      :font-family="linkIcon.family" v-if="link" stroke="white" stroke-width="3"
      paint-order="stroke">{{ linkIcon.char }}</text>
  </svg>
</template>

<script>
import SingleFileIcon from './single-file-icon'

export default {
  name: 'single-file-icon-impress',
  extends: SingleFileIcon,
}
</script>
