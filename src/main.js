import Vue from 'vue'
import FileStorage from './plugins/storage'
import Root from './components/root'

Vue.use(FileStorage)

new Vue(Root)
