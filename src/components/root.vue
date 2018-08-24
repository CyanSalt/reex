<template>
  <div id="main">
  </div>
</template>

<script>
export default {
  el: '#main',
  components: {
  },
  data: {
  },
  computed: {
  },
  methods: {
  },
  beforeCreate() {
    // custom stylesheet
    const stylesheet = this.$storage.rawdataSync('custom.css')
    if (stylesheet) {
      const element = document.createElement('style')
      element.appendChild(document.createTextNode(stylesheet))
      document.head.appendChild(element)
    }
  },
  created() {
    // custom script
    this.$storage.require('custom.js', init => init(this))
  }
}
</script>
