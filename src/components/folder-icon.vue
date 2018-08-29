<template>
  <svg class="folder-icon" version="1.1" baseProfile="full" viewBox="0 0 64 60"
    xmlns="http://www.w3.org/2000/svg">
    <use xlink:href="./assets/images/file-icons.svg#folder"/>
    <text x="32" y="46" font-size="24" text-anchor="middle"
      font-family="icomoon" fill="black" opacity="0.2" v-if="watermark"
      >{{ watermark }}</text>
    <text x="65" y="60" font-size="14" text-anchor="end" font-family="icomoon"
      fill="#353d46" v-if="link" stroke="white" stroke-width="3"
      paint-order="stroke">&#xe904;</text>
  </svg>
</template>

<script>
export default {
  name: 'folder-icon',
  props: {
    watermark: String,
    link: Boolean,
  },
}
</script>
