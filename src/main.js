import Vue from 'vue'
import {remote} from 'electron'
import Relax from './plugins/relax'
import I18N from './plugins/i18n'
import FileStorage from './plugins/storage'
import Root from './components/root'
import PropertyRoot from './components/property-root'
import store from './core'

Vue.use(I18N)
Vue.use(FileStorage)
Vue.use(Relax, store)

let Main = Root
const {additionalArguments} = remote.getCurrentWindow()
if (additionalArguments.type === 'property') {
  Main = PropertyRoot
}
new Vue(Main)
