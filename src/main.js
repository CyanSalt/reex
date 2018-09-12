import Vue from 'vue'
import {remote} from 'electron'
import Flux from './plugins/flux'
import I18N from './plugins/i18n'
import FileStorage from './plugins/storage'
import Root from './components/root'
import Store from './components/store'
import PropertyRoot from './components/property-root'

Vue.use(I18N)
Vue.use(FileStorage)
Vue.use(Flux, Store)

let Main = Root
const {additionalArguments} = remote.getCurrentWindow()
if (additionalArguments.type === 'property') {
  Main = PropertyRoot
}
new Vue(Main)
